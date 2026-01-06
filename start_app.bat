@echo off
TITLE SGA Launcher
echo ===================================================
echo    INICIANDO SISTEMA DE GESTION (SGA)
echo ===================================================
echo.

:: 1. Iniciar Backend (Servidor Python)
echo [1/2] Iniciando Backend...
start "Servidor Python" cmd /k "cd server && env\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"

:: Esperar unos segundos para que el backend arranque
timeout /t 5 /nobreak >nul

:: 2. Iniciar Frontend (Next.js)
echo [2/2] Iniciando Frontend...
:: Nota: Usamos 'npm run dev' para desarrollo o 'npm start' para produccion (requiere build previo)
:: Si quieres produccion real, cambia 'npm run dev' por 'npm start' y asegurate de haber hecho 'npm run build' antes.
start "SGA Frontend" cmd /k "cd client && npm run start"

echo.
echo ===================================================
echo    SISTEMA INICIADO CORRECTAMENTE
echo ===================================================
echo.
echo Las ventanas se han abierto en segundo plano.
echo No cierres las ventanas negras o el sistema se detendra.
echo.
pause
