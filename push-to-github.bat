@echo off
echo Instructions to push FRA Atlas translation branch to GitHub:
echo.
echo 1. First create a new repository on GitHub.com named "fra-atlas"
echo 2. Replace YOUR_USERNAME with your actual GitHub username in the commands below
echo 3. Run these commands:
echo.
echo git remote set-url origin https://github.com/YOUR_USERNAME/fra-atlas.git
echo git push -u origin translation
echo.
echo Current branch status:
git branch
echo.
echo Files ready to push:
git status --short
pause