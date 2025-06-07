# Indentation Fix Script

This PowerShell script converts spaces to tabs in source files according to the AIDE coding standards.

```powershell
# convert-spaces-to-tabs.ps1
# A script to convert spaces to tabs in source files

param (
    [string]$directory = ".",
    [int]$tabSize = 4,
    [switch]$dryRun = $false
)

# Define file extensions to process
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.md")

# Get all files with specified extensions
$files = Get-ChildItem -Path $directory -Include $extensions -Recurse |
         Where-Object { -not $_.FullName.Contains("node_modules") -and -not $_.FullName.Contains(".next") }

$totalFiles = $files.Count
$processedFiles = 0
$modifiedFiles = 0

Write-Host "Found $totalFiles files to check..."

foreach ($file in $files) {
    $processedFiles++

    # Read file content
    $content = Get-Content -Path $file.FullName -Raw

    # Check if the file uses spaces for indentation
    if ($content -match "^( {$tabSize})+[^ ]") {
        # Replace spaces with tabs
        $modified = $content -replace "^( {$tabSize})+", { $args[0].Value -replace " {$tabSize}", "`t" }

        # Also handle mixed indentation within lines
        $modified = $modified -replace "(\r?\n)( {$tabSize})+", { $args[0].Groups[1].Value + $args[0].Groups[2].Value -replace " {$tabSize}", "`t" }

        if ($dryRun) {
            Write-Host "Would modify: $($file.FullName)"
        } else {
            # Write the modified content back to the file
            Set-Content -Path $file.FullName -Value $modified -NoNewline
            Write-Host "Modified: $($file.FullName)"
            $modifiedFiles++
        }
    }

    # Show progress
    if ($processedFiles % 100 -eq 0 -or $processedFiles -eq $totalFiles) {
        Write-Progress -Activity "Converting spaces to tabs" -Status "Processed $processedFiles of $totalFiles files" -PercentComplete (($processedFiles / $totalFiles) * 100)
    }
}

Write-Host "Completed! Processed $processedFiles files, modified $modifiedFiles files."
if ($dryRun) {
    Write-Host "This was a dry run. No files were actually modified."
}
```

## Usage

To run this script:

1. Save it as `convert-spaces-to-tabs.ps1` in the project root
2. Open PowerShell in the project directory
3. Run the script:

```powershell
# Dry run (shows files that would be modified without changing them)
.\convert-spaces-to-tabs.ps1 -dryRun

# Actually modify the files
.\convert-spaces-to-tabs.ps1

# Specify a different tab size (default is 4)
.\convert-spaces-to-tabs.ps1 -tabSize 2

# Specify a specific directory
.\convert-spaces-to-tabs.ps1 -directory ".\apps\aide-control"
```

This script will help ensure consistent indentation across the codebase according to the AIDE coding standards.
