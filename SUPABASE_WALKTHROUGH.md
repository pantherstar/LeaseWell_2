# 🚀 Supabase Setup Walkthrough

Follow these steps in order!

## Step 1: Create a New Project

1. **In your Supabase dashboard**, you should see:
   - A "New Project" button, OR
   - A "+" icon, OR
   - "Create a new project" link

2. **Click to create a new project**

3. **Fill in the project details:**
   - **Organization:** Select existing or create new
   - **Project Name:** `leasewell` (or any name you like)
   - **Database Password:** ⚠️ **CREATE A STRONG PASSWORD AND SAVE IT!**
     - Write it down somewhere safe
     - You'll need this password for the connection string
   - **Region:** Choose the region closest to you
   - **Pricing Plan:** Select **Free** (it's generous!)

4. **Click "Create new project"**

5. **Wait 1-2 minutes** - You'll see "Setting up your project..." message

## Step 2: Get Your Connection String

Once your project is ready (you'll see the dashboard):

1. **Click "Settings"** (gear icon in the left sidebar)

2. **Click "Database"** in the settings menu

3. **Scroll down to "Connection string" section**

4. **You'll see different connection types:**
   - URI
   - Session mode (pooler)
   - Transaction mode (pooler)
   
5. **Copy the "URI" connection string** (the first one, NOT the pooler)
   - It looks like: `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
   - OR: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

6. **⚠️ IMPORTANT:** Replace `[YOUR-PASSWORD]` with the actual password you set in Step 1!

## Step 3: Connect to LeaseWell

Now let's connect it to your app:

### Option A: Quick Script (Easiest)

```bash
cd backend
./quick_connect.sh
```

Then:
1. Choose option **1** (Supabase)
2. Paste your connection string when prompted
3. The script will automatically update your `.env` file!

### Option B: Manual Setup

1. **Edit the .env file:**
   ```bash
   cd backend
   nano .env
   # or use: code .env, vim .env, etc.
   ```

2. **Find or add this line:**
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```

3. **Important changes:**
   - Replace `YOUR_PASSWORD` with your actual password
   - Add `+asyncpg` after `postgresql` (for Python)
   - If your connection string has `[ref]` or pooler, use the direct connection instead

4. **Save the file**

## Step 4: Test the Connection

Test that everything works:

```bash
cd backend
python3 connect_database.py
```

**You should see:**
```
✅ Database connection successful!
✅ Database is ready to use!
```

If you see errors, check:
- Password is correct (no brackets)
- Connection string has `+asyncpg` in it
- You're using the direct connection (not pooler)

## Step 5: Run Database Migrations

Your database is empty, so we need to create the tables:

1. **In Supabase Dashboard:**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button

2. **Open the migration file:**
   - In your project, open: `supabase/migrations/001_initial_schema.sql`
   - Copy the ENTIRE file content (Cmd/Ctrl + A, then Cmd/Ctrl + C)

3. **Paste into SQL Editor:**
   - Paste into the SQL Editor in Supabase
   - Click **"Run"** button (or press Cmd/Ctrl + Enter)

4. **Wait for success:**
   - You should see "Success. No rows returned" or similar
   - This means tables were created!

5. **Run other migrations:**
   - Repeat for `002_row_level_security.sql`
   - Repeat for `003_storage_setup.sql`
   - And any other migration files you have

## Step 6: Verify Everything Works

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
   - Should show database status as "ok"

## 🎉 You're Done!

Your database is now fully connected and ready to use!

## Common Issues

**"Connection refused"**
- Check your connection string format
- Make sure password doesn't have brackets

**"Authentication failed"**
- Double-check your password
- Make sure you replaced `[YOUR-PASSWORD]` with actual password

**"No tables found"**
- You need to run migrations (Step 5)

**Connection string format:**
- Should be: `postgresql+asyncpg://postgres:PASSWORD@HOST:5432/postgres`
- Not: `postgresql://postgres.[ref]:...` (that's the pooler)

