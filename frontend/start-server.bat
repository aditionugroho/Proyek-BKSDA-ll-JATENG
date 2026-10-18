@echo off
title Server E-Office SKSDA
cd /d "%~dp0"
echo ================================================
echo  Server E-Office SKSDA
echo  Folder : %cd%
echo  Buka   : http://localhost:3000
echo  Hentikan: tutup jendela ini atau tekan Ctrl+C
echo ================================================
echo.
python -m http.server 3000 2>nul || py -m http.server 3000
pause
