from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from .serializers import UserSerializer

User = get_user_model()

# 1. THE LOGIN API
class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(request, username=email, password=password)

        if user:
            # Give the user a secure token
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)


# 2. THE REGISTER API
class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        username = request.data.get("username")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")

        # Validate inputs
        if not email or not password or not username:
            return Response(
                {"error": "Email, password, and username are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already taken."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the user
        try:
            user = User.objects.create_user(
                email=email,
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role="borrower"
            )

            # Generate token
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# 3. THE PROFILE API
class ProfileView(views.APIView):
    # You MUST be logged in to see this
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user automatically knows who is calling based on their Token
        serializer = UserSerializer(request.user)
        return Response(serializer.data)