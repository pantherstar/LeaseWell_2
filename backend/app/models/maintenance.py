"""
Maintenance Request model
"""
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text, JSON, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class MaintenanceRequest(Base):
    """Maintenance Request model"""
    __tablename__ = "maintenance_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    landlord_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), index=True)  # low, medium, high, emergency
    status = Column(String(20), index=True)  # pending, in_progress, completed, cancelled
    category = Column(String(100))
    photos = Column(JSON, default=list)
    assigned_to = Column(String(255))
    estimated_cost = Column(Numeric(10, 2))
    actual_cost = Column(Numeric(10, 2))
    scheduled_date = Column(DateTime(timezone=True))
    completed_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint("priority IN ('low', 'medium', 'high', 'emergency')", name="check_priority"),
        CheckConstraint("status IN ('pending', 'in_progress', 'completed', 'cancelled')", name="check_status"),
    )
    
    # Relationships
    property = relationship("Property", back_populates="maintenance_requests")

