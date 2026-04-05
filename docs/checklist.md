# Submission Checklist

## Application Repository
- [ ] All source code pushed to GitHub
- [ ] `.gitignore` excludes `.env` files and `node_modules`
- [ ] `README.md` with setup instructions
- [ ] `docker-compose.yml` for local development
- [ ] `.env.example` files for all services

## Services Implemented
- [ ] Frontend (React + Vite) — login, register, dashboard, task detail
- [ ] Backend API (Node.js + Express) — all 7 endpoints
- [ ] Python Worker — all 4 operations (uppercase, lowercase, reverse, word_count)
- [ ] MongoDB integration
- [ ] Redis queue integration

## API Endpoints
- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login`
- [ ] `GET /api/auth/me`
- [ ] `POST /api/tasks`
- [ ] `GET /api/tasks`
- [ ] `GET /api/tasks/:id`
- [ ] `POST /api/tasks/:id/run`
- [ ] `GET /api/tasks/:id/logs`

## Task Processing
- [ ] Task status transitions: pending → running → success/failed
- [ ] All operations work: uppercase, lowercase, reverse, word_count
- [ ] Logs written to MongoDB per task
- [ ] Error handling and retry logic in worker

## Security
- [ ] bcrypt password hashing
- [ ] JWT authentication on protected routes
- [ ] Helmet middleware
- [ ] Rate limiting (global + auth)
- [ ] No hardcoded secrets
- [ ] `.env.example` files only (no real `.env` in repo)

## Docker
- [ ] `Dockerfile` for frontend (multi-stage, non-root user)
- [ ] `Dockerfile` for backend (multi-stage, non-root user)
- [ ] `Dockerfile` for worker (multi-stage, non-root user)
- [ ] `docker-compose.yml` starts all services
- [ ] `docker-compose up --build` works end-to-end

## Kubernetes
- [ ] Namespace manifest
- [ ] ConfigMap for non-secret config
- [ ] Secret manifest (template only, no real values)
- [ ] MongoDB StatefulSet + Service
- [ ] Redis Deployment + Service
- [ ] Backend Deployment + Service (with probes)
- [ ] Frontend Deployment + Service (with probes)
- [ ] Worker Deployment (with HPA)
- [ ] Ingress manifest
- [ ] Kustomize base + overlays (staging, production)

## GitOps / Argo CD
- [ ] Separate infrastructure repository created
- [ ] Kubernetes manifests stored in infra repo
- [ ] Argo CD installed on cluster
- [ ] `Application` manifest applied
- [ ] Auto-sync enabled (prune + selfHeal)
- [ ] **Argo CD dashboard screenshot captured** ← Required!

## CI/CD
- [ ] GitHub Actions workflow file
- [ ] Lint step
- [ ] Test step (backend + worker)
- [ ] Docker build + push step
- [ ] Infra repo image tag update step
- [ ] GitHub Secrets configured (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN, etc.)

## Documentation
- [ ] `README.md` — setup, architecture overview, endpoint table
- [ ] `docs/architecture.md` — 2–4 pages with scaling, indexing, Redis failure, staging/prod
- [ ] `docs/deployment.md` — step-by-step deployment guide
- [ ] `docs/demo-script.md` — interview presentation guide

## Submission Deliverables
- [ ] Application repository URL
- [ ] Infrastructure repository URL
- [ ] Live deployed URL (if available)
- [ ] Argo CD dashboard screenshot
- [ ] Architecture document (docs/architecture.md)
- [ ] README with setup instructions
