import { supabase } from './supabase';
import { compressImage, isImageFile, isPDFFile, isValidFileType } from './imageCompression';

export interface UploadedFile {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  url: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'complete' | 'error';
  error?: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILES_PER_ENTRY = 5;

/**
 * Upload file to Supabase Storage and create attachment record
 */
export async function uploadLogAttachment(
  file: File,
  familyId: string,
  logEntryId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFile> {
  try {
    // Validate file type
    if (!isValidFileType(file)) {
      throw new Error('Ongeldig bestandstype. Alleen JPG, PNG, HEIC en PDF zijn toegestaan.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`Bestand is te groot. Maximum grootte is ${MAX_FILE_SIZE_MB}MB.`);
    }

    let fileToUpload = file;
    let finalMimeType = file.type;

    // Compress images
    if (isImageFile(file)) {
      onProgress?.({
        fileName: file.name,
        progress: 0,
        status: 'compressing',
      });

      const compressed = await compressImage(file);
      fileToUpload = compressed.file;
      finalMimeType = 'image/jpeg'; // Always JPEG after compression

      console.log(`Image compressed: ${compressed.originalSize} → ${compressed.compressedSize} bytes (${Math.round(compressed.compressionRatio * 100)}%)`);
    }

    // Generate storage path
    const fileExt = isPDFFile(fileToUpload) ? 'pdf' : 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;
    const storagePath = `${familyId}/${logEntryId}/${fileName}`;

    // Upload to storage
    onProgress?.({
      fileName: file.name,
      progress: 50,
      status: 'uploading',
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('log-attachments')
      .upload(storagePath, fileToUpload, {
        contentType: finalMimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload mislukt: ${uploadError.message}`);
    }

    // Get public URL (signed URL for private bucket)
    const { data: urlData } = supabase.storage
      .from('log-attachments')
      .getPublicUrl(storagePath);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Niet ingelogd');
    }

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .insert({
        family_id: familyId,
        linked_type: 'log_entry' as const,
        linked_id: logEntryId,
        file_name: file.name, // Keep original filename
        mime_type: finalMimeType,
        storage_key: storagePath,
        file_size: fileToUpload.size,
        uploaded_by: user.id,
      } as any)
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file
      await supabase.storage.from('log-attachments').remove([storagePath]);
      throw new Error(`Database fout: ${dbError.message}`);
    }

    onProgress?.({
      fileName: file.name,
      progress: 100,
      status: 'complete',
    });

    return {
      id: attachment.id,
      fileName: attachment.file_name,
      mimeType: attachment.mime_type,
      fileSize: attachment.file_size,
      storageKey: attachment.storage_key,
      url: urlData.publicUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload mislukt';

    onProgress?.({
      fileName: file.name,
      progress: 0,
      status: 'error',
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Get attachments for a log entry
 */
export async function getLogAttachments(logEntryId: string): Promise<UploadedFile[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('linked_type', 'log_entry')
    .eq('linked_id', logEntryId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Kon bijlagen niet ophalen: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Generate URLs for all attachments
  return data.map((attachment: any) => {
    const { data: urlData } = supabase.storage
      .from('log-attachments')
      .getPublicUrl(attachment.storage_key);

    return {
      id: attachment.id,
      fileName: attachment.file_name,
      mimeType: attachment.mime_type,
      fileSize: attachment.file_size,
      storageKey: attachment.storage_key,
      url: urlData.publicUrl,
    };
  });
}

/**
 * Get signed URL for viewing attachment (for private access)
 */
export async function getAttachmentSignedUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('log-attachments')
    .createSignedUrl(storageKey, expiresIn);

  if (error || !data) {
    throw new Error('Kon downloadlink niet genereren');
  }

  return data.signedUrl;
}

/**
 * Validate max files limit
 */
export async function canUploadMore(logEntryId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('attachments')
    .select('id', { count: 'exact', head: true })
    .eq('linked_type', 'log_entry')
    .eq('linked_id', logEntryId);

  if (error) {
    throw new Error('Kon aantal bijlagen niet controleren');
  }

  return (count || 0) < MAX_FILES_PER_ENTRY;
}

export { MAX_FILES_PER_ENTRY };
