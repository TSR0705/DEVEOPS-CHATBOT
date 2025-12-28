# Usage Guide

## Getting Started

Once the application is running, you can interact with LoadLab + DeployBot through the web interface at `http://localhost:3000`.

## Command Types

The system supports three types of commands:

### 1. Read Commands (Default)
- **Purpose**: Retrieve system status
- **Safety**: Always safe, no mutations
- **Examples**: "Show status", "What's running?", "List pods"

### 2. Dry-Run Commands
- **Purpose**: Simulate operations without executing
- **Safety**: Always safe, no mutations
- **Keywords**: "what happens", "what if", "simulate"
- **Examples**: "What happens if I scale to 3?", "Simulate restart"

### 3. Execute Commands
- **Purpose**: Perform actual Kubernetes operations
- **Safety**: Serialized through mutex
- **Types**: 
  - Scale: "Scale to [number]"
  - Restart: "Restart"
- **Examples**: "Scale to 3", "Restart deployment"

## Command Execution Flow

1. **User Input**: Command is entered via chat interface
2. **Authentication**: User identity is verified via Clerk
3. **Parsing**: Command is classified (READ/DRY_RUN/EXECUTE)
4. **Queue**: EXECUTE commands are added to priority queue
5. **Execution**: Commands execute sequentially via mutex
6. **Verification**: Results are stored and returned to user

## Available Operations

### Scaling
- **Command**: "Scale to [number]"
- **Range**: 1-5 replicas (hard limits enforced)
- **Example**: "Scale to 3"

### Restarting
- **Command**: "Restart"
- **Effect**: Triggers rolling restart of LoadLab deployment
- **Example**: "Restart"

### Status Queries
- **Commands**: Any text not matching scale/restart patterns
- **Effect**: Returns current system status
- **Examples**: "Show status", "How many pods?"

## User Roles and Priorities

### Admin Users
- **Priority**: Highest (1)
- **Access**: Full command access
- **Quota**: Unlimited

### Free Users
- **Priority**: High for first 3 commands (2)
- **Priority**: Normal after quota (3)
- **Access**: All commands
- **Quota**: 3 execute commands

### Normal Users
- **Priority**: Standard (3)
- **Access**: All commands
- **Quota**: No execute command limit

## Monitoring and Observability

### Dashboard Elements
- **Status Indicator**: Shows current system state
- **Queue Length**: Number of pending commands
- **Completed Count**: Number of completed commands
- **Execution Time**: Time taken for last operation

### Pod Information
- **Pod Names**: Unique identifiers for each pod
- **Uptime**: Time since pod creation
- **Request Count**: Number of requests handled
- **Load Status**: Current CPU load state

## Safety Features

### Hard Limits
- Maximum 5 replicas for LoadLab deployment
- Single namespace (demo) restriction
- Single deployment (loadlab) restriction

### Serialization
- Only one EXECUTE command runs at a time
- Mutex prevents race conditions
- Priority queue ensures fairness

### Validation
- All commands validated before execution
- Fail-closed behavior for invalid commands
- No arbitrary execution paths

## Troubleshooting

### Common Issues

#### Command Not Executing
- Check if command matches expected patterns
- Verify user role and permissions
- Confirm system is not overloaded

#### Authentication Issues
- Ensure Clerk is properly configured
- Verify authentication token is valid
- Check browser cookies

#### Kubernetes Connection Issues
- Confirm kubectl context is set correctly
- Verify LoadLab deployment exists
- Check Kubernetes API connectivity