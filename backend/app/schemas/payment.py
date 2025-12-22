"""
Payment schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal


class PaymentBase(BaseModel):
    lease_id: UUID
    amount: Decimal
    payment_date: date
    due_date: date
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    payment_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    late_fee: Optional[Decimal] = None


class Payment(PaymentBase):
    id: UUID
    tenant_id: UUID
    landlord_id: UUID
    status: Optional[str] = "pending"
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    late_fee: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

