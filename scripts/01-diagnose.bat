@echo off
chcp 65001 >nul
title Senegram - Diagnostic MySQL
color 0B

echo =======================================================
echo   SENEGRAM - Diagnostic rapide de ton environnement
echo =======================================================
echo.

echo [1/5] Verification de Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    [ERREUR] Node.js est introuvable. Installe-le depuis https://nodejs.org
) else (
    for /f "delims=" %%v in ('node -v') do echo    Node.js OK : %%v
)
echo.

echo [2/5] Verification du port 3306 (MySQL)
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo    MySQL semble ecouter sur le port 3306 :
    netstat -ano ^| findstr ":3306 " ^| findstr "LISTENING"
) else (
    echo    [ATTENTION] Rien n'ecoute sur le port 3306.
    echo    -- Ouvre le XAMPP Control Panel et clique "Start" sur la ligne MySQL.
)
echo.

echo [3/5] Recherche d'un processus mysqld fantome
tasklist /FI "IMAGENAME eq mysqld.exe" 2>nul | findstr mysqld.exe >nul
if %ERRORLEVEL% EQU 0 (
    echo    mysqld.exe est en cours d'execution :
    tasklist /FI "IMAGENAME eq mysqld.exe"
) else (
    echo    Aucun mysqld.exe actif.
)
echo.

echo [4/5] Recherche d'un conflit de port (autres services SQL)
sc query state= all ^| findstr /I /C:"MySQL" /C:"MariaDB" /C:"MSSQL" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    Aucun service MySQL/MariaDB/MSSQL detecte comme service Windows.
)
echo.

echo [5/5] Test de connexion MySQL (root sans mot de passe)
if exist "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 'OK' AS senegram_db_check;" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo    [OK] MySQL repond bien a la connexion.
    ) else (
        echo    [ERREUR] MySQL ne repond pas. Demarre-le d'abord dans XAMPP.
    )
) else (
    echo    C:\xampp\mysql\bin\mysql.exe introuvable.
    echo    Si tu as installe XAMPP ailleurs, ouvre ce script et change le chemin.
)
echo.

echo =======================================================
echo   Fini.
echo =======================================================
pause
