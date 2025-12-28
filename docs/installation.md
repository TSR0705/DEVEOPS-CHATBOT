# Installation Guide

## Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **Kubernetes** cluster (Minikube, Kind, or cloud cluster)
- **kubectl** configured to access your cluster
- **Clerk** account for authentication (free tier sufficient)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/loadlab-deploybot.git
cd loadlab-deploybot
```

### 2. Install Dependencies

Using Bun:
```bash
bun install
```

Or using npm:
```bash
npm install
```

### 3. Set Up Authentication

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 4. Configure Kubernetes

Ensure your `kubectl` context is set to the desired cluster:

```bash
kubectl config current-context
```

## Kubernetes Deployment

### 1. Apply Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Deploy LoadLab Application

```bash
kubectl apply -f k8s/loadlab-deployment.yaml
kubectl apply -f k8s/loadlab-service.yaml
```

### 3. Verify Deployment

```bash
# Check if LoadLab pods are running
kubectl get pods -n demo

# Check service
kubectl get svc -n demo

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=loadlab -n demo --timeout=300s
```

## Running the Application

### 1. Development Mode

```bash
bun next dev
```

### 2. Production Mode

```bash
# Build the application
bun run build

# Start the application
bun start
```

## Verification

1. Open your browser to `http://localhost:3000`
2. Verify the dashboard loads correctly
3. Test authentication flow
4. Check that Kubernetes connectivity is established

## Troubleshooting

### Common Issues

#### Kubernetes Connection Issues
- Verify `kubectl` is properly configured
- Ensure the `demo` namespace exists
- Check that LoadLab pods are running

#### Authentication Issues
- Verify Clerk keys are correctly set
- Check that Clerk application is properly configured
- Ensure the domain is added to Clerk allowed origins

#### LoadLab Deployment Issues
- Verify the LoadLab deployment is created successfully
- Check that the service is accessible
- Confirm readiness and liveness probes are working