# Health Check Implementation for AIDE Control Panel

This document explains the health check implementation for the AIDE Control Panel application.

## Overview

Health checks are essential for containerized applications, especially when deployed to cloud platforms like Google Cloud Run. They help the platform determine when the application is ready to receive traffic and when it's experiencing issues.

## Health Check Endpoints

### `/api/health` Endpoint

The main health check endpoint is located at `/api/health`. This is a simple REST endpoint that returns a 200 OK response when the application is healthy.

```typescript
// app/api/health/route.ts
export async function GET() {
	return NextResponse.json(
		{
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'aide-control',
			version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
		},
		{ status: 200 }
	);
}
```

## Types of Health Checks

In our Cloud Run configuration, we've implemented three types of health checks:

1. **Startup Probe**: Determines if the application has started successfully.
2. **Readiness Probe**: Determines if the application is ready to receive traffic.
3. **Liveness Probe**: Determines if the application is running as expected.

These are configured in the `service.yaml` file.

## Configuration

The following configuration is used for health checks in the Cloud Run service:

```yaml
startupProbe:
  httpGet:
    path: /api/health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 3
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /api/health
    port: 8080
  periodSeconds: 10
  failureThreshold: 3
livenessProbe:
  httpGet:
    path: /api/health
    port: 8080
  periodSeconds: 15
  failureThreshold: 3
```

## Advanced Health Checks

For more advanced scenarios, you can extend the health check to verify:

1. **Database Connectivity**: Check if the application can connect to Firestore
2. **External Dependencies**: Check if the application can connect to other services
3. **System Status**: Check CPU, memory, and other system metrics

Example implementation:

```typescript
export async function GET() {
	try {
		// Check database connectivity
		const db = getFirestoreDb();
		const testDoc = await db.collection('health_checks').doc('test').get();

		// Check other dependencies
		const stripeStatus = await checkStripeConnectivity();

		return NextResponse.json(
			{
				status: 'ok',
				timestamp: new Date().toISOString(),
				service: 'aide-control',
				version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
				dependencies: {
					firestore: 'ok',
					stripe: stripeStatus ? 'ok' : 'failed',
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Health check failed:', error);
		return NextResponse.json(
			{
				status: 'error',
				message: 'Health check failed',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
```

## Monitoring Health Checks

You can monitor health check failures in Google Cloud Console:

1. Go to Cloud Run > aide-control > Logs
2. Filter for health check failures using the query: `resource.type="cloud_run_revision" severity>=WARNING`

## Best Practices

1. Keep health checks lightweight to avoid performance issues
2. Use appropriate timeouts and failure thresholds
3. Log health check failures for easier debugging
4. Consider implementing different levels of health checks (basic, full)
5. Test health checks with failure scenarios
