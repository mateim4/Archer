@echo off
echo Checking git status...
echo.
echo ====================================
echo Current Branch:
echo ====================================
git branch --show-current
echo.
echo ====================================
echo Recent Commits:
echo ====================================
git log --oneline -5
echo.
echo ====================================
echo Git Status:
echo ====================================
git status
echo.
pause
