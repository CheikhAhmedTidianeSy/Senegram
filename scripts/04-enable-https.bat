@echo off
chcp 65001 >nul
title Senegram - Activation HTTPS (WebRTC mobile)
color 0E

set "ROOT=%~dp0.."
pushd "%ROOT%"

echo =======================================================
echo   SENEGRAM - Activation HTTPS auto-signe
echo =======================================================
echo.
echo Pourquoi ce script ?
echo   Les navigateurs Android/iOS bloquent l'acces camera/micro
echo   (WebRTC) tant que la page n'est pas en HTTPS.
echo   On genere un certificat auto-signe pour le LAN et on
echo   active HTTPS cote backend + frontend.
echo.
echo Apres execution :
echo   - backend\certs\cert.pem et key.pem sont crees
echo   - 03-run.bat detectera le certificat et lancera
echo     automatiquement backend + frontend en HTTPS.
echo.
pause

REM -------- Verifier que 02-setup a deja tourne --------
if not exist "backend\node_modules" (
    echo.
    echo [ERREUR] backend\node_modules introuvable.
    echo          Lance d'abord 02-setup.bat
    popd & pause & exit /b 1
)
if not exist "frontend\node_modules" (
    echo.
    echo [ERREUR] frontend\node_modules introuvable.
    echo          Lance d'abord 02-setup.bat
    popd & pause & exit /b 1
)

echo.
echo --- 1/3 : Installation des dependances HTTPS (backend + frontend) ---
echo.

pushd backend
call npm install --silent
if errorlevel 1 (
    echo [ERREUR] npm install backend a echoue.
    popd & popd & pause & exit /b 1
)
popd

pushd frontend
call npm install --silent
if errorlevel 1 (
    echo [ERREUR] npm install frontend a echoue.
    popd & popd & pause & exit /b 1
)
popd

echo.
echo --- 2/3 : Generation du certificat auto-signe ---
echo.

pushd backend
call npm run gen-cert
if errorlevel 1 (
    echo [ERREUR] Generation du certificat echouee.
    popd & popd & pause & exit /b 1
)
popd

echo.
echo --- 3/3 : Verification ---
echo.

if not exist "backend\certs\cert.pem" (
    echo [ERREUR] backend\certs\cert.pem introuvable apres generation.
    popd & pause & exit /b 1
)
if not exist "backend\certs\key.pem" (
    echo [ERREUR] backend\certs\key.pem introuvable apres generation.
    popd & pause & exit /b 1
)

echo OK : certs generes dans backend\certs\
echo.
echo =======================================================
echo   HTTPS est pret !
echo =======================================================
echo.
echo Etapes suivantes :
echo.
echo   1. Ferme les fenetres backend/frontend actuelles (Ctrl+C).
echo   2. Relance 03-run.bat : il detectera le certificat et
echo      basculera automatiquement en HTTPS.
echo   3. Sur le PC serveur, ouvre d'abord :
echo         https://localhost:5000/
echo      Ton navigateur va afficher "Connexion non privee"
echo      -> Parametres avances -> Continuer quand meme.
echo      Fais la meme chose avec :
echo         https://localhost:5173/
echo.
echo   4. Sur ton telephone Android (meme wifi) :
echo         a) https://IP_DU_PC:5000/   -> accepter le certificat
echo         b) https://IP_DU_PC:5173/   -> accepter le certificat
echo      (On doit accepter les DEUX car backend et frontend
echo       ont chacun leur propre certificat auto-signe.)
echo.
echo   5. Connecte-toi, lance un appel : cette fois la camera
echo      et le micro seront autorises.
echo.
popd
pause
exit /b 0
