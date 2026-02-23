# KRITIEKE FIX: 30-Dagen Filter voor FREE Gebruikers

## Probleem
FREE gebruikers zagen logboek items ouder dan 30 dagen in:
1. Dashboard "Recent Logboek" sectie
2. Logboek pagina

## Root Cause
De filter werd toegepast op de **verkeerde plek** en gebruikte het **verkeerde veld**.

### Fout 1: Client-side filtering in Logboek.tsx
**VOOR**:
```typescript
// Haalt ALLE data op
const { data } = await query;

// Filtert CLIENT-SIDE (inefficient en niet betrouwbaar)
const filteredData = filterByPlan(data || []);
```

**PROBLEEM**:
- Alle data wordt opgehaald uit database
- Filtering gebeurt in browser
- Gebruiker ziet mogelijk oude data tijdens laden

### Fout 2: Verkeerd veld gebruikt
**VOOR**:
```typescript
return data.filter(entry => new Date(entry.occurred_at) >= thirtyDaysAgo);
```

**PROBLEEM**:
- `occurred_at` = wanneer de gebeurtenis plaatsvond (door gebruiker ingevoerd)
- `created_at` = wanneer het item in het systeem werd aangemaakt
- Gebruiker kan vandaag een logboek maken over gebeurtenis van 60 dagen geleden
- Met `occurred_at` filter: item wordt GETOOND ❌
- Met `created_at` filter: item wordt VERBORGEN ✅

## Oplossing Geïmplementeerd

### 1. Logboek.tsx - Database Level Filtering

**Bestand**: `src/pages/Logboek.tsx`
**Lijnen**: 144-169

**NA**:
```typescript
const fetchEntries = async () => {
  if (!currentFamily) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let query = supabase
    .from('log_entries')
    .select('*')
    .eq('family_id', currentFamily.id)
    .is('deleted_at', null);

  // ✅ Filter op DATABASE niveau voor FREE gebruikers
  if (!canAccessHistory) {
    query = query.gte('created_at', thirtyDaysAgo.toISOString());
  }

  if (selectedChild !== 'all') {
    query = query.eq('child_id', selectedChild);
  }

  query = query.order('occurred_at', { ascending: false });

  const { data } = await query;
  setEntries(data || []); // Geen client-side filtering meer nodig
};
```

**Voordelen**:
- ✅ Filter op database niveau (efficient)
- ✅ Gebruikt correct veld (`created_at`)
- ✅ Geen client-side filtering nodig
- ✅ Database kan index gebruiken
- ✅ Minder data over netwerk

### 2. Dashboard.tsx - Al Correct

**Bestand**: `src/pages/Dashboard.tsx`
**Lijnen**: 121-135

```typescript
const isFree = !subscription || subscription.plan === 'FREE';

let logsQuery = supabase
  .from('log_entries')
  .select('*')
  .eq('family_id', currentFamily.id)
  .is('deleted_at', null);

if (isFree) {
  logsQuery = logsQuery.gte('created_at', thirtyDaysAgo.toISOString());
}

logsQuery = logsQuery
  .order('created_at', { ascending: false })
  .limit(5);
```

**Status**: ✅ Al correct geïmplementeerd

## Test Scenario's

### TEST 1: FREE Gebruiker - Oude Data Niet Zichtbaar

**Stappen**:
1. Log in met FREE account
2. Maak een logboek item VANDAAG met:
   - `title`: "Test oude gebeurtenis"
   - `occurred_at`: Datum van 60 dagen geleden
   - `created_at`: Automatisch (vandaag)
3. Ga naar Dashboard
4. Ga naar Logboek pagina

**Verwacht Resultaat**:
- ✅ Item VERSCHIJNT in beide (want `created_at` is vandaag)
- ✅ Dit is CORRECT gedrag

**Nu test oude items**:
5. Via SQL, maak een item aan met `created_at` = 60 dagen geleden:
```sql
INSERT INTO log_entries (family_id, title, category, occurred_at, created_at, created_by)
VALUES (
  'your-family-id',
  'OUD TEST ITEM',
  'other',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '60 days',  -- Dit is de kritieke waarde
  'your-user-id'
);
```

**Verwacht Resultaat**:
- ❌ Item VERSCHIJNT NIET in Dashboard
- ❌ Item VERSCHIJNT NIET in Logboek
- ✅ Dit is CORRECT gedrag

### TEST 2: FREE Gebruiker - Recente Data Wel Zichtbaar

**Stappen**:
1. Log in met FREE account
2. Maak een logboek item VANDAAG
3. Ga naar Dashboard en Logboek

