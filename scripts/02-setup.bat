@echo off
chcp 65001 >nul
title Senegram - Setup (install + import DB)
color 0A
setlocal enabledelayedexpansion

set "ROOT=%~dp0.."
pushd "%ROOT%"

echo =======================================================
echo   SENEGRAM - Installation complete
echo =======================================================
echo.
echo Cette operation va :
echo   1. Copier les fichiers .env par defaut
echo   2. Installer les dependances npm (backend + frontend)
echo   3. Importer le schema MySQL (base "senegram")
echo.
echo IMPORTANT : MySQL doit deja etre DEMARRE dans XAMPP.
echo.
pause

REM -------- 1. Fichiers .env --------
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo [1] backend\.env cree a partir de .env.example
) else (
    echo [1] backend\.env existe deja - on le garde
)

if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env" >nul
    echo     frontend\.env cree a partir de .env.example
) else (
    echo     frontend\.env existe deja - on le garde
)
echo.

REM -------- 2. npm install --------
echo [2] Installation des dependances backend (cela peut prendre quelques minutes)
pushd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] npm install backend a echoue.
    popd & popd & pause & exit /b 1
)
popd
echo.

echo     Installation des dependances frontend
pushd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] npm install frontend a echoue.
    popd & popd & pause & exit /b 1
)
popd
echo.

REM -------- 3. Import MySQL --------
echo [3] Import du schema MySQL (database/schema.sql)
if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo [ATTENTION] C:\xampp\mysql\bin\mysql.exe introuvable.
    echo Si ton XAMPP est ailleurs, importe manuellement le fichier :
    echo     backend\database\schema.sql
    echo via phpMyAdmin, puis relance ce script a partir de l'etape "run".
    popd & pause & exit /b 0
)

"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Impossible de se connecter a MySQL.
    echo          Ouvre le XAMPP Control Panel et clique "Start" sur MySQL.
    popd & pause & exit /b 1
)

"C:\xampp\mysql\bin\mysql.exe" -u root < "backend\database\schema.sql"
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Import du schema echoue.
    popd & pause & exit /b 1
)
echo     Base "senegram" creee avec succes.
echo.

echo =======================================================
echo   Setup termine. Tu peux maintenant lancer : 03-run.bat
echo =======================================================
popd
pause
