# Development Guide

## Tech Stack

### Frontend + Backend
- **Next.js (App Router)** - React framework with file-based routing
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Bun** - JavaScript runtime & package manager

### Infrastructure
- **Docker** - Containerization
- **Kubernetes (Minikube / Kind)** - Container orchestration
- **@kubernetes/client-node** - Kubernetes API client

### Auth
- **Clerk** (identity only) - Authentication and user management

### UI Components
- **shadcn/ui** - Accessible UI components
- **React Icons** - Icon library
- **GSAP** - Animation library

### Design Goals
- 100% Lighthouse score
- Server Components by default
- Minimal client-side JavaScript
- Zero fake data

## Project Structure

```
loadlab-deploybot/
│
├── app/                    # Next.js App Router
│   ├── api/               # API routes (chat, load, stats)
│   ├── dashboard/         # Dashboard pages
│   └── ...                # Other pages
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
├── docs/                  # Documentation
└── public/                # Static assets
```

## Development Workflow

### Setting Up Development Environment

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Set Up Environment Variables**
   Create `.env.local` with Clerk keys:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

3. **Deploy LoadLab to Kubernetes**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/loadlab-deployment.yaml
   kubectl apply -f k8s/loadlab-service.yaml
   ```

4. **Start Development Server**
   ```bash
   bun dev
   ```

### Key Development Concepts

#### Command Parsing
The system uses a command parser to classify user input:
- `parseCommand()` function in `lib/parser/parseCommand.ts`
- Classifies commands as READ, DRY_RUN, or EXECUTE
- Extracts parameters for EXECUTE commands

#### Scheduling System
The scheduler implements OS-style concurrency control:
- **Mutex**: Binary semaphore with FIFO queue
- **PriorityQueue**: Orders commands by user role
- **SchedulerWorker**: Processes commands sequentially
- All in `lib/scheduler/` directory

#### Authentication Flow
- Clerk handles user authentication
- Server-side role derivation
- Priority assignment based on user type
- Located in `lib/auth/identity.ts`

#### Kubernetes Integration
- Hard-coded namespace and deployment restrictions
- Replica limits enforced (1-5)
- Safe operations only (scale, restart)
- Located in `lib/k8s/client.ts`

## Contributing Guidelines

### Safety-First Philosophy
- Preserve mutex protection for all Kubernetes mutations
- Maintain hard-coded safety boundaries
- Ensure role-based access controls remain server-side
- Keep validation layers for all external inputs
- Prioritize safety over convenience

### Code Organization
- Keep business logic in `lib/` directory
- Use React components in `components/` directory
- Store Kubernetes manifests in `k8s/` directory
- Put documentation in `docs/` directory

### Testing
- Verify mutex behavior prevents race conditions
- Test priority queue ordering
- Confirm safety boundaries are enforced
- Validate authentication flow

## Common Development Tasks

### Adding New Commands
1. Update `parseCommand()` in `lib/parser/parseCommand.ts`
2. Add command type to `lib/scheduler/types.ts`
3. Update worker logic in `lib/scheduler/worker.ts`
4. Add validation in `lib/k8s/client.ts`

### Modifying Safety Limits
1. Update constants in `lib/k8s/client.ts`
2. Update documentation in `docs/`
3. Verify all validation logic still works

### Extending Authentication
1. Modify role logic in `lib/auth/identity.ts`
2. Update priority mapping
3. Test all user types

## Build and Deployment

### Development Build
```bash
bun dev
```

### Production Build
```bash
bun run build
bun start
```

### Docker Build
```bash
# For LoadLab
cd loadlab
docker build -t loadlab:latest .
```

## Troubleshooting Development Issues

### Common Problems
- **Kubernetes Connection**: Verify kubectl context and permissions
- **Authentication**: Check Clerk configuration and keys
- **Command Parsing**: Verify command patterns match expected formats
- **Scheduler Issues**: Check mutex and queue logic