# Seed Data Instructions

Om de applicatie te testen met demo data, volg deze stappen:

## Test Accounts

De applicatie heeft de volgende test accounts nodig:

### Ouder 1
- Email: ouder1@test.nl
- Wachtwoord: test123456
- Naam: Anna Jansen

### Ouder 2
- Email: ouder2@test.nl
- Wachtwoord: test123456
- Naam: Peter Bakker

### Hulpverlener
- Email: hulpverlener@test.nl
- Wachtwoord: test123456
- Naam: Maria de Vries

## Stappen om seed data toe te voegen

1. **Registreer de test accounts**
   - Ga naar /register en maak de 3 accounts aan zoals hierboven beschreven
   - Dit moet handmatig omdat Supabase Auth gebruikt wordt

2. **Seed data SQL uitvoeren**

   Nadat de accounts zijn aangemaakt, voer het volgende SQL script uit in de Supabase SQL Editor.
   **BELANGRIJK**: Vervang de UUID placeholders met de werkelijke user IDs uit Supabase Auth.

```sql
-- VERVANG DEZE UUIDs MET DE ECHTE USER IDs UIT SUPABASE AUTH
-- Krijg deze via: SELECT id, email FROM auth.users;

DO $$
DECLARE
    v_family_id uuid;
    v_child1_id uuid;
    v_child2_id uuid;
    v_parent1_id uuid := 'VERVANG-MET-ANNA-JANSEN-UUID';
    v_parent2_id uuid := 'VERVANG-MET-PETER-BAKKER-UUID';
    v_helper_id uuid := 'VERVANG-MET-MARIA-DE-VRIES-UUID';
    v_request_id uuid;
    v_question_id uuid;
BEGIN
    -- Create family
    INSERT INTO families (name, created_at)
    VALUES ('Gezin Jansen-Bakker', now())
    RETURNING id INTO v_family_id;

    -- Add family members
    INSERT INTO family_members (family_id, user_id, role, status, joined_at)
    VALUES
        (v_family_id, v_parent1_id, 'PARENT', 'ACTIVE', now()),
        (v_family_id, v_parent2_id, 'PARENT', 'ACTIVE', now()),
        (v_family_id, v_helper_id, 'HELPER', 'ACTIVE', now());

    -- Create subscription (PLUS plan)
    INSERT INTO subscriptions (family_id, plan, status, created_at)
    VALUES (v_family_id, 'PLUS', 'ACTIVE', now());

    -- Add children
    INSERT INTO children (family_id, first_name, birth_year, created_at)
    VALUES
        (v_family_id, 'Sophie', 2018, now()),
        (v_family_id, 'Lucas', 2020, now())
    RETURNING id INTO v_child1_id;

    SELECT id INTO v_child2_id FROM children WHERE family_id = v_family_id AND first_name = 'Lucas';

    -- Add events
    INSERT INTO events (family_id, child_id, type, title, description, start_at, end_at, location, status, created_by, created_at)
    VALUES
        (v_family_id, v_child1_id, 'medical', 'Doktersafspraak Sophie', 'Controle bij huisarts',
         (now() + interval '2 days')::timestamptz, null, 'Huisartsenpraktijk Centrum', 'scheduled', v_parent1_id, now()),
        (v_family_id, v_child2_id, 'school', 'Ouderavond Lucas', 'Eerste ouderavond dit schooljaar',
         (now() + interval '5 days')::timestamptz, null, 'Basisschool De Regenboog', 'scheduled', v_parent1_id, now()),
        (v_family_id, null, 'handover', 'Overdracht kinderen', 'Overdracht van Anna naar Peter',
         (now() + interval '1 day')::timestamptz, null, 'Centraal Station', 'scheduled', v_parent1_id, now());

    -- Add log entries
    INSERT INTO log_entries (family_id, child_id, category, title, details, occurred_at, created_by, created_at)
    VALUES
        (v_family_id, v_child1_id, 'health', 'Sophie heeft koorts gehad',
         'Temperatuur van 38.5, paracetamol gegeven. Na 2 dagen weer beter.',
         (now() - interval '3 days')::timestamptz, v_parent1_id, now()),
        (v_family_id, v_child2_id, 'achievement', 'Lucas kan fietsen zonder zijwieltjes',
         'Grote mijlpaal bereikt! Lucas fietst nu zelfstandig zonder hulpwielen.',
         (now() - interval '1 week')::timestamptz, v_parent2_id, now()),
        (v_family_id, v_child1_id, 'behavior', 'Slecht geslapen vannacht',
         'Sophie had nachtmerries en kwam 3x uit bed. Extra knuffel en geruststelling gegeven.',
         (now() - interval '1 day')::timestamptz, v_parent1_id, now()),
        (v_family_id, v_child1_id, 'development', 'Sophie leert nieuwe woorden',
         'Sophie breidt haar woordenschat snel uit. Gebruikt nu hele zinnen.',
         (now() - interval '5 days')::timestamptz, v_parent2_id, now());

    -- Add requests
    INSERT INTO requests (family_id, type, title, status, created_by, created_at)
    VALUES (v_family_id, 'vacation', 'Vakantie zomervakantie plannen', 'OPEN', v_parent1_id, now())
    RETURNING id INTO v_request_id;

    -- Add request messages
    INSERT INTO request_messages (request_id, sender_id, message, created_at)
    VALUES
        (v_request_id, v_parent1_id, 'Ik stel voor om de laatste 2 weken van juli vakantie te nemen met de kinderen. Zijn jullie hiermee akkoord?', now()),
        (v_request_id, v_parent2_id, 'Dat komt mij goed uit. Waar denk je aan qua bestemming?', now() + interval '1 hour'),
        (v_request_id, v_parent1_id, 'Ik dacht aan een huisje in de Ardennen, veel natuur en rust voor de kinderen.', now() + interval '2 hours');

    -- Add another request
    INSERT INTO requests (family_id, type, title, status, created_by, created_at)
    VALUES (v_family_id, 'schedule_change', 'Ruil weekend ivm verjaardag', 'ACCEPTED', v_parent2_id, now() - interval '2 days');

    -- Add question from helper
    INSERT INTO questions (family_id, helper_id, title, question_text, status, created_at)
    VALUES (v_family_id, v_helper_id, 'Hoe gaat het op school?',
            'Ik zou graag willen weten hoe het met Sophie op school gaat. Zijn er bijzonderheden in haar gedrag of ontwikkeling die opvallen?',
            'ANSWERED', now() - interval '1 week')
    RETURNING id INTO v_question_id;

    -- Add answer
    INSERT INTO answers (question_id, parent_id, answer_text, created_at)
    VALUES (v_question_id, v_parent1_id,
            'Sophie doet het goed op school. Ze heeft inmiddels al wat vriendinnetjes gemaakt en participeert actief in de klas. De juf is tevreden over haar ontwikkeling.',
            now() - interval '6 days');

    -- Add audit logs
    INSERT INTO audit_logs (family_id, entity_type, entity_id, action, actor_id, created_at)
    VALUES
        (v_family_id, 'family', v_family_id, 'CREATE', v_parent1_id, now()),
        (v_family_id, 'child', v_child1_id, 'CREATE', v_parent1_id, now()),
        (v_family_id, 'child', v_child2_id, 'CREATE', v_parent1_id, now());

    RAISE NOTICE 'Seed data successfully created!';
    RAISE NOTICE 'Family ID: %', v_family_id;
END $$;
```

## Inloggen

Na het uitvoeren van bovenstaande stappen kun je inloggen met een van de test accounts:

- **Ouder:** ouder1@test.nl / test123456
- **Ouder:** ouder2@test.nl / test123456
- **Hulpverlener:** hulpverlener@test.nl / test123456

## Testen

Test de volgende scenario's:

### Als Ouder (ouder1@test.nl of ouder2@test.nl)
- Dashboard bekijken met recente items
- Kinderen beheren (toevoegen/bewerken)
- Agenda items aanmaken
- Logboek bijhouden met soft delete
- Verzoeken aanmaken en communiceren
- Hulpverlener toevoegen (PLUS plan)
- Export functionaliteit (paywall check)

### Als Hulpverlener (hulpverlener@test.nl)
- Gezin bekijken (read-only)
- Vragen stellen aan ouders
- Antwoorden bekijken

### Paywall Testing
Log in met een nieuw account (gratis plan) en test:
- Meerdere kinderen toevoegen (geblokkeerd)
- Historie > 30 dagen (gefilterd)
- Export (geblokkeerd)
- Hulpverlener toevoegen (geblokkeerd)
