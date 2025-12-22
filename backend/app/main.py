"""
LeaseWell Backend - FastAPI Application
Optimized for performance and scalability
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.redis_client import init_redis, close_redis
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting LeaseWell API...")
    await init_db()
    await init_redis()
    logger.info("LeaseWell API started successfully")
    yield
    # Shutdown
    logger.info("Shutting down LeaseWell API...")
    await close_db()
    await close_redis()
    logger.info("LeaseWell API shut down")


app = FastAPI(
    title="LeaseWell API",
    description="Efficient Property Management Platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "LeaseWell API",
        "version": "2.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    from app.core.database import check_db_health
    from app.core.redis_client import check_redis_health
    
    db_health = await check_db_health()
    redis_health = await check_redis_health()
    
    return {
        "status": "ok" if db_health and redis_health else "degraded",
        "database": "ok" if db_health else "error",
        "cache": "ok" if redis_health else "error"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

