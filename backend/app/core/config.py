"""
Application configuration
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # App
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/leasewell"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_TTL: int = 300  # 5 minutes default

    # CORS - stored as string, parsed to list
    CORS_ORIGINS_STR: str = "http://localhost:8080,http://localhost:3000,http://localhost:5173,https://leasewell2-production.up.railway.app"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS_ORIGINS string into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",") if origin.strip()]

    def get_cors_origins_list(self) -> List[str]:
        """Get CORS origins as list"""
        return self.CORS_ORIGINS

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Storage (S3 or local)
    STORAGE_TYPE: str = "local"  # local or s3
    S3_BUCKET: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"

    # Email (Resend)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "LeaseWell <onboarding@resend.dev>"
    FRONTEND_URL: str = "http://localhost:3000"
    VERCEL_URL: str = ""  # Auto-set by Vercel
    RAILWAY_PUBLIC_DOMAIN: str = ""  # Auto-set by Railway

    @property
    def frontend_base_url(self) -> str:
        """Get frontend URL - Railway/Vercel URL in production, FRONTEND_URL locally"""
        if self.RAILWAY_PUBLIC_DOMAIN:
            return f"https://{self.RAILWAY_PUBLIC_DOMAIN}"
        if self.VERCEL_URL:
            return f"https://{self.VERCEL_URL}"
        return self.FRONTEND_URL

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"  # Ignore extra fields from .env
    }


settings = Settings()
