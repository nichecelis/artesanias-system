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
    pause
    exit /b 1
)

set OUTPUT=artesanias-deploy
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

echo [1/5] Limpiando imagenes anteriores...
docker rmi artesanias-backend:latest artesanias-frontend:latest 2>nul
echo DONE
pause

echo [2/5] Preparando dependencias del backend (npm ci) y Construyendo imagen Docker del backend (con Prisma en Linux)...
cd backend
call npm ci
cd ..
docker build -t artesanias-backend:latest ./backend
if errorlevel 1 (
    echo ERROR: Fallo al construir backend
    pause
    exit /b 1
)
echo DONE
pause

echo [3/5] Compilando y exportando frontend (con dist actualizado)...
cd frontend
echo [npm] Clean install (ci) y build del frontend...
call npm ci 2>nul
call npm run build
set FRONTEND_DIST_EXISTS=0
if exist dist (
  set FRONTEND_DIST_EXISTS=1
)
if %FRONTEND_DIST_EXISTS%==0 (
  echo ERROR: dist no fue generado en frontend, abortando.
  pause
  exit /b 1
)
cd ..
echo DONE
pause

echo [4/5] Exportando imagenes a archivos...
docker save -o "%OUTPUT%\artesanias-backend.tar" artesanias-backend:latest
docker save -o "%OUTPUT%\artesanias-frontend.tar" artesanias-frontend:latest
docker pull postgres:16
docker save -o "%OUTPUT%\artesanias-db.tar" postgres:16
docker pull redis:7-alpine
docker save -o "%OUTPUT%\artesanias-redis.tar" redis:7-alpine
echo DONE
pause

echo [5/5] Creando archivos de configuracion...
copy docker-compose.yml "%OUTPUT%\"
copy backend\.env "%OUTPUT%\backend.env"
echo DONE
pause

REM Crear script de instalacion con permisos de administrador
(
echo @echo off
echo :: Solicitar permisos de administrador
echo fsutil dirty query %%systemdrive%%^>nul 2^>^&1
echo if '%%errorlevel%%'=='1' ^(
echo     echo Solicitando permisos de administrador...
echo     powershell -Command "Start-Process cmd -ArgumentList '/c cd /d %%~dp0^&^&instalar.bat' -Verb RunAs"
echo     exit /b
echo ^)
echo.
echo @echo off
echo setlocal enabledelayedexpansion
echo.
echo echo ============================================
echo echo   Artesanias System - Instalacion
echo echo ============================================
echo echo.
echo.
echo REM Verificar Docker
echo where docker ^>nul 2^>^&1
echo if errorlevel 1 ^(
echo     echo ERROR: Docker no esta instalado.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo [1/7] Cargando imagenes Docker...
echo docker load -i artesanias-backend.tar
echo docker load -i artesanias-frontend.tar
echo docker load -i artesanias-db.tar
echo docker load -i artesanias-redis.tar
echo.
echo echo [2/7] Configurando variables de entorno...
echo copy backend.env .env 2^>nul
echo.
echo echo [3/7] Iniciando servicios...
echo docker-compose up -d
echo.
echo echo [4/7] Esperando que los servicios esten listos...
echo timeout /t 30 /nobreak
echo docker-compose ps
echo.
echo echo [5/7] Configurando firewall de Windows...
echo netsh advfirewall firewall add rule name="Artesanias Frontend" dir=in action=allow protocol=TCP localport=80 2^>nul
echo netsh advfirewall firewall add rule name="Artesanias Backend" dir=in action=allow protocol=TCP localport=3001 2^>nul
echo.
echo echo [6/7] Configurando base de datos...
echo echo    docker exec -u root artesanias_backend npm install prisma@5.22.0
echo docker exec -u root artesanias_backend npm install prisma@5.22.0
echo echo    docker exec -u root artesanias_backend npx prisma db push
echo docker exec -u root artesanias_backend npx prisma db push
echo echo    docker exec -u root artesanias_backend npx prisma db seed
echo docker exec -u root artesanias_backend npx prisma db seed
echo.
echo echo [7/7] Obteniendo IP del servidor...
echo for /f "tokens=2 delims=:" %%%%a in ^('"ipconfig ^| findstr /i ipv4"'^) do set "IP=%%%%~a"
echo set "IP=!IP: =!"
echo.
echo echo ============================================
echo echo   Instalacion completada!
echo echo ============================================
echo echo.
echo echo ACCESO LOCAL:
echo echo   Frontend: http://localhost
echo echo   Backend:  http://localhost:3001
echo echo   Docs:     http://localhost:3001/api/v1/docs
echo echo.
echo echo ACCESO EN RED ^(desde otros equipos^):
echo echo   Frontend: http://!IP!:80
echo echo   Backend:  http://!IP!:3001
echo echo.
echo echo LOGIN:
echo echo   admin / admin123
echo echo.
echo echo COMANDOS UTILES:
echo echo   Ver estado:  docker-compose ps
echo echo   Ver logs:   docker-compose logs -f
echo echo   Reiniciar:  docker-compose restart
echo echo   Parar:     docker-compose down
echo echo.
echo pause
) > "%OUTPUT%\instalar.bat"

REM Crear README
(
echo Artesanias System - Instalacion Docker
echo =====================================
echo.
echo REQUISITOS:
echo - Docker Desktop instalado
echo.
echo INSTALACION:
echo 1. Ejecuta instalar.bat ^(se ejecutara como administrador^)
echo 2. Espera a que termine
echo 3. Configura la base de datos ^(ver abajo^)
echo.
echo ACCESO:
echo   Local:  http://localhost
echo   Red:    http://192.168.x.x
echo.
echo CONFIGURAR BASE DE DATOS:
echo =============================
echo.
echo DESPUES de instalar, ejecuta estos comandos en PowerShell ^(como administrador^):
echo.
echo 1. Instalar Prisma en el contenedor:
echo    docker exec -u root artesanias_backend npm install prisma@5.22.0
echo.
echo 2. Crear tablas en la base de datos:
echo    docker exec -u root artesanias_backend npx prisma db push
echo.
echo 3. Crear usuario administrador inicial:
echo    docker exec -u root artesanias_backend npx prisma db seed
echo.
echo VERIFICAR TABLAS:
echo    docker exec -it artesanias_db psql -U artesanias_user -d artesanias_db -c "\dt"
echo.
echo VERIFICAR USUARIOS:
echo    docker exec -it artesanias_db psql -U artesanias_user -d artesanias_db -c "SELECT correo, nombre FROM usuarios;"
echo.
echo COMANDOS UTILES:
echo   Ver estado:  docker-compose ps
echo   Ver logs:   docker-compose logs -f backend
echo   Reiniciar:  docker-compose restart
echo   Parar:      docker-compose down
echo.
echo LOGIN:
echo   admin / admin123
echo.
echo RESOLUCION DE PROBLEMAS:
echo.
echo Si el login no funciona:
echo 1. Verifica que las tablas existen: docker exec -it artesanias_db psql -U artesanias_user -d artesanias_db -c "\dt"
echo 2. Verifica que hay usuarios: docker exec -it artesanias_db psql -U artesanias_user -d artesanias_db -c "SELECT * FROM usuarios;"
echo 3. Si no hay tablas ni usuarios, ejecuta los pasos de CONFIGURAR BASE DE DATOS
echo.
) > "%OUTPUT%\README.txt"

echo.
echo ============================================
echo   Build completado!
echo ============================================
dir "%OUTPUT%"
echo.
pause
