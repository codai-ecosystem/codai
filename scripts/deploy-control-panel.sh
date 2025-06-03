#!/bin/bash

# AIDE Control Panel Deployment Script
# This script deploys the aide-control app to Google Cloud Run

set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"aide-dev"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
SERVICE_NAME="aide-control"

echo "🚀 Deploying AIDE Control Panel to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Build and deploy using Cloud Build
echo "📦 Building and deploying with Cloud Build..."
gcloud builds submit \
    --config=apps/aide-control/cloudbuild.yaml \
    --region=$REGION

echo "✅ Deployment completed!"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format='value(status.url)')

echo "🌐 Service URL: $SERVICE_URL"
echo "📊 To view logs: gcloud logs tail --follow --resource-type cloud_run_revision --resource-name $SERVICE_NAME"
