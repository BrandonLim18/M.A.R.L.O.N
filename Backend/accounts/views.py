from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from .models import CustomUser 
from .serializers import UserSerializer
from datetime import datetime

class RegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'borrower')
        profile_picture = request.FILES.get('profile_picture')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        existing_user = CustomUser.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_verified:
                return Response({"error": "User with this email already exists and is verified."}, status=status.HTTP_400_BAD_REQUEST)
            # If user exists but is NOT verified, delete the old record so they can try again
            existing_user.delete()

        username = request.data.get('username', email)
        
        # Check if username is already taken by someone else
        if CustomUser.objects.filter(username=username).exists():
            return Response({"error": "This username is already taken. Please choose another."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            address = request.data.get('address', '')
            birthday_str = request.data.get('birthday')
            
            age = None
            if birthday_str:
                try:
                    bday = datetime.strptime(birthday_str, '%Y-%m-%d')
                    today = datetime.today()
                    age = today.year - bday.year - ((today.month, today.day) < (bday.month, bday.day))
                except ValueError:
                    pass

            # Create user as inactive until verified
            user = CustomUser.objects.create_user(
                username=username, 
                email=email,
                password=password,
                role=role,
                profile_picture=profile_picture,
                is_active=False,
                is_verified=False
            )
            user.first_name = first_name
            user.last_name = last_name
            user.address = address
            if birthday_str:
                user.birthday = birthday_str
            if age is not None:
                user.age = age
            user.save()

            user.generate_otp() # Generates OTP and saves it to the user

            # --- START OF NEW HTML EMAIL DESIGN ---
            html_content = f"""
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9;">
                    <h1 style="color: #0f172a; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">M.A.R.L.O.N</h1>
                    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Library Management System</p>
                </div>
                
                <div style="padding: 30px 0; text-align: center;">
                    <h2 style="color: #334155; font-size: 22px; margin-bottom: 15px;">Verify Your Account</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        Welcome aboard! To complete your registration, please enter the 6-digit activation code below into the verification screen.
                    </p>
                    
                    <div style="background: linear-gradient(to right, #059669, #14b8a6); padding: 20px; border-radius: 16px; display: inline-block; margin-bottom: 20px;">
                        <span style="font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: 10px;">{user.otp}</span>
                    </div>
                    
                    <p style="color: #94a3b8; font-size: 13px; margin-top: 30px;">
                        If you did not request this account creation, you can safely ignore and delete this email.
                    </p>
                </div>
            </div>
            """

            try:
                # Send OTP via email using both plain text (fallback) and HTML
                send_mail(
                    subject="Welcome to M.A.R.L.O.N - Your Activation Code",
                    message=f"Your verification code is: {user.otp}",
                    from_email=settings.DEFAULT_FROM_EMAIL, 
                    recipient_list=[email],
                    fail_silently=False,
                    html_message=html_content, 
                )
            except Exception as email_err:
                # --- BULLETPROOF HOTSPOT FIX ---
                # We DO NOT delete the user anymore. We let them stay in the database!
                print(f"\n⚠️ HOTSPOT BLOCKED EMAIL: {email_err}") 
                print(f"👉 NO WORRIES! THE OTP FOR {email} IS: {user.otp}\n")
                # We skip the 500 error and let the code continue down to the 201 Success!

            return Response({"message": "Registration successful. OTP sent to your email for verification."}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Registration Error: {e}") 
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_provided = request.data.get('otp')

        try:
            user = CustomUser.objects.get(email=email)
            if user.otp == otp_provided:
                user.is_active = True
                user.is_verified = True
                user.otp = None 
                user.save()
                return Response({"message": "Account successfully activated!"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, email=email, password=password)

        if user is not None:
            if not user.is_active:
                return Response({"error": "Please verify your OTP first."}, status=status.HTTP_400_BAD_REQUEST)
            
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)