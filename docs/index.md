# LoadLab + DeployBot Documentation

Welcome to the comprehensive documentation for LoadLab + DeployBot, a controlled DevOps playground that lets users safely experience real Kubernetes behavior through a chatbot-driven interface.

## Table of Contents

### Getting Started
- [Installation Guide](installation.md) - Complete setup instructions
- [Usage Guide](usage.md) - How to use the system effectively

### System Information
- [Architecture](architecture.md) - System design and components
- [Development Guide](development.md) - Development workflow and practices

### Reference
- [API Documentation](api.md) - API endpoints and usage
- [Command Reference](commands.md) - Complete command documentation
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## About This Project

LoadLab + DeployBot demonstrates real Kubernetes behavior including:
- Real pod scaling
- Real restarts
- Real readiness & liveness behavior
- Real load distribution
- Real concurrency handling

All changes are **visibly verifiable** and **system-backed**.

## Project Goals

- **Safety First**: All Kubernetes mutations are serialized through a mutex
- **Educational**: Show real Kubernetes behavior without risk
- **Honest**: No fake metrics or simulated results
- **OS-Correct**: Proper concurrency control with bounded waiting
- **Accessible**: Chatbot-driven interface for easy interaction