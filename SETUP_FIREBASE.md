# Firebase Cloud Messaging Setup

## Stap 1: Firebase Project Aanmaken

1. Ga naar https://console.firebase.google.com/
2. Klik op "Add project" (Project toevoegen)
3. Geef je project een naam (bijvoorbeeld: "co-oudering-app")
4. Google Analytics is optioneel, je kunt dit uitschakelen
5. Klik op "Create project"

## Stap 2: Web App Toevoegen

1. Klik in je Firebase project op het web icoon (</>) om een web app toe te voegen
2. Geef je app een naam (bijvoorbeeld: "Co-oudering Web App")
3. Firebase Hosting hoef je niet in te schakelen
4. Klik op "Register app"
5. Je ziet nu je Firebase configuratie

## Stap 3: Firebase Configuratie Kopiëren

Kopieer de waarden uit je Firebase config en update deze in:

### `.env` bestand:
```
VITE_FIREBASE_API_KEY=jouw_api_key
VITE_FIREBASE_AUTH_DOMAIN=jouw_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jouw_project_id
VITE_FIREBASE_STORAGE_BUCKET=jouw_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=jouw_sender_id
VITE_FIREBASE_APP_ID=jouw_app_id
```

### `public/firebase-messaging-sw.js` bestand:
Vervang de waarden in regel 4-9 met jouw Firebase configuratie:
```javascript
firebase.initializeApp({
  apiKey: "jouw_api_key",
  authDomain: "jouw_project_id.firebaseapp.com",
  projectId: "jouw_project_id",
  storageBucket: "jouw_project_id.appspot.com",
  messagingSenderId: "jouw_sender_id",
  appId: "jouw_app_id"
});
```

## Stap 4: Cloud Messaging Activeren

1. Ga in Firebase Console naar "Build" → "Cloud Messaging"
2. Klik op "Get started" als je dit nog niet gedaan hebt
3. Ga naar "Cloud Messaging API (Legacy)"
4. **BELANGRIJK**: Klik op "Enable API" om de Legacy API te activeren (deze is nodig voor server-side messaging)

## Stap 5: VAPID Key Genereren

1. Ga naar "Project Settings" (tandwiel icoon rechtsboven)
2. Ga naar het "Cloud Messaging" tabblad
3. Scroll naar beneden naar "Web configuration"
4. Bij "Web Push certificates" klik je op "Generate key pair"
5. Kopieer de gegenereerde VAPID key
6. Voeg deze toe aan je `.env`:
```
VITE_FIREBASE_VAPID_KEY=jouw_vapid_key
```

## Stap 6: Server Key voor Edge Function

1. Ga naar "Project Settings" → "Cloud Messaging"
2. Kopieer de "Server key" (onder "Cloud Messaging API (Legacy)")
3. Deze moet je toevoegen aan Supabase als secret:
   - Ga naar je Supabase project dashboard
   - Ga naar "Settings" → "Edge Functions"
   - Voeg een nieuwe secret toe:
     - Key: `FCM_SERVER_KEY`
     - Value: jouw_server_key

## Stap 7: Supabase Configuratie

Je moet ook twee settings toevoegen aan je Supabase database configuratie:

Ga naar je Supabase SQL Editor en voer uit:
```sql
ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'jouw_supabase_url';
ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'jouw_service_role_key';
```

Deze waarden vind je in je Supabase project settings.

## Stap 8: Testen

1. Herstart je development server (`npm run dev`)
2. Log in op je co-oudering app
3. Ga naar Instellingen
4. Schakel "Push meldingen" in
5. Je browser vraagt om toestemming - accepteer dit
6. Test door een verzoek, event of logboek item aan te maken vanuit een andere browser/account

## Troubleshooting

### "Firebase: Error (messaging/token-subscribe-failed)"
- Controleer of de VAPID key correct is ingevuld
- Controleer of Cloud Messaging API is geactiveerd in Firebase Console

### "Failed to register service worker"
- Controleer of `firebase-messaging-sw.js` correct is geconfigureerd
- Controleer browser console voor specifieke errors

### "Notifications niet ontvangen"
- Controleer of browser notificaties zijn toegestaan
- Controleer of FCM_SERVER_KEY correct is ingesteld in Supabase
- Check de browser console en Supabase Edge Function logs voor errors

### "Service worker update"
Als je wijzigingen maakt aan de service worker:
1. Open DevTools (F12)
2. Ga naar "Application" tab
3. Ga naar "Service Workers"
4. Klik op "Unregister" bij de bestaande worker
5. Herlaad de pagina
