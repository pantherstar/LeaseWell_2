# LeaseWell 2.0 - Efficient Property Management Platform

A completely redesigned, high-performance property management platform built with Python FastAPI and a streamlined frontend.

## 🚀 Key Improvements

### Performance Optimizations
- **Python FastAPI Backend**: Async/await for maximum concurrency
- **Single Dashboard Endpoint**: One optimized query instead of multiple API calls
- **Redis Caching**: 5-minute cache for dashboard data
- **Connection Pooling**: Efficient database connection management
- **Minimal Frontend**: Vanilla JavaScript, no heavy frameworks

### Architecture
- **Backend**: FastAPI with async SQLAlchemy
- **Database**: PostgreSQL with optimized queries
- **Cache**: Redis for performance
- **Frontend**: Minimal vanilla JavaScript
- **Authentication**: JWT tokens

## 📁 Project Structure

```
LeaseWell-1/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # API endpoints
│   │   ├── core/                # Core functionality (auth, db, cache)
│   │   ├── models/              # SQLAlchemy models
│   │   └── schemas/             # Pydantic schemas
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── static/
│   │   ├── css/style.css
│   │   └── js/app.js
│   └── index.html
└── README_NEW.md
```

## 🛠️ Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Redis (optional, for caching)

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment**:
Create a `.env` file:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/leasewell
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=True
```

3. **Run database migrations**:
```bash
# Use the existing Supabase migrations or create new ones with Alembic
```

4. **Start the server**:
```bash
python run.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

The frontend is static and can be served with any web server:

```bash
# Using Python
cd frontend
python -m http.server 3000

# Or using nginx, serve the frontend/ directory
```

Update `API_BASE` in `frontend/static/js/app.js` to point to your backend.

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Dashboard
- `GET /api/v1/dashboard` - Get all dashboard data (cached)
- `POST /api/v1/dashboard/refresh` - Clear cache

### Resources
- `GET /api/v1/properties` - List properties
- `POST /api/v1/properties` - Create property
- `GET /api/v1/leases` - List leases
- `GET /api/v1/maintenance` - List maintenance requests
- `GET /api/v1/payments` - List payments
- `GET /api/v1/documents` - List documents
- `GET /api/v1/notifications` - List notifications

## 🎯 Performance Features

1. **Single Dashboard Query**: All dashboard data in one request
2. **Redis Caching**: Dashboard data cached for 5 minutes
3. **Connection Pooling**: Efficient database connections
4. **Optimized Queries**: Role-based query optimization
5. **Minimal Frontend**: No framework overhead

## 🔒 Security

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- SQL injection protection via SQLAlchemy

## 🚢 Deployment

### Docker

```bash
docker build -t leasewell-backend ./backend
docker run -p 8000:8000 leasewell-backend
```

### Production

1. Set `DEBUG=False` in environment
2. Use a production ASGI server (e.g., Gunicorn with Uvicorn workers)
3. Set up proper database connection pooling
4. Configure Redis for caching
5. Use a reverse proxy (nginx) for the frontend

## 📈 Monitoring

- Health check: `GET /health`
- API docs: `GET /docs` (when DEBUG=True)

## 🔄 Migration from Old Version

The new version uses the same database schema, so you can:
1. Keep using your existing PostgreSQL database
2. Point the new backend to your existing database
3. The frontend is completely new, so you'll need to update any bookmarks

## 🐛 Troubleshooting

- **Database connection errors**: Check DATABASE_URL in .env
- **Redis errors**: The app will continue without Redis (caching disabled)
- **CORS errors**: Update CORS_ORIGINS in settings

## 📝 License

Same as original project.

