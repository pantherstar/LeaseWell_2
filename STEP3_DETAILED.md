# 📍 Step 3: Connect to LeaseWell - Detailed Instructions

## Where to Run This

You need to use your **Terminal** (command line) on your Mac.

## Method 1: Using Terminal (Recommended)

### Step 1: Open Terminal

1. **Press:** `Cmd + Space` (opens Spotlight search)
2. **Type:** `Terminal`
3. **Press:** `Enter`

You should see a black or white window with a command prompt.

### Step 2: Navigate to the Backend Folder

In Terminal, type this command and press Enter:

```bash
cd /Users/hassan/Documents/LeaseWell-1/backend
```

You should see the prompt change to show you're in that directory.

### Step 3: Run the Connection Script

Type this command and press Enter:

```bash
./quick_connect.sh
```

### Step 4: Follow the Prompts

The script will ask you:
1. **Choose option 1** (Supabase)
2. **Paste your connection string** (the one you copied from Supabase)
3. **Confirm** when asked

That's it! The script will automatically update your `.env` file.

---

## Method 2: Manual Setup (If Script Doesn't Work)

If the script doesn't work, you can edit the file manually:

### Step 1: Open the .env File

You can use any text editor:

**Option A: Using VS Code (if you have it)**
```bash
cd /Users/hassan/Documents/LeaseWell-1/backend
code .env
```

**Option B: Using TextEdit**
```bash
cd /Users/hassan/Documents/LeaseWell-1/backend
open -a TextEdit .env
```

**Option C: Using nano (in Terminal)**
```bash
cd /Users/hassan/Documents/LeaseWell-1/backend
nano .env
```

### Step 2: Find or Add DATABASE_URL

Look for a line that says:
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/leasewell
```

### Step 3: Replace with Your Supabase Connection String

Replace that line with your Supabase connection string, but make sure to:
- Add `+asyncpg` after `postgresql`
- Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
DATABASE_URL=postgresql+asyncpg://postgres:MyActualPassword123@db.xxxxx.supabase.co:5432/postgres
```

### Step 4: Save the File

- **VS Code/TextEdit:** Cmd + S
- **nano:** Press `Ctrl + X`, then `Y`, then `Enter`

---

## Troubleshooting

**"Permission denied" when running script:**
```bash
chmod +x quick_connect.sh
./quick_connect.sh
```

**"Command not found":**
- Make sure you're in the right directory: `cd /Users/hassan/Documents/LeaseWell-1/backend`
- Check the file exists: `ls -la quick_connect.sh`

**"No such file or directory":**
- Make sure you're in: `/Users/hassan/Documents/LeaseWell-1/backend`
- Check with: `pwd` (should show the backend directory)

---

## What Happens Next?

After connecting:
1. Test the connection: `python3 connect_database.py`
2. Run migrations (Step 4)
3. Start using your app!

