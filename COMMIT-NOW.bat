@echo off
cls
echo.
echo ============================================================
echo   COMMITTING YOUR VIEW LAYOUT CHANGES
echo ============================================================
echo.
echo This will commit all your changes so you can merge safely.
echo.
pause

echo.
echo [1/2] Adding all files...
git add .

echo.
echo [2/2] Creating commit...
git commit -m "feat: Complete view layout standardization (23 views)"

echo.
echo ============================================================
echo   SUCCESS! Your changes are now committed.
echo ============================================================
echo.
echo You can now run your merge command:
echo   git merge [your-branch-name]
echo.
echo Press any key to close this window...
pause >nul
