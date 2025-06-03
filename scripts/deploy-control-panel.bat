@echo off
REM AIDE Control Panel Deployment Script for Windows
REM This script deploys the aide-control app to Google Cloud Run

setlocal enabledelayedexpansion

REM Configuration
if "%GOOGLE_CLOUD_PROJECT%"=="" set GOOGLE_CLOUD_PROJECT=aide-dev
if "%GOOGLE_CLOUD_REGION%"=="" set GOOGLE_CLOUD_REGION=us-central1
set SERVICE_NAME=aide-control

echo 🚀 Deploying AIDE Control Panel to Cloud Run...
echo Project: %GOOGLE_CLOUD_PROJECT%
echo Region: %GOOGLE_CLOUD_REGION%
echo Service: %SERVICE_NAME%

REM Check if gcloud is installed
where gcloud >nul 2>nul
if errorlevel 1 (
    echo ❌ gcloud CLI not found. Please install Google Cloud SDK.
    exit /b 1
)

REM Set the project
gcloud config set project %GOOGLE_CLOUD_PROJECT%

REM Build and deploy using Cloud Build
echo 📦 Building and deploying with Cloud Build...
gcloud builds submit --config=apps/aide-control/cloudbuild.yaml --region=%GOOGLE_CLOUD_REGION%

if errorlevel 1 (
    echo ❌ Deployment failed!
    exit /b 1
)

echo ✅ Deployment completed!

REM Get the service URL
for /f "delims=" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%GOOGLE_CLOUD_REGION% --format="value(status.url)"') do set SERVICE_URL=%%i

echo 🌐 Service URL: %SERVICE_URL%
echo 📊 To view logs: gcloud logs tail --follow --resource-type cloud_run_revision --resource-name %SERVICE_NAME%

pause
