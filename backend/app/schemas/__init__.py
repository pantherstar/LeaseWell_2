from app.schemas.user import User, UserCreate, UserLogin, Profile, ProfileUpdate
from app.schemas.property import Property, PropertyCreate, PropertyUpdate
from app.schemas.lease import Lease, LeaseCreate, LeaseUpdate
from app.schemas.maintenance import MaintenanceRequest, MaintenanceRequestCreate, MaintenanceRequestUpdate
from app.schemas.payment import Payment, PaymentCreate, PaymentUpdate
from app.schemas.document import Document, DocumentCreate
from app.schemas.notification import Notification, NotificationCreate
from app.schemas.dashboard import DashboardData

__all__ = [
    "User", "UserCreate", "UserLogin", "Profile", "ProfileUpdate",
    "Property", "PropertyCreate", "PropertyUpdate",
    "Lease", "LeaseCreate", "LeaseUpdate",
    "MaintenanceRequest", "MaintenanceRequestCreate", "MaintenanceRequestUpdate",
    "Payment", "PaymentCreate", "PaymentUpdate",
    "Document", "DocumentCreate",
    "Notification", "NotificationCreate",
    "DashboardData",
]

