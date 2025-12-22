"""
Document model
"""
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class Document(Base):
    """Document model"""
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), index=True)
    lease_id = Column(UUID(as_uuid=True), ForeignKey("leases.id", ondelete="CASCADE"), index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(BigInteger)
    mime_type = Column(String(100))
    document_type = Column(String(50))  # lease, inspection, insurance, receipt, photo, other
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        CheckConstraint(
            "document_type IN ('lease', 'inspection', 'insurance', 'receipt', 'photo', 'other')",
            name="check_document_type"
        ),
    )
    
    # Relationships
    property = relationship("Property", back_populates="documents")

