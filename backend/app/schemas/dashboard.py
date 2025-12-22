"""
Dashboard schema - optimized single endpoint response
"""
from typing import List, Optional
from app.schemas.user import Profile
from app.schemas.property import Property
from app.schemas.lease import Lease
from app.schemas.maintenance import MaintenanceRequest
from app.schemas.payment import Payment
from app.schemas.document import Document
from app.schemas.notification import Notification
from pydantic import BaseModel


class DashboardData(BaseModel):
    """Unified dashboard data response"""
    profile: Optional[Profile] = None
    properties: List[Property] = []
    leases: List[Lease] = []
    maintenance_requests: List[MaintenanceRequest] = []
    documents: List[Document] = []
    payments: List[Payment] = []
    notifications: List[Notification] = []
    
    # Aggregated stats for quick display
    stats: dict = {}
    
    model_config = {"from_attributes": True}

