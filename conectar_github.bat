@echo off
echo ==========================================
echo CONFIGURADOR AUTOMATICO DE GITHUB
echo ==========================================
echo.

REM Verificando instalación de Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git no esta instalado o no se encuentra en el sistema.
    echo Por favor, instala Git desde: https://git-scm.com/download/win
    echo Una vez instalado, cierra y vuelve a abrir este archivo.
    pause
    exit /b
)

echo [OK] Git detectado. Iniciando configuracion...
echo.

REM Inicializar repositorio si no existe
if not exist ".git" (
    echo Inicializando repositorio Git...
    git init
    echo [OK] Repositorio inicializado.
) else (
    echo El repositorio ya esta inicializado.
)

REM Agregar archivos
echo Agregando archivos al control de versiones...
git add .
echo [OK] Archivos agregados.

REM Crear commit inicial
echo Creando primer commit...
git commit -m "Primera version: App con Login y Supabase"
git branch -M main

echo.
echo ==========================================
echo CONECTANDO A TU CUENTA DE GITHUB
echo ==========================================
echo Usuario detectado: menteslibres2020
echo Repositorio objetivo: audiolibros-final
echo.

set REPO_URL=https://github.com/menteslibres2020/audiolibros-final.git

echo Configurando remoto origin a: %REPO_URL%
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git remote set-url origin %REPO_URL%

echo.
echo ==========================================
echo SUBIENDO ARCHIVOS...
echo ==========================================
echo IMPORTANTE: Si al subir falla porque el repositorio no existe,
echo por favor VE AHORA a GitHub y crea un repositorio llamado 'audiolibros-final'
echo en tu cuenta 'menteslibres2020'.
echo.
pause

git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo subir. 
    echo 1. Asegurate de haber creado el repositorio vacio audiolibros-final en GitHub.
    echo 2. Verifica tus permisos/login en la ventana emergente.
) else (
    echo.
    echo [EXITO] PROYECTO GUARDADO EN GITHUB CORRECTAMENTE!
)

pause
