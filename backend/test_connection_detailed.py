"""
Detailed connection test with better error messages
"""
import asyncio
import sys
from urllib.parse import quote_plus
from sqlalchemy.ext.asyncio import create_async_engine

async def test_connection_detailed():
    """Test connection with detailed error messages"""
    print("🔍 Testing database connection with detailed diagnostics...")
    print()
    
    # Read from .env
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    db_url = os.getenv("DATABASE_URL", "")
    
    if not db_url:
        print("❌ DATABASE_URL not found in .env file!")
        return False
    
    print(f"📍 Connection string format: {db_url[:60]}...")
    print()
    
    # Check for common issues
    if "[YOUR-PASSWORD]" in db_url:
        print("❌ Still has [YOUR-PASSWORD] placeholder!")
        print("   Please replace it with your actual password.")
        return False
    
    if not "postgresql+asyncpg" in db_url:
        print("⚠️  Connection string should use 'postgresql+asyncpg://'")
        print("   (for Python asyncpg driver)")
    
    # Test connection
    try:
        print("🔄 Attempting connection...")
        engine = create_async_engine(
            db_url,
            pool_pre_ping=True,
            connect_args={"server_settings": {"application_name": "leasewell"}}
        )
        
        async with engine.begin() as conn:
            result = await conn.execute("SELECT version();")
            version = result.scalar()
            print(f"✅ Connection successful!")
            print(f"   PostgreSQL: {version.split(',')[0]}")
            print()
            
            # Check tables
            result = await conn.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = [row[0] for row in result.fetchall()]
            if tables:
                print(f"📋 Found {len(tables)} tables")
            else:
                print("⚠️  No tables found - you'll need to run migrations")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        
        print(f"❌ Connection failed!")
        print(f"   Error type: {error_type}")
        print(f"   Message: {error_msg}")
        print()
        
        # Provide specific troubleshooting
        if "password" in error_msg.lower() or "authentication" in error_msg.lower():
            print("💡 Authentication issue:")
            print("   • Check your password is correct")
            print("   • Make sure you're using the database password (not account password)")
            print("   • Special characters in password may need URL encoding")
        elif "connection" in error_msg.lower() or "refused" in error_msg.lower():
            print("💡 Connection issue:")
            print("   • Check your Supabase project is running")
            print("   • Verify the host/port in connection string")
            print("   • Check firewall/network settings")
        elif "database" in error_msg.lower() and "does not exist" in error_msg.lower():
            print("💡 Database issue:")
            print("   • Use 'postgres' as database name (default)")
            print("   • Or create the database in Supabase")
        else:
            print("💡 General troubleshooting:")
            print("   • Verify connection string format")
            print("   • Check Supabase dashboard for connection info")
            print("   • Try resetting database password in Supabase")
        
        try:
            await engine.dispose()
        except:
            pass
        
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(test_connection_detailed())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(1)

