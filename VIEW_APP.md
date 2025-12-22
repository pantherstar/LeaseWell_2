# 🎯 How to View LeaseWell

## Quick Start (Easiest Way)

### Option 1: Use the Startup Script
```bash
./start.sh
```

This will automatically:
- Install dependencies (first time only)
- Start the backend on `http://localhost:8000`
- Start the frontend on `http://localhost:3000`

Then open your browser to: **http://localhost:8080**

---

## Manual Setup

### Step 1: Start the Backend

Open a terminal and run:
```bash
cd backend
pip install -r requirements.txt  # First time only
python run.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Backend is running at: **http://localhost:8000**

### Step 2: Start the Frontend

Open a **new terminal** and run:
```bash
cd frontend
python3 -m http.server 8080
```

You should see:
```
Serving HTTP on :: port 3000
```

✅ Frontend is running at: **http://localhost:8080**

### Step 3: Open in Browser

Open your browser and go to:
**http://localhost:8080**

---

## What You'll See

1. **Home Page** - Welcome screen with Login/Register buttons
2. **Register** - Create a new account (landlord or tenant)
3. **Login** - Sign in with your credentials
4. **Dashboard** - Your property management dashboard with:
   - Overview stats
   - Properties
   - Leases
   - Maintenance requests
   - Payments

---

## Important Notes

### Before First Run

1. **Database Setup**: You need a PostgreSQL database. You can:
   - Use your existing Supabase database
   - Create a new PostgreSQL database
   - Update `backend/.env` with your database URL

2. **Environment File**: Create `backend/.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/leasewell
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ```

3. **Frontend API URL**: The frontend is configured to use `/api/v1` which works if:
   - You're serving the frontend from the same domain as the backend, OR
   - You update `frontend/static/js/app.js` line 8 to use the full backend URL:
     ```javascript
     const API_BASE = 'http://localhost:8000/api/v1';
     ```

---

## URLs to Access

- **Frontend (Main App)**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (when DEBUG=True)
- **Health Check**: http://localhost:8000/health

---

## Troubleshooting

**"Cannot connect to API"**
- Make sure backend is running on port 8000
- Check browser console for errors
- Update `API_BASE` in `frontend/static/js/app.js` if needed

**"Database connection error"**
- Check your `DATABASE_URL` in `backend/.env`
- Make sure PostgreSQL is running
- Verify database exists

**"CORS error"**
- Add `http://localhost:8080` to `CORS_ORIGINS` in `backend/.env`

**Port already in use?**
- Change port in `backend/run.py` (backend)
- Change port in frontend command: `python3 -m http.server 9000` (frontend)

---

## Next Steps

1. Register a new account
2. Login
3. Explore the dashboard
4. Add properties (if landlord)
5. Create leases
6. Test all features!

Enjoy! 🏠✨