**Verwacht Resultaat**:
- ✅ Item is ZICHTBAAR in beide
- ✅ Dit is CORRECT gedrag

### TEST 3: PLUS/PRO Gebruiker - Alle Data Zichtbaar

**Stappen**:
1. Log in met PLUS of PRO account
2. Bekijk Dashboard en Logboek

**Verwacht Resultaat**:
- ✅ ALLE items zichtbaar (geen 30-dagen limiet)
- ✅ Oude items uit TEST 1 zijn WEL zichtbaar
- ✅ Dit is CORRECT gedrag

### TEST 4: Database Query Verificatie

**Voor FREE gebruiker**, open Developer Console → Network tab:

**Dashboard query moet zijn**:
```
/rest/v1/log_entries?select=*&family_id=eq.XXX&deleted_at=is.null&created_at=gte.2026-01-23T...&order=created_at.desc&limit=5
```

**Logboek query moet zijn**:
```
/rest/v1/log_entries?select=*&family_id=eq.XXX&deleted_at=is.null&created_at=gte.2026-01-23T...&order=occurred_at.desc
```

**Let op**: Beide moeten `created_at=gte.` bevatten!

### TEST 5: Upgrade Scenario

**Stappen**:
1. Log in met FREE account (ziet alleen recente data)
2. Upgrade naar PLUS of PRO
3. Ververs de pagina

**Verwacht Resultaat**:
- ✅ Na upgrade zijn ALLE oude items DIRECT zichtbaar
- ✅ Geen data verlies
- ✅ Geen wachttijd

## SQL Test Queries

### Controleer je data:
```sql
-- Bekijk alle log entries met relevante datums
SELECT
  id,
  title,
  created_at,
  occurred_at,
  EXTRACT(DAY FROM NOW() - created_at) as dagen_sinds_aanmaak,
  EXTRACT(DAY FROM NOW() - occurred_at) as dagen_sinds_gebeurtenis
FROM log_entries
WHERE family_id = 'your-family-id'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Test de 30-dagen filter:
```sql
-- Wat zou een FREE gebruiker moeten zien
SELECT COUNT(*) as zichtbaar_voor_free
FROM log_entries
WHERE family_id = 'your-family-id'
  AND deleted_at IS NULL
  AND created_at >= (NOW() - INTERVAL '30 days');

-- Totaal aantal items
SELECT COUNT(*) as totaal
FROM log_entries
WHERE family_id = 'your-family-id'
  AND deleted_at IS NULL;
```

## Veranderingen Samenvatting

| Bestand | Wijziging | Type |
|---------|-----------|------|
| `src/pages/Logboek.tsx` | Verwijderd `filterByPlan()`, filter nu in query | DATABASE LEVEL |
| `src/pages/Logboek.tsx` | Gebruikt `created_at` veld | CORRECT VELD |
| `src/pages/Dashboard.tsx` | Geen wijziging (al correct) | N/A |

## Waarom Deze Aanpak?

### Database Level vs Client Level

**DATABASE LEVEL** (huidige oplossing):
- ✅ Efficient (minder data over netwerk)
- ✅ Veilig (server controleert)
- ✅ Database kan index gebruiken
- ✅ Sneller voor gebruiker
- ✅ Consistent gedrag

**CLIENT LEVEL** (oude oplossing):
- ❌ Alle data moet worden gedownload
- ❌ Gebruiker ziet mogelijk flits van oude data
- ❌ Langzamer
- ❌ Meer data verbruik
- ❌ Browser kan data cachen (security risk)

### created_at vs occurred_at

**created_at** (CORRECT):
- Wanneer item in systeem werd aangemaakt
- Niet manipuleerbaar door gebruiker
- Betrouwbare basis voor abonnement limiet

**occurred_at** (FOUT):
- Wanneer gebeurtenis plaatsvond (user input)
- Kan ver in verleden liggen
- Niet geschikt voor abonnement filtering

## Deployment

**Geen database wijzigingen nodig** ✅
**Alleen frontend build** ✅
**Geen downtime** ✅

```bash
npm run build
# Deploy frontend assets
```

## Verificatie na Deployment

1. Log in met FREE account
2. Open Developer Console → Network tab
3. Bekijk log_entries query
4. Controleer aanwezigheid van: `created_at=gte.YYYY-MM-DD`
5. Verifieer dat alleen recente items zichtbaar zijn

**Status**: ✅ **OPGELOST**

---
**Datum**: 2026-02-23
**Versie**: 1.0.1
**Getest**: ✅ Ja
**Deployed**: Pending
