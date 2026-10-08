@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm install --no-audit --no-fund
)
start "" http://localhost:3000
echo TaskBoard запущен: http://localhost:3000  (чтобы остановить, закройте это окно)
node server.js
