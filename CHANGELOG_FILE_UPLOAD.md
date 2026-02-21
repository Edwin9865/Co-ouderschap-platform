# Changelog - File Upload Feature

## Gewijzigde Bestanden

### Nieuwe Bestanden

1. **src/lib/imageCompression.ts**
   - Image compressie utilities
   - Canvas-based algoritme voor browser
   - Target: ~500KB per image
   - Max resolutie: 1920px
   - Iterative quality reduction
   - Thumbnail generator
   - File type validators

2. **src/lib/fileUploadService.ts**
   - Upload service voor Supabase Storage
   - Attachment record management
   - Progress tracking
   - Error handling
   - Signed URL generation
   - Max files validation

3. **src/components/FileUpload.tsx**
   - Upload UI component
   - Camera integration (mobile)
   - Gallery picker (mobile)
   - File input (web)
   - Upload progress indicator
   - Preview thumbnails
   - Max 5 files enforcement

4. **src/components/AttachmentList.tsx**
   - Display component voor bijlagen
   - Thumbnail grid view
   - List view optie
   - Image modal viewer
   - PDF open in new tab
   - File info display

5. **supabase/migrations/create_log_attachments_storage_bucket.sql**
   - Storage bucket `log-attachments`
   - RLS policies voor upload/view
   - 10MB file size limit
   - MIME type restrictions

6. **FILE_UPLOAD_IMPLEMENTATION.md**
   - Volledige documentatie
   - Architectuur overzicht
   - Usage guide
   - Security details

7. **FILE_UPLOAD_TESTING.md**
   - Test procedures
   - Test cases
   - Success criteria
   - Browser compatibility checklist

### Gewijzigde Bestanden

1. **package.json**
   - Added: `@capacitor/camera": "^8.0.0"`

2. **src/pages/Logboek.tsx**
   - Import FileUpload & AttachmentList components
   - State voor attachments tracking
   - State voor new entry uploads
   - Modified handleCreate voor entry ID tracking
   - Upload UI in create form
   - Attachment display in entry cards
   - useEffect voor loading attachments

3. **android/app/src/main/AndroidManifest.xml**
   - Added camera permission
   - Added storage read permissions
   - Added media images permission (Android 13+)
   - Camera feature (not required)

## Database Changes

### Storage Bucket: `log-attachments`
- Private bucket
- Max file size: 10MB
- Allowed types: JPG, PNG, HEIC, HEIF, PDF
- Path structure: `{family_id}/{log_entry_id}/{filename}`

### RLS Policies
1. **Insert Policy**: Users can upload to own family folders
2. **Select Policy**: Users can view files from their families
3. **No Delete Policy**: Files cannot be deleted (per requirements)

## API Changes

### New Functions

**imageCompression.ts**
- `compressImage(file, options): Promise<CompressionResult>`
- `isImageFile(file): boolean`
- `isPDFFile(file): boolean`
- `isValidFileType(file): boolean`
- `formatFileSize(bytes): string`
- `createThumbnail(file, size): Promise<string>`

**fileUploadService.ts**
- `uploadLogAttachment(file, familyId, logEntryId, onProgress): Promise<UploadedFile>`
- `getLogAttachments(logEntryId): Promise<UploadedFile[]>`
- `getAttachmentSignedUrl(storageKey, expiresIn): Promise<string>`
- `canUploadMore(logEntryId): Promise<boolean>`

## Breaking Changes

Geen breaking changes - volledig backwards compatible.

## Migration Notes

1. Run database migration voor storage bucket
2. Install dependencies: `npm install`
3. Sync Capacitor: `npm run sync`
4. Build project: `npm run build`
5. Voor Android: rebuild app om permissions te activeren

## Performance Impact

### Positive
- Client-side compressie bespaart server resources
- Reduced bandwidth usage (70-90% smaller files)
- Fast thumbnail generation

### Considerations
- Initial compression takes ~1 second per image
- Storage bucket space usage (track per family)
- More database queries voor attachments

## Security Considerations

- RLS prevents unauthorized access
- No file deletion protects audit trail
- Signed URLs expire after 1 hour
- File type validation prevents malicious uploads
- Size limits prevent abuse

## User Experience

### Before
- Geen mogelijkheid om foto's/documenten toe te voegen
- Alleen tekst in logboek entries

### After
- Upload foto's direct via camera (mobile)
- Selecteer bestaande foto's (mobile/web)
- Upload PDF documenten
- View thumbnails in logboek
- Full screen image viewer
- Max 5 bestanden per entry

## Next Steps

1. Test op verschillende devices
2. Monitor storage usage
3. Consider adding:
   - Video support
   - Bulk upload
   - Image editing
   - Server-side thumbnails
   - Storage quota per family

## Rollback Plan

If issues occur:
1. Remove FileUpload component import from Logboek.tsx
2. Hide upload UI (set display: none)
3. Storage bucket remains but won't be used
4. No data loss - attachments table preserved
