# 🚀 Step-by-Step: Connect Supabase Database

I'll guide you through connecting Supabase to LeaseWell. It takes about 5 minutes!

## Step 1: Create Supabase Account (2 minutes)

1. **Go to Supabase:**
   - Open: https://supabase.com
   - Click **"Start your project"** or **"Sign up"**

2. **Sign up:**
   - Use GitHub (recommended) or email
   - Complete the signup process

## Step 2: Create a Project (2 minutes)

1. **Create new project:**
   - Click **"New Project"** or **"Create Project"**
   - Fill in:
     - **Organization:** Create new or select existing
     - **Project Name:** `leasewell` (or any name)
     - **Database Password:** ⚠️ **SAVE THIS PASSWORD!** You'll need it
     - **Region:** Choose closest to you
     - **Pricing Plan:** Free tier is fine to start

2. **Wait for setup:**
   - Click **"Create new project"**
   - Wait 1-2 minutes for provisioning
   - You'll see "Setting up your project..." message

## Step 3: Get Connection String (1 minute)

Once your project is ready:

1. **Go to Database Settings:**
   - In left sidebar, click **Settings** (gear icon)
   - Click **Database** in the settings menu

2. **Find Connection String:**
   - Scroll to **"Connection string"** section
   - You'll see different connection types
   - **Copy the "URI"** (not the pooler)
   - It looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```

3. **Important:** Replace `[YOUR-PASSWORD]` with the password you set in Step 2!

## Step 4: Connect to LeaseWell (1 minute)

Now let's connect it to your app:

### Option A: Use the Quick Script (Easiest)

```bash
cd backend
./quick_connect.sh
```

Then:
1. Choose option **1** (Supabase)
2. Paste your connection string when prompted
3. The script will update your `.env` automatically!

### Option B: Manual Setup

1. **Edit backend/.env:**
   ```bash
   cd backend
   nano .env  # or use your favorite editor
   ```

2. **Update DATABASE_URL:**
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
   
   ⚠️ **Important:** 
   - Replace `YOUR_PASSWORD` with your actual password
   - Add `+asyncpg` after `postgresql` (for Python async)

3. **Save the file**

## Step 5: Test Connection

Test that it works:

```bash
cd backend
python3 connect_database.py
```

You should see:
```
✅ Database connection successful!
✅ Database is ready to use!
```

## Step 6: Run Migrations

Your database is empty, so we need to create the tables:

### Using Supabase Dashboard (Easiest):

1. **Go to SQL Editor:**
   - In Supabase dashboard, click **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Run migrations:**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire file content
   - Paste into SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

3. **Run other migrations:**
   - Repeat for `002_row_level_security.sql`
   - Repeat for `003_storage_setup.sql`
   - And any other migration files you have

### Using Command Line (Alternative):

```bash
# Install psql if needed
# Then connect and run migrations
psql "postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres" -f supabase/migrations/001_initial_schema.sql
```

## Step 7: Verify Everything Works

1. **Test connection again:**
   ```bash
   cd backend
   python3 connect_database.py
   ```
   
   You should now see tables listed!

2. **Start your backend:**
   ```bash
   python3 run.py
   ```

3. **Test the API:**
   - Open: http://localhost:8000/health
   - Should show database status

## 🎉 You're Done!

Your database is now connected! You can:
- ✅ Register users
- ✅ Create properties
- ✅ Manage leases
- ✅ All features work!

## Troubleshooting

**"Connection refused"**
- Check your connection string is correct
- Verify password is correct (no brackets)

**"Authentication failed"**
- Double-check your password
- Make sure you replaced `[YOUR-PASSWORD]` with actual password

**"No tables found"**
- You need to run migrations (Step 6)

**"Database does not exist"**
- Use `postgres` as the database name (default)

## Need Help?

If you get stuck at any step, let me know which step and what error you see!

