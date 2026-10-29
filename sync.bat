@echo off
cd /d C:\Users\Yassine\PlusUltraApp
git add .
set /p commit_msg="Message du commit: "
git commit -m "%commit_msg%"
git push origin main
pause