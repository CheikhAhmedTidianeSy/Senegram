@echo off
chcp 65001 >nul
title Senegram - Lancement du projet
color 0A

set "ROOT=%~dp0.."
pushd "%ROOT%"

echo =======================================================
echo   SENEGRAM - Lancement du projet
echo =======================================================
echo.

REM -------- Detection HTTPS --------
set "USE_HTTPS=0"
set "PROTO=http"
if exist "backend\certs\cert.pem" (
    if exist "backend\certs\key.pem" (
        set "USE_HTTPS=1"
        set "PROTO=https"
    )
)

if "%USE_HTTPS%"=="1" (
    echo Mode : HTTPS  ^(certificat auto-signe detecte^)
) else (
    echo Mode : HTTP   ^(pas de certs - lance 04-enable-https.bat pour WebRTC mobile^)
)
echo.
echo Je vais ouvrir 2 fenetres cmd :
echo    - une pour le backend  (port 5000)
echo    - une pour le frontend (port 5173)
echo.
echo Puis j'ouvrirai automatiquement ton navigateur sur %PROTO%://localhost:5173
echo.
echo Ferme cette fenetre quand tu arretes le projet (Ctrl+C dans les 2 fenetres).
echo.

REM -------- Verification rapide --------
if not exist "backend\node_modules" (
    echo [ERREUR] backend\node_modules introuvable.
    echo          Lance d'abord 02-setup.bat
    popd & pause & exit /b 1
)
if not exist "frontend\node_modules" (
    echo [ERREUR] frontend\node_modules introuvable.
    echo          Lance d'abord 02-setup.bat
    popd & pause & exit /b 1
)

REM -------- Tuer les instances precedentes (sinon strictPort bloque) --------
echo Nettoyage des anciens processus node sur les ports 5000 / 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

REM -------- Demarrage backend --------
echo Demarrage du backend...
start "Senegram - Backend" cmd /k "cd /d %ROOT%\backend && npm run dev"

timeout /t 3 /nobreak >nul

REM -------- Demarrage frontend --------
echo Demarrage du frontend...
if "%USE_HTTPS%"=="1" (
    REM On pose HTTPS=1 dans CE processus batch -> herite par le cmd spawne
    REM (plus fiable que "set" a l'interieur du cmd /k sur Windows).
    set "HTTPS=1"
    start "Senegram - Frontend" cmd /k "cd /d %ROOT%\frontend && npm run dev"
) else (
    set "HTTPS="
    start "Senegram - Frontend" cmd /k "cd /d %ROOT%\frontend && npm run dev"
)

timeout /t 5 /nobreak >nul

REM -------- Ouverture navigateur --------
echo Ouverture du navigateur...
start "" "%PROTO%://localhost:5173"

echo.
echo =======================================================
echo   Tout est lance. Tu peux fermer cette fenetre.
echo =======================================================
if "%USE_HTTPS%"=="1" (
    echo.
    echo Rappel : la 1re fois, accepte l'alerte "Connexion non privee"
    echo         sur %PROTO%://localhost:5000/  ET  %PROTO%://localhost:5173/
    echo         Idem sur ton telephone avec l'IP du PC.
)
popd
timeout /t 4 /nobreak >nul
exit /b 0
