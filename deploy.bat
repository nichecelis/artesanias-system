@echo off
echo ============================================
echo   Artesanias System - Deploy Script
echo ============================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no esta instalado.
    echo Descarga Docker Desktop de: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [1/5] Deteniendo contenedores existentes...
docker-compose down

echo [2/5] Eliminando imagenes antiguas...
docker-compose rm -f

echo [3/5] Construyendo e iniciando contenedores...
docker-compose up -d --build

echo [4/5] Esperando que la base de datos este lista...
timeout /t 15 /nobreak >nul

echo [5/5] Verificando estado...
docker-compose ps

echo.
echo ============================================
echo   Deploy completado!
echo ============================================
echo.
echo Frontend: http://localhost
echo Backend:  http://localhost:3001
echo.
pause
