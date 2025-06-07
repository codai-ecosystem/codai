# PowerShell script to fix all dynamic routes for Next.js 15
$routes = @(
    "app\api\billing\plans\[id]\route.ts",
    "app\api\projects\[id]\route.ts",
    "app\api\services\[providerId]\route.ts",
    "app\api\users\[id]\route.ts",
    "app\api\users\[id]\provision\route.ts",
    "app\api\users\[id]\services\route.ts",
    "app\api\users\[id]\services\[type]\[provider]\route.ts",
    "app\api\users\[id]\usage\route.ts"
)

foreach ($route in $routes) {
    if (Test-Path $route) {
        Write-Host "Fixing $route"
        $content = Get-Content $route -Raw

        # Fix params type for GET
        $content = $content -replace '{ params }: { params: { ([^}]+) } }', '{ params }: { params: Promise<{ $1 }> }'

        # Fix params access for await
        $content = $content -replace 'params\.(\w+)', '(await params).$1'
        $content = $content -replace 'const (\w+) = params\.(\w+);', 'const { $2: $1 } = await params;'

        Set-Content $route $content
    }
}

Write-Host "Fixed all dynamic routes for Next.js 15 compatibility"
