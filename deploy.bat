@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "TARGET_REPO=https://github.com/0tiagooliveira/painel-de-vendas.git"
set "PROJECT_ID=painel-de-vendas-c032e"
set "DEPLOY_ONLY=hosting"
set "HOSTING_URL=https://%PROJECT_ID%.web.app"
set "HOSTING_URL_ALT=https://%PROJECT_ID%.firebaseapp.com"

if /I "%~1"=="full" set "DEPLOY_ONLY=hosting,firestore"
if /I "%~1"=="--full" set "DEPLOY_ONLY=hosting,firestore"

if /I "%~1"=="help" goto :show_help
if /I "%~1"=="--help" goto :show_help
if /I "%~1"=="-h" goto :show_help

echo ==========================================
echo    Deploy automatico - Painel de Vendas
echo ==========================================
echo.

call :check_prereq git "Git"
call :check_prereq npm "Node.js/NPM"
call :check_prereq npx "Node.js/NPX"

call npx firebase --version >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Firebase CLI nao encontrado via NPX.
  echo [INFO] Instale com: npm install -g firebase-tools
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [INFO] Inicializando repositorio Git...
  git init || exit /b 1
)

set "CURRENT_ORIGIN="
for /f "delims=" %%i in ('git remote get-url origin 2^>nul') do set "CURRENT_ORIGIN=%%i"
if defined CURRENT_ORIGIN (
  if /I not "!CURRENT_ORIGIN!"=="%TARGET_REPO%" (
    echo [INFO] Atualizando remote origin...
    git remote set-url origin %TARGET_REPO% || exit /b 1
  )
) else (
  echo [INFO] Adicionando remote origin...
  git remote add origin %TARGET_REPO% || exit /b 1
)

echo [INFO] Instalando dependencias...
call npm install || exit /b 1

echo [INFO] Gerando build...
call npm run build || exit /b 1

echo [INFO] Preparando commit...
git add -A
git diff --cached --quiet
if errorlevel 1 (
  set "SUMMARY="
  set /a COUNT=0
  set /a EXTRA=0

  for /f "tokens=1,*" %%A in ('git diff --cached --name-status') do (
    set "STATUS=%%A"
    set "FILE=%%B"
    set "ACTION=atualiza"

    if /I "!STATUS!"=="A" set "ACTION=adiciona"
    if /I "!STATUS!"=="M" set "ACTION=atualiza"
    if /I "!STATUS!"=="D" set "ACTION=remove"
    if /I "!STATUS!"=="R" set "ACTION=renomeia"

    if !COUNT! lss 4 (
      if defined SUMMARY (
        set "SUMMARY=!SUMMARY!; !ACTION! !FILE!"
      ) else (
        set "SUMMARY=!ACTION! !FILE!"
      )
      set /a COUNT+=1
    ) else (
      set /a EXTRA+=1
    )
  )

  if !EXTRA! gtr 0 set "SUMMARY=!SUMMARY!; e mais !EXTRA! arquivo(s)"

  if not defined SUMMARY set "SUMMARY=atualizacao automatica"

  git commit -m "Deploy automatico: !SUMMARY!" || exit /b 1
  echo [OK] Commit criado automaticamente.
) else (
  echo [AVISO] Nenhuma alteracao para commit.
)

set "BRANCH=main"
for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%i"

echo [INFO] Enviando para o GitHub (branch !BRANCH!)...
git push -u origin !BRANCH!
if errorlevel 1 (
  echo [AVISO] Push falhou. Continuando para deploy no Firebase.
)

set "DEPLOY_LOG=%TEMP%\firebase_deploy_%RANDOM%.log"
echo [INFO] Publicando no Firebase (^!scope: %DEPLOY_ONLY%^)...
call npx firebase deploy --only %DEPLOY_ONLY% --project %PROJECT_ID% > "%DEPLOY_LOG%" 2>&1
if errorlevel 1 (
  type "%DEPLOY_LOG%"
  del "%DEPLOY_LOG%" >nul 2>&1
  echo [ERRO] Falha no deploy do Firebase.
  call :print_links
  call :wait_to_close
  exit /b 1
)

type "%DEPLOY_LOG%"

set "HOSTING_URL_DETECTED="

for /f "tokens=1,* delims=:" %%A in ('findstr /I /C:"Hosting URL" "%DEPLOY_LOG%"') do (
  set "HOSTING_URL_DETECTED=%%B"
)

if defined HOSTING_URL_DETECTED (
  for /f "tokens=* delims= " %%i in ("!HOSTING_URL_DETECTED!") do set "HOSTING_URL_DETECTED=%%i"
)

del "%DEPLOY_LOG%" >nul 2>&1

echo [OK] Deploy concluido com sucesso!
call :print_links
call :wait_to_close
exit /b 0

:print_links
echo.
echo ==========================================
echo  Link principal: %HOSTING_URL%
echo  Link alternativo: %HOSTING_URL_ALT%
if defined HOSTING_URL_DETECTED echo  Link detectado no deploy: !HOSTING_URL_DETECTED!
echo ==========================================
echo.
exit /b 0

:wait_to_close
echo Pressione qualquer tecla para fechar...
pause >nul
exit /b 0

:check_prereq
where %~1 >nul 2>&1
if errorlevel 1 (
  echo [ERRO] %~2 nao encontrado no PATH.
  exit /b 1
)
exit /b 0

:show_help
echo Uso:
echo   deploy.bat            ^(deploy hosting^)
echo   deploy.bat full       ^(deploy hosting + firestore^)
echo.
echo O script faz automaticamente:
echo - npm install
echo - npm run build
echo - commit em PT-BR com resumo do que mudou
echo - git push
echo - firebase deploy
exit /b 0