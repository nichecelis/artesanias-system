@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Artesanias System - Build para Deploy
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

REM Carpeta de salida
set OUTPUT=artesanias-deploy
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

echo [1/6] Limpiando imagenes anteriores...
docker rmi artesanias-backend:latest artesanias-frontend:latest artesanias-db:latest artesanias-redis:latest 2>nul

echo [2/6] Construyendo imagen del backend...
docker build -t artesanias-backend:latest ./backend

echo [3/6] Construyendo imagen del frontend...
docker build -t artesanias-frontend:latest ./frontend

echo [4/6] Exportando imagenes a archivos...
docker save -o "%OUTPUT%\artesanias-backend.tar" artesanias-backend:latest
docker save -o "%OUTPUT%\artesanias-frontend.tar" artesanias-frontend:latest
docker save -o "%OUTPUT%\artesanias-db.tar" postgres:16
docker save -o "%OUTPUT%\artesanias-redis.tar" redis:7-alpine

echo [5/6] Copiando archivos de configuracion...
copy docker-compose.yml "%OUTPUT%\"
copy backend\.env "%OUTPUT%\backend.env"

echo [6/6] Creando script de instalacion...
(
echo @echo off
echo echo ============================================
echo echo   Artesanias System - Instalacion
echo echo ============================================
echo echo.
echo.
echo REM Instalar Docker Desktop si no esta instalado
echo where docker >nul 2^>nul
echo if errorlevel 1 (
echo     echo Docker no encontrado. Instala Docker Desktop.
echo     pause
echo     exit /b 1
echo )
echo.
echo echo [1/4] Cargando imagenes...
echo docker load -i artesanias-backend.tar
echo docker load -i artesanias-frontend.tar
echo docker load -i artesanias-db.tar
echo docker load -i artesanias-redis.tar
echo.
echo echo [2/4] Configurando variables de entorno...
echo copy backend.env .env
echo.
echo echo [3/4] Iniciando servicios...
echo docker-compose up -d
echo.
echo echo [4/4] Esperando servicios...
echo timeout /t 20 /nobreak
echo docker-compose ps
echo.
echo echo ============================================
echo echo   Instalacion completada!
echo echo ============================================
echo echo.
echo echo Accede a: http://localhost
echo echo.
echo pause
) > "%OUTPUT%\instalar.bat"

REM Mostrar resultado
echo.
echo ============================================
echo   Build completado!
echo ============================================
echo.
echo Archivos en carpeta: %OUTPUT%
echo.
echo Contenido:
dir /b "%OUTPUT%"
echo.
echo ============================================
echo   Pasos para instalar en otro equipo:
echo ============================================
echo.
echo 1. Copia la carpeta "%OUTPUT%" al servidor
echo 2. Instala Docker Desktop en el servidor
echo 3. Ejecuta instalar.bat en el servidor
echo.
echo ============================================
echo.

echo.
echo [7/7] Limpiando archivos sensibles...
del "%OUTPUT%\backend.env" 2>nul

REM Crear README para el servidor
(
echo Artesanias System - Instalacion
echo ==============================
echo.
echo Requisitos:
echo - Docker Desktop instalado
echo.
echo Pasos:
echo 1. Ejecuta instalar.bat
echo 2. Espera a que termine la instalacion
echo 3. Accede a http://localhost
echo.
echo Primeros pasos:
echo 1. Ve a http://localhost/api/v1/docs para ver la documentacion
echo 2. Login con admin / admin123
echo.
) > "%OUTPUT%\README.txt"

pause
