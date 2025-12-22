"""
Email service using Resend
"""
import resend
from app.core.config import settings


def init_email():
    """Initialize Resend with API key"""
    if settings.RESEND_API_KEY:
        resend.api_key = settings.RESEND_API_KEY


async def send_password_reset_email(to_email: str, reset_token: str, user_name: str = None) -> bool:
    """Send password reset email"""
    if not settings.RESEND_API_KEY:
        print(f"[Email] RESEND_API_KEY not configured. Would send reset email to {to_email}")
        return False

    reset_url = f"{settings.frontend_base_url}/reset-password?token={reset_token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1513; color: #ffffff; padding: 40px 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: #1a2e2a; border-radius: 12px; padding: 40px; }}
            h1 {{ color: #10b981; margin-bottom: 20px; }}
            p {{ color: rgba(255,255,255,0.8); line-height: 1.6; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #10b981, #0f766e); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: rgba(255,255,255,0.5); }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Reset Your Password</h1>
            <p>Hi{' ' + user_name if user_name else ''},</p>
            <p>We received a request to reset your password for your LeaseWell account. Click the button below to create a new password:</p>
            <a href="{reset_url}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <div class="footer">
                <p>&copy; 2026 Northridge Technologies. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        init_email()
        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "Reset Your LeaseWell Password",
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"[Email] Failed to send reset email: {e}")
        return False


async def send_tenant_invitation_email(
    to_email: str,
    landlord_name: str,
    property_address: str,
    invitation_token: str
) -> bool:
    """Send tenant invitation email"""
    if not settings.RESEND_API_KEY:
        print(f"[Email] RESEND_API_KEY not configured. Would send invitation to {to_email}")
        return False

    invite_url = f"{settings.frontend_base_url}/accept-invitation?token={invitation_token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1513; color: #ffffff; padding: 40px 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: #1a2e2a; border-radius: 12px; padding: 40px; }}
            h1 {{ color: #10b981; margin-bottom: 20px; }}
            p {{ color: rgba(255,255,255,0.8); line-height: 1.6; }}
            .property {{ background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0; }}
            .property-label {{ font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; }}
            .property-address {{ font-size: 18px; color: #10b981; font-weight: 600; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #10b981, #0f766e); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: rgba(255,255,255,0.5); }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>You're Invited!</h1>
            <p><strong>{landlord_name}</strong> has invited you to join LeaseWell as a tenant for the following property:</p>
            <div class="property">
                <div class="property-label">Property</div>
                <div class="property-address">{property_address}</div>
            </div>
            <p>Click below to accept the invitation and create your account:</p>
            <a href="{invite_url}" class="button">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
            <div class="footer">
                <p>&copy; 2026 Northridge Technologies. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        init_email()
        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": f"You're Invited to Join LeaseWell - {property_address}",
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"[Email] Failed to send invitation email: {e}")
        return False
