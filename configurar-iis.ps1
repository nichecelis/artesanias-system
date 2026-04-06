# Artesanias System - Configurar IIS
# Ejecutar como Administrador en el servidor

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Artesanias System - Configurar IIS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar permisos
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Ejecuta este script como Administrador" -ForegroundColor Red
    pause
    exit 1
}

$basePath = "C:\inetpub\wwwroot\artesanias"

# 1. Verificar Node.js
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "OK - Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js no esta instalado" -ForegroundColor Red
    Write-Host "Descarga de: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# 2. Verificar PostgreSQL
Write-Host "[2/6] Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "*postgres*" -ErrorAction Stop
    if ($pgService.Status -eq "Running") {
        Write-Host "OK - PostgreSQL esta ejecutandose" -ForegroundColor Green
    } else {
        Write-Host "ADVERTENCIA: PostgreSQL no esta ejecutandose" -ForegroundColor Yellow
        Write-Host "Inicia el servicio PostgreSQL" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ADVERTENCIA: No se encontro el servicio PostgreSQL" -ForegroundColor Yellow
}

# 3. Crear estructura de carpetas
Write-Host "[3/6] Creando estructura de carpetas..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$basePath\frontend\dist" | Out-Null
New-Item -ItemType Directory -Force -Path "$basePath\backend\dist" | Out-Null
New-Item -ItemType Directory -Force -Path "$basePath\backend\node_modules" | Out-Null
New-Item -ItemType Directory -Force -Path "$basePath\logs" | Out-Null
Write-Host "OK - Carpetas creadas" -ForegroundColor Green

# 4. Instalar URL Rewrite
Write-Host "[4/6] Verificando URL Rewrite..." -ForegroundColor Yellow
$urlRewrite = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\InetStp\Components" -Name "UrlRewrite" -ErrorAction SilentlyContinue
if (-not $urlRewrite) {
    Write-Host "ADVERTENCIA: URL Rewrite no esta instalado" -ForegroundColor Yellow
    Write-Host "Descarga de: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
} else {
    Write-Host "OK - URL Rewrite instalado" -ForegroundColor Green
}

# 5. Configurar IIS
Write-Host "[5/6] Configurando IIS..." -ForegroundColor Yellow

# Configurar Frontend Site
$frontendPath = "$basePath\frontend\dist"
if (Test-Path $frontendPath) {
    Write-Host "  - Configurando sitio Frontend..." -ForegroundColor Cyan
    
    # Crear web.config para frontend si no existe
    $frontendWebConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Router" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
    Set-Content -Path "$frontendPath\web.config" -Value $frontendWebConfig -Force
    Write-Host "  OK - web.config creado" -ForegroundColor Green
}

# 6. Mostrar instrucciones finales
Write-Host "[6/6] Configuracion completada!" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Pasos finales en IIS Manager:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. CREAR SITIO WEB PARA FRONTEND:" -ForegroundColor Yellow
Write-Host "   - IIS Manager ^> Sites ^> Add Website"
Write-Host "   - Site name: Artesanias"
Write-Host "   - Physical path: $frontendPath" -ForegroundColor White
Write-Host "   - Port: 80"
Write-Host ""
Write-Host "2. CREAR APLICACION PARA API:" -ForegroundColor Yellow
Write-Host "   - IIS ^> Sitio Artesanias ^> Add Application"
Write-Host "   - Alias: api"
Write-Host "   - Physical path: $basePath\backend" -ForegroundColor White
Write-Host ""
Write-Host "3. CONFIGURAR PROXY PARA API:" -ForegroundColor Yellow
Write-Host "   - Selecciona la aplicacion 'api'"
Write-Host "   - abre URL Rewrite ^> View Server Variables"
Write-Host "   - Agregar: HTTP_ACCEPT, HTTP_AUTHORIZATION"
Write-Host "   - Crear regla de reverse proxy a localhost:3001"
Write-Host ""
Write-Host "4. INICIAR BACKEND:" -ForegroundColor Yellow
Write-Host "   - Abre PowerShell como Administrador"
Write-Host "   - cd $basePath\backend" -ForegroundColor White
Write-Host "   - node dist\server.js"
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  URLs de acceso:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost" -ForegroundColor Green
Write-Host "   API:      http://localhost/api/v1" -ForegroundColor Green
Write-Host "   Docs:     http://localhost:3001/api/v1/docs" -ForegroundColor Green
Write-Host ""
Write-Host "   Login: admin / admin123" -ForegroundColor Green
Write-Host ""

pause
