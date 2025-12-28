# LoadLab DeployBot

**Kubernetes Deployment Control and Load Testing Platform**

A secure, role-based Kubernetes deployment control system with load testing capabilities. This platform provides a chat-based interface for managing Kubernetes deployments with safety-first design principles.

## Overview

LoadLab DeployBot solves the problem of safely managing Kubernetes deployments through a controlled interface that prevents race conditions, unauthorized access, and resource exhaustion. It provides a chat-based command interface that translates natural language into Kubernetes operations while maintaining strict safety constraints.

This system deliberately does NOT try to solve: general-purpose Kubernetes management, complex multi-namespace operations, or arbitrary Kubernetes resource creation.

The platform is designed specifically for deployment scaling and restart operations within a single, pre-defined namespace.

## Core Concept

The system implements a command queuing and execution architecture that ensures:

- **Safety**: All Kubernetes mutations are serialized through a mutex to prevent race conditions
- **Constraints**: Hard-coded namespace and deployment restrictions prevent escalation
- **Observability**: Priority-based queuing with role-based access control
- **Fail-closed**: Strict validation prevents unauthorized operations

The architecture prioritizes safety over convenience, ensuring that multiple users can interact with the system without causing conflicts or security issues.

## System Architecture

The system consists of five core components:

### LoadLab
A demo application that demonstrates Kubernetes behaviors including readiness/liveness probes, scaling, and load handling. It exposes endpoints for work simulation, health checks, and pod statistics.

### DeployBot
The chat-based control interface that accepts natural language commands and translates them into Kubernetes operations.

### Scheduler
A priority-based command queuing system that processes commands in order of user role priority (Admin > Free > Normal).

### Kubernetes Adapter
A safe Kubernetes client that enforces namespace and deployment restrictions while performing actual cluster operations.

### Frontend
A Next.js-based dashboard with chat interface and real-time cluster monitoring capabilities.

Each component has clearly defined responsibilities and communication boundaries to maintain system safety.

## OS / DSA Design Rationale

### Critical Section
The system implements a mutex to protect the critical section where Kubernetes mutations occur. This prevents race conditions when multiple users issue commands simultaneously.

### Mutex
A binary semaphore with FIFO waiting queue that ensures only one command executes at a time. The mutex provides the three classical properties of mutual exclusion: mutual exclusion, progress, and bounded waiting.

### Priority Queue
A sorted queue that processes commands based on user role priority (1=Admin, 2=Free with quota, 3=Normal) and timestamp for fairness within priority levels.

### Single Worker Model
A single worker processes the command queue sequentially, ensuring serialized execution of all Kubernetes mutations. This prevents concurrent operations that could cause conflicts.

This approach prevents race conditions, deadlocks, and resource starvation while maintaining system responsiveness.

## User Identity & Authorization

The system uses Clerk for authentication and role-based access control:

- **Clerk Usage**: Provides secure authentication and verified user identity
- **What Clerk is Used For**: User authentication, stable user IDs, and role verification
- **What Clerk is NOT Used For**: Direct role assignment (roles are server-side derived)

### User Roles:
- **Admin**: Hard-coded allowlist of users with priority 1 access
- **Free**: Authenticated users with limited quota (3 commands) at priority 2
- **Normal**: Authenticated users with priority 3 access after quota exhaustion

Role derivation happens server-side with verified Clerk user IDs, preventing client-side role spoofing.

## LoadLab (Demo Application)

LoadLab serves as the demonstration target for Kubernetes operations:

### Endpoints:
- `POST /work` - Generates CPU load and demonstrates readiness behavior
- `GET /stats` - Returns pod identity and runtime metrics
- `GET /health` - Liveness probe (process alive check)
- `GET /ready` - Readiness probe (service ready for traffic)

### Observable Behaviors:
- Pod identity and runtime metrics
- Readiness probe responses during load
- Liveness probe responses
- Scaling behavior

### Intentionally NOT Included:
- Database persistence
- Complex business logic
- External service dependencies
- Production-grade security

## Kubernetes Behavior Demonstrated

