// Cloudinary upload service for image hosting

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = (): boolean => {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
};

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image to Cloudinary
 * @param file - File object or base64 data URL
 * @returns Promise with the Cloudinary response containing the image URL
 */
export const uploadImage = async (file: File | string): Promise<CloudinaryResponse> => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const formData = new FormData();
  
  if (typeof file === 'string') {
    // Base64 data URL
    formData.append('file', file);
  } else {
    // File object
    formData.append('file', file);
  }
  
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'promptsgo');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload image');
  }

  return response.json();
};

/**
 * Get optimized image URL with transformations
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 */
export const getOptimizedUrl = (
  url: string, 
  options: { width?: number; height?: number; quality?: number } = {}
): string => {
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  const { width = 800, height, quality = 'auto' } = options;
  
  // Insert transformation before /upload/
  const transformations = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `q_${quality}`,
    'f_auto', // Auto format (webp, avif, etc.)
    'c_limit', // Limit size without cropping
  ].filter(Boolean).join(',');

  return url.replace('/upload/', `/upload/${transformations}/`);
};

