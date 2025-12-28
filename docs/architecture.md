# Architecture

## System Overview

LoadLab + DeployBot implements a controlled DevOps playground that allows users to safely experience real Kubernetes behavior through a chatbot-driven interface. The system is designed with safety as the primary concern, using OS-style concurrency control to prevent race conditions and ensure deterministic behavior.

## High-Level Architecture

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

## Component Breakdown

### 1. LoadLab (Demo Backend App)

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

### 2. DeployBot (Chatbot + Control Plane)

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

### 3. Frontend (Truth Viewer)

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

### 4. Kubernetes Adapter

A safe Kubernetes client that enforces namespace and deployment restrictions while performing actual cluster operations.

### 5. Scheduler

A priority-based command queuing system that processes commands in order of user role priority (Admin > Free > Normal).

## OS/DSA Design Rationale

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

## User Identity & Roles

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

## Safety Guarantees

The system remains safe even under misuse because of:

- Single app (LoadLab only)
- Single namespace
- Replica caps
- Serialized execution
- No arbitrary execution paths

Identity is **not trusted for safety** — only for fairness.