# File Upload Testing Guide

## Test Procedure

### Web Browser Testing

#### 1. Basic Upload
1. Ga naar Logboek pagina
2. Klik "Item toevoegen"
3. Vul formulier in (titel, categorie, etc.)
4. Klik "Toevoegen" (entry wordt aangemaakt)
5. Upload sectie verschijnt
6. Klik "Upload bestand"
7. Selecteer een JPG/PNG image (3-5MB)
8. Controleer:
   - Compressie indicator verschijnt
   - Upload progress wordt getoond
   - Thumbnail preview verschijnt
   - "Upload voltooid" message

#### 2. Multiple Files
1. Upload 2-3 bestanden achter elkaar
2. Controleer dat alle thumbnails zichtbaar zijn
3. Test max 5 files limiet
4. Probeer 6e bestand toe te voegen → moet geblokkeerd worden

#### 3. PDF Upload
1. Upload een PDF document
2. Controleer:
   - PDF icoon wordt getoond (geen thumbnail)
   - Bestandsnaam zichtbaar
   - Geen compressie (direct upload)

#### 4. View Attachments
1. Ga terug naar logboek overzicht
2. Open entry met bijlagen
3. Controleer:
   - Thumbnails worden getoond
   - Klik op image → opens full view modal
   - Klik op PDF → opens in new tab
   - Close modal werkt

#### 5. Error Handling
1. Probeer >10MB bestand te uploaden → error message
2. Probeer ongeldige file type (bijv. .docx) → error message
3. Test zonder internet connectie → error message

### Mobile App Testing (Android)

#### 1. Camera Capture
1. Open Logboek in app
2. Klik "Item toevoegen"
3. Vul formulier in
4. Klik "Toevoegen"
5. Klik "Maak foto"
6. Geef camera permissie (eerste keer)
7. Neem foto
8. Controleer:
   - Foto verschijnt als thumbnail
   - Compressie werkt
   - Upload completes

#### 2. Gallery Selection
1. Klik "Selecteer foto"
2. Geef storage permissie (eerste keer)
3. Selecteer bestaande foto
4. Controleer upload & preview

#### 3. Multiple Photos Mobile
1. Test uploaden van meerdere foto's achter elkaar
2. Test mix van camera + gallery
3. Controleer performance (geen crashes)

### Security Testing

#### 1. RLS Policies
Test dat:
- [ ] Kan alleen uploaden naar eigen familie
- [ ] Kan alleen files zien van eigen families
- [ ] Kan geen files verwijderen
- [ ] Kan niet naar andere families uploaden

#### 2. Test Procedure
1. Login als User A (Family 1)
2. Upload bestand naar logboek entry
3. Noteer storage path
4. Login als User B (Family 2)
5. Probeer direct URL te benaderen → moet geblokkeerd worden
6. Probeer file te verwijderen via console → moet geblokkeerd worden

### Performance Testing

#### 1. Large Image Compression
Test met verschillende groottes:
- [ ] 1MB image → ~300KB
- [ ] 3MB image → ~400KB
- [ ] 5MB image → ~500KB
- [ ] 10MB image → error (te groot)

#### 2. Upload Speed
Test op verschillende connecties:
- [ ] WiFi: <2 sec voor compressed image
- [ ] 4G: 2-5 sec
- [ ] 3G: 5-10 sec

### Edge Cases

#### 1. Orientation (HEIC images)
- [ ] Upload HEIC from iPhone
- [ ] Check orientation preserved
- [ ] Check conversion to JPEG

#### 2. Concurrent Uploads
- [ ] Upload 3 files tegelijk
- [ ] All complete successfully
- [ ] No conflicts

#### 3. Network Interruption
- [ ] Start upload
- [ ] Disable internet mid-upload
- [ ] Check error handling
- [ ] Retry upload works

### Regression Testing

Controleer dat bestaande functionaliteit werkt:
- [ ] Logboek entries zonder bijlagen tonen correct
- [ ] Edit functie werkt nog
- [ ] Delete functie werkt nog
- [ ] Filters werken nog
- [ ] History viewer werkt nog

## Known Issues & Limitations

1. **HEIC Support**: Browser-based - werkt niet in alle browsers
2. **PDF Thumbnails**: Geen preview voor PDFs (alleen icoon)
3. **Video**: Niet ondersteund in deze versie
4. **Offline**: Upload vereist internet connectie

## Success Criteria

- [ ] Alle basis functionaliteit werkt web + mobile
- [ ] Image compressie reduceert files met 70-90%
- [ ] Upload succeeds binnen 5 seconden (4G)
- [ ] Geen crashes of errors tijdens normal usage
- [ ] RLS policies worden gehandhaafd
- [ ] User kan uploaded files bekijken
- [ ] Thumbnails laden correct

## Browser Compatibility

Getest op:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
