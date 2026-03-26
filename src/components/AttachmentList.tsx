import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { File, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import { UploadedFile } from '../lib/fileUploadService';
import { formatFileSize, isImageFile } from '../lib/imageCompression';
import { getAttachmentSignedUrl } from '../lib/fileUploadService';

interface AttachmentListProps {
  attachments: UploadedFile[];
  showThumbnails?: boolean;
}

export default function AttachmentList({
  attachments,
  showThumbnails = true,
}: AttachmentListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  if (attachments.length === 0) {
    return null;
  }

  const handleViewFile = async (attachment: UploadedFile) => {
    if (isImageFile({ type: attachment.mimeType } as File)) {
      // For images, show in modal
      setLoadingUrls((prev) => new Set(prev).add(attachment.id));
      try {
        const signedUrl = await getAttachmentSignedUrl(attachment.storageKey);
        setSelectedImage(signedUrl);
      } catch (error) {
        console.error('Failed to get signed URL:', error);
        alert('Kon bestand niet laden');
      } finally {
        setLoadingUrls((prev) => {
          const newSet = new Set(prev);
          newSet.delete(attachment.id);
          return newSet;
        });
      }
    } else {
      // For PDFs, open in new tab
      try {
        const signedUrl = await getAttachmentSignedUrl(attachment.storageKey);
        window.open(signedUrl, '_blank');
      } catch (error) {
        console.error('Failed to get signed URL:', error);
        alert('Kon bestand niet laden');
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Bijlagen</h4>

        {showThumbnails ? (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <AttachmentThumbnail
                key={attachment.id}
                attachment={attachment}
                onClick={() => handleViewFile(attachment)}
                loading={loadingUrls.has(attachment.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {attachments.map((attachment) => (
              <AttachmentListItem
                key={attachment.id}
                attachment={attachment}
                onClick={() => handleViewFile(attachment)}
                loading={loadingUrls.has(attachment.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}

function AttachmentThumbnail({
  attachment,
  onClick,
  loading,
}: {
  attachment: UploadedFile;
  onClick: () => void;
  loading: boolean;
}) {
  const isImage = isImageFile({ type: attachment.mimeType } as File);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isImage) {
      getAttachmentSignedUrl(attachment.storageKey)
        .then(setSignedUrl)
        .catch(() => setImageError(true));
    }
  }, [attachment.storageKey, isImage]);

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors disabled:opacity-50 flex-shrink-0"
    >
      {isImage && !imageError && signedUrl ? (
        <>
          <img
            src={signedUrl}
            alt={attachment.fileName}
            className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </>
      ) : isImage && !imageError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-gray-400" />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <File className="w-5 h-5 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500 uppercase">PDF</span>
        </div>
      )}

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
        <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-xs text-white truncate">{attachment.fileName}</p>
      </div>
    </button>
  );
}

function AttachmentListItem({
  attachment,
  onClick,
  loading,
}: {
  attachment: UploadedFile;
  onClick: () => void;
  loading: boolean;
}) {
  const isImage = isImageFile({ type: attachment.mimeType } as File);

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-colors text-left disabled:opacity-50"
    >
      <div className="flex-shrink-0">
        {isImage ? (
          <ImageIcon className="w-5 h-5 text-blue-600" />
        ) : (
          <File className="w-5 h-5 text-red-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {attachment.fileName}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>

      <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  );
}

function ImageModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <img
          src={imageUrl}
          alt="Vergroting"
          className="max-w-full max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white text-gray-900 rounded-full p-2 hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
