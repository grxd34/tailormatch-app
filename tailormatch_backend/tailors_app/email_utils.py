from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import random
import string
from datetime import datetime, timedelta


def generate_reset_token():
    """Generate a 6-digit random token"""
    return ''.join(random.choices(string.digits, k=6))


def send_password_reset_email(user_email, token):
    """Send password reset email with token"""
    subject = 'TailorMatch - Password Reset Code'
    
    # Create HTML email template
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You have requested to reset your password for your TailorMatch account.</p>
            <p>Your password reset code is:</p>
            <div style="background-color: #007bff; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
                {token}
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated message from TailorMatch. Please do not reply to this email.
            </p>
        </div>
    </body>
    </html>
    """
    
    # Create plain text version
    plain_message = f"""
    Password Reset Request
    
    Hello,
    
    You have requested to reset your password for your TailorMatch account.
    
    Your password reset code is: {token}
    
    This code will expire in 15 minutes.
    
    If you did not request this password reset, please ignore this email.
    
    This is an automated message from TailorMatch.
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
