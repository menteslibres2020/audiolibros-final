@echo off
echo ==========================================
echo GUARDANDO PROGRESO...
echo ==========================================
echo.

git add .
set /p MSG="Que cambios hiciste? (Enter = Avance automatico): "
if "%MSG%"=="" set MSG="Avance del proyecto %date%"

git commit -m "%MSG%"
git push origin main

echo.
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo conectar con GitHub.
) else (
    echo [OK] TODO GUARDADO EN LA NUBE!
)
pause
