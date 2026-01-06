@echo off
echo ========================================
echo SGA Docker Deployment Script
echo ========================================

echo.
echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop first
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed or not in PATH
    echo Please install Docker Compose first
    pause
    exit /b 1
)

echo Docker and Docker Compose are installed
echo.

echo Setting up environment variables...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env >nul
    echo .env file created successfully
    echo IMPORTANT: Edit .env file with your production settings
    echo.
) else (
    echo .env file already exists
)

echo Creating necessary directories...
if not exist server\storage mkdir server\storage
if not exist server\uploads mkdir server\uploads
if not exist server\database mkdir server\database
echo Directories created
echo.

echo Stopping existing containers...
docker-compose down 2>nul

echo Building and starting all services...
docker-compose up --build -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo ========================================
echo DEPLOYMENT COMPLETED
echo ========================================
echo.
echo Application URLs:
echo - Frontend: http://localhost:8080
echo - Backend API: http://localhost:8080/api
echo - Database: localhost:3306
echo.
echo Default admin credentials:
echo - Username: admin
echo - Password: admin123
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause