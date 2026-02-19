@echo off
REM CoParenting Android Rebuild Script
REM This script rebuilds the Android app with FCM changes

echo ========================================
echo CoParenting Android Rebuild Script
echo ========================================
echo.

echo [1/4] Building web assets...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Syncing Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Cleaning Android build...
cd android
call gradlew clean
if %errorlevel% neq 0 (
    echo WARNING: Gradle clean had issues, continuing...
)

echo.
echo [4/4] Building debug APK...
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ERROR: Android build failed!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo APK location: android/app/build/outputs/apk/debug/app-debug.apk
echo.
echo Next steps:
echo 1. Install APK on your device
echo 2. Check logcat: adb logcat -s FirebaseMessaging
echo 3. Send test notification from Firebase Console
echo.
pause
