# PHASE 6.4 — FINAL VERIFICATION SCRIPT

## Complete End-to-End Test Procedure

### Prerequisites
1. Kubernetes cluster running
2. `demo` namespace exists
3. LoadLab deployment exists in `demo` namespace
4. DeployBot RBAC applied (`kubectl apply -f k8s/deploybot-rbac.yaml`)

### Test Script

```bash
# 1. Start DeployBot server
bun dev

# Expected: See worker bootstrap logs exactly once:
# [WorkerBootstrap] Starting SchedulerWorker...
# [WorkerBootstrap] SchedulerWorker started successfully.

# 2. Start LoadLab (separate terminal)
bun run loadlab

# Expected: LoadLab starts on port 3001

# 3. Login to DeployBot
# Navigate to http://localhost:3000
# Sign in with Clerk authentication

# 4. Test DRY_RUN command
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "dry run scale loadlab to 3"}'

# Expected response:
# {
#   "type": "DRY_RUN",
#   "status": "preview",
#   "message": "DRY RUN: SCALE loadlab to 3 replicas - No changes would be made."
# }

# 5. Test EXECUTE scale command
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "scale loadlab to 3"}'

# Expected response:
# {
#   "status": "queued",
#   "commandId": "cmd_...",
#   "command": {"action": "SCALE", "target": "loadlab", "targetReplicas": 3}
# }

# 6. Verify Kubernetes state
kubectl get pods -n demo

# Expected: 3 loadlab pods running

# 7. Check internal status (admin only)
curl -X GET http://localhost:3000/api/internal/status \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected response:
# {
#   "system": {
#     "workerStatus": "idle",
#     "queueLength": 0,
#     "currentCommand": null,
#     "lastResult": {"status": "success", "message": "..."}
#   }
# }

# 8. Restart server test
# Ctrl+C to stop server
bun dev

# Expected: Worker starts exactly once again (no duplicates)

# 9. Test concurrent commands
# Send multiple commands rapidly:
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d '{"message": "scale loadlab to 2"}' &
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d '{"message": "restart loadlab"}' &

# Expected: Commands execute serially (mutex protection)

# 10. Verify final state
kubectl get pods -n demo
kubectl get deployment loadlab -n demo

# Expected: Deployment reflects final command result
```

### Edge Case Tests

```bash
# Test 1: Unauthorized access
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "scale loadlab to 3"}'
# Expected: 401 Unauthorized

# Test 2: Invalid replica count
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "scale loadlab to 0"}'
# Expected: 400 Bad Request (out of bounds)

# Test 3: Unknown command
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "delete all pods"}'
# Expected: READ command (safe fallback)

# Test 4: Status API without admin
curl -X GET http://localhost:3000/api/internal/status \
  -H "Authorization: Bearer FREE_USER_TOKEN"
# Expected: 403 Forbidden

# Test 5: FREE user quota exceeded
# Send multiple commands as FREE user until quota exceeded
# Expected: 429 Too Many Requests
```

### Success Criteria

✅ All tests pass
✅ Commands execute in order
✅ Kubernetes state changes correctly
✅ Worker starts exactly once per server boot
✅ No race conditions observed
✅ Errors are logged and handled gracefully
✅ RBAC restrictions enforced
✅ No silent failures

### Failure Investigation

If any test fails:
1. Check server logs for error messages
2. Verify Kubernetes cluster connectivity
3. Confirm RBAC permissions with `kubectl auth can-i`
4. Check LoadLab deployment status
5. Verify authentication tokens are valid