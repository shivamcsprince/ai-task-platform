# Demo Flow Script — Interview Presentation

**Duration:** 8–12 minutes  
**Goal:** Show the full lifecycle of a task through the system

---

## Opening (1 min)

> "I built a full-stack async task processing platform using the MERN stack,
> Python workers, Redis queues, Docker, Kubernetes, and GitOps via Argo CD.
> Let me walk you through how it works end-to-end."

Draw or point to the architecture diagram:
```
Frontend → Backend API → Redis Queue → Python Worker → MongoDB → back to Frontend
```

---

## Demo Steps

### 1. Register / Login (1 min)
- Open `http://localhost:3000`
- Register a new account: `demo@example.com`
- Show that you're redirected to the dashboard
- Point out: *"Passwords are hashed with bcrypt 12 rounds, auth uses JWT"*

### 2. Create a Task (2 min)
- Click **New Task**
- Fill in:
  - Title: `"Process product copy"`
  - Input Text: `"This is SAMPLE Text for Our Store."`
  - Operation: **Word Count**
- Click **Create Task**
- Show the task card appears with status `PENDING`
- Point out: *"The task is saved in MongoDB with status 'pending'. No processing yet."*

### 3. Run the Task (2 min)
- Click **▶ Run** on the task card
- Watch status change: `PENDING → RUNNING → SUCCESS`
- *"When I clicked Run, the API pushed a job payload to Redis via LPUSH.
  The Python worker was blocking on BRPOP — it atomically claimed the job,
  updated the task status to 'running' in MongoDB, processed the text,
  and wrote the result back."*

### 4. View Task Detail (2 min)
- Click **View Details** on the task
- Show the result (word count JSON)
- Show the **Execution Logs** panel:
  - "Worker picked up job (attempt 1)"
  - "Processing operation: 'word_count'"
  - "Operation completed successfully"
- *"Every step the worker takes is logged to MongoDB and displayed here."*

### 5. Show a Failed Task (1 min)
- Create a task and explain what happens if the worker crashes
- *"If processing fails, the worker retries up to 3 times with exponential backoff.
  After max retries, the task is marked 'failed' with the error in the logs."*

### 6. Kubernetes / Argo CD (2 min)
- Show Argo CD dashboard screenshot
- *"All of this runs on Kubernetes. The manifests live in a separate infra repo.
  When my CI/CD pipeline pushes a new Docker image, it updates the image tag in
  the infra repo, and Argo CD auto-syncs — that's GitOps."*
- Show HPA: *"Workers autoscale from 2 to 20 replicas based on CPU utilization."*

---

## Key Technical Points to Emphasize

1. **Why Redis for the queue?** — Atomic BRPOP ensures exactly-one worker claims each job. AOF persistence survives restarts.

2. **Why separate Python worker?** — Separation of concerns. Workers can be scaled independently. Future ML model inference would run here.

3. **Why Kustomize overlays?** — Same base manifests, different configs per environment (staging vs production). No code duplication.

4. **Security choices** — bcrypt (not MD5/SHA), JWT with expiry, Helmet headers, rate limiting on auth endpoints (5/15min).

5. **What you'd improve** — WebSockets for real-time updates instead of polling, KEDA for queue-depth autoscaling, Sealed Secrets for encrypted secrets in Git.

---

## Questions to Expect

**Q: How do you prevent two workers from processing the same job?**
> Redis BRPOP is atomic — only one client can pop a value. No two workers can get the same job.

**Q: What if MongoDB is down?**
> Workers will fail to write results and mark the job as failed after retries. The API returns 503. In production, MongoDB would run as a replica set for HA.

**Q: How does Argo CD know when to redeploy?**
> It polls the infra Git repo every 3 minutes (or via webhook). When CI/CD updates the image tag in kustomization.yaml, Argo CD detects the diff and applies it.

**Q: Why not use a managed queue like SQS or Google Pub/Sub?**
> Redis is simpler to self-host for this scale and removes a cloud dependency. At 10M+ tasks/day I'd evaluate SQS for managed durability.
