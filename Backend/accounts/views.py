from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import CustomUser 

class RegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'borrower') # Default role

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        existing_user = CustomUser.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_verified:
                return Response({"error": "User with this email already exists and is verified."}, status=status.HTTP_400_BAD_REQUEST)
            # If user exists but is NOT verified, delete the old record so they can try again
            existing_user.delete()

        try:
            # Create user as inactive until verified
            user = CustomUser.objects.create_user(
                username=email, # Using email as username for simplicity, adjust if needed
                email=email,
                password=password,
                role=role,
                is_active=False, # Important: user is inactive until OTP is verified
                is_verified=False # Custom field for OTP verification status
            )
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

            # Send OTP via email using both plain text (fallback) and HTML
            send_mail(
                subject="Welcome to M.A.R.L.O.N - Your Activation Code",
                message=f"Your verification code is: {user.otp}",
                from_email=settings.DEFAULT_FROM_EMAIL, 
                recipient_list=[email],
                fail_silently=False,
                html_message=html_content, # Magic parameter for HTML emails
            )
            # --- END OF NEW HTML EMAIL DESIGN ---

            return Response({"message": "Registration successful. OTP sent to your email for verification."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "address": user.address,
            "age": user.age,
            "birthday": user.birthday,
        })

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_provided = request.data.get('otp')

        try:
            user = CustomUser.objects.get(email=email)
            if user.otp == otp_provided:
                user.is_active = True
                user.is_verified = True
                user.otp = None # Clear OTP after successful verification
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