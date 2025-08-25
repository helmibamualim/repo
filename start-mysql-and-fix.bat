@echo off
echo ========================================
echo   PERBAIKAN DATABASE POKER ONLINE
echo ========================================
echo.

echo 1. Mencari dan menjalankan Laragon...
echo.

REM Cari Laragon di lokasi umum
set LARAGON_PATH=""
if exist "C:\laragon\laragon.exe" set LARAGON_PATH="C:\laragon\laragon.exe"
if exist "C:\Program Files\Laragon\laragon.exe" set LARAGON_PATH="C:\Program Files\Laragon\laragon.exe"
if exist "D:\laragon\laragon.exe" set LARAGON_PATH="D:\laragon\laragon.exe"

if %LARAGON_PATH%=="" (
    echo LARAGON TIDAK DITEMUKAN!
    echo.
    echo Silakan:
    echo 1. Buka Laragon secara manual
    echo 2. Klik "Start All" atau start MySQL
    echo 3. Jalankan script: node fix-database-connection.js
    echo.
    pause
    exit /b 1
)

echo Laragon ditemukan di: %LARAGON_PATH%
start "" %LARAGON_PATH%

echo.
echo 2. Menunggu 5 detik untuk Laragon terbuka...
timeout /t 5 /nobreak >nul

echo.
echo 3. Menjalankan perbaikan database...
node fix-database-connection.js

echo.
echo 4. Menjalankan frontend server...
cd frontend
start cmd /k "npm run dev"

echo.
echo ========================================
echo   SELESAI!
echo ========================================
echo.
echo Jika berhasil:
echo - Frontend server akan terbuka di terminal baru
echo - Buka browser: http://localhost:3000/register
echo - Test registrasi
echo.
echo Jika gagal:
echo - Pastikan MySQL di Laragon sudah running (hijau)
echo - Jalankan: node fix-database-connection.js
echo.
pause
