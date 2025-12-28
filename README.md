# LoadLab + DeployBot

**A controlled DevOps playground that lets users safely experience real Kubernetes behavior through a chatbot-driven interface** — with **provable results**, **OS-correct concurrency control**, and **no fake metrics**.

## 🧠 What This Project Is

**LoadLab + DeployBot** is a learning-first system designed to answer one core question:

> *How can someone safely experience real Kubernetes behavior without being given destructive power?*

Instead of screenshots, mocked dashboards, or "trust me" scaling demos, this project exposes **actual runtime behavior** of Kubernetes:

- Real pod scaling
- Real restarts
- Real readiness & liveness behavior
- Real load distribution
- Real concurrency handling

All changes are **visibly verifiable** and **system-backed**.

## Overview

LoadLab DeployBot solves the problem of safely managing Kubernetes deployments through a controlled interface that prevents race conditions, unauthorized access, and resource exhaustion. It provides a chat-based command interface that translates natural language into Kubernetes operations while maintaining strict safety constraints.

This project intentionally does **not** try to be:

- A production DevOps platform  
- A SaaS product  
- A deployment tool for user apps  
- A monitoring system (no Prometheus / Grafana)  
- A multi-tenant system  

These are **explicitly out of scope** to keep the system honest, safe, and finishable.

## Core Concept

The system implements a command queuing and execution architecture that ensures:

- **Safety**: All Kubernetes mutations are serialized through a mutex to prevent race conditions
- **Constraints**: Hard-coded namespace and deployment restrictions prevent escalation
- **Observability**: Priority-based queuing with role-based access control
- **Fail-closed**: Strict validation prevents unauthorized operations
- **Truth Source**: LoadLab pods provide verifiable runtime behavior

The architecture prioritizes safety over convenience, ensuring that multiple users can interact with the system without causing conflicts or security issues.

## System Architecture

```
User
↓
Next.js UI (Dashboard + Chat)
↓
DeployBot (API Routes)
↓
OS-style Scheduler (Mutex + Priority Queue)
↓
Kubernetes API
↓
LoadLab Pods (Truth Source)
```

**Key principle:**  
> *Kubernetes is the shared resource. All mutations are serialized.*

### 1️⃣ LoadLab (Demo Backend App)

A purpose-built backend service whose **only job** is to make Kubernetes behavior observable.

**Capabilities:**
- Generates CPU load
- Exposes pod identity
- Tracks uptime & request counters
- Implements liveness & readiness probes

**Endpoints:**

| Endpoint | Purpose |
|--------|--------|
| `POST /work` | Generate CPU load |
| `GET /stats` | Pod name, uptime, counters |
| `GET /health` | Liveness probe |
| `GET /ready` | Readiness probe (fails under load) |

**Design rules:**
- Stateless
- No database
- In-memory counters only
- Pod restart resets uptime

LoadLab is the **ground truth** of the system.

### 2️⃣ DeployBot (Chatbot + Control Plane)

DeployBot translates chat commands into **safe infrastructure actions**.

**Responsibilities:**
- Parse user intent
- Classify commands
- Enforce OS-level safety
- Interact with Kubernetes API
- Explain outcomes (read-only)

**DeployBot NEVER:**
- Executes arbitrary commands
- Controls anything except LoadLab
- Lets AI make infra decisions

AI is used **only** for:
- Understanding commands
- Explaining what already happened

### 3️⃣ Frontend (Truth Viewer)

A minimal Next.js UI focused on **proof, not polish**.

**Shows:**
- Chat interface
- Pod list (real pod names)
- Pod uptimes
- Load behavior
- Queue / execution feedback

**Does NOT:**
- Calculate metrics
- Fake charts
- Hide failures

### Kubernetes Adapter
A safe Kubernetes client that enforces namespace and deployment restrictions while performing actual cluster operations.

### Scheduler
A priority-based command queuing system that processes commands in order of user role priority (Admin > Free > Normal).

Each component has clearly defined responsibilities and communication boundaries to maintain system safety.

## OS / DSA Design Rationale

This project treats infrastructure control as a **classic OS problem**.

### OS Mapping

| OS Concept | This System |
|-----------|-------------|
| Process | User |
| Shared resource | Kubernetes |
| Critical section | Scale / Restart |
| Non-critical section | Status / Dry-run |
| Scheduler | DeployBot |
| Mutex | Execution lock |
| Ready queue | Priority queue |

### Final Solution

**Priority-Based Mutual Exclusion with Bounded Waiting**

- Only **one infra-mutating command** executes at a time
- Read-only & dry-run commands run in parallel
- Commands are scheduled via a **priority queue**
- Starvation is prevented through bounded priority usage

This guarantees:
- ❌ No race conditions  
- ❌ No deadlocks  
- ❌ No inconsistent state  
- ✅ Deterministic behavior  

### Critical Section
The system implements a mutex to protect the critical section where Kubernetes mutations occur. This prevents race conditions when multiple users issue commands simultaneously.

### Mutex
A binary semaphore with FIFO waiting queue that ensures only one command executes at a time. The mutex provides the three classical properties of mutual exclusion: mutual exclusion, progress, and bounded waiting.

### Priority Queue
A sorted queue that processes commands based on user role priority (1=Admin, 2=Free with quota, 3=Normal) and timestamp for fairness within priority levels.

### Single Worker Model
A single worker processes the command queue sequentially, ensuring serialized execution of all Kubernetes mutations. This prevents concurrent operations that could cause conflicts.

This approach prevents race conditions, deadlocks, and resource starvation while maintaining system responsiveness.

## 👤 User Identity & Roles

Authentication is handled via **Clerk**, used **only for identity**.

**Why Clerk?**
- Stable, non-spoofable user IDs
- Free tier sufficient for demos
- No auth logic reinvented

**Important:**  
Authentication does **not** provide safety.  
Safety comes from OS-style scheduling and hard limits.

### User Types

| Type | Priority |
|----|----|
| Admin | Highest |
| Free User | First 3 executions get priority |
| Normal User | FIFO |

### Safety Guarantees

The system remains safe even under misuse because of:

- Single app (LoadLab only)
- Single namespace
- Replica caps
- Serialized execution
- No arbitrary execution paths

Identity is **not trusted for safety** — only for fairness.

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

## 📁 Project Structure

```
loadlab-deploybot/
│
├── app/ # Next.js App Router
├── lib/ # Scheduler, parser, k8s client
├── loadlab/ # Demo backend app
├── k8s/ # Kubernetes manifests
├── docs/ # Documentation
├── public/ # Static assets
└── README.md
```

## 🧰 Tech Stack

### Frontend + Backend
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **Bun** (runtime & package manager)

### Infrastructure
- **Docker**
- **Kubernetes (Minikube / Kind)**
- **@kubernetes/client-node**

### Auth
- **Clerk** (identity only)

### Design Goals
- 100% Lighthouse score
- Server Components by default
- Minimal client-side JavaScript
- Zero fake data

## 🧪 What This Project Demonstrates

- Real Kubernetes scaling behavior
- Safe automation via chatbot
- OS-correct concurrency handling
- Honest system design
- Clear separation of identity vs safety
- Engineering discipline over feature hype

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

## 📌 One-Line Explanation (Interview-Ready)

> "This project demonstrates real Kubernetes behavior through a chatbot-driven interface, where infrastructure mutations are serialized using OS-style priority scheduling with bounded waiting, and results are visually verified using system truth."

## 🚀 Status

✔ Architecture frozen  
✔ Safety model finalized  
✔ Concurrency solved  
✔ Identity clarified  
✔ Implementation in progress  

## 📄 License

MIT — for learning and demonstration purposes.
