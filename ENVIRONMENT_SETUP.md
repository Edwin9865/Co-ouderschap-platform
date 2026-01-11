# Environment Variables Setup Guide

Dit document beschrijft hoe je alle benodigde environment variabelen verkrijgt voor het Co-Ouderschap Platform.

## Overzicht

Het project gebruikt de volgende services:
- **Supabase**: Database, authenticatie en storage
- **Firebase**: Push notificaties (FCM)
- **Capacitor**: Native iOS en Android apps

## 1. Supabase Setup

### Stap 1: Project aanmaken
1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Klik op "New Project"
3. Vul projectnaam in: `co-ouderschap-platform`
4. Kies een database wachtwoord (bewaar dit veilig!)
5. Selecteer een regio (bij voorkeur West Europe voor NL)
6. Klik "Create Project"

### Stap 2: Environment variabelen ophalen
1. Ga naar Project Settings → API
2. Kopieer de volgende waardes:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Stap 3: Database migraties
De database schema is al gedefinieerd in `supabase/migrations/`. Deze worden automatisch toegepast als je de Supabase CLI gebruikt, of handmatig via de SQL editor in het Supabase dashboard.

```bash
# Als je Supabase CLI gebruikt
npx supabase db push
```

## 2. Firebase Setup (Push Notificaties)

### Stap 1: Firebase project aanmaken
1. Ga naar [Firebase Console](https://console.firebase.google.com)
2. Klik "Add Project" of "Create Project"
3. Projectnaam: `co-ouderschap-platform`
4. Google Analytics: optioneel (kan uitgeschakeld)
5. Klik "Create Project"

### Stap 2: Web app toevoegen
1. In Firebase Console, klik op het web icon (</>) om een web app toe te voegen
2. App nickname: `CoParenting Web`
3. Firebase Hosting: Nee (skip deze stap)
4. Klik "Register app"

### Stap 3: Firebase configuratie ophalen
Je krijgt nu een config object te zien. Kopieer de waardes:

```javascript
const firebaseConfig = {
  apiKey: "...",           // → VITE_FIREBASE_API_KEY
  authDomain: "...",       // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "...",        // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "...",    // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...", // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "..."             // → VITE_FIREBASE_APP_ID
};
```

### Stap 4: Cloud Messaging (FCM) activeren
1. Ga naar Project Settings → Cloud Messaging
2. Scroll naar "Web Push certificates"
3. Klik "Generate key pair"
4. Kopieer de VAPID key → `VITE_FIREBASE_VAPID_KEY`

### Stap 5: Service Account voor Supabase Edge Function
Voor het versturen van notificaties vanuit de backend heb je een service account key nodig:

1. Ga naar Project Settings → Service Accounts
2. Klik "Generate new private key"
3. Download het JSON bestand
4. In Supabase Dashboard → Project Settings → Edge Functions → Secrets
5. Voeg toe:
   - Key: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: De inhoud van het gedownloade JSON bestand

### Stap 6: Android App Setup (Optioneel)
Voor de Android app heb je een extra Firebase configuratie nodig:

1. Ga terug naar Firebase Console
2. In "Your apps", klik "Add app" en selecteer Android
3. Package name: `com.coparenting.app`
4. Download `google-services.json`
5. Plaats het bestand in: `android/app/google-services.json`

**Volledige Android build instructies:** Zie `/android/BUILD_INSTRUCTIONS.md`

## 3. .env Bestand Configureren

Kopieer `.env.example` naar `.env`:

```bash
cp .env.example .env
```

Vul alle variabelen in met de waardes die je hebt verkregen:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

## 4. Verificatie

Test of alles werkt:

```bash
# Start development server
npm run dev

# Open browser naar http://localhost:5173
# Probeer te registreren en in te loggen
```

### Checklist
- [ ] Supabase project aangemaakt
- [ ] Database migraties toegepast
- [ ] Firebase project aangemaakt
- [ ] FCM geconfigureerd met VAPID key
- [ ] Service account key toegevoegd aan Supabase Edge Functions
- [ ] .env bestand geconfigureerd
- [ ] App start zonder errors
- [ ] Registratie werkt
- [ ] Login werkt
- [ ] Push notificatie toestemming vraagt

## 5. Productie Deployment

Voor productie deployment:

1. **Vercel/Netlify/etc**: Voeg alle `VITE_*` variabelen toe aan je hosting platform
2. **Supabase**: Productie database is automatisch beschikbaar
3. **Firebase**: Gebruik dezelfde Firebase project of maak een aparte productie project
4. **Capacitor**: Voor mobile apps, build en sync naar native platforms

## Troubleshooting

### Supabase connectie errors
- Controleer of `VITE_SUPABASE_URL` correct is (moet eindigen op `.supabase.co`)
- Controleer of `VITE_SUPABASE_ANON_KEY` de juiste key is (heel lange string)

### Firebase notificaties werken niet
- Controleer of VAPID key correct is ingevuld
- Controleer of service worker (`/firebase-messaging-sw.js`) geladen wordt
- Kijk in browser console voor errors

### Database schema ontbreekt
- Run de migraties handmatig via Supabase SQL editor
- Of gebruik `npx supabase db push` met CLI

## Security Notes

⚠️ **BELANGRIJK**:
- Commit **NOOIT** je `.env` bestand naar Git
- De `.env` staat al in `.gitignore`
- Gebruik `.env.example` als template voor anderen
- Service account keys zijn **zeer gevoelig** - bewaar ze veilig!

## Support

Voor vragen of problemen, raadpleeg:
- [Supabase Documentation](https://supabase.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
