import { useState, useRef } from 'react';
import { Camera, Upload, File, Image, X, Loader2, AlertCircle } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from '../lib/capacitor';
import { uploadLogAttachment, UploadProgress, MAX_FILES_PER_ENTRY, UploadedFile } from '../lib/fileUploadService';
import { formatFileSize, createThumbnail, isImageFile } from '../lib/imageCompression';

interface FileUploadProps {
  familyId: string;
  logEntryId: string;
  existingFiles: UploadedFile[];
  onUploadComplete: (file: UploadedFile) => void;
  disabled?: boolean;
}

interface PendingUpload {
  file: File;
  preview?: string;
  progress: UploadProgress;
}

export default function FileUpload({
  familyId,
  logEntryId,
  existingFiles,
  onUploadComplete,
  disabled = false,
}: FileUploadProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadMore = existingFiles.length + pendingUploads.length < MAX_FILES_PER_ENTRY;
  const remainingSlots = MAX_FILES_PER_ENTRY - existingFiles.length - pendingUploads.length;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const filesToUpload = filesArray.slice(0, remainingSlots);

    // Create pending uploads with previews
    const newPendingUploads: PendingUpload[] = [];
    for (const file of filesToUpload) {
      const preview = isImageFile(file) ? await createThumbnail(file) : undefined;
      newPendingUploads.push({
        file,
        preview,
        progress: { fileName: file.name, progress: 0, status: 'compressing' },
      });
    }

    setPendingUploads((prev) => [...prev, ...newPendingUploads]);

    // Upload files
    for (let i = 0; i < newPendingUploads.length; i++) {
      const upload = newPendingUploads[i];
      try {
        const result = await uploadLogAttachment(
          upload.file,
          familyId,
          logEntryId,
          (progress) => {
            setPendingUploads((prev) =>
              prev.map((u) =>
                u.file === upload.file ? { ...u, progress } : u
              )
            );
          }
        );

        onUploadComplete(result);

        // Remove from pending after short delay
        setTimeout(() => {
          setPendingUploads((prev) => prev.filter((u) => u.file !== upload.file));
        }, 1000);
      } catch (error) {
        console.error('Upload failed:', error);
        // Keep in pending with error state
      }
    }
  };

  const handleCameraCapture = async () => {
    if (!isNative()) {
      alert('Camera is alleen beschikbaar in de mobiele app');
      return;
    }

    try {
      const photo = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (photo.path) {
        // Convert to File object
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

        handleFileSelect(createFileList([file]));
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleGalleryPick = async () => {
    if (!isNative()) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const photo = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      if (photo.path) {
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

        handleFileSelect(createFileList([file]));
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  const removePendingUpload = (file: File) => {
    setPendingUploads((prev) => prev.filter((u) => u.file !== file));
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,application/pdf"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {canUploadMore && !disabled && (
        <div className="flex flex-wrap gap-2">
          {isNative() ? (
            <>
              <button
                type="button"
                onClick={handleCameraCapture}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Maak foto
              </button>
              <button
                type="button"
                onClick={handleGalleryPick}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Image className="w-4 h-4" />
                Selecteer foto
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <File className="w-4 h-4" />
                Selecteer bestand
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload bestand
            </button>
          )}

          <p className="text-sm text-gray-500 flex items-center">
            Max {remainingSlots} {remainingSlots === 1 ? 'bestand' : 'bestanden'}
          </p>
        </div>
      )}

      {!canUploadMore && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4" />
          Maximum aantal bestanden ({MAX_FILES_PER_ENTRY}) bereikt
        </div>
      )}

      {pendingUploads.length > 0 && (
        <div className="space-y-2">
          {pendingUploads.map((upload, index) => (
            <PendingUploadItem
              key={index}
              upload={upload}
              onRemove={() => removePendingUpload(upload.file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingUploadItem({
  upload,
  onRemove,
}: {
  upload: PendingUpload;
  onRemove: () => void;
}) {
  const { file, preview, progress } = upload;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      {preview ? (
        <img src={preview} alt="" className="w-12 h-12 object-cover rounded" />
      ) : (
        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
          <File className="w-6 h-6 text-gray-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

        {progress.status !== 'complete' && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              {progress.status === 'compressing' && (
                <span className="text-xs text-gray-600">Comprimeren...</span>
              )}
              {progress.status === 'uploading' && (
                <span className="text-xs text-gray-600">Uploaden...</span>
              )}
              {progress.status === 'error' && (
                <span className="text-xs text-red-600">{progress.error}</span>
              )}
            </div>
            {progress.status !== 'error' && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {progress.status === 'complete' && (
          <p className="text-xs text-green-600 mt-1">Upload voltooid</p>
        )}
      </div>

      {progress.status === 'error' ? (
        <button
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      ) : progress.status === 'complete' ? (
        <div className="p-2 text-green-600">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div className="p-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}

function createFileList(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}
