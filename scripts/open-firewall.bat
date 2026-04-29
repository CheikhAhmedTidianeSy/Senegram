@echo off
chcp 65001 >nul
title Senegram - Ouverture pare-feu Windows (ports 5000 + 5173)
color 0E

REM Ce script DOIT etre execute en Administrateur.
REM Il ouvre les ports 5000 (backend) et 5173 (frontend) pour que les
REM autres machines du meme reseau local puissent acceder a Senegram.

echo =======================================================
echo   Senegram - Ouverture du pare-feu Windows
echo =======================================================
echo.

REM Verif droits admin
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Ce script doit etre lance en ADMINISTRATEUR.
    echo          Clic droit sur le .bat -^> "Executer en tant qu'administrateur".
    pause
    exit /b 1
)

echo Ouverture du port 5000 (backend Node)...
netsh advfirewall firewall delete rule name="Senegram Backend 5000" >nul 2>&1
netsh advfirewall firewall add rule name="Senegram Backend 5000" dir=in action=allow protocol=TCP localport=5000 profile=private,domain
if %ERRORLEVEL% NEQ 0 echo [ERREUR] Port 5000 : ajout echoue.

echo Ouverture du port 5173 (frontend Vite)...
netsh advfirewall firewall delete rule name="Senegram Frontend 5173" >nul 2>&1
netsh advfirewall firewall add rule name="Senegram Frontend 5173" dir=in action=allow protocol=TCP localport=5173 profile=private,domain
if %ERRORLEVEL% NEQ 0 echo [ERREUR] Port 5173 : ajout echoue.

echo.
echo Regles actives :
netsh advfirewall firewall show rule name="Senegram Backend 5000" | findstr /I "Regle Rule LocalPort"
netsh advfirewall firewall show rule name="Senegram Frontend 5173" | findstr /I "Regle Rule LocalPort"

echo.
echo =======================================================
echo   Trouve l'IP de ce PC :
echo =======================================================
ipconfig | findstr /I "IPv4"
echo.
echo Depuis l'autre machine du meme reseau local, ouvre :
echo    http://<cette-ip>:5173
echo =======================================================
pause
