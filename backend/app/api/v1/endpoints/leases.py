"""
Leases endpoints
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
from app.models.lease import Lease
from app.schemas.lease import Lease as LeaseSchema, LeaseCreate, LeaseUpdate

router = APIRouter()


@router.get("", response_model=List[LeaseSchema])
async def get_leases(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all leases for current user"""
    if current_user.role == "landlord":
        result = await db.execute(
            select(Lease).where(Lease.landlord_id == current_user.id)
        )
    else:
        result = await db.execute(
            select(Lease).where(Lease.tenant_id == current_user.id)
        )
    return [LeaseSchema.model_validate(l) for l in result.scalars().all()]


@router.post("", response_model=LeaseSchema, status_code=status.HTTP_201_CREATED)
async def create_lease(
    lease_data: LeaseCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new lease"""
    if current_user.role != "landlord":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only landlords can create leases"
        )
    
    # Verify property belongs to landlord
    from app.models.property import Property
    result = await db.execute(
        select(Property).where(Property.id == lease_data.property_id)
    )
    property = result.scalar_one_or_none()
    if not property or property.landlord_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found or access denied"
        )
    
    new_lease = Lease(
        **lease_data.dict(),
        landlord_id=current_user.id
    )
    db.add(new_lease)
    await db.commit()
    await db.refresh(new_lease)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    
    return LeaseSchema.model_validate(new_lease)


@router.put("/{lease_id}", response_model=LeaseSchema)
async def update_lease(
    lease_id: UUID,
    lease_data: LeaseUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a lease"""
    result = await db.execute(select(Lease).where(Lease.id == lease_id))
    lease = result.scalar_one_or_none()
    
    if not lease:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lease not found")
    
    # Check access
    if current_user.role == "landlord" and lease.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == "tenant" and lease.tenant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = lease_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lease, field, value)
    
    await db.commit()
    await db.refresh(lease)
    
    # Clear cache for both landlord and tenant
    await delete_cache_pattern(f"dashboard:{lease.landlord_id}*")
    await delete_cache_pattern(f"dashboard:{lease.tenant_id}*")
    
    return LeaseSchema.model_validate(lease)


@router.delete("/{lease_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lease(
    lease_id: UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a lease"""
    result = await db.execute(select(Lease).where(Lease.id == lease_id))
    lease = result.scalar_one_or_none()
    
    if not lease:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lease not found")
    
    if lease.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    await db.delete(lease)
    await db.commit()
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    await delete_cache_pattern(f"dashboard:{lease.tenant_id}*")

