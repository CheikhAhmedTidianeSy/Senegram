@echo off
chcp 65001 >nul
title Senegram - Fermeture pare-feu Windows
color 0E

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Lance en ADMINISTRATEUR.
    pause & exit /b 1
)

echo Suppression des regles pare-feu Senegram...
netsh advfirewall firewall delete rule name="Senegram Backend 5000"
netsh advfirewall firewall delete rule name="Senegram Frontend 5173"
echo Fini.
pause
