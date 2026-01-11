# Android App Build Instructies

Deze handleiding beschrijft hoe je de CoParenting Android app bouwt en test.

## Vereisten

### Software
- **Android Studio** (versie 2023.3.1 of nieuwer)
- **Java Development Kit (JDK)** 11 of hoger
- **Android SDK** (API 22 of hoger, aanbevolen: API 34)
- **Node.js** en npm (voor web build)

### Firebase Setup
- Google Services JSON bestand (zie `/android/FIREBASE_SETUP.md`)

## Eerste Keer Setup

### 1. Installeer Android Studio
Download van [developer.android.com](https://developer.android.com/studio)

### 2. Installeer Android SDK
Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
- Installeer minimaal API 22 (Lollipop)
- Aanbevolen: API 34 (Android 14)

### 3. Download Firebase Config
Volg de instructies in `/android/FIREBASE_SETUP.md` om `google-services.json` te verkrijgen.

### 4. Build Web Assets
```bash
npm install
npm run build
```

### 5. Sync naar Android
```bash
npx cap sync android
```

## Android App Openen

### Via Command Line
```bash
npx cap open android
```

Dit opent het project in Android Studio.

### Handmatig
Open Android Studio → Open → Selecteer de `/android` folder

## Bouwen en Runnen

### Optie 1: Via Android Studio (Aanbevolen)

1. Open het project in Android Studio
2. Wacht tot Gradle sync klaar is (kan een paar minuten duren bij eerste keer)
3. Selecteer een device of emulator in de toolbar
4. Klik op de groene "Run" knop (▶️) of gebruik Shift+F10

### Optie 2: Via Command Line

**Debug build:**
```bash
cd android
./gradlew assembleDebug
```

De APK wordt aangemaakt in:
`android/app/build/outputs/apk/debug/app-debug.apk`

**Release build (unsigned):**
```bash
cd android
./gradlew assembleRelease
```

## Emulator Setup

### Via Android Studio
1. Tools → Device Manager
2. Create Device
3. Selecteer een device (bijv. Pixel 6)
4. Download een System Image (aanbevolen: API 34)
5. Finish en start de emulator

### Via Command Line
```bash
# Lijst beschikbare emulators
emulator -list-avds

# Start een emulator
emulator -avd <naam>
```

## Fysiek Device Setup

### Aansluiten
1. Enable Developer Options op je Android telefoon:
   - Settings → About Phone → Tap "Build Number" 7x
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Sluit telefoon aan via USB
4. Accepteer "Allow USB Debugging" popup op telefoon

### Verificatie
```bash
# Check of device gedetecteerd wordt
adb devices
```

## Debugging

### Logcat in Android Studio
View → Tool Windows → Logcat

Filter op "coparenting" om alleen relevante logs te zien.

### Chrome DevTools
1. Run de app op device/emulator
2. Open Chrome → chrome://inspect
3. Klik "Inspect" naast je app
4. Je hebt nu toegang tot Console, Network, etc.

### Via Command Line
```bash
# Live logs
adb logcat | grep -i coparenting

# Clear logs
adb logcat -c
```

## Common Issues

### Gradle Sync Failures
- Check internet connectie
- Invalidate Caches: File → Invalidate Caches / Restart
- Delete `.gradle` folder en sync opnieuw

### google-services.json Missing
Download van Firebase Console (zie FIREBASE_SETUP.md)

### Device Not Detected
```bash
# Restart adb server
adb kill-server
adb start-server
adb devices
```

### Build Errors
```bash
# Clean build
cd android
./gradlew clean
./gradlew build
```

## Workflow bij Wijzigingen

Bij elke wijziging in de web code:

```bash
# 1. Build web assets
npm run build

# 2. Sync naar Android
npx cap sync android

# 3. De app wordt automatisch ge-reload in Android Studio
```

**TIP:** Als je alleen web code wijzigt (geen Capacitor plugins), kan je soms hotreload gebruiken door de app via `npm run dev` te runnen en de dev URL te gebruiken. Dit is sneller maar niet alle features werken (zoals native push notifications).

## App Signing voor Release

Voor Play Store uploads heb je een signing key nodig.

### Generate Keystore
```bash
keytool -genkey -v -keystore coparenting-release.keystore \
  -alias coparenting -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing
1. Plaats keystore in `android/app/`
2. Maak `android/keystore.properties`:
```properties
storeFile=coparenting-release.keystore
storePassword=<your-store-password>
keyAlias=coparenting
keyPassword=<your-key-password>
```

3. Update `android/app/build.gradle` om signing te gebruiken

**BELANGRIJK:** Voeg `keystore.properties` toe aan `.gitignore`!

## App Bundle voor Play Store

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Upload dit bestand naar Google Play Console.

## Nuttige Commands

```bash
# Installeer debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Uninstall app
adb uninstall com.coparenting.app

# Clear app data
adb shell pm clear com.coparenting.app

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

## Support

Voor problemen:
1. Check Android Studio Build tab voor errors
2. Check Logcat voor runtime errors
3. Zie Capacitor docs: https://capacitorjs.com/docs/android
4. Zie Firebase docs: https://firebase.google.com/docs/android/setup
