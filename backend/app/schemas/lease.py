"""
Lease schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal


class LeaseBase(BaseModel):
    property_id: UUID
    tenant_id: UUID
    start_date: date
    end_date: date
    monthly_rent: Decimal
    security_deposit: Optional[Decimal] = None
    status: str = "pending"
    lease_document_url: Optional[str] = None
    terms: Dict[str, Any] = {}


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(BaseModel):
    property_id: Optional[UUID] = None
    tenant_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    monthly_rent: Optional[Decimal] = None
    security_deposit: Optional[Decimal] = None
    status: Optional[str] = None
    lease_document_url: Optional[str] = None
    terms: Optional[Dict[str, Any]] = None


class Lease(LeaseBase):
    id: UUID
    landlord_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

