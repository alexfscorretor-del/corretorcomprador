@echo off
setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0"

set LOG=setup-log.txt
> "%LOG%" echo ==============================
>> "%LOG%" echo Corretor Pro setup log
>> "%LOG%" echo ==============================

call :log "Iniciando setup..."

if not exist package.json (
  call :log "ERRO: package.json nao encontrado."
  call :log "Coloque este .bat na raiz do projeto."
  goto :end
)
call :log "package.json encontrado."

if exist .env.local (
  call :log ".env.local encontrado."
) else (
  call :log "AVISO: .env.local nao encontrado."
  call :log "Criando .env.local de exemplo..."
  > .env.local echo NEXT_PUBLIC_SUPABASE_URL=
  >> .env.local echo NEXT_PUBLIC_SUPABASE_ANON_KEY=
)

set HAS_COMPOSE=0
if exist docker-compose.yml set HAS_COMPOSE=1
if exist compose.yml set HAS_COMPOSE=1
if exist docker-compose.yaml set HAS_COMPOSE=1
if exist compose.yaml set HAS_COMPOSE=1

if "%HAS_COMPOSE%"=="1" (
  call :log "Arquivo compose encontrado. Subindo Docker..."
  docker compose up -d >> "%LOG%" 2>&1
  if errorlevel 1 (
    call :log "ERRO: falha ao subir Docker."
  ) else (
    call :log "Docker iniciado com sucesso."
  )
) else (
  call :log "Nenhum compose encontrado."
  call :log "Pulando SQL local. O projeto nao tem banco local configurado aqui."
)

if not exist node_modules (
  call :log "Instalando dependencias..."
  call npm install >> "%LOG%" 2>&1
  if errorlevel 1 (
    call :log "ERRO: npm install falhou. Veja setup-log.txt."
    goto :end
  )
) else (
  call :log "node_modules ja existe."
)

call :log "Iniciando Next.js..."
start "Corretor Pro" cmd /k "npm run dev"
timeout /t 8 /nobreak >nul
start "" http://localhost:3000
call :log "Browser aberto em http://localhost:3000"

goto :end

:log
 echo %~1
 >> "%LOG%" echo %~1
 exit /b 0

:end
popd
pause
