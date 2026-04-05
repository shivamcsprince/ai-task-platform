# ⚡ AI Task Processing Platform

A production-ready, full-stack asynchronous task processing platform built with the MERN stack, Python workers, Redis queues, Docker, Kubernetes, and GitOps via Argo CD.

[![CI/CD](https://github.com/yourusername/ai-task-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/ai-task-platform/actions)

---

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│   React     │────▶│  Express API     │────▶│   MongoDB     │
│  Frontend   │     │  (Node.js)       │     │   Database    │
└─────────────┘     └──────────────────┘     └───────────────┘
                              │                       ▲
                              ▼                       │
                    ┌──────────────────┐     ┌───────────────┐
                    │   Redis Queue    │────▶│ Python Worker │
                    │                  │     │  (Scalable)   │
                    └──────────────────┘     └───────────────┘
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone and configure
```bash
git clone https://github.com/yourusername/ai-task-platform.git
cd ai-task-platform
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp worker/.env.example worker/.env
```

### 2. Start all services with Docker Compose
```bash
docker-compose up --build
```

### 3. Access the application
| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3000      |
| Backend   | http://localhost:5000      |
| MongoDB   | mongodb://localhost:27017  |
| Redis     | redis://localhost:6379     |

---

## 📁 Project Structure

```
ai-task-platform/
├── frontend/          # React application (Vite)
├── backend/           # Node.js + Express REST API
├── worker/            # Python background job processor
├── infra/             # Kubernetes manifests & Argo CD configs
│   ├── k8s/
│   │   ├── base/      # Base Kubernetes manifests
│   │   └── overlays/  # Environment-specific patches
│   └── argocd/        # Argo CD Application manifests
├── docs/              # Architecture and design documents
├── .github/workflows/ # CI/CD pipelines
└── docker-compose.yml # Local development orchestration
```

---

## 🔧 Services

### Frontend (React + Vite)
- Modern dashboard UI with real-time task tracking
- JWT authentication with protected routes
- Task creation, listing, and detail pages
- Port: `3000`

### Backend API (Node.js + Express)
- RESTful API with JWT authentication
- Rate limiting, Helmet security headers, CORS
- Redis queue integration for async task processing
- Port: `5000`

### Worker (Python)
- Consumes jobs from Redis queue
- Processes: `uppercase`, `lowercase`, `reverse`, `word_count`
- Writes results and logs back to MongoDB
- Horizontally scalable (multiple replicas)

### Database (MongoDB)
- Stores users and tasks with proper indexing
- Port: `27017`

### Queue (Redis)
- Async job queue between API and workers
- Port: `6379`

---

## 🔌 API Endpoints

| Method | Endpoint               | Auth | Description              |
|--------|------------------------|------|--------------------------|
| POST   | /api/auth/register     | No   | Register new user        |
| POST   | /api/auth/login        | No   | Login, receive JWT       |
| GET    | /api/auth/me           | Yes  | Get current user         |
| POST   | /api/tasks             | Yes  | Create a new task        |
| GET    | /api/tasks             | Yes  | List all tasks (paginated)|
| GET    | /api/tasks/:id         | Yes  | Get task details         |
| POST   | /api/tasks/:id/run     | Yes  | Enqueue task for processing|
| GET    | /api/tasks/:id/logs    | Yes  | Get task execution logs  |

---

## 🐳 Docker

### Build individual images
```bash
docker build -t ai-task-frontend ./frontend
docker build -t ai-task-backend ./backend
docker build -t ai-task-worker ./worker
```

### Run with Docker Compose
```bash
docker-compose up --build        # Start all services
docker-compose up -d             # Start in background
docker-compose logs -f worker    # Stream worker logs
docker-compose down -v           # Stop and remove volumes
```

---

## ☸️ Kubernetes Deployment

### Prerequisites
- kubectl configured
- k3s or any Kubernetes cluster

### Deploy base manifests
```bash
kubectl apply -k infra/k8s/base/
```

### Deploy with environment overlay
```bash
kubectl apply -k infra/k8s/overlays/production/
```

---

## 🔄 GitOps with Argo CD

### Install Argo CD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Deploy application
```bash
kubectl apply -f infra/argocd/application.yaml
```

### Access Argo CD dashboard
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Username: admin
# Password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT tokens with expiration
- **Helmet** for HTTP security headers
- **Rate limiting** on all routes (100 req/15min, 5 req/15min for auth)
- No secrets in codebase — all via `.env` / Kubernetes Secrets
- Non-root container users

---

## 📊 Performance & Scaling

- Workers scale horizontally via Kubernetes HPA
- MongoDB indexes on `userId`, `status`, `createdAt`
- Redis queue ensures at-most-once processing per job
- Handles **100k+ tasks/day** at scale (see `docs/architecture.md`)

---

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Worker tests
cd worker && python -m pytest
```

---

## 📚 Documentation

- [Architecture Document](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [API Reference](docs/api.md)

---

## 📋 Submission Checklist

- [ ] Application repository pushed to GitHub
- [ ] Infrastructure repository created
- [ ] Docker images built and pushed to Docker Hub
- [ ] Kubernetes manifests applied
- [ ] Argo CD configured and synced
- [ ] Argo CD dashboard screenshot captured
- [ ] Architecture document complete
- [ ] README with setup instructions
- [ ] Live deployed URL (if available)

---

*Built for MERN Stack Developer Internship Assignment*
