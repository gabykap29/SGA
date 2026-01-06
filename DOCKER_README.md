# Docker Deployment Guide for SGA

## Prerequisites
- Docker and Docker Compose installed
- Git repository cloned locally

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up --build -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8080/api
   - Database: localhost:3306

## Services

### Frontend (Next.js)
- Container: `sga-frontend`
- Port: 3000
- Framework: Next.js 15 with React 19

### Backend (FastAPI)
- Container: `sga-backend`
- Port: 8000
- Framework: FastAPI with Python 3.11

### Database (MariaDB)
- Container: `sga-db`
- Port: 3306
- Version: MariaDB 10.11
- Database: `sga_db`

### Reverse Proxy (Nginx)
- Container: `sga-nginx`
- Port: 8080
- Routes:
  - `/` → Frontend (port 3000)
  - `/api/` → Backend (port 8000)

## Useful Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Stop services
```bash
docker-compose down
```

### Rebuild and restart
```bash
docker-compose up --build -d
```

### Access database
```bash
docker-compose exec db mysql -u user -p sga_db
```

### Execute commands in containers
```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec db mysql -u root -p
```

## Database Initialization

The database is automatically initialized with:
- Admin user: `admin` / `admin123`
- Basic categories
- Required tables and indexes

## File Storage

- Backend uploads: `./server/storage` → `/app/storage`
- User uploads: `./server/uploads` → `/app/uploads`

## Environment Variables

Key variables in `.env`:
- `DATABASE_HOST`: Database container name
- `SECRET_KEY`: JWT secret key
- `NEXT_PUBLIC_API_URL`: Frontend API URL

## Production Considerations

1. **Change default passwords** in `.env`
2. **Set strong `SECRET_KEY`** for JWT
3. **Configure SSL/TLS** for production
4. **Set up proper backup strategy** for database
5. **Monitor logs** regularly
6. **Update dependencies** regularly

## Troubleshooting

### Database connection issues
```bash
# Check if database is ready
docker-compose exec db mysql -u user -ppassword -e "SHOW DATABASES;"
```

### Permission issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./server/storage
sudo chown -R $USER:$USER ./server/uploads
```

### Port conflicts
- Ensure ports 80, 3000, 8000, 3306 are available
- Modify ports in `docker-compose.yml` if needed