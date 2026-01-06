@echo off
echo ========================================
echo Iniciando servidores para produccion
echo ========================================

echo.
echo 1. Verificando instalacion de dependencias...

cd /d "%~dp0"

echo Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado o no esta en el PATH
    pause
    exit /b 1
)

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado o no esta en el PATH
    pause
    exit /b 1
)

echo Verificando pnpm...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo pnpm no encontrado, usando npm...
    npm --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Ni pnpm ni npm estan instalados
        pause
        exit /b 1
    )
    set NPM_CMD=npm
) else (
    set NPM_CMD=pnpm
)

echo.
echo 2. Configurando entorno virtual Python...
cd server

if not exist "venv" (
    echo Creando entorno virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Fallo al crear entorno virtual
        pause
        exit /b 1
    )
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Fallo al activar entorno virtual
    pause
    exit /b 1
)

echo Instalando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias de Python
    pause
    exit /b 1
)

echo.
echo 3. Instalando dependencias del cliente Next.js...
cd ..\client
%NPM_CMD% install
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias de Node.js
    pause
    exit /b 1
)

echo.
echo 4. Construyendo aplicacion Next.js para produccion...
%NPM_CMD% run build
if errorlevel 1 (
    echo ERROR: Fallo al construir la aplicacion Next.js
    pause
    exit /b 1
)

echo.
echo 5. Iniciando servidores en modo produccion...
echo.
echo Servidor Python: http://localhost:8000
echo Servidor Next.js: http://localhost:3000
echo.
echo Presione Ctrl+C para detener ambos servidores
echo.

cd ..
start "Servidor Python" cmd /k "cd server && env\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"
timeout /t 3 /nobreak >nul
start "Servidor Next.js" cmd /k "cd client && %NPM_CMD% start"

echo.
echo ========================================
echo Servidores iniciados correctamente
echo ========================================
echo.
pause