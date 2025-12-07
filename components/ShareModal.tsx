
import React, { useState, useEffect } from 'react';
import { X, Globe, Upload, Image as ImageIcon, Loader2, Tag, Plus } from 'lucide-react';
import { Prompt, GlobalPrompt, Dictionary, User, ThemeId } from '../types';
import { sharePrompt, getUniqueModelTags } from '../services/globalService';
import { generateId } from '../services/storageService';
import { uploadImage, isCloudinaryConfigured } from '../services/cloudinaryService';
// @ts-ignore
import modelsRaw from '../MODELS.MD?raw';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prompt: Prompt;
  user: User | null;
  dict: Dictionary;
  theme: ThemeId;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onSuccess, prompt, user, dict, theme }) => {
  const [title, setTitle] = useState(prompt.title);
  const [description, setDescription] = useState(prompt.description || '');
  const [positive, setPositive] = useState(prompt.positive);
  const [negative, setNegative] = useState(prompt.negative || '');
  const [note, setNote] = useState(prompt.note || '');
  const [tags, setTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handlePublish = async () => {
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t);

    let imageUrl: string | undefined;

    // Upload image to Cloudinary if available
    if (imageFile && isCloudinaryConfigured()) {
      setIsUploading(true);
      try {
        const result = await uploadImage(imageFile);
        imageUrl = result.secure_url;
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Image upload failed. Publishing without image.');
      }
      setIsUploading(false);
    } else if (imagePreview) {
      // Fallback to base64 if Cloudinary not configured
      imageUrl = imagePreview;
    }

    const globalPrompt: GlobalPrompt = {
      id: generateId(),
      title,
      description,
      positive,
      negative,
      note,
      authorId: isAnonymous ? 'anonymous' : (user?.id || 'guest'),
      authorName: isAnonymous ? 'Anonymous' : (user?.displayName || 'Guest'),
      authorAvatar: isAnonymous ? null : user?.photoURL,
      tags: tagList,
      modelTags: prompt.modelTags || [],
      image: imageUrl,
      rating: 0,
      ratingCount: 0,
      comments: [],
      views: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await sharePrompt(globalPrompt);
    if (onSuccess) onSuccess();
    onClose();
    alert('Published to Global Prompts!');
  };

  // Theme Styles
  let bgClass = 'bg-white text-slate-800';
  let inputClass = 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500';
  
  if (theme === 'dark') {
    bgClass = 'bg-slate-800 text-white';
    inputClass = 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500';
  } else if (theme === 'binder') {
    bgClass = 'bg-[#1e1e1e] text-slate-200';
    inputClass = 'bg-[#2d2d2d] border-[#3d3d3d] text-slate-200 placeholder-slate-500 focus:border-blue-500';
  } else if (theme === 'journal') {
    bgClass = 'bg-white text-[#2c2c2c] font-[Poppins]';
    inputClass = 'bg-white border-slate-200 text-[#2c2c2c] placeholder-slate-400 focus:border-[#80c63c]';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${bgClass}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-500/10">
          <div className="flex items-center gap-2">
            <Globe className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold">{dict.shareToGlobal}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          <p className="opacity-70 text-sm">{dict.shareDescription}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{dict.title}</label>
                <input 
                  value={title} onChange={e => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{dict.description}</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border outline-none text-sm h-20 resize-none ${inputClass}`}
                />
              </div>
               <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{dict.tags}</label>
                <input 
                  value={tags} onChange={e => setTags(e.target.value)}
                  placeholder={dict.tagsPlaceholder}
                  className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                />
              </div>
            </div>

            <div className="space-y-4">
               {/* Image Upload */}
               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{dict.uploadImage}</label>
                  <div className={`relative w-full h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors ${
                      imagePreview ? 'border-blue-500' : 'border-gray-500/30 hover:border-blue-400'
                  }`}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={clearImage}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={32} className="opacity-30 mb-2" />
                        <span className="text-xs opacity-50 text-center px-4">{dict.uploadImage}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
               </div>

               {/* Anonymity */}
               <div className="flex items-center gap-3 pt-2">
                 <input 
                    type="checkbox" 
                    id="anon"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                 />
                 <label htmlFor="anon" className="text-sm font-medium cursor-pointer">{dict.anonymous}</label>
               </div>
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{dict.positivePrompt}</label>
             <textarea 
                value={positive} onChange={e => setPositive(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none text-xs font-mono h-24 ${inputClass}`}
              />
          </div>
          <div>
             <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{dict.negativePrompt}</label>
             <textarea 
                value={negative} onChange={e => setNegative(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none text-xs font-mono h-16 ${inputClass}`}
              />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-500/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-5 py-2 rounded-lg font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
          >
            {dict.cancel}
          </button>
          <button
            onClick={handlePublish}
            disabled={!title || !positive || isUploading}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isUploading ? (
              <><Loader2 size={16} className="animate-spin" /> Uploading...</>
            ) : (
              <><Upload size={16} /> {dict.publish}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
