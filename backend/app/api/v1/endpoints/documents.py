"""
Documents endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import os
from pathlib import Path
from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.core.redis_client import delete_cache_pattern
from app.core.config import settings
from app.models.user import Profile
from app.models.document import Document
from app.schemas.document import Document as DocumentSchema, DocumentCreate

router = APIRouter()

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.get("", response_model=List[DocumentSchema])
async def get_documents(
    property_id: UUID = None,
    lease_id: UUID = None,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get documents for current user"""
    query = select(Document)
    
    if property_id:
        query = query.where(Document.property_id == property_id)
    if lease_id:
        query = query.where(Document.lease_id == lease_id)
    
    # Filter by access
    if current_user.role == "landlord":
        from app.models.property import Property
        property_ids = await db.execute(
            select(Property.id).where(Property.landlord_id == current_user.id)
        )
        query = query.where(Document.property_id.in_(property_ids.scalars().all()))
    else:
        from app.models.lease import Lease
        lease_ids = await db.execute(
            select(Lease.id).where(Lease.tenant_id == current_user.id)
        )
        query = query.where(Document.lease_id.in_(lease_ids.scalars().all()))
    
    result = await db.execute(query)
    return [DocumentSchema.model_validate(d) for d in result.scalars().all()]


@router.post("", response_model=DocumentSchema, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    property_id: UUID = None,
    lease_id: UUID = None,
    document_type: str = None,
    description: str = None,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a document"""
    # Save file
    file_path = UPLOAD_DIR / f"{current_user.id}_{file.filename}"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    new_document = Document(
        property_id=property_id,
        lease_id=lease_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        mime_type=file.content_type,
        document_type=document_type,
        description=description
    )
    db.add(new_document)
    await db.commit()
    await db.refresh(new_document)
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")
    
    return DocumentSchema.model_validate(new_document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a document"""
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    if document.uploaded_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Delete file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    await db.delete(document)
    await db.commit()
    
    # Clear cache
    await delete_cache_pattern(f"dashboard:{current_user.id}*")

