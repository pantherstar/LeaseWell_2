"""
Notifications endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.core.redis_client import delete_cache_pattern
from app.models.user import Profile
from app.models.notification import Notification
from app.schemas.notification import Notification as NotificationSchema

router = APIRouter()


@router.get("", response_model=List[NotificationSchema])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get notifications for current user"""
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.where(Notification.read == False)
    
    query = query.order_by(Notification.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    return [NotificationSchema.model_validate(n) for n in result.scalars().all()]


@router.put("/{notification_id}/read", response_model=NotificationSchema)
async def mark_notification_read(
    notification_id: UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read"""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notification.read = True
    await db.commit()
    await db.refresh(notification)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    
    return NotificationSchema.model_validate(notification)


@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_read(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read"""
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.read == False
        )
        .values(read=True)
    )
    await db.commit()
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    
    return {"message": "All notifications marked as read"}

