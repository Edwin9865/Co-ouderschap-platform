/**
 * Image compression utilities for optimizing uploaded images
 * Compresses images to ~500KB while maintaining acceptable quality
 */

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidthOrHeight: 1920,
  quality: 0.8,
  maxSizeMB: 0.5, // Target 500KB
};

/**
 * Compress an image file using canvas
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // If file is already small enough, return as-is
  if (originalSize <= (opts.maxSizeMB! * 1024 * 1024)) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // Load image
  const img = await loadImage(file);

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    opts.maxWidthOrHeight!
  );

  // Compress using canvas
  let quality = opts.quality!;
  let compressedFile = await compressToCanvas(file, img, width, height, quality);

  // If still too large, reduce quality iteratively
  let iterations = 0;
  while (
    compressedFile.size > opts.maxSizeMB! * 1024 * 1024 &&
    quality > 0.3 &&
    iterations < 5
  ) {
    quality -= 0.1;
    compressedFile = await compressToCanvas(file, img, width, height, quality);
    iterations++;
  }

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    compressionRatio: compressedFile.size / originalSize,
  };
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxSize: number
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxSize,
      height: Math.round((height * maxSize) / width),
    };
  } else {
    return {
      width: Math.round((width * maxSize) / height),
      height: maxSize,
    };
  }
}

/**
 * Compress image using canvas and return as File
 */
function compressToCanvas(
  originalFile: File,
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Draw image on canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        // Create new File from blob
        const compressedFile = new File([blob], originalFile.name, {
          type: 'image/jpeg', // Always convert to JPEG for better compression
          lastModified: Date.now(),
        });

        resolve(compressedFile);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'application/pdf',
  ];
  return validTypes.includes(file.type);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create thumbnail from image file
 */
export async function createThumbnail(
  file: File,
  size: number = 100
): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate square crop
  const minDim = Math.min(img.width, img.height);
  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;

  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

  return canvas.toDataURL('image/jpeg', 0.7);
}
