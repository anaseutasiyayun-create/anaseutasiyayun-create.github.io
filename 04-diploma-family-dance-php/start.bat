@echo off
cd /d "%~dp0"

set "PHP="
for /f "delims=" %%i in ('where php 2^>nul') do if not defined PHP set "PHP=%%i"
if not defined PHP if exist "%LOCALAPPDATA%\Microsoft\WinGet\Links\php.exe" set "PHP=%LOCALAPPDATA%\Microsoft\WinGet\Links\php.exe"
if not defined PHP for /d %%d in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP*") do if not defined PHP if exist "%%d\php.exe" set "PHP=%%d\php.exe"
if not defined PHP if exist "C:\xampp\php\php.exe" set "PHP=C:\xampp\php\php.exe"
if not defined PHP (
  echo Не найден PHP. Установите его командой: winget install PHP.PHP.8.3
  pause & exit /b 1
)

set "MYSQL="
for /f "delims=" %%i in ('where mysql 2^>nul') do if not defined MYSQL set "MYSQL=%%i"
if not defined MYSQL for /d %%d in ("C:\Program Files\MariaDB*") do if not defined MYSQL if exist "%%d\bin\mysql.exe" set "MYSQL=%%d\bin\mysql.exe"
if not defined MYSQL if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL=C:\xampp\mysql\bin\mysql.exe"
if not defined MYSQL (
  echo Не найден MySQL/MariaDB. Установите: winget install MariaDB.Server
  pause & exit /b 1
)

for %%m in ("%MYSQL%") do set "DBBIN=%%~dpm"
tasklist /FI "IMAGENAME eq mysqld.exe" | find /I "mysqld.exe" >nul || tasklist /FI "IMAGENAME eq mariadbd.exe" | find /I "mariadbd.exe" >nul || (
  if exist "%USERPROFILE%\mariadb-data\my.ini" (
    echo Запускаю MariaDB...
    start "MariaDB" /min "%DBBIN%mysqld.exe" --defaults-file="%USERPROFILE%\mariadb-data\my.ini" --console
  ) else if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo Запускаю MySQL из XAMPP...
    start "MySQL" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
  )
  timeout /t 5 /nobreak >nul
)

"%MYSQL%" -u root -e "USE family_dance" 2>nul
if errorlevel 1 (
  echo Создаю базу данных family_dance...
  "%MYSQL%" -u root --default-character-set=utf8mb4 < schema.sql || (
    echo Не удалось подключиться к базе. Проверьте, что сервер MariaDB/MySQL запущен,
    echo а логин и пароль совпадают с includes\config.php
    pause & exit /b 1
  )
)

start "" http://localhost:8000
echo.
echo Сайт:     http://localhost:8000
echo Админка:  http://localhost:8000/admin/   (admin / admin123)
echo Чтобы остановить сайт, закройте это окно.
echo.
"%PHP%" -S localhost:8000
