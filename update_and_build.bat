@echo off
TITLE SGA Updater
echo ===================================================
echo    ACTUALIZANDO SISTEMA DE GESTION (SGA)
echo ===================================================
echo.

:: 1. Actualizar codigo (si usas git)
echo [1/3] Buscando actualizaciones...
git pull
echo.

:: 2. Actualizar Backend
echo [2/3] Actualizando librerias del Backend...
cd server
if not exist .venv (
    echo Creando entorno virtual...
    python -m venv .venv
)
call .venv\Scripts\activate
pip install -r requirements.txt
cd ..
echo.

:: 3. Actualizar y Construir Frontend
echo [3/3] Actualizando y Construyendo Frontend...
cd client
call npm install
echo Construyendo version de produccion...
call npm run build
cd ..

echo.
echo ===================================================
echo    ACTUALIZACION COMPLETADA
echo ===================================================
echo.
echo Ahora puedes usar start_app.bat para iniciar el sistema (asegurate de cambiarlo a 'npm start').
pause
