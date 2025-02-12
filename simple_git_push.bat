git add .
set /p "commit= enter commit message: "
git commit -m "%commit%"
git push origin main