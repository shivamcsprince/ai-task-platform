# Deployment Guide

## Prerequisites

| Tool       | Version  | Install                              |
|------------|----------|--------------------------------------|
| Docker     | 24+      | https://docs.docker.com/get-docker   |
| kubectl    | 1.28+    | https://kubernetes.io/docs/tasks/tools |
| kustomize  | 5+       | https://kubectl.docs.kubernetes.io/installation/kustomize |
| k3s (opt.) | latest   | https://k3s.io                       |
| Argo CD    | 2.11+    | Via kubectl below                    |

---

## Step 1: Local Development (Docker Compose)

```bash
# 1. Clone and configure
git clone https://github.com/yourusername/ai-task-platform.git
cd ai-task-platform

# 2. Create env files from examples
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp worker/.env.example worker/.env

# 3. Start all services
docker-compose up --build

# 4. Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000/health
# MongoDB:  mongodb://localhost:27017
# Redis:    redis://localhost:6379
```

---

## Step 2: Set Up Kubernetes Cluster (k3s)

```bash
# Install k3s (single-node, great for local/VPS)
curl -sfL https://get.k3s.io | sh -

# Configure kubectl
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER ~/.kube/config
export KUBECONFIG=~/.kube/config

# Verify
kubectl get nodes
```

---

## Step 3: Install Nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

---

## Step 4: Install cert-manager (TLS)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml

# Create a ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your@email.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## Step 5: Configure Secrets

```bash
# NEVER commit real secrets. Create them imperatively:
kubectl create namespace ai-task-platform

kubectl create secret generic app-secrets \
  --namespace ai-task-platform \
  --from-literal=JWT_SECRET="$(openssl rand -hex 32)" \
  --from-literal=REDIS_PASSWORD="$(openssl rand -hex 16)" \
  --from-literal=MONGO_ROOT_USER="admin" \
  --from-literal=MONGO_ROOT_PASS="$(openssl rand -hex 16)" \
  --from-literal=MONGODB_URI="mongodb://admin:YOURPASSHERE@mongodb-service:27017/aitasks?authSource=admin"
```

---

## Step 6: Deploy with Kustomize

```bash
# Apply production overlay
kubectl apply -k infra/k8s/overlays/production/

# Watch rollout
kubectl rollout status deployment/backend -n ai-task-platform
kubectl rollout status deployment/frontend -n ai-task-platform
kubectl rollout status deployment/worker -n ai-task-platform

# View all pods
kubectl get pods -n ai-task-platform
```

---

## Step 7: Install and Configure Argo CD

```bash
# Install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for Argo CD to start
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=120s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo

# Access dashboard (in a separate terminal)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open https://localhost:8080 (username: admin)
```

---

## Step 8: Deploy Application via Argo CD

```bash
# Update the repoURL in infra/argocd/application.yaml to your infra repo
# Then apply:
kubectl apply -f infra/argocd/application.yaml

# Watch Argo CD sync
kubectl get application -n argocd ai-task-platform
```

---

## Step 9: Set Up GitHub Actions Secrets

In your GitHub repository Settings → Secrets → Actions, add:

| Secret Name         | Value                                |
|--------------------|--------------------------------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username           |
| `DOCKERHUB_TOKEN`    | Docker Hub access token            |
| `INFRA_REPO`         | `yourusername/ai-task-platform-infra` |
| `INFRA_REPO_TOKEN`   | GitHub PAT with repo write access  |

---

## Verification

```bash
# Check all pods are running
kubectl get pods -n ai-task-platform

# Check services
kubectl get svc -n ai-task-platform

# Check ingress
kubectl get ingress -n ai-task-platform

# View backend logs
kubectl logs -l app=backend -n ai-task-platform --tail=50

# View worker logs
kubectl logs -l app=worker -n ai-task-platform --tail=50

# Scale workers manually
kubectl scale deployment worker -n ai-task-platform --replicas=5
```

---

## Argo CD Dashboard Screenshot

After deploying, take a screenshot showing:
1. Application name: `ai-task-platform`
2. Sync status: `Synced`
3. Health status: `Healthy`
4. Resource tree showing all deployments (backend, frontend, worker, mongodb, redis)

This screenshot is required for submission.
