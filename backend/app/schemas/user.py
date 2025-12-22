"""
User and Profile schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    full_name: Optional[str] = None
    role: str  # landlord or tenant


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class Profile(ProfileBase):
    id: UUID
    email: str
    role: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class ProfileUpdate(ProfileBase):
    pass


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Profile

