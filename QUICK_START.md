# LeaseWell 2.0 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

Minimum required settings:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/leasewell
SECRET_KEY=your-secret-key-here
```

### Step 3: Database Setup

Use your existing Supabase database or create a new PostgreSQL database. The schema is compatible with the existing migrations in `supabase/migrations/`.

### Step 4: Start Backend

```bash
python run.py
```

Backend will run on `http://localhost:8000`

### Step 5: Frontend Setup

The frontend is static. Serve it with any web server:

```bash
cd frontend
python -m http.server 3000
```

Or use nginx, serve the `frontend/` directory.

**Important**: Update `API_BASE` in `frontend/static/js/app.js` to match your backend URL.

### Step 6: Test

1. Open `http://localhost:3000` in your browser
2. Register a new account (landlord or tenant)
3. Login and explore the dashboard

## 🎯 Key Features

- **Single Dashboard Endpoint**: All data in one request
- **Redis Caching**: Optional but recommended
- **Fast API**: Async Python backend
- **Minimal Frontend**: Vanilla JavaScript, no framework overhead

## 📝 Notes

- Redis is optional - the app works without it (caching disabled)
- The frontend uses vanilla JavaScript for maximum performance
- All API endpoints are RESTful and well-documented
- Check `/docs` endpoint for API documentation when DEBUG=True

## 🐛 Troubleshooting

**Database connection errors?**
- Check your DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists

**Redis errors?**
- App works without Redis (caching disabled)
- Check REDIS_URL if you want caching

**CORS errors?**
- Update CORS_ORIGINS in .env
- Add your frontend URL to the list

## 🎨 Customization

- Edit `frontend/static/css/style.css` for styling
- Edit `frontend/static/js/app.js` for frontend logic
- Backend is modular - edit endpoints in `backend/app/api/v1/endpoints/`

Enjoy your efficient property management platform! 🏠

