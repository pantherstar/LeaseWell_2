"""
Interactive script to set up database connection
Supports both Supabase and local PostgreSQL
"""
import os
import sys

def get_supabase_connection():
    """Get Supabase connection string from user"""
    print("\n" + "="*60)
    print("🔗 Supabase Database Connection Setup")
    print("="*60)
    print()
    print("To get your Supabase connection string:")
    print("1. Go to https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Go to Settings > Database")
    print("4. Find 'Connection string' section")
    print("5. Copy the 'URI' connection string")
    print("   (It looks like: postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres)")
    print()
    print("Or use the connection pooler:")
    print("   Settings > Database > Connection Pooling > Session mode")
    print()
    
    connection_string = input("Paste your Supabase connection string (or press Enter to skip): ").strip()
    
    if not connection_string:
        return None
    
    # Convert to asyncpg format if needed
    if connection_string.startswith("postgresql://"):
        connection_string = connection_string.replace("postgresql://", "postgresql+asyncpg://")
    
    return connection_string

def get_local_connection():
    """Get local PostgreSQL connection"""
    print("\n" + "="*60)
    print("💻 Local PostgreSQL Connection Setup")
    print("="*60)
    print()
    
    host = input("Database host [localhost]: ").strip() or "localhost"
    port = input("Database port [5432]: ").strip() or "5432"
    database = input("Database name [leasewell]: ").strip() or "leasewell"
    user = input("Database user [postgres]: ").strip() or "postgres"
    password = input("Database password: ").strip()
    
    if not password:
        print("⚠️  Password is required!")
        return None
    
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}"

def update_env_file(connection_string):
    """Update .env file with database URL"""
    env_path = ".env"
    
    # Read existing .env
    env_content = ""
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            env_content = f.read()
    
    # Update or add DATABASE_URL
    lines = env_content.split("\n")
    updated = False
    new_lines = []
    
    for line in lines:
        if line.startswith("DATABASE_URL="):
            new_lines.append(f"DATABASE_URL={connection_string}")
            updated = True
        else:
            new_lines.append(line)
    
    if not updated:
        new_lines.append(f"DATABASE_URL={connection_string}")
    
    # Write back
    with open(env_path, "w") as f:
        f.write("\n".join(new_lines))
        if not new_lines[-1].endswith("\n"):
            f.write("\n")
    
    print(f"✅ Updated {env_path} with new DATABASE_URL")

def main():
    print("\n" + "="*60)
    print("🗄️  LeaseWell Database Connection Setup")
    print("="*60)
    print()
    print("Choose your database type:")
    print("1. Supabase (Cloud PostgreSQL - Recommended)")
    print("2. Local PostgreSQL")
    print("3. Exit")
    print()
    
    choice = input("Enter choice [1-3]: ").strip()
    
    if choice == "1":
        connection_string = get_supabase_connection()
    elif choice == "2":
        connection_string = get_local_connection()
    else:
        print("Exiting...")
        return
    
    if not connection_string:
        print("⚠️  No connection string provided. Exiting.")
        return
    
    print()
    print(f"📝 Connection string: {connection_string[:50]}...")
    confirm = input("Use this connection? [y/N]: ").strip().lower()
    
    if confirm != "y":
        print("Cancelled.")
        return
    
    update_env_file(connection_string)
    print()
    print("✅ Database connection configured!")
    print()
    print("Next steps:")
    print("1. Test connection: python3 connect_database.py")
    print("2. Run migrations if needed (see supabase/migrations/)")
    print("3. Start backend: python3 run.py")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)

