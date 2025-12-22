"""
Script to help connect to database and test connection
"""
import asyncio
import sys
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, init_db, check_db_health

async def test_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    print(f"📍 Database URL: {settings.DATABASE_URL[:50]}...")
    print()
    
    try:
        # Test connection
        health = await check_db_health()
        if health:
            print("✅ Database connection successful!")
            print()
            print("📊 Running basic query test...")
            async with engine.begin() as conn:
                result = await conn.execute(text("SELECT version();"))
                version = result.scalar()
                print(f"   PostgreSQL version: {version.split(',')[0]}")
            
            # Check if tables exist
            print()
            print("📋 Checking for existing tables...")
            async with engine.begin() as conn:
                result = await conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name;
                """))
                tables = [row[0] for row in result.fetchall()]
                if tables:
                    print(f"   Found {len(tables)} tables:")
                    for table in tables[:10]:
                        print(f"   • {table}")
                    if len(tables) > 10:
                        print(f"   ... and {len(tables) - 10} more")
                else:
                    print("   ⚠️  No tables found. You may need to run migrations.")
            
            print()
            print("✅ Database is ready to use!")
            return True
        else:
            print("❌ Database connection failed!")
            return False
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        print()
        print("💡 Troubleshooting:")
        print("   1. Check your DATABASE_URL in backend/.env")
        print("   2. Ensure PostgreSQL/Supabase is running")
        print("   3. Verify database credentials are correct")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)

