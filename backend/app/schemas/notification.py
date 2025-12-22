"""
Notification schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class NotificationBase(BaseModel):
    title: str
    message: str
    type: Optional[str] = None
    action_url: Optional[str] = None
    metadata: Dict[str, Any] = {}


class NotificationCreate(NotificationBase):
    user_id: UUID


class Notification(NotificationBase):
    id: UUID
    user_id: UUID
    read: bool = False
    created_at: datetime
    
    model_config = {"from_attributes": True}

