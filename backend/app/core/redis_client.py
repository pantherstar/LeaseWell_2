"""
Redis client for caching
"""
import redis.asyncio as redis
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)

redis_client: redis.Redis = None


async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        # Test connection
        await redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Continuing without cache.")
        redis_client = None


async def close_redis():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")


async def check_redis_health() -> bool:
    """Check Redis health"""
    if not redis_client:
        return False
    try:
        await redis_client.ping()
        return True
    except Exception:
        return False


async def get_cache(key: str):
    """Get value from cache"""
    if not redis_client:
        return None
    try:
        value = await redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.warning(f"Cache get error: {e}")
        return None


async def set_cache(key: str, value: any, ttl: int = None):
    """Set value in cache"""
    if not redis_client:
        return False
    try:
        ttl = ttl or settings.REDIS_TTL
        await redis_client.setex(
            key,
            ttl,
            json.dumps(value, default=str)
        )
        return True
    except Exception as e:
        logger.warning(f"Cache set error: {e}")
        return False


async def delete_cache(key: str):
    """Delete value from cache"""
    if not redis_client:
        return False
    try:
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache delete error: {e}")
        return False


async def delete_cache_pattern(pattern: str):
    """Delete all keys matching pattern"""
    if not redis_client:
        return False
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
        return True
    except Exception as e:
        logger.warning(f"Cache pattern delete error: {e}")
        return False

