from datetime import date, timedelta
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Book, Borrowing, History
from .serializers import BookSerializer, BorrowingSerializer, HistorySerializer
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, BasePermission

class IsAdmin(BasePermission):
    """Allow access only to admin users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsBorrower(BasePermission):
    """Allow access only to borrower users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'borrower'

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticatedOrReadOnly()]

class BorrowingViewSet(viewsets.ModelViewSet):
    queryset = Borrowing.objects.all()
    serializer_class = BorrowingSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            # Only allow admins to create borrowings from admin panel
            # Borrowers will use the borrow_book_for_user action
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Borrowing.objects.all()
        return Borrowing.objects.filter(borrower_email_address=user.email)

    # 1. BORROWING LOGIC

    def create(self, request, *args, **kwargs):
        """
        Intercepts the creation of a borrowing record to apply business rules.
        Only admins can create borrowings through this endpoint.
        """
        book_id = request.data.get('book')
        borrower_email = request.data.get('borrower_email_address')

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "The requested book does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # RULE 1: Validate Availability
        if book.status != 'Available' or book.copies_available <= 0:
            return Response(
                {"error": "This book is currently unavailable for borrowing."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # RULE 2: Prevent Double-Booking
        active_borrowing = Borrowing.objects.filter(
            book=book,
            borrower_email_address=borrower_email,
            return_date__isnull=True
        ).exists()

        if active_borrowing:
            return Response(
                {"error": "You already have an active borrowing record for this book."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # RULE 3: Proceed with creating the transaction
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(status='Active')

        # RULE 4: Update Book Inventory Mathematically
        book.copies_available -= 1
        book.copies_borrowed += 1

        if book.copies_available == 0:
            book.status = 'Borrowed'

        book.save()

        # RULE 5: History logging
        borrowing = serializer.instance
        History.objects.create(
            transaction=borrowing,
            borrow_date=borrowing.borrow_date
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # 2. RETURN LOGIC

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin()])
    def return_book(self, request, pk=None):
        """
        Custom action to handle returning a borrowed book.
        Only admins can mark books as returned.
        - Sets the return_date to today.
        - Updates book inventory and status.
        - Updates the related History log.
        - Returns the updated borrowing with recalculated overdue_days.
        """
        borrowing = self.get_object()

        if borrowing.return_date:
            return Response(
                {"detail": "This borrowing has already been returned."},
                status=status.HTTP_400_BAD_REQUEST,
            )


        return_date_str = request.data.get("return_date")
        if return_date_str:
            try:

                year, month, day = map(int, return_date_str.split("-"))
                borrowing.return_date = date(year, month, day)
            except (TypeError, ValueError):
                return Response(
                    {"return_date": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            borrowing.return_date = date.today()


        borrowing.save()


        book = borrowing.book
        if book.copies_borrowed > 0:
            book.copies_borrowed -= 1
        book.copies_available += 1


        book.status = 'Available'
        book.save()


        History.objects.update_or_create(
            transaction=borrowing,
            defaults={
                "borrow_date": borrowing.borrow_date,
                "return_date": borrowing.return_date,
            },
        )

        serializer = self.get_serializer(borrowing)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def borrow_for_me(self, request):
        """
        Borrowers can use this to borrow a book for themselves.
        Automatically uses their email from the authenticated user.
        """
        book_id = request.data.get('book')
        user_email = request.user.email

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "The requested book does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # RULE 1: Validate Availability
        if book.status != 'Available' or book.copies_available <= 0:
            return Response(
                {"error": "This book is currently unavailable for borrowing."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # RULE 2: Prevent Double-Booking
        active_borrowing = Borrowing.objects.filter(
            book=book,
            borrower_email_address=user_email,
            return_date__isnull=True
        ).exists()

        if active_borrowing:
            return Response(
                {"error": "You already have an active borrowing record for this book."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create borrowing record
        borrow_data = {
            'book': book_id,
            'borrower_name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email,
            'borrower_contact_number': request.data.get('borrower_contact_number') or 'N/A',
            'borrower_email_address': user_email,
        }

        serializer = self.get_serializer(data=borrow_data)
        serializer.is_valid(raise_exception=True)
        serializer.save(status='Pending')

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin()])
    def approve(self, request, pk=None):
        """
        Admin approves a pending borrowing request.
        """
        borrowing = self.get_object()

        if borrowing.status != 'Pending':
            return Response({"error": "Only pending requests can be approved."}, status=status.HTTP_400_BAD_REQUEST)

        book = borrowing.book
        if book.status != 'Available' or book.copies_available <= 0:
            return Response({"error": "This book is no longer available."}, status=status.HTTP_400_BAD_REQUEST)

        # Advance status and restart due date to exactly 14 days from approval date
        borrowing.status = 'Active'
        borrowing.borrow_date = date.today()
        borrowing.due_date = borrowing.borrow_date + timedelta(days=14)
        borrowing.save()

        book.copies_available -= 1
        book.copies_borrowed += 1
        if book.copies_available == 0:
            book.status = 'Borrowed'
        book.save()

        History.objects.create(transaction=borrowing, borrow_date=borrowing.borrow_date)

        serializer = self.get_serializer(borrowing)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin()])
    def reject(self, request, pk=None):
        """
        Admin rejects a pending borrowing request.
        """
        borrowing = self.get_object()
        if borrowing.status != 'Pending':
            return Response({"error": "Only pending requests can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        borrowing.delete()
        return Response({"detail": "Borrowing request rejected and removed."}, status=status.HTTP_200_OK)
class HistoryViewSet(viewsets.ModelViewSet):
    queryset = History.objects.all()
    serializer_class = HistorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return History.objects.all()
        return History.objects.filter(transaction__borrower_email_address=user.email)