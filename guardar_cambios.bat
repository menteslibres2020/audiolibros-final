@echo off
echo ==========================================
echo CONFIGURAR Y GUARDAR EN GITHUB
echo ==========================================
echo.

REM Verificando Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git no detectado.
    pause
    exit /b
)

echo Configurando identidad para este proyecto...
echo (Solo necesitas hacerlo si no funciona automatico)
echo.

set /p GITEMAIL="Ingresa tu email de GitHub: "
set /p GITNAME="Ingresa tu nombre de usuario: "

echo.
echo Guardando configuracion...
git config user.email "%GITEMAIL%"
git config user.name "%GITNAME%"

echo.
echo 1. Preparando archivos...
git add .

echo.
echo 2. Guardando version...
git commit -m "Version Inicial Auditada"

echo.
echo 3. Subiendo a GitHub...
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Algo salio mal.
    echo Mira el mensaje de error arriba.
) else (
    echo.
    echo [EXITO] PROYECTO GUARDADO CORRECTAMENTE!
)

pause
