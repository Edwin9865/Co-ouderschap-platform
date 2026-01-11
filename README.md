# Co-Ouderschap Platform

Een volledige full-stack webapplicatie voor co-ouderschap en parallel parenting. Dit platform dient als objectief dossier-, communicatie- en bewijsplatform voor gescheiden ouders en betrokken hulpverleners.

## Kenmerken

- Objectieve registratie van alle communicatie en gebeurtenissen
- Soft delete met volledige audit trail
- Role-based access (Ouders en Hulpverleners)
- Subscription-based features (FREE, PLUS, PRO)
- Responsive web interface (desktop + mobiel)
- Export naar PDF voor dossierbeheer

## Tech Stack

### Frontend
- React 18 met TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- Lucide React (icons)

### Backend & Database
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security voor data isolatie
- Edge Functions voor server-side logica

### Authenticatie
- Supabase Auth (email + password)
- Role-based authorization
- Session management

### Native Apps
- Capacitor voor iOS en Android
- Single codebase voor web en mobile
- Native device capabilities

## Project Structuur

```
/src
  /lib
    supabase.ts       - Supabase client configuratie
    types.ts          - TypeScript type definities
  /contexts
    AuthContext.tsx   - Authentication state management
    FamilyContext.tsx - Family/subscription state
  /components
    Layout.tsx        - Hoofdlayout met navigatie
    ProtectedRoute.tsx - Route beveiliging
  /pages
    Login.tsx         - Inlogpagina
    Register.tsx      - Registratiepagina
    Families.tsx      - Gezinnenbeheer
    Dashboard.tsx     - Hoofddashboard
    Children.tsx      - Kinderenbeheer
    Agenda.tsx        - Agenda/planning
    Logboek.tsx       - Logboek met soft delete
    Verzoeken.tsx     - Gestructureerde communicatie
    Hulpverleners.tsx - Hulpverlenerbeheer
    Vragen.tsx        - Q&A systeem
    Export.tsx        - PDF export functionaliteit
    Instellingen.tsx  - Account en abonnement
```

## Database Schema

Het platform gebruikt 15 tabellen:

**Core**
- `users` - Gebruikersprofielen
- `families` - Gezinnen
- `family_members` - Koppeling users <> families met rollen
- `children` - Kinderen binnen gezinnen

**Subscription**
- `subscriptions` - Abonnementen per gezin

**Content**
- `events` - Agenda items
- `log_entries` - Logboek met soft delete
- `log_entry_revisions` - Bewerkingsgeschiedenis
- `requests` - Gestructureerde verzoeken
- `request_messages` - Berichten in verzoeken
- `questions` - Vragen van hulpverleners
- `answers` - Antwoorden van ouders

**System**
- `attachments` - Bestandsbijlagen
- `audit_logs` - Volledige audit trail
- `share_links` - Tijdelijke share links

## Setup Instructies

### 1. Vereisten

- Node.js 18+ en npm
- Supabase account
- Git

### 2. Installatie

```bash
# Clone repository
git clone <repository-url>
cd project

# Installeer dependencies
npm install
```

### 3. Environment Variables

Kopieer `.env.example` naar `.env` en vul alle variabelen in:

```bash
cp .env.example .env
```

Voor een complete uitleg over het verkrijgen van alle credentials, zie **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)**.

Het `.env` bestand moet de volgende variabelen bevatten:
- Supabase URL en anon key
- Firebase configuratie voor push notificaties
- Optioneel: Stripe keys voor betalingen (toekomstige feature)

### 4. Database Setup

De database schema en RLS policies zijn al geconfigureerd via de migrations:
- `create_coparenting_schema` - Alle tabellen en indexen
- `create_rls_policies` - Volledige Row Level Security

### 5. Seed Data

Voor test data, zie `SEED_DATA.md` voor gedetailleerde instructies.

Snelle start:
1. Registreer 3 test accounts via de applicatie
2. Voer het seed data SQL script uit (zie SEED_DATA.md)
3. Log in met een van de test accounts

### 6. Development Server

```bash
npm run dev
```

De applicatie draait op `http://localhost:5173`

### 7. Production Build

```bash
npm run build
```

## Gebruikersrollen

### PARENT (Ouder)
- Volledige CRUD binnen eigen gezin
- Kinderen beheren
- Agenda en logboek bijhouden
- Verzoeken aanmaken en beantwoorden
- Hulpverleners koppelen (PLUS/PRO)
- Exports maken (PLUS/PRO)

### HELPER (Hulpverlener)
- Read-only toegang tot gekoppelde gezinnen
- Vragen stellen aan ouders
- Geen data wijzigen of verwijderen

