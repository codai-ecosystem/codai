# AIDE Control Panel - Deployment Guide

This guide provides instructions for deploying the AIDE Control Panel using Docker.

## Prerequisites

- Docker installed and running
- Docker Compose (optional, for easier management)
- Google Cloud SDK (for cloud deployment)

## Quick Deployment

### Option 1: Direct Docker Run

```bash
# Build the image (from workspace root)
docker build -f Dockerfile.aide-control -t aide-control .

# Run the container
docker run -d -p 3000:8080 --name aide-control aide-control:latest

# Access the application
# Open http://localhost:3000 in your browser
```

### Option 2: Docker Compose

```bash
# Use the provided compose file
docker-compose -f ../../docker-compose.aide-control.yml up -d

# Access the application
# Open http://localhost:3000 in your browser
```

## Configuration

### Environment Variables

The application requires the following environment variables:

#### Required for Production:

- `FIREBASE_ADMIN_CREDENTIALS` - JSON string of Firebase service account credentials
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID

#### Optional:

- `NODE_ENV` - Set to "production" for production deployments
- `PORT` - Internal port (default: 8080)
- `HOSTNAME` - Bind hostname (default: "0.0.0.0")

### Environment Files

Create these files in the `apps/aide-control` directory:

1. `.env.production` - Production configuration
2. `.env.secrets` - Sensitive credentials (not committed to version control)

Example `.env.production`:

```env
NODE_ENV=production
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
```

Example `.env.secrets`:

```env
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
```

## Validation

Before deployment, run the validation script:

```powershell
# From apps/aide-control directory
.\validate-deployment.ps1
```

This script will:

- ✅ Check Docker availability
- ✅ Validate Google Cloud SDK setup
- ✅ Test Firebase configuration
- ✅ Verify environment files
- ✅ Test Docker build and container startup
- ✅ Validate API endpoints

## Build Features

### Robust Error Handling

The build process includes enhanced error handling for:

- **Firebase Credentials**: Graceful fallback when credentials are invalid or missing during build-time
- **Static Generation**: Continues build process even when external services are unavailable
- **Environment Variables**: Safe handling of missing or malformed configuration

### Build Optimizations

- **Multi-stage Docker build** for smaller production images (~200MB)
- **Standalone Next.js output** for faster container startup
- **Non-root user** for enhanced security
- **Optimized dependencies** with workspace support

## Troubleshooting

### Common Issues

1. **Build fails with Firebase errors**

   - Solution: The build process now includes fallback initialization
   - Check that `FIREBASE_ADMIN_CREDENTIALS` is valid JSON when provided

2. **Container starts but app not accessible**

   - Verify port mapping: `-p 3000:8080` (external:internal)
   - Check container logs: `docker logs aide-control`

3. **Environment variables not loaded**
   - Ensure `.env.production` and `.env.secrets` files exist
   - Verify file permissions and content format

### Logs and Debugging

```bash
# View container logs
docker logs aide-control

# Access container shell
docker exec -it aide-control sh

# Check container health
docker ps | grep aide-control
```

## Production Deployment

### Google Cloud Run

```bash
# Use the provided deployment script
.\deploy-to-cloud-run.ps1
```

### Custom Cloud Provider

1. Build and tag the image appropriately
2. Push to your container registry
3. Deploy using your cloud provider's container service
4. Configure environment variables securely
5. Set up SSL/TLS termination
6. Configure monitoring and logging

## Security Considerations

- Use secure secret management for `FIREBASE_ADMIN_CREDENTIALS`
- Enable HTTPS in production
- Configure proper firewall rules
- Regular security updates for base images
- Monitor access logs and unusual activity

## Performance Tuning

- Use a content delivery network (CDN) for static assets
- Configure proper caching headers
- Monitor memory and CPU usage
- Scale horizontally if needed
- Consider database connection pooling

## Support

For issues specific to the AIDE Control Panel deployment:

1. Check the validation script output
2. Review container logs
3. Verify environment configuration
4. Test Firebase connectivity
5. Check Google Cloud authentication

## Changelog

### Recent Improvements (June 2025)

- ✅ Fixed Docker build errors with Firebase Admin SDK
- ✅ Added robust error handling for build-time credential issues
- ✅ Enhanced validation script with comprehensive testing
- ✅ Improved port mapping documentation (3000:8080)
- ✅ Added fallback Firebase initialization for static generation
- ✅ Optimized build process for better reliability
