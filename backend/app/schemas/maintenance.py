"""
Maintenance Request schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class MaintenanceRequestBase(BaseModel):
    property_id: UUID
    title: str
    description: str
    priority: Optional[str] = "medium"
    category: Optional[str] = None
    photos: List[Any] = []


class MaintenanceRequestCreate(MaintenanceRequestBase):
    pass


class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    estimated_cost: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    photos: Optional[List[Any]] = None


class MaintenanceRequest(MaintenanceRequestBase):
    id: UUID
    tenant_id: UUID
    landlord_id: UUID
    status: Optional[str] = "pending"
    assigned_to: Optional[str] = None
    estimated_cost: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

