@echo off
echo Cleaning up unnecessary VS Code extensions for AI-native development...

cd /d "%~dp0\..\extensions"

REM Keep these essential extensions:
REM - aide-core (our main extension)
REM - copilot (our custom Copilot extension)
REM - github-authentication (needed for auth)
REM - microsoft-authentication (needed for auth)
REM - types (TypeScript definitions)

REM Remove manual coding extensions
if exist "configuration-editing" rmdir /s /q "configuration-editing"
if exist "diff" rmdir /s /q "diff"
if exist "docker" rmdir /s /q "docker"
if exist "extension-editing" rmdir /s /q "extension-editing"
if exist "git" rmdir /s /q "git"
if exist "git-base" rmdir /s /q "git-base"
if exist "ipynb" rmdir /s /q "ipynb"
if exist "media-preview" rmdir /s /q "media-preview"
if exist "merge-conflict" rmdir /s /q "merge-conflict"
if exist "notebook-renderers" rmdir /s /q "notebook-renderers"
if exist "prompt-basics" rmdir /s /q "prompt-basics"
if exist "references-view" rmdir /s /q "references-view"
if exist "search-result" rmdir /s /q "search-result"
if exist "simple-browser" rmdir /s /q "simple-browser"

echo Extension cleanup completed!
echo.
echo Remaining extensions:
dir /b
