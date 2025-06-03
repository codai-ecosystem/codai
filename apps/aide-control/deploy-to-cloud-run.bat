@echo off
REM Deploy AIDE Control Panel to Google Cloud Run

REM Configuration
set PROJECT_ID=%1
if "%PROJECT_ID%"=="" for /f "tokens=*" %%i in ('gcloud config get-value project') do set PROJECT_ID=%%i
set REGION=%2
if "%REGION%"=="" set REGION=us-central1
set SERVICE_NAME=aide-control
set IMAGE=gcr.io/%PROJECT_ID%/%SERVICE_NAME%:latest

REM Display info
echo Deploying AIDE Control Panel to Google Cloud Run
echo Project ID: %PROJECT_ID%
echo Region: %REGION%
echo Service: %SERVICE_NAME%
echo Image: %IMAGE%
echo.

REM Check if .env.secrets exists
if not exist .env.secrets (
  echo Warning: .env.secrets file not found. Sensitive environment variables may need to be set manually.
  echo Create this file with your sensitive environment variables (FIREBASE_ADMIN_CREDENTIALS, etc.)
  set /p CONTINUE=Continue anyway? (y/n)
  if /i not "%CONTINUE%"=="y" exit /b 1
)

REM Build the Docker image
echo Building Docker image...
docker build -t %IMAGE% .

REM Push to Google Container Registry
echo Pushing image to Google Container Registry...
call gcloud auth configure-docker --quiet
docker push %IMAGE%

REM Update service.yaml with project ID
powershell -Command "(Get-Content service.yaml) -replace 'gcr.io/PROJECT_ID/aide-control:latest', '%IMAGE%' | Set-Content service.yaml"

REM Deploy to Cloud Run
echo Deploying to Cloud Run...
gcloud run services replace service.yaml --region=%REGION%

REM Set secrets from .env.secrets file if it exists
if exist .env.secrets (
  echo Setting secrets from .env.secrets...
  for /f "tokens=1,* delims==" %%a in (.env.secrets) do (
    if not "%%a"=="" (
      if not "%%a:~0,1%"=="#" (
        echo Setting secret: %%a
        gcloud run services update %SERVICE_NAME% --region=%REGION% --set-env-vars="%%a=%%b"
      )
    )
  )
)

REM Display the service URL
echo.
echo Deployment complete!
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format^="value(status.url)"') do (
  echo Service URL: %%i
)