## Abonnementen

### FREE
- Max 1 kind
- Historie laatste 30 dagen
- Geen export
- Geen hulpverleners

### PLUS (€9,95/maand)
- Onbeperkt kinderen
- Volledige historie
- PDF export
- 1 hulpverlener

### PRO (€14,95/maand)
- Alles van PLUS
- Onbeperkt hulpverleners
- Uitgebreide exports
- Premium support

## Security & Privacy

### Data Beveiliging
- Row Level Security op alle tabellen
- Family-scoped data toegang
- Geen cross-family data lekkage
- Audit logging van alle acties

### Soft Delete
- Geen permanente verwijdering van data
- Soft delete met timestamp
- Volledige bewerkingsgeschiedenis
- Exporteerbare audit trail

### Communicatie
- Alle communicatie permanent opgeslagen
- Geen hard deletes mogelijk
- Bewerken creëert nieuwe revisie
- Geschikt als juridisch bewijs

## API Endpoints (Future)

Voor toekomstige Stripe integratie en PDF export:
- `/api/stripe/checkout` - Checkout sessie
- `/api/stripe/webhook` - Subscription webhooks
- `/api/export/pdf` - PDF generatie
- `/api/share/:token` - Publieke share links

## Testing

Test scenarios:

**Als Ouder:**
1. Gezin aanmaken
2. Kinderen toevoegen (paywall bij >1 op FREE)
3. Agenda items plannen
4. Logboek bijhouden en bewerken
5. Verzoek aanmaken en communiceren
6. Hulpverlener toevoegen (PLUS vereist)

**Als Hulpverlener:**
1. Toegang tot gezin
2. Data bekijken (read-only)
3. Vraag stellen
4. Antwoord ontvangen

**Paywall Tests:**
- Meerdere kinderen (FREE blokkeert)
- Oude historie (FREE filtert <30 dagen)
- Export (FREE blokkeert)
- Hulpverlener (FREE blokkeert)

## Environment Variables

```bash
VITE_SUPABASE_URL=         # Supabase project URL
VITE_SUPABASE_ANON_KEY=    # Supabase anon/public key
```

## Development

### Web Development

```bash
# Development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Native App Development

```bash
# Build web assets en sync naar native platforms
npm run build
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode (alleen macOS)
npx cap open ios

# Sync na wijzigingen (zonder rebuild)
npx cap copy

# Update Capacitor en plugins
npx cap sync
```

### Native App Requirements

**Voor Android:**
- Android Studio geïnstalleerd
- Android SDK (API 22+)
- Java Development Kit (JDK 11+)

**Voor iOS (alleen macOS):**
- Xcode 13+ geïnstalleerd
- CocoaPods geïnstalleerd (`sudo gem install cocoapods`)
- macOS 11+ (Big Sur of nieuwer)

### Workflow

1. Maak wijzigingen in `src/`
2. Test in browser: `npm run dev`
3. Build voor productie: `npm run build`
4. Sync naar native: `npx cap sync`
5. Open native IDE en run op emulator/device

## Belangrijke Ontwerpkeuzes

1. **Hybrid App met Capacitor**: Web-based met native iOS en Android apps via Capacitor
2. **Supabase over Custom Backend**: Snellere development, ingebouwde auth & RLS
3. **Soft Delete Everywhere**: Data integriteit en juridische bruikbaarheid
4. **Subscription per Gezin**: Niet per gebruiker, gezin is de billing entity
5. **Role-based Access**: Parents kunnen alles, Helpers alleen lezen + vragen
6. **Audit Trail**: Volledige logging voor juridisch gebruik

## Known Limitations

1. **Stripe Integratie**: Placeholder UI, Edge Functions nog te implementeren
2. **PDF Export**: Placeholder UI, server-side generatie nog te implementeren
3. **File Uploads**: Storage bucket configuratie nog te doen
4. **Email Notificaties**: Nog niet geïmplementeerd
5. **Multi-tenant**: Families zijn gescheiden maar delen dezelfde database

## Toekomstige Features

- Stripe Checkout & Webhooks via Edge Functions
- PDF export met Puppeteer
- File attachments met Supabase Storage
- Email notificaties voor belangrijke events
- Advanced filtering en zoeken
- Calendar sync (iCal export)
- Native device features (camera, notificaties, biometrie)

## Support

Voor vragen of problemen, zie de documentatie in `/docs` of neem contact op met het ontwikkelteam.

## Licentie

Proprietary - Alle rechten voorbehouden
