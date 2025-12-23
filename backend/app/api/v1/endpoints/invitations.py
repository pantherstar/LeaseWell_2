"""
Tenant invitation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import List
import secrets

from app.core.database import get_db
from app.core.auth import get_current_active_user, create_access_token, get_password_hash
from app.core.email import send_tenant_invitation_email
from app.models.user import User, Profile
from app.models.property import Property
from app.models.invitation import Invitation
from app.models.lease import Lease
from pydantic import BaseModel, EmailStr

router = APIRouter()


class InvitationCreate(BaseModel):
    email: EmailStr
    property_id: str
    monthly_rent: str = None
    start_date: str = None
    end_date: str = None


class InvitationResponse(BaseModel):
    id: str
    email: str
    property_id: str
    status: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    token: str
    full_name: str
    password: str


@router.post("/invite", response_model=dict)
async def invite_tenant(
    invitation_data: InvitationCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Invite a tenant to a property (landlords only)"""
    if current_user.role != "landlord":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only landlords can invite tenants"
        )

    # Verify property belongs to landlord
    result = await db.execute(
        select(Property).where(
            Property.id == invitation_data.property_id,
            Property.landlord_id == current_user.id
        )
    )
    property = result.scalar_one_or_none()
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found or you don't have access"
        )

    # Check if there's already a pending invitation for this email/property
    result = await db.execute(
        select(Invitation).where(
            Invitation.email == invitation_data.email,
            Invitation.property_id == invitation_data.property_id,
            Invitation.status == "pending"
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An invitation for this email and property is already pending"
        )

    # Generate secure token
    token = secrets.token_urlsafe(32)

    # Create invitation
    invitation = Invitation(
        email=invitation_data.email,
        property_id=invitation_data.property_id,
        landlord_id=current_user.id,
        token=token,
        monthly_rent=invitation_data.monthly_rent,
        start_date=datetime.fromisoformat(invitation_data.start_date) if invitation_data.start_date else None,
        end_date=datetime.fromisoformat(invitation_data.end_date) if invitation_data.end_date else None
    )
    db.add(invitation)
    await db.commit()

    # Send invitation email
    property_address = f"{property.address}, {property.city}, {property.state}"
    email_sent = await send_tenant_invitation_email(
        to_email=invitation_data.email,
        landlord_name=current_user.full_name or current_user.email,
        property_address=property_address,
        invitation_token=token
    )

    return {
        "message": "Invitation sent successfully" if email_sent else "Invitation created (email not sent - configure RESEND_API_KEY)",
        "invitation_id": str(invitation.id),
        "email_sent": email_sent
    }


@router.get("/invitations", response_model=List[InvitationResponse])
async def list_invitations(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all invitations sent by the current landlord"""
    if current_user.role != "landlord":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only landlords can view invitations"
        )

    result = await db.execute(
        select(Invitation).where(Invitation.landlord_id == current_user.id)
    )
    invitations = result.scalars().all()

    return [
        InvitationResponse(
            id=str(inv.id),
            email=inv.email,
            property_id=str(inv.property_id),
            status=inv.status,
            created_at=inv.created_at,
            expires_at=inv.expires_at
        )
        for inv in invitations
    ]


@router.delete("/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: str,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending invitation"""
    result = await db.execute(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.landlord_id == current_user.id
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending invitations"
        )

    invitation.status = "cancelled"
    await db.commit()

    return {"message": "Invitation cancelled"}


@router.get("/invitation/{token}")
async def get_invitation_details(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Get invitation details by token (for accept page)"""
    result = await db.execute(
        select(Invitation).where(Invitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is {invitation.status}"
        )

    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )

    # Get property and landlord details
    result = await db.execute(select(Property).where(Property.id == invitation.property_id))
    property = result.scalar_one_or_none()

    result = await db.execute(select(Profile).where(Profile.id == invitation.landlord_id))
    landlord = result.scalar_one_or_none()

    return {
        "email": invitation.email,
        "property": {
            "address": property.address,
            "city": property.city,
            "state": property.state,
            "zip_code": property.zip_code
        } if property else None,
        "landlord_name": landlord.full_name if landlord else None,
        "monthly_rent": invitation.monthly_rent,
        "start_date": invitation.start_date.isoformat() if invitation.start_date else None,
        "end_date": invitation.end_date.isoformat() if invitation.end_date else None
    }


@router.post("/accept-invitation")
async def accept_invitation(
    data: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Accept an invitation and create tenant account"""
    # Get invitation
    result = await db.execute(
        select(Invitation).where(Invitation.token == data.token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is {invitation.status}"
        )

    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == invitation.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please login instead."
        )

    # Create user account
    hashed_password = get_password_hash(data.password)
    new_user = User(
        email=invitation.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    await db.flush()

    # Create profile
    new_profile = Profile(
        id=new_user.id,
        email=invitation.email,
        full_name=data.full_name,
        role="tenant"
    )
    db.add(new_profile)

    # Create lease from invitation data
    from datetime import date
    new_lease = Lease(
        property_id=invitation.property_id,
        tenant_id=new_user.id,
        landlord_id=invitation.landlord_id,
        start_date=invitation.start_date.date() if invitation.start_date else date.today(),
        end_date=invitation.end_date.date() if invitation.end_date else date.today().replace(year=date.today().year + 1),
        monthly_rent=float(invitation.monthly_rent) if invitation.monthly_rent else 0,
        security_deposit=0,
        status="active"
    )
    db.add(new_lease)

    # Update invitation status
    invitation.status = "accepted"
    invitation.accepted_at = datetime.utcnow()

    await db.commit()

    # Create access token
    access_token = create_access_token(data={"sub": str(new_user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(new_profile.id),
            "email": new_profile.email,
            "full_name": new_profile.full_name,
            "role": new_profile.role
        },
        "message": "Account created successfully!"
    }
