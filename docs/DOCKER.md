# AIDE Docker Deployment Guide

This guide covers Docker containerization for the AIDE project components.

## 🐳 Available Docker Configurations

### AIDE Control Panel

The AIDE Control Panel is a Next.js application that provides administrative interface for the AIDE system.

**Files:**

- `Dockerfile.aide-control` - Multi-stage production Dockerfile
- `docker-compose.aide-control.yml` - Docker Compose configuration
- `scripts/docker-aide-control.sh` - Management script

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- pnpm (package manager)

### Build and Run AIDE Control Panel

```bash
# Using Docker Compose (Recommended)
docker-compose -f docker-compose.aide-control.yml up -d

# Using Docker commands directly
docker build -f Dockerfile.aide-control -t aide-control:latest .
docker run -d -p 8080:8080 --name aide-control aide-control:latest

# Using management script (Linux/macOS)
./scripts/docker-aide-control.sh build
./scripts/docker-aide-control.sh start
```

### PowerShell Management (Windows)

```powershell
# Build image
docker build -f Dockerfile.aide-control -t aide-control:latest .

# Run with Docker Compose
docker-compose -f docker-compose.aide-control.yml up -d

# Check status
docker-compose -f docker-compose.aide-control.yml ps

# View logs
docker-compose -f docker-compose.aide-control.yml logs -f

# Stop services
docker-compose -f docker-compose.aide-control.yml down
```

## 📋 Configuration

### Environment Variables

Create the following environment files in `apps/aide-control/`:

**`.env.production`:**

```env
NODE_ENV=production
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
```

**`.env.secrets`:**

```env
FIREBASE_ADMIN_CREDENTIALS=path/to/service-account.json
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### Docker Compose Configuration

The `docker-compose.aide-control.yml` includes:

- **Health Checks**: HTTP endpoint monitoring
- **Resource Limits**: 512MB memory, 0.5 CPU limit
- **Security**: Non-root user, no new privileges
- **Logging**: JSON file driver with rotation
- **Networks**: Custom bridge network
- **Restart Policy**: Unless stopped

### Port Configuration

| Service      | Internal Port | External Port | Description         |
| ------------ | ------------- | ------------- | ------------------- |
| AIDE Control | 8080          | 8080          | Next.js application |

## 🏗️ Docker Image Details

### AIDE Control Panel Image

**Base Image:** `node:18-alpine`
**Final Size:** ~199MB
**Architecture:** Multi-stage build

**Stages:**

1. **base** - Base Node.js Alpine image
2. **deps** - Install dependencies
3. **builder** - Build application
4. **runner** - Production runtime

**Security Features:**

- Non-root user (`nextjs:nodejs`, uid 1001)
- Minimal Alpine Linux base
- No unnecessary packages
- Security headers configured

## 🔧 Management Commands

### Using Docker Compose

```bash
# Start services
docker-compose -f docker-compose.aide-control.yml up -d

# Stop services
docker-compose -f docker-compose.aide-control.yml down

# View logs
docker-compose -f docker-compose.aide-control.yml logs -f

# Restart services
docker-compose -f docker-compose.aide-control.yml restart

# Check health
docker-compose -f docker-compose.aide-control.yml ps
```

### Using Management Script

```bash
# Build image
./scripts/docker-aide-control.sh build

# Start container
./scripts/docker-aide-control.sh start

# Stop container
./scripts/docker-aide-control.sh stop

# View logs
./scripts/docker-aide-control.sh logs

# Check status
./scripts/docker-aide-control.sh status

# Health check
./scripts/docker-aide-control.sh health

# Shell access
./scripts/docker-aide-control.sh shell

# Clean up
./scripts/docker-aide-control.sh clean
```

## 🧪 Testing and Validation

### Pre-deployment Validation

Run the validation script to check deployment readiness:

```powershell
# Windows PowerShell
cd apps/aide-control
.\validate-deployment.ps1

# Skip optional tests
.\validate-deployment.ps1 -SkipFirebase -SkipBuild
```

The validation script checks:

- ✅ Docker daemon status
- ✅ Environment configuration
- ✅ Dockerfile structure
- ✅ Docker Compose configuration
- ✅ Container build and startup
- ✅ Health endpoint response

### Health Monitoring

The application exposes health endpoints:

```bash
# Health check
curl http://localhost:8080/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2025-01-10T10:30:00.000Z",
  "uptime": 12345,
  "version": "1.0.0"
}
```

### Container Inspection

```bash
# Check container logs
docker logs aide-control

# Inspect container details
docker inspect aide-control

# Execute commands in container
docker exec -it aide-control sh

# Check resource usage
docker stats aide-control
```

## 🔒 Security Considerations

### Container Security

- **Non-root User**: Runs as `nextjs:nodejs` (uid 1001)
- **Read-only Filesystem**: Application files are immutable
- **No New Privileges**: Security flag enabled
- **Minimal Attack Surface**: Alpine Linux base with minimal packages

### Network Security

- **Custom Networks**: Isolated container communication
- **Port Binding**: Only expose necessary ports
- **Security Headers**: Configured in Next.js application

### Secrets Management

- **Environment Files**: Use `.env.secrets` for sensitive data
- **File Permissions**: Restrict access to 600
- **Volume Mounts**: Avoid mounting sensitive host directories

## 📊 Monitoring and Logging

### Log Configuration

Docker Compose includes centralized logging:

```yaml
logging:
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'
```

### Resource Monitoring

```bash
# Real-time stats
docker stats aide-control

# Memory usage
docker exec aide-control cat /proc/meminfo

# Disk usage
docker system df
```

### Health Monitoring

```bash
# Container health status
docker inspect --format='{{.State.Health.Status}}' aide-control

# Health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' aide-control
```

## 🚀 Production Deployment

### Cloud Run Deployment

For Google Cloud Run deployment:

```powershell
# Validate deployment
.\validate-deployment.ps1

# Deploy to Cloud Run
.\deploy-to-cloud-run.ps1
```

### Local Production Environment

```bash
# Production build and run
docker-compose -f docker-compose.aide-control.yml up -d

# Scale services
docker-compose -f docker-compose.aide-control.yml up -d --scale aide-control=3
```

### Performance Optimization

- **Resource Limits**: Set appropriate CPU/memory limits
- **Health Checks**: Configure proper intervals
- **Restart Policies**: Use `unless-stopped` for production
- **Image Optimization**: Use multi-stage builds

## 🐛 Troubleshooting

### Common Issues

**Container won't start:**

```bash
# Check logs
docker logs aide-control

# Check container events
docker events --filter container=aide-control
```

**Health check failing:**

```bash
# Test health endpoint manually
curl -v http://localhost:8080/api/health

# Check container network
docker network ls
docker network inspect aide-network
```

**Permission issues:**

```bash
# Check file permissions
docker exec aide-control ls -la /app

# Verify user context
docker exec aide-control id
```

**Build failures:**

```bash
# Clean build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -f Dockerfile.aide-control -t aide-control:latest .
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
export DEBUG=aide:*

# Run with debug output
docker run -e DEBUG=aide:* aide-control:latest
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Alpine Linux Security](https://alpinelinux.org/about/)

## 🤝 Contributing

When adding new Docker configurations:

1. Follow the existing naming convention (`Dockerfile.service-name`)
2. Use multi-stage builds for optimization
3. Include comprehensive health checks
4. Add management scripts for common operations
5. Update this documentation

## 📄 License

This Docker configuration is part of the AIDE project and follows the same licensing terms.
