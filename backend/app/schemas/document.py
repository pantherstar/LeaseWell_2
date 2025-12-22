"""
Document schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class DocumentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    document_type: Optional[str] = None
    description: Optional[str] = None


class DocumentCreate(DocumentBase):
    property_id: Optional[UUID] = None
    lease_id: Optional[UUID] = None


class Document(DocumentBase):
    id: UUID
    property_id: Optional[UUID] = None
    lease_id: Optional[UUID] = None
    uploaded_by: UUID
    created_at: datetime
    
    model_config = {"from_attributes": True}

