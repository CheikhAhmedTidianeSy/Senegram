@echo off
chcp 65001 >nul
title Senegram - Nettoyage processus MySQL
color 0E

echo Ce script tue tous les mysqld.exe fantomes (utile quand XAMPP refuse
echo de demarrer MySQL avec "MySQL shutdown unexpectedly").
echo.
pause

tasklist /FI "IMAGENAME eq mysqld.exe" 2>nul | findstr mysqld.exe >nul
if %ERRORLEVEL% EQU 0 (
    echo Processus mysqld.exe detectes :
    tasklist /FI "IMAGENAME eq mysqld.exe"
    echo.
    taskkill /F /IM mysqld.exe
    echo.
    echo Nettoyage termine. Relance MySQL dans le XAMPP Control Panel.
) else (
    echo Aucun mysqld.exe en cours. Rien a nettoyer.
)
echo.
pause
