"""
Notification model
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50))  # payment, maintenance, lease, message, system
    read = Column(Boolean, default=False, index=True)
    action_url = Column(String(500))
    notification_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        CheckConstraint(
            "type IN ('payment', 'maintenance', 'lease', 'message', 'system')",
            name="check_notification_type"
        ),
    )

