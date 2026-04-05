# Architecture Document — AI Task Processing Platform

**Version:** 1.0  
**Author:** [Your Name]  
**Date:** 2024

---

## 1. System Overview

The AI Task Processing Platform is a cloud-native, microservice-style application that enables authenticated users to submit text-processing tasks asynchronously. Tasks are enqueued into Redis and consumed by horizontally scalable Python worker pods, with results persisted in MongoDB.

### High-Level Architecture

```
Browser (React SPA)
        │
        │ HTTPS
        ▼
  [ Kubernetes Ingress / Nginx ]
        │                │
        ▼                ▼
  [ Frontend ]     [ Backend API ]
  (Nginx + React)  (Node.js/Express)
                         │         │
                         ▼         ▼
                    [ MongoDB ] [ Redis Queue ]
                         ▲         │
                         │         ▼
                    [ Python Worker × N replicas ]
```

### Component Responsibilities

| Component    | Technology          | Role                                           |
|-------------|---------------------|------------------------------------------------|
| Frontend     | React + Vite + Nginx | SPA served statically; API calls via Ingress  |
| Backend API  | Node.js + Express    | Auth, task CRUD, job enqueuing                |
| Worker       | Python 3.11          | Job consumer, text processing, result storage |
| Database     | MongoDB 7.0          | Persistent store for users and tasks          |
| Queue        | Redis 7.2            | Async job queue between API and workers       |
| Ingress      | Nginx Ingress        | TLS termination, routing, rate limiting       |
| GitOps       | Argo CD              | Declarative deployment from Git               |
| CI/CD        | GitHub Actions       | Build, test, push, update infra repo          |

---

## 2. API Design

### Authentication Flow
```
POST /api/auth/register  →  Create user, return JWT
POST /api/auth/login     →  Verify bcrypt hash, return JWT
GET  /api/auth/me        →  Validate JWT, return user profile
```

### Task Lifecycle
```
POST /api/tasks          →  Create task (status: pending)
POST /api/tasks/:id/run  →  Enqueue job to Redis → status: pending (re-queued)
                             Worker picks up → status: running
                             Worker completes → status: success | failed
GET  /api/tasks          →  Paginated list (user-scoped)
GET  /api/tasks/:id      →  Full task with result and logs
GET  /api/tasks/:id/logs →  Log entries only
```

### Queue Message Format (Redis LPUSH / BRPOP)
```json
{
  "jobId": "uuid-v4",
  "taskId": "mongodb-object-id",
  "operation": "uppercase | lowercase | reverse | word_count",
  "inputText": "...",
  "enqueuedAt": "ISO-8601"
}
```

---

## 3. Worker Scaling Strategy

### How Workers Scale Safely
- Each worker calls `BRPOP` (blocking right pop) — Redis guarantees **at-most-once delivery**: only one worker can claim a job from the queue at a time.
- Multiple replicas can run concurrently without coordination. No distributed locks needed.
- Kubernetes HPA scales workers based on CPU utilization (target 70%). As queue depth grows, workers become busy → CPU rises → HPA adds replicas.

