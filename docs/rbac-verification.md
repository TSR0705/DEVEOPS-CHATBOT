# PHASE 6.3 — RBAC VERIFICATION

## DeployBot Service Account Permissions

The `deploybot-sa` service account in the `demo` namespace has minimal permissions:

### ✅ ALLOWED OPERATIONS
```bash
# Scale deployments (MUST PASS)
kubectl auth can-i patch deployment/loadlab --as=system:serviceaccount:demo:deploybot-sa -n demo

# Read deployment status (MUST PASS)
kubectl auth can-i get deployment/loadlab --as=system:serviceaccount:demo:deploybot-sa -n demo

# List deployments (MUST PASS)
kubectl auth can-i list deployments --as=system:serviceaccount:demo:deploybot-sa -n demo

# Read pod status (MUST PASS)
kubectl auth can-i get pods --as=system:serviceaccount:demo:deploybot-sa -n demo
kubectl auth can-i list pods --as=system:serviceaccount:demo:deploybot-sa -n demo
```

### ❌ FORBIDDEN OPERATIONS (MUST ALL FAIL)
```bash
# Cannot delete pods (MUST FAIL)
kubectl auth can-i delete pods --as=system:serviceaccount:demo:deploybot-sa -n demo

# Cannot create pods (MUST FAIL)
kubectl auth can-i create pods --as=system:serviceaccount:demo:deploybot-sa -n demo

# Cannot access other namespaces (MUST FAIL)
kubectl auth can-i get deployments --as=system:serviceaccount:demo:deploybot-sa -n default
kubectl auth can-i get deployments --as=system:serviceaccount:demo:deploybot-sa -n kube-system

# Cannot delete deployments (MUST FAIL)
kubectl auth can-i delete deployment/loadlab --as=system:serviceaccount:demo:deploybot-sa -n demo

# Cannot create deployments (MUST FAIL)
kubectl auth can-i create deployments --as=system:serviceaccount:demo:deploybot-sa -n demo

# Cannot access secrets (MUST FAIL)
kubectl auth can-i get secrets --as=system:serviceaccount:demo:deploybot-sa -n demo

# Cannot access cluster-wide resources (MUST FAIL)
kubectl auth can-i get nodes --as=system:serviceaccount:demo:deploybot-sa
kubectl auth can-i get clusterroles --as=system:serviceaccount:demo:deploybot-sa
```

## Setup Instructions

1. Apply RBAC configuration:
```bash
kubectl apply -f k8s/deploybot-rbac.yaml
```

2. Verify service account exists:
```bash
kubectl get serviceaccount deploybot-sa -n demo
```

3. Run permission tests above to confirm proper restrictions.

## Security Boundaries

- **Namespace isolation**: Only `demo` namespace accessible
- **Resource limitation**: Only deployments and pods (read-only for pods)
- **Action restriction**: No delete, create, or admin operations
- **Blast radius**: Limited to scaling/restarting single deployment