   # TravelIQ AI Platform

TravelIQ is a production-ready, AI-powered Travel Optimization Platform. It predicts travel price and time, suggests the best modes of transport, and optimizes multi-modal routes using intelligent algorithms.

## Features

- **Immersive UI:** Premium, modern frontend built with React, Vite, Tailwind CSS, and Framer Motion.
- **AI Analytics Dashboard:** Built with Recharts and Leaflet to visualize data and map paths.
- **Microservices Architecture:** 
  - Express.js Backend for user auth and DB interactions.
  - Python FastAPI Service for AI models and route optimization.
- **NetworkX Routing:** Multi-modal graph algorithms (Dijkstra) to calculate optimal transport paths (Flight -> Train -> Taxi).
- **Dockerized:** Fully orchestrated with Docker Compose for seamless local and production deployment.

## Prerequisites

- Docker and Docker Compose

## Quick Start (Docker)

1. Clone the repository.
2. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. The platform will be available at:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - AI Microservice API: `http://localhost:8000`

## Manual Setup

### 1. AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python generate_data.py
python train_models.py
uvicorn main:app --reload --port 8000
```

### 2. Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
