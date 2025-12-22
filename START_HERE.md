# 🚀 START HERE - View Your LeaseWell App

## Quickest Way to See It

### 1. Start Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt  # First time only
python run.py
```
✅ Backend running at: **http://localhost:8000**

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
python3 -m http.server 8080
```
✅ Frontend running at: **http://localhost:3000**

### 3. Open Browser
Go to: **http://localhost:8080** 🎉

---

## What You Need First

### Database Setup
You need a PostgreSQL database. Options:

**Option A: Use Existing Supabase Database**
- Get your Supabase connection string
- Update `backend/.env` with `DATABASE_URL`

**Option B: Create New Database**
```bash
# Create database
createdb leasewell

# Update backend/.env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/leasewell
```

### Create Environment File
```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and SECRET_KEY
```

Minimum `.env` content:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/leasewell
SECRET_KEY=your-random-secret-key-here
DEBUG=True
```

---

## Or Use the Startup Script

```bash
./start.sh
```

This starts both servers automatically!

---

## First Time Using It

1. **Open** http://localhost:8080
2. **Click** "Register"
3. **Create** an account (choose landlord or tenant)
4. **Login** with your credentials
5. **Explore** the dashboard!

---

## Need Help?

- **Backend not starting?** Check database connection in `.env`
- **Frontend shows errors?** Check browser console (F12)
- **API errors?** Make sure backend is running on port 8000
- **See** `VIEW_APP.md` for detailed troubleshooting

---

## URLs

- 🏠 **Main App**: http://localhost:8080
- 🔧 **API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs

Enjoy! 🎊

