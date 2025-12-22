"""
Payments endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.core.redis_client import delete_cache_pattern
from app.models.user import Profile
from app.models.payment import Payment
from app.schemas.payment import Payment as PaymentSchema, PaymentCreate, PaymentUpdate

router = APIRouter()


@router.get("", response_model=List[PaymentSchema])
async def get_payments(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all payments for current user"""
    if current_user.role == "landlord":
        result = await db.execute(
            select(Payment).where(Payment.landlord_id == current_user.id)
        )
    else:
        result = await db.execute(
            select(Payment).where(Payment.tenant_id == current_user.id)
        )
    return [PaymentSchema.model_validate(p) for p in result.scalars().all()]


@router.post("", response_model=PaymentSchema, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new payment"""
    # Verify lease access
    from app.models.lease import Lease
    result = await db.execute(
        select(Lease).where(Lease.id == payment_data.lease_id)
    )
    lease = result.scalar_one_or_none()
    
    if not lease:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lease not found")
    
    # Check access
    if current_user.role == "tenant" and lease.tenant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == "landlord" and lease.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    new_payment = Payment(
        **payment_data.dict(),
        tenant_id=lease.tenant_id,
        landlord_id=lease.landlord_id
    )
    db.add(new_payment)
    await db.commit()
    await db.refresh(new_payment)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{lease.landlord_id}*")
    await delete_cache_pattern(f"dashboard:{lease.tenant_id}*")
    
    return PaymentSchema.model_validate(new_payment)


@router.put("/{payment_id}", response_model=PaymentSchema)
async def update_payment(
    payment_id: UUID,
    payment_data: PaymentUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a payment"""
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    
    # Check access
    if current_user.role == "landlord" and payment.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == "tenant" and payment.tenant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = payment_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    await db.commit()
    await db.refresh(payment)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{payment.landlord_id}*")
    await delete_cache_pattern(f"dashboard:{payment.tenant_id}*")
    
    return PaymentSchema.model_validate(payment)

