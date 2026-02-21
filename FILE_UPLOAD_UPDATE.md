# File Upload Update - Logboek

## Wat is gewijzigd?

De file upload functionaliteit voor logboek items is nu **VOOR** het aanmaken van een logboek item zichtbaar, in plaats van erna.

## Nieuwe Functionaliteit

### Web Versie
- **File input** veld is direct zichtbaar bij het aanmaken van een logboek item
- Selecteer tot 5 bestanden (images/PDF) voordat je op "Toevoegen" klikt
- Preview van geselecteerde bestanden met verwijder-knop
- Automatische upload na het aanmaken van het logboek item

### Mobiele Versie (Android/iOS)
- **"Maak foto"** knop (blauw) - opent direct de camera
- **"Selecteer foto"** knop (groen) - opent de gallery/foto picker
- Preview van geselecteerde foto's
- Automatische upload na het aanmaken van het logboek item

## Flow

```
1. Klik "Item toevoegen"
2. Vul formulier in (categorie, kind, titel, details, datum/tijd)
3. [NIEUW] Selecteer optioneel bestanden:
   - Web: Kies bestanden via file input
   - Mobiel: Gebruik camera of gallery knoppen
4. Zie preview van geselecteerde bestanden
5. Klik "Toevoegen"
6. Item wordt aangemaakt
7. Bestanden worden automatisch geüpload
8. Formulier sluit automatisch
```

## Technische Details

### State Management
- `pendingFiles: File[]` - houdt geselecteerde bestanden bij voor upload
- Files worden geüpload NA het aanmaken van het logboek item
- Upload gebeurt sequentieel met error handling per file

### Capacitor Camera
- Gebruikt `@capacitor/camera` plugin
- `CameraSource.Camera` voor camera
- `CameraSource.Photos` voor gallery
- `CameraResultType.Uri` voor web path
- Converteert Uri naar File object via fetch + blob

### File Limits
- Max 5 bestanden per logboek item
- Max 10MB per bestand
- Toegestane types: JPG, PNG, HEIC, PDF
- Images worden automatisch gecomprimeerd

## Test Instructies

### Web
```bash
npm run dev
```
1. Ga naar Logboek
2. Klik "Item toevoegen"
3. Vul formulier in
4. Scroll naar beneden naar "Bijlagen (optioneel)"
5. Klik op file input, selecteer bestanden
6. Zie preview van bestanden
7. Klik "Toevoegen"
8. Check of item verschijnt met bijlagen

### Android
```bash
npm run sync
# Open Android Studio
# Run app on device/emulator
```
1. Ga naar Logboek
2. Klik "Item toevoegen"
3. Vul formulier in
4. Scroll naar beneden
5. Zie "Maak foto" en "Selecteer foto" knoppen
6. Test camera en gallery
7. Zie preview van geselecteerde foto's
8. Klik "Toevoegen"
9. Check of item verschijnt met bijlagen

## Gewijzigde Bestanden

- `src/pages/Logboek.tsx` - Hoofdimplementatie
  - Verwijderd: `newEntryId`, `newEntryAttachments` state
  - Toegevoegd: `pendingFiles` state
  - Toegevoegd: `handleCameraCapture()`, `handleGalleryPick()` functies
  - Upload sectie is nu VOOR submit zichtbaar
  - Conditionale rendering: camera knoppen op mobiel, file input op web

## Voordelen

✅ Duidelijkere UX - gebruiker ziet upload optie meteen
✅ Beter voor mobiel - dedicated camera/gallery knoppen
✅ Eenvoudiger flow - alles in één formulier
✅ Geen "Klaar" knop meer nodig na submit
✅ Automatische upload na item creatie
