"""
Property schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class PropertyBase(BaseModel):
    address: str
    city: str
    state: str
    zip_code: str
    unit_number: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[Decimal] = None
    square_feet: Optional[int] = None
    description: Optional[str] = None
    amenities: List[Any] = []


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    unit_number: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[Decimal] = None
    square_feet: Optional[int] = None
    description: Optional[str] = None
    amenities: Optional[List[Any]] = None


class Property(PropertyBase):
    id: UUID
    landlord_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

