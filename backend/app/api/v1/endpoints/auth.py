"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from app.core.database import get_db
from app.core.auth import verify_password, get_password_hash, create_access_token, get_current_active_user
from app.core.config import settings
from app.models.user import User, Profile
from app.schemas.user import UserCreate, UserLogin, Token, Profile as ProfileSchema

router = APIRouter()


@router.post("/register", response_model=Token)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    await db.flush()
    
    # Create profile
    new_profile = Profile(
        id=new_user.id,
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role
    )
    db.add(new_profile)
    await db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": ProfileSchema.model_validate(new_profile)
    }


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login user"""
    # Get user
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get profile
    result = await db.execute(select(Profile).where(Profile.id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": ProfileSchema.model_validate(profile)
    }


@router.get("/me", response_model=ProfileSchema)
async def get_me(
    current_user: Profile = Depends(get_current_active_user)
):
    """Get current user profile"""
    return ProfileSchema.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password(
    email_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset - sends email if configured"""
    from app.core.email import send_password_reset_email

    email = email_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )

    # Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Get profile for user's name
    profile = None
    if user:
        result = await db.execute(select(Profile).where(Profile.id == user.id))
        profile = result.scalar_one_or_none()

    if not user:
        # Don't reveal if email exists for security
        return {"message": "If that email is registered, you will receive reset instructions.", "email_sent": True}

    # Create a password reset token
    reset_token = create_access_token(
        data={"sub": str(user.id), "type": "reset"},
        expires_delta=timedelta(hours=1)
    )

    # Try to send email
    email_sent = await send_password_reset_email(
        to_email=email,
        reset_token=reset_token,
        user_name=profile.full_name if profile else None
    )

    if email_sent:
        return {
            "message": "Password reset instructions have been sent to your email.",
            "email_sent": True
        }
    else:
        # Fallback: return token directly (for demo/development)
        return {
            "message": "Email service not configured. Use the link below to reset your password.",
            "reset_token": reset_token,
            "email_sent": False
        }


@router.post("/reset-password")
async def reset_password(
    reset_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using token"""
    from jose import JWTError, jwt

    token = reset_data.get("token")
    new_password = reset_data.get("new_password")

    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and new_password are required"
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")

        if token_type != "reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Update password
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.hashed_password = get_password_hash(new_password)
    await db.commit()

    return {"message": "Password has been reset successfully"}

