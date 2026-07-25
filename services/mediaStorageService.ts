import { supabase } from './supabaseClient';

const MEDIA_BUCKET = 'media';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export type MediaCategory = 'avatars' | 'banners' | 'prompts' | 'comments';

export interface MediaUploadResult {
  path: string;
  publicUrl: string;
}

export const isMediaStorageConfigured = (): boolean => Boolean(supabase);

const getFileExtension = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;

  const mimeExtension = file.type.split('/').pop()?.toLowerCase();
  return mimeExtension && /^[a-z0-9]+$/.test(mimeExtension)
    ? mimeExtension.replace('jpeg', 'jpg')
    : 'bin';
};

const validateMediaFile = (file: File, imagesOnly: boolean): void => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && (!isVideo || imagesOnly)) {
    throw new Error(imagesOnly ? 'Only image files are allowed' : 'Only image and video files are allowed');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 50 MB upload limit');
  }
};

const upload = async (
  file: File,
  category: MediaCategory,
  imagesOnly: boolean
): Promise<MediaUploadResult> => {
  if (!supabase) throw new Error('Supabase Storage is not configured');
  validateMediaFile(file, imagesOnly);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('You must be signed in to upload media');
  }

  const path = `${category}/${userData.user.id}/${crypto.randomUUID()}.${getFileExtension(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
};

export const uploadImage = (file: File, category: MediaCategory): Promise<MediaUploadResult> =>
  upload(file, category, true);

export const uploadMedia = (file: File, category: MediaCategory): Promise<MediaUploadResult> =>
  upload(file, category, false);

