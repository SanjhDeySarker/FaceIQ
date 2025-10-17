# FaceIQ Platform

A complete face detection, comparison, and metadata extraction SaaS platform.

## Quick Start

1. Copy all files to your project directory
2. Run: `docker-compose up --build`
3. Access:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Features

- Face detection with bounding boxes
- Face comparison and verification
- Age, gender, emotion detection
- Configurable similarity threshold
- JWT authentication
- MongoDB storage
- React frontend with TailwindCSS

## Default Credentials

Register a new account through the frontend interface.

## API Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/images/upload` - Upload image
- `POST /api/v1/faces/verify` - Compare faces
- `GET /api/v1/users/profile` - Get user profile

## Development

- Backend: FastAPI with Python 3.11
- Frontend: React 18 with Vite
- Database: MongoDB
- Cache: Redis