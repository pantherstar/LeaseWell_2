# 🔗 Connect Database to LeaseWell

## Quick Setup

### Option 1: Use Supabase (Recommended)

If you already have a Supabase project:

1. **Get your connection string:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **Settings > Database**
   - Find **Connection string** section
   - Copy the **URI** (looks like: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

2. **Update backend/.env:**
   ```bash
   cd backend
   # Edit .env and update DATABASE_URL
   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```

3. **Or use the interactive script:**
   ```bash
   cd backend
   python3 setup_database.py
   # Choose option 1 (Supabase)
   # Paste your connection string
   ```

### Option 2: Use Local PostgreSQL

1. **Make sure PostgreSQL is running:**
   ```bash
   # Check if PostgreSQL is running
   psql --version
   ```

2. **Create database (if needed):**
   ```bash
   createdb leasewell
   ```

3. **Update backend/.env:**
   ```bash
   DATABASE_URL=postgresql+asyncpg://postgres:your-password@localhost:5432/leasewell
   ```

4. **Or use the interactive script:**
   ```bash
   cd backend
   python3 setup_database.py
   # Choose option 2 (Local PostgreSQL)
   ```

## Test Connection

After setting up, test the connection:

```bash
cd backend
python3 connect_database.py
```

You should see:
```
✅ Database connection successful!
✅ Database is ready to use!
```

## Run Migrations

If your database is empty, you need to run migrations:

### For Supabase:
1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run in SQL Editor
4. Repeat for other migration files

### For Local PostgreSQL:
```bash
psql -d leasewell -f ../supabase/migrations/001_initial_schema.sql
```

## Troubleshooting

**"Connection refused"**
- Check if PostgreSQL/Supabase is running
- Verify host and port are correct

**"Authentication failed"**
- Check username and password
- For Supabase, use the password you set when creating the project

**"Database does not exist"**
- Create the database first
- Or use the default `postgres` database

**"No tables found"**
- Run the migrations (see above)

## Need Help?

Run the interactive setup:
```bash
cd backend
python3 setup_database.py
```

This will guide you through the process step by step!

