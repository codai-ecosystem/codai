#!/bin/bash
# Deploy AIDE Control Panel to Google Cloud Run

# Configuration
PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION=${2:-"us-central1"}
SERVICE_NAME="aide-control"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# Display info
echo "Deploying AIDE Control Panel to Google Cloud Run"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Image: $IMAGE"
echo ""

# Check if .env.secrets exists
if [ ! -f .env.secrets ]; then
  echo "Warning: .env.secrets file not found. Sensitive environment variables may need to be set manually."
  echo "Create this file with your sensitive environment variables (FIREBASE_ADMIN_CREDENTIALS, etc.)"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t $IMAGE .

# Push to Google Container Registry
echo "Pushing image to Google Container Registry..."
gcloud auth configure-docker --quiet
docker push $IMAGE

# Update service.yaml with project ID
sed -i "s|gcr.io/PROJECT_ID/aide-control:latest|$IMAGE|g" service.yaml

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
if [ -f .env.secrets ]; then
  gcloud run services replace service.yaml --region=$REGION

  # Set secrets from .env.secrets file
  echo "Setting secrets from .env.secrets..."
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key == \#* ]] && continue
    [[ -z "$key" ]] && continue

    # Trim whitespace
    key=$(echo $key | xargs)

    # Update secret in the service
    echo "Setting secret: $key"
    gcloud run services update $SERVICE_NAME \
      --region=$REGION \
      --set-env-vars="$key=$value"
  done < .env.secrets
else
  gcloud run services replace service.yaml --region=$REGION
fi

# Display the service URL
echo ""
echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"
