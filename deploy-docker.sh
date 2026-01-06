#!/bin/bash

echo "========================================"
echo "SGA Docker Deployment Script"
echo "========================================"

echo ""
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH"
    echo "Please install Docker first"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed or not in PATH"
    echo "Please install Docker Compose first"
    exit 1
fi

echo "Docker and Docker Compose are installed"
echo ""

echo "Setting up environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ".env file created successfully"
    echo "IMPORTANT: Edit .env file with your production settings"
    echo ""
else
    echo ".env file already exists"
fi

echo "Creating necessary directories..."
mkdir -p server/storage
mkdir -p server/uploads
mkdir -p server/database
echo "Directories created"
echo ""

echo "Stopping existing containers..."
docker-compose down 2>/dev/null

echo "Building and starting all services..."
docker-compose up --build -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "Checking service status..."
docker-compose ps

echo ""
echo "========================================"
echo "DEPLOYMENT COMPLETED"
echo "========================================"
echo ""
echo "Application URLs:"
echo "- Frontend: http://localhost:8080"
echo "- Backend API: http://localhost:8080/api"
echo "- Database: localhost:3306"
echo ""
echo "Default admin credentials:"
echo "- Username: admin"
echo "- Password: admin123"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""