The system demonstrates several Kubernetes concepts:

### Scaling
Commands can scale the LoadLab deployment between 1-5 replicas with hard limits to prevent resource exhaustion.

### Pod Identity
Each pod reports its unique identity and runtime metrics via the `/stats` endpoint.

### Readiness & Liveness
The LoadLab application implements proper readiness and liveness probes that Kubernetes monitors.

### Self-Healing
Kubernetes automatically replaces failed pods based on probe responses.

### Replica Limits
Hard-coded limits prevent scaling beyond 5 replicas to avoid resource exhaustion.

### Explicitly NOT Implemented:
- Horizontal Pod Autoscaler (HPA)
- Pod Disruption Budgets (PDB)
- Multiple namespace support
- Arbitrary resource creation

## Execution Flow (End-to-End)

1. **User** → Issues command via chat interface
2. **Chat** → Authenticates user and parses command
3. **API** → Validates command and assigns priority based on role
4. **Queue** → Commands are ordered by priority and timestamp
5. **Worker** → Processes commands sequentially through mutex
6. **Kubernetes** → Executes safe, validated operations
7. **Verification** → Results are stored and returned to user

Each step includes validation and safety checks to prevent unauthorized operations.

## Safety & Constraints

### Namespace Restriction
Hard-coded to "demo" namespace to prevent namespace escape attacks.

### Deployment Restriction
Hard-coded to "loadlab" deployment to prevent targeting arbitrary deployments.

### Replica Limits
Enforced between 1-5 replicas to prevent resource exhaustion and denial of service.

### Fail-Closed Behavior
Unknown actions or validation failures result in operation rejection.

### Why This System is Safe by Design
- Multiple validation layers before Kubernetes operations
- Single point of execution with mutex protection
- Hard-coded safety boundaries
- No direct Kubernetes access from frontend

## Project Structure

```
├── app/                    # Next.js application
│   ├── api/               # API routes (chat, load, stats)
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── chat/              # Chat interface components
│   ├── laser/             # Visual effects
│   ├── nav/               # Navigation components
│   └── visual/            # Visualization components
├── k8s/                   # Kubernetes manifests
│   ├── loadlab-deployment.yaml
│   ├── loadlab-service.yaml
│   └── namespace.yaml
├── lib/                   # Core libraries
│   ├── auth/              # Authentication logic
│   ├── chat/              # Chat state management
│   ├── k8s/               # Kubernetes client
│   ├── parser/            # Command parsing
│   ├── scheduler/         # Scheduling logic (mutex, queue, worker)
│   └── utils/             # Utility functions
├── loadlab/               # Demo application
│   └── src/               # LoadLab server implementation
└── ...
```

## Running the Project Locally

### Prerequisites
- Node.js 18+ or Bun
- Kubernetes cluster (minikube, kind, or cloud cluster)
- kubectl configured to access cluster
- Clerk account for authentication

### Setup

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

3. Deploy LoadLab to Kubernetes:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/loadlab-deployment.yaml
kubectl apply -f k8s/loadlab-service.yaml
```

4. Start the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) to access the dashboard

## Known Limitations

- Missing worker startup in current implementation (scheduler worker needs to be initialized)
- In-memory quota tracking resets on server restart
- Limited to single namespace and deployment operations
- Client-side chat simulation not yet connected to backend
- LoadLab application is a simple demo without persistent state

## What This Project Is NOT

- A general-purpose Kubernetes management platform
- A production-ready infrastructure management system
- A complete CI/CD solution
- A multi-tenant platform (designed for single-namespace demo)
- A replacement for kubectl or other Kubernetes tools

This is a focused demonstration of safe Kubernetes operation patterns with proper access controls and race condition prevention.

## Contribution Guidelines

Contributors should maintain the safety-first design philosophy:

- Preserve mutex protection for all Kubernetes mutations
- Maintain hard-coded safety boundaries
- Ensure role-based access controls remain server-side
- Keep validation layers for all external inputs
- Prioritize safety over convenience

New features must not compromise the fundamental safety properties of the system.

## License

[License file to be added]
