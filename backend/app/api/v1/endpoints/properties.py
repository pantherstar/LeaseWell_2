"""
Properties endpoints
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
from app.models.property import Property
from app.schemas.property import Property as PropertySchema, PropertyCreate, PropertyUpdate

router = APIRouter()


@router.get("", response_model=List[PropertySchema])
async def get_properties(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all properties for current user"""
    if current_user.role == "landlord":
        result = await db.execute(
            select(Property).where(Property.landlord_id == current_user.id)
        )
    else:
        # Tenants see properties through leases
        from app.models.lease import Lease
        result = await db.execute(
            select(Property)
            .join(Lease)
            .where(Lease.tenant_id == current_user.id)
            .distinct()
        )
    return [PropertySchema.model_validate(p) for p in result.scalars().all()]


@router.post("", response_model=PropertySchema, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new property"""
    if current_user.role != "landlord":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only landlords can create properties"
        )
    
    new_property = Property(
        **property_data.dict(),
        landlord_id=current_user.id
    )
    db.add(new_property)
    await db.commit()
    await db.refresh(new_property)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    
    return PropertySchema.model_validate(new_property)


@router.get("/{property_id}", response_model=PropertySchema)
async def get_property(
    property_id: UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific property"""
    result = await db.execute(select(Property).where(Property.id == property_id))
    property = result.scalar_one_or_none()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    # Check access
    if current_user.role == "landlord" and property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == "tenant":
        from app.models.lease import Lease
        lease_result = await db.execute(
            select(Lease).where(
                Lease.property_id == property_id,
                Lease.tenant_id == current_user.id
            )
        )
        if not lease_result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return PropertySchema.model_validate(property)


@router.put("/{property_id}", response_model=PropertySchema)
async def update_property(
    property_id: UUID,
    property_data: PropertyUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a property"""
    result = await db.execute(select(Property).where(Property.id == property_id))
    property = result.scalar_one_or_none()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    if property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = property_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(property, field, value)
    
    await db.commit()
    await db.refresh(property)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    
    return PropertySchema.model_validate(property)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a property"""
    result = await db.execute(select(Property).where(Property.id == property_id))
    property = result.scalar_one_or_none()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    if property.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    await db.delete(property)
    await db.commit()
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")

