# Firebase Setup voor Android

Voor push notifications op Android moet je een `google-services.json` bestand toevoegen.

## Stappen

1. Ga naar [Firebase Console](https://console.firebase.google.com/project/co-ouderschap-platform)
2. Klik op het tandwiel (Settings) → Project settings
3. Scroll naar "Your apps" sectie
4. Klik op "Add app" en selecteer Android
5. Vul de package name in: `com.coparenting.app`
6. (Optioneel) Geef een app nickname: "CoParenting Android"
7. Download het `google-services.json` bestand
8. Plaats het bestand in: `android/app/google-services.json`

## Verificatie

Na het plaatsen van het bestand, run:

```bash
npm run build
npx cap sync
```

Het bestand zou automatisch gedetecteerd moeten worden door de Android build.

## Let op

- Het `google-services.json` bestand bevat je Firebase configuratie
- Dit bestand staat in `.gitignore` en wordt NIET gecommit naar Git
- Elk teamlid moet zijn eigen bestand downloaden uit Firebase Console
