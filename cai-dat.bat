@echo off
rem Cai dat Meta Ads Library skill tren Windows: bam dup file nay.
rem Toan bo logic nam trong tools\install\cai-dat.ps1 (PowerShell xu ly tieng Viet tot hon .bat).
chcp 65001 >nul
cd /d "%~dp0"
if not exist "%~dp0package.json" (
  echo.
  echo [LOI] Khong thay file package.json canh file nay.
  echo Ban dang chay ngay trong file ZIP. Hay bam chuot phai vao file ZIP, chon "Extract All" / "Giai nen tat ca",
  echo roi mo thu muc vua giai nen va bam dup lai cai-dat.bat.
  echo.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\install\cai-dat.ps1" %*
echo.
pause