### Advanced Scaling (KEDA — Optional)
For queue-depth-based scaling (more accurate than CPU), replace HPA with [KEDA](https://keda.sh/):
```yaml
# KEDA ScaledObject watches Redis queue length directly
triggers:
  - type: redis
    metadata:
      listName: task_queue
      listLength: "10"  # Scale up when >10 jobs queued
```
This achieves near-zero-latency scaling proportional to actual backlog.

---

## 4. Handling 100,000 Tasks/Day

**Back-of-envelope:**
- 100,000 tasks/day = ~1.16 tasks/second average
- Peak load (assuming 10× average): ~12 tasks/second

**Throughput with current design:**
- Each worker processes ~2–5 tasks/second (simple string ops)
- 3 worker replicas → 6–15 tasks/second → handles 10× peak easily
- HPA can scale to 20 replicas → up to 100 tasks/second

**Infrastructure requirements for 100k/day:**
| Layer      | Spec                               |
|------------|------------------------------------|
| Backend    | 2–3 replicas, 500m CPU / 512Mi each |
| Workers    | 3–10 replicas (HPA-managed)        |
| MongoDB    | Single node sufficient; add replica set for HA |
| Redis      | Single node; 256MB maxmemory with LRU eviction |

**If volume grows to 10M tasks/day:**
- Partition Redis queues by operation type (separate queue per op type)
- Add MongoDB read replicas for GET /tasks
- Use MongoDB sharding on `userId`
- Consider KEDA queue-depth scaling for workers
- Add API Gateway (Kong/AWS API GW) for advanced rate limiting

---

## 5. Database Indexing Strategy

### Users Collection
```js
db.users.createIndex({ email: 1 }, { unique: true })
// Used by: login (exact match), register (duplicate check)
// Cardinality: high (one email per user)
```

### Tasks Collection
```js
// Primary query pattern: "get my tasks, newest first"
db.tasks.createIndex({ userId: 1, createdAt: -1 })

// Filter by status globally (admin/monitoring)
db.tasks.createIndex({ status: 1 })

// Filter a user's tasks by status (most common dashboard query)
db.tasks.createIndex({ userId: 1, status: 1 })
```

**Why these indexes?**
- `userId + createdAt`: Covers the dashboard list query entirely (covered index)
- `status`: Supports fast status-based polling by workers (though workers use Redis, not Mongo, for job picking)
- `userId + status`: Covers the filter tabs on the dashboard (pending/running/etc.)

**Index maintenance:**
- MongoDB B-tree indexes add ~10–15% write overhead — acceptable for this workload
- Monitor with `db.tasks.explain("executionStats").find({userId: X})` to confirm index usage

---

## 6. Redis Failure Handling

### What happens when Redis goes down?

| Scenario                     | Behavior                                                    |
|------------------------------|-------------------------------------------------------------|
| Redis down during enqueue    | API catches error, marks task `failed`, returns 503 to user |
| Redis down while worker runs | Worker retries connection (retryStrategy with backoff)       |
| Redis restarts               | Pending jobs in queue survive (AOF persistence enabled)      |
| Redis OOM                    | LRU eviction configured; old jobs evicted (acceptable loss)  |

### AOF Persistence
Redis is configured with `appendonly yes`, meaning every write is durably journaled. If Redis pod restarts, the queue is restored from the AOF log.

### Circuit Breaker Pattern (Optional Enhancement)
Wrap the `redis.lpush` call in a circuit breaker (e.g., `opossum` for Node.js). If Redis is consistently failing, open the circuit and fail fast with a user-friendly message rather than blocking on timeouts.

---

## 7. Staging vs. Production Deployment

### Environment Separation via Kustomize Overlays

```
infra/k8s/
├── base/            # Shared manifests (all environments)
└── overlays/
    ├── staging/     # Low-replica counts, debug logging, staging domain
    └── production/  # High-replica counts, warn logging, prod domain, TLS
```

### Key Differences

| Config              | Staging              | Production           |
|---------------------|----------------------|----------------------|
| Replicas (backend)  | 1                    | 3                    |
| Replicas (worker)   | 1 (HPA: 1–3)         | 2 (HPA: 2–20)        |
| Log level           | debug                | warn                 |
| TLS                 | Self-signed / none   | Let's Encrypt        |
| Domain              | staging.yourdomain   | yourdomain.com       |
| Image tag           | `staging-<sha>`      | `<sha>` + `latest`   |

### Deployment Flow
```
Developer pushes code to `main`
    → GitHub Actions: lint, test, build images, push to Docker Hub
    → GitHub Actions: updates image tags in infra repo (kustomize edit set image)
    → Argo CD detects infra repo change (polling every 3 min or webhook)
    → Argo CD applies production overlay to cluster
    → Rolling update: zero-downtime (maxUnavailable: 0)
```

---

## 8. Security Architecture

- **Authentication:** JWT (HS256), 7-day expiry, stored in `localStorage` (acceptable for SPA; use httpOnly cookies for higher security)
- **Passwords:** bcrypt with 12 salt rounds (~300ms per hash — brute-force resistant)
- **Transport:** TLS everywhere (Ingress terminates TLS, internal cluster traffic is plaintext — add mutual TLS via Istio for zero-trust)
- **Secrets:** Kubernetes Secrets (base64, not encrypted at rest by default — use Sealed Secrets or AWS KMS envelope encryption in production)
- **Rate Limiting:** Global: 100 req/15min per IP; Auth: 5 req/15min per IP
- **HTTP Headers:** Helmet middleware sets `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`
- **Container Security:** Non-root users in all containers, read-only root filesystem (where applicable)
- **Input Validation:** express-validator on all endpoints; max input size 10KB body, 10,000 char text

---

## 9. Trade-offs and Future Improvements

| Current Design          | Production Enhancement               | Reason to Upgrade                      |
|-------------------------|--------------------------------------|----------------------------------------|
| CPU-based HPA           | KEDA queue-depth HPA                 | More accurate worker scaling           |
| localStorage JWT        | httpOnly cookie JWT                  | XSS protection                         |
| MongoDB single node     | MongoDB replica set                  | HA + read scaling                      |
| Polling (4s interval)   | WebSockets or SSE                    | True real-time updates                 |
| Base64 K8s Secrets      | Sealed Secrets / Vault               | Encrypted secrets in Git               |
| Single Redis            | Redis Sentinel or Redis Cluster      | HA for queue                           |
| Simple text processing  | ML model inference (e.g. HuggingFace)| Actual AI operations                   |
