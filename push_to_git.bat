@echo off
echo Updating git remote to incuXai_Test...
git remote set-url origin https://github.com/majjihemanthkumar/incuXai_Test.git

echo Adding files to git...
git add .

echo Committing changes...
git commit -m "Initialize INCUXAI Secure Live Exam Platform - Frontend, Backend, and Core Logic"

echo Pushing to remote...
git push -u origin main

echo Done! The project has been pushed to the new repository.
pause
