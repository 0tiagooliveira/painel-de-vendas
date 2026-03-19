@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

set "FIREBASE_PROJECT_ID=dashboard-mercado-livre-ionlab"
set "HOSTING_URL_1=https://%FIREBASE_PROJECT_ID%.web.app"
set "HOSTING_URL_2=https://%FIREBASE_PROJECT_ID%.firebaseapp.com"
set "GITHUB_REPO_URL=https://github.com/0tiagooliveira/dashboard-ionlab.git"
set "DEPLOY_ONLY=hosting"

if /I "%~1"=="full" (
  set "DEPLOY_ONLY=firestore,hosting"
)

if /I "%~2"=="full" (
  set "DEPLOY_ONLY=firestore,hosting"
)

where git >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Git nao encontrado no PATH.
  goto :fail
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] NPM nao encontrado no PATH.
  goto :fail
)

where npx >nul 2>nul
if errorlevel 1 (
  echo [ERRO] NPX nao encontrado no PATH.
  goto :fail
)

set "COMMIT_MSG=%~1"
if /I "%COMMIT_MSG%"=="full" (
  set "COMMIT_MSG=%~2"
)
if "%COMMIT_MSG%"=="" (
  set /p COMMIT_MSG=Mensagem do commit: 
)
if "%COMMIT_MSG%"=="" (
  set "COMMIT_MSG=deploy: atualizacao %date% %time%"
)

echo.
echo [1/5] Instalando dependencias (se necessario)...
call npm install
if errorlevel 1 (
  echo [ERRO] Falha no npm install.
  goto :fail
)

echo.
echo [2/5] Buildando projeto...
call npm run build
if errorlevel 1 (
  echo [ERRO] Falha no build.
  goto :fail
)

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo.
  echo [INFO] Repositorio Git nao encontrado. Inicializando...
  git init
  if errorlevel 1 (
    echo [ERRO] Falha ao inicializar Git.
    goto :fail
  )
)

git branch -M main >nul 2>nul

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo.
  echo [INFO] Configurando remote origin para %GITHUB_REPO_URL%
  git remote add origin "%GITHUB_REPO_URL%"
  if errorlevel 1 (
    echo [ERRO] Falha ao configurar remote origin.
    goto :fail
  )
) else (
  for /f "delims=" %%R in ('git remote get-url origin') do set "CURRENT_ORIGIN=%%R"
  if /I not "%CURRENT_ORIGIN%"=="%GITHUB_REPO_URL%" (
    echo.
    echo [INFO] Atualizando remote origin para %GITHUB_REPO_URL%
    git remote set-url origin "%GITHUB_REPO_URL%"
    if errorlevel 1 (
      echo [ERRO] Falha ao atualizar remote origin.
      goto :fail
    )
  )
)

if not exist "firebase.json" (
  echo.
  echo [INFO] firebase.json nao encontrado. Criando arquivo padrao...
  (
    echo {
    echo   "firestore": {
    echo     "rules": "firestore.rules"
    echo   },
    echo   "hosting": {
    echo     "public": "dist",
    echo     "ignore": [
    echo       "firebase.json",
    echo       "**/.*",
    echo       "**/node_modules/**"
    echo     ],
    echo     "rewrites": [
    echo       {
    echo         "source": "**",
    echo         "destination": "/index.html"
    echo       }
    echo     ]
    echo   }
    echo }
  ) > firebase.json
)

if not exist ".firebaserc" (
  echo.
  echo [INFO] .firebaserc nao encontrado. Criando arquivo padrao...
  (
    echo {
    echo   "projects": {
    echo     "default": "%FIREBASE_PROJECT_ID%"
    echo   }
    echo }
  ) > .firebaserc
)

echo.
echo [3/5] Enviando para GitHub...
git add -A

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%COMMIT_MSG%"
  if errorlevel 1 (
    echo [ERRO] Falha ao criar commit.
    goto :fail
  )
) else (
  echo [INFO] Nenhuma alteracao para commit.
)

git push -u origin main
if errorlevel 1 (
  echo [ERRO] Falha ao enviar para GitHub.
  echo [DICA] Verifique permissao no repositorio e autenticacao do GitHub.
  goto :fail
)

echo.
echo [4/5] Fazendo deploy no Firebase...
echo [INFO] Alvos de deploy: %DEPLOY_ONLY%
call npx firebase-tools deploy --only "%DEPLOY_ONLY%" --project "%FIREBASE_PROJECT_ID%"
if errorlevel 1 (
  echo [ERRO] Falha no deploy do Firebase.
  if /I "%DEPLOY_ONLY%"=="firestore,hosting" (
    echo [DICA] O modo full exige billing no projeto para Firestore.
    echo [DICA] Rode sem o parametro "full" para publicar apenas Hosting.
  )
  goto :fail
)

echo.
echo [5/5] Deploy concluido com sucesso!
echo.
echo Links de acesso (Hosting):
echo - !HOSTING_URL_1!
echo - !HOSTING_URL_2!
echo.
pause
exit /b 0

:fail
echo.
echo [FALHOU] O deploy foi interrompido. Veja a mensagem acima.
echo.
pause
exit /b 1