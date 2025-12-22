"""
API v1 Router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, dashboard, properties, leases, maintenance, payments, documents, notifications, invitations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(leases.router, prefix="/leases", tags=["leases"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(invitations.router, prefix="/tenants", tags=["invitations"])

