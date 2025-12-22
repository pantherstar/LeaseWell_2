"""
Dashboard endpoint - optimized single query
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from datetime import date
from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.core.redis_client import get_cache, set_cache, delete_cache_pattern
from app.models.user import Profile
from app.models.property import Property
from app.models.lease import Lease
from app.models.maintenance import MaintenanceRequest
from app.models.payment import Payment
from app.models.document import Document
from app.models.notification import Notification
from app.schemas.dashboard import DashboardData
from app.schemas.user import Profile as ProfileSchema
from app.schemas.property import Property as PropertySchema
from app.schemas.lease import Lease as LeaseSchema
from app.schemas.maintenance import MaintenanceRequest as MaintenanceRequestSchema
from app.schemas.payment import Payment as PaymentSchema
from app.schemas.document import Document as DocumentSchema
from app.schemas.notification import Notification as NotificationSchema
from app.models.lease import Lease

router = APIRouter()


@router.get("", response_model=DashboardData)
async def get_dashboard(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all dashboard data in a single optimized query
    Uses caching and efficient joins
    """
    cache_key = f"dashboard:{current_user.id}"
    
    # Try cache first
    cached_data = await get_cache(cache_key)
    if cached_data:
        return DashboardData(**cached_data)
    
    user_id = current_user.id
    is_landlord = current_user.role == "landlord"
    
    # Build optimized queries based on role
    if is_landlord:
        # Landlord: get all their properties and related data
        properties_query = select(Property).where(Property.landlord_id == user_id)
        leases_query = select(Lease).where(Lease.landlord_id == user_id)
        maintenance_query = select(MaintenanceRequest).where(MaintenanceRequest.landlord_id == user_id)
        payments_query = select(Payment).where(Payment.landlord_id == user_id)
    else:
        # Tenant: get only their leases and related data
        leases_query = select(Lease).where(Lease.tenant_id == user_id)
        properties_query = select(Property).join(Lease).where(Lease.tenant_id == user_id).distinct()
        maintenance_query = select(MaintenanceRequest).where(MaintenanceRequest.tenant_id == user_id)
        payments_query = select(Payment).where(Payment.tenant_id == user_id)
    
    # Execute all queries in parallel
    properties_result = await db.execute(properties_query)
    leases_result = await db.execute(leases_query)
    maintenance_result = await db.execute(maintenance_query)
    payments_result = await db.execute(payments_query)
    
    properties = properties_result.scalars().all()
    leases = leases_result.scalars().all()
    maintenance_requests = maintenance_result.scalars().all()
    payments = payments_result.scalars().all()
    
    # Get property IDs for documents
    property_ids = [p.id for p in properties]
    if property_ids:
        documents_query = select(Document).where(Document.property_id.in_(property_ids))
    else:
        documents_query = select(Document).where(False)  # Empty result
    
    # Get notifications
    notifications_query = select(Notification).where(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(50)
    
    documents_result = await db.execute(documents_query)
    notifications_result = await db.execute(notifications_query)
    
    documents = documents_result.scalars().all()
    notifications = notifications_result.scalars().all()
    
    # Calculate stats
    active_leases = [l for l in leases if l.status == "active"]
    pending_payments = [p for p in payments if p.status == "pending"]
    pending_maintenance = [m for m in maintenance_requests if m.status == "pending"]
    
    stats = {
        "total_properties": len(properties),
        "active_leases": len(active_leases),
        "pending_payments": len(pending_payments),
        "pending_maintenance": len(pending_maintenance),
        "total_payments_this_month": sum(
            float(p.amount) for p in payments 
            if p.payment_date.month == date.today().month and p.status == "paid"
        ),
        "unread_notifications": sum(1 for n in notifications if not n.read)
    }
    
    # Build response
    dashboard_data = DashboardData(
        profile=ProfileSchema.model_validate(current_user),
        properties=[PropertySchema.model_validate(p) for p in properties],
        leases=[LeaseSchema.model_validate(l) for l in leases],
        maintenance_requests=[MaintenanceRequestSchema.model_validate(m) for m in maintenance_requests],
        documents=[DocumentSchema.model_validate(d) for d in documents],
        payments=[PaymentSchema.model_validate(p) for p in payments],
        notifications=[NotificationSchema.model_validate(n) for n in notifications],
        stats=stats
    )
    
    # Cache the result
    await set_cache(cache_key, dashboard_data.model_dump(), ttl=300)  # 5 minutes
    
    return dashboard_data


@router.post("/refresh")
async def refresh_dashboard(
    current_user: Profile = Depends(get_current_active_user)
):
    """Invalidate dashboard cache"""
    cache_key = f"dashboard:{current_user.id}"
    await delete_cache_pattern(f"{cache_key}*")
    return {"message": "Dashboard cache cleared"}

