@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Artesanias System - Build para IIS
echo ============================================
echo.

REM Carpeta de salida
set OUTPUT=artesanias-iis
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

echo [1/7] Instalando dependencias del backend...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias del backend
    pause
    exit /b 1
)
cd ..

echo [2/7] Generando cliente Prisma...
cd backend
call npx prisma generate
cd ..

echo [3/7] Compilando backend...
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo al compilar backend
    pause
    exit /b 1
)
cd ..

echo [4/7] Instalando dependencias del frontend...
cd frontend
call npm install
cd ..

echo [5/7] Compilando frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo al compilar frontend
    pause
    exit /b 1
)
cd ..

echo [6/7] Creando estructura de archivos...
REM Backend
if not exist "%OUTPUT%\backend" mkdir "%OUTPUT%\backend"
xcopy /E /I /Y backend\dist "%OUTPUT%\backend\dist\"
xcopy /E /I /Y backend\node_modules "%OUTPUT%\backend\node_modules\"
copy backend\package.json "%OUTPUT%\backend\"

REM Frontend
if not exist "%OUTPUT%\frontend" mkdir "%OUTPUT%\frontend"
xcopy /E /I /Y frontend\dist "%OUTPUT%\frontend\dist\"

REM Configuracion
if not exist "%OUTPUT%\config" mkdir "%OUTPUT%\config"
copy backend\.env "%OUTPUT%\config\backend.env"
copy "%OUTPUT%\config\backend.env" "%OUTPUT%\backend\.env"

echo [7/7] Creando archivos de instalacion...

REM Script de inicio
(
echo @echo off
echo ============================================
echo   Artesanias System - Iniciar Servicios
echo ============================================
echo.
echo.
echo REM Verificar Node.js
echo where node >nul 2^>nul
echo if errorlevel 1 (
echo     echo ERROR: Node.js no esta instalado.
echo     echo Descarga de: https://nodejs.org/
echo     pause
echo     exit /b 1
echo )
echo.
echo REM Verificar PostgreSQL
echo net start | findstr /i "postgres" >nul
echo if errorlevel 1 (
echo     echo ERROR: PostgreSQL no esta ejecutandose.
echo     echo Inicia PostgreSQL manualmente.
echo     pause
echo     exit /b 1
echo )
echo.
echo REM Verificar Redis
echo net start | findstr /i "redis" >nul
echo if errorlevel 1 (
echo     echo ADVERTENCIA: Redis no esta ejecutandose.
echo     echo Algunos features pueden no funcionar.
echo )
echo.
echo cd /d "%%~dp0backend"
echo echo Iniciando backend en puerto 3001...
echo start "Artesanias Backend" cmd /k "node dist/server.js"
echo.
echo echo Backend iniciado!
echo echo.
echo echo Accede a:
echo echo   Frontend: http://localhost
echo echo   API:      http://localhost:3001
echo echo.
echo pause
) > "%OUTPUT%\iniciar.bat"

REM Configuracion IIS (web.config para frontend)
(
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="React Router" stopProcessing="true"^>
echo           ^<match url=".*" /^>
echo           ^<conditions logicalGrouping="MatchAll"^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="/index.html" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%OUTPUT%\frontend\web.config"

REM Configuracion IIS (para API)
(
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<proxy enabled="true" /'^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%OUTPUT%\backend\web.config"

REM README
(
echo Artesanias System - Instalacion IIS
echo ====================================
echo.
echo REQUISITOS:
echo - Windows Server con IIS
echo - Node.js 20+: https://nodejs.org/
echo - PostgreSQL 16+: https://www.postgresql.org/download/windows/
echo - Redis (opcional): https://github.com/microsoftarchive/redis/releases
echo - URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
echo.
echo INSTALACION:
echo.
echo 1. INSTALAR SOFTWARE
echo    - Instala Node.js
echo    - Instala PostgreSQL y crea la base de datos:
echo      CREATE DATABASE artesanias_db;
echo      CREATE USER artesanias_user WITH PASSWORD 'artesanias_pass';
echo      GRANT ALL PRIVILEGES ON DATABASE artesanias_db TO artesanias_user;
echo.
echo 2. COPIAR ARCHIVOS
echo    - Copia esta carpeta a C:\inetpub\wwwroot\artesanias
echo.
echo 3. CONFIGURAR BASE DE DATOS
echo    - Edita backend\.env con tu DATABASE_URL
echo    - Ejecuta: cd backend ^&^& npx prisma db push
echo.
echo 4. CONFIGURAR IIS
echo    - IIS Manager ^> Sites ^> Add Website
echo      Nombre: Artesanias
echo      Physical path: C:\inetpub\wwwroot\artesanias\frontend\dist
echo      Port: 80
echo.
echo    - Para API (Application):
echo      IIS ^> Sitio principal ^> Add Application
echo      Alias: api
echo      Physical path: C:\inetpub\wwwroot\artesanias\backend
echo.
echo    - Instala URL Rewrite y habilita proxy en IIS
echo.
echo 5. INICIAR
echo    - Ejecuta iniciar.bat
echo    - O inicia manualmente:
echo      cd C:\inetpub\wwwroot\artesanias\backend
echo      node dist/server.js
echo.
echo ACCESO:
echo   Frontend: http://localhost
echo   API:      http://localhost:3001/api/v1
echo   Docs:     http://localhost:3001/api/v1/docs
echo.
echo LOGIN:
echo   Admin: admin / admin123
echo.
) > "%OUTPUT%\README.txt"

echo.
echo ============================================
echo   Build completado!
echo ============================================
echo.
echo Carpeta de salida: %OUTPUT%
echo.
echo Contenido:
dir /b "%OUTPUT%"
echo.
echo Pasos siguientes:
echo 1. Copia la carpeta %OUTPUT% al servidor
echo 2. Sigue las instrucciones en README.txt
echo.
pause
