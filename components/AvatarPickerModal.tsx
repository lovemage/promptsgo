import React, { useMemo, useState } from 'react';
import { X, Lock, Upload } from 'lucide-react';
import { ThemeId } from '../types';
import { buildDefaultAvatarList, isDefaultAvatarUnlocked } from '../utils/avatarUtils';
import { uploadImage, isCloudinaryConfigured } from '../services/cloudinaryService';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeId;
  level: number;
  selectedAvatarUrl: string | null;
  onSelectAvatar: (avatarUrl: string) => void;
  allowUpload: boolean;
}

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  theme,
  level,
  selectedAvatarUrl,
  onSelectAvatar,
  allowUpload,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const avatars = useMemo(() => buildDefaultAvatarList(), []);

  if (!isOpen) return null;

  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
  const bgClass = theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900';
  const mutedText = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowUpload) {
      alert('Level not unlocked for custom upload yet.');
      return;
    }

    if (!isCloudinaryConfigured()) {
      alert('Cloudinary is not configured.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadImage(file);
      if (res?.secure_url) {
        onSelectAvatar(res.secure_url);
      }
    } catch {
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl ${borderClass} ${bgClass}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${borderClass}`}>
          <div>
            <div className="text-lg font-bold">Choose Avatar</div>
            <div className={`text-xs ${mutedText}`}>Level {level}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {avatars.map(a => {
              const avatarId = a.id;
              const unlocked = isDefaultAvatarUnlocked(avatarId, level);
              const isSelected = selectedAvatarUrl === a.url;

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    if (!unlocked) return;
                    onSelectAvatar(a.url);
                  }}
                  className={`relative rounded-xl overflow-hidden border transition-all ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : borderClass} ${unlocked ? 'hover:scale-[1.02]' : 'opacity-70 cursor-not-allowed'}`}
                  title={unlocked ? 'Select' : 'Locked'}
                >
                  <img src={a.url} alt={a.id} className="w-full aspect-square object-cover" />
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                        <Lock size={16} className="text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className={`text-xs ${mutedText}`}>
              Star Creator and above can upload a custom avatar.
            </div>

            <label className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${borderClass} ${allowUpload ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10' : 'opacity-50 cursor-not-allowed'}`}>
              <Upload size={16} />
              {isUploading ? 'Uploading...' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={!allowUpload || isUploading} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
