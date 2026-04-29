@echo off
chcp 65001 >nul
title Senegram - Re-import du schema MySQL
color 0E

set "ROOT=%~dp0.."

echo Ce script supprime la base "senegram" et la recree a neuf.
echo Toutes les donnees existantes seront perdues.
echo.
set /p CONFIRM="Continuer ? (o/N) : "
if /I not "%CONFIRM%"=="o" (
    echo Annule.
    pause
    exit /b 0
)

if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo [ERREUR] MySQL XAMPP introuvable a C:\xampp\mysql\bin\mysql.exe
    pause & exit /b 1
)

"C:\xampp\mysql\bin\mysql.exe" -u root < "%ROOT%\backend\database\schema.sql"
if %ERRORLEVEL% EQU 0 (
    echo Import OK. Base "senegram" recreee.
) else (
    echo [ERREUR] Import echoue.
)
pause
