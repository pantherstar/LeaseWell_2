"""
Maintenance requests endpoints
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
from app.models.maintenance import MaintenanceRequest
from app.schemas.maintenance import (
    MaintenanceRequest as MaintenanceRequestSchema,
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate
)

router = APIRouter()


@router.get("", response_model=List[MaintenanceRequestSchema])
async def get_maintenance_requests(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all maintenance requests for current user"""
    if current_user.role == "landlord":
        result = await db.execute(
            select(MaintenanceRequest).where(MaintenanceRequest.landlord_id == current_user.id)
        )
    else:
        result = await db.execute(
            select(MaintenanceRequest).where(MaintenanceRequest.tenant_id == current_user.id)
        )
    return [MaintenanceRequestSchema.model_validate(m) for m in result.scalars().all()]


@router.post("", response_model=MaintenanceRequestSchema, status_code=status.HTTP_201_CREATED)
async def create_maintenance_request(
    request_data: MaintenanceRequestCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new maintenance request"""
    # Verify property access
    from app.models.property import Property
    from app.models.lease import Lease
    
    result = await db.execute(
        select(Property).where(Property.id == request_data.property_id)
    )
    property = result.scalar_one_or_none()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    # Get landlord_id
    landlord_id = property.landlord_id
    
    # If tenant, verify they have a lease
    if current_user.role == "tenant":
        lease_result = await db.execute(
            select(Lease).where(
                Lease.property_id == request_data.property_id,
                Lease.tenant_id == current_user.id,
                Lease.status == "active"
            )
        )
        if not lease_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active lease for this property"
            )
    
    new_request = MaintenanceRequest(
        **request_data.dict(),
        tenant_id=current_user.id if current_user.role == "tenant" else None,
        landlord_id=landlord_id
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    await delete_cache_pattern(f"dashboard:{landlord_id}*")
    
    return MaintenanceRequestSchema.model_validate(new_request)


@router.put("/{request_id}", response_model=MaintenanceRequestSchema)
async def update_maintenance_request(
    request_id: UUID,
    request_data: MaintenanceRequestUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a maintenance request"""
    result = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    # Check access
    if current_user.role == "landlord" and request.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == "tenant" and request.tenant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = request_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(request, field, value)
    
    await db.commit()
    await db.refresh(request)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{request.landlord_id}*")
    await delete_cache_pattern(f"dashboard:{request.tenant_id}*")
    
    return MaintenanceRequestSchema.model_validate(request)

