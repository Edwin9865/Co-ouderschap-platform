@echo off
setlocal

echo === CLEAN WEB BUILD ===
rmdir /s /q dist 2>nul
npm run build || exit /b 1

echo === SYNC TO ANDROID ===
npx cap sync android || exit /b 1

echo === GRADLE CLEAN APK ===
cd android || exit /b 1
call .\gradlew clean assembleDebug || exit /b 1

echo === APK READY ===
echo android\app\build\outputs\apk\debug\app-debug.apk
endlocal
pause
