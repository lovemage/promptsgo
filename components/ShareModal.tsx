
import React, { useState, useEffect } from 'react';
import { X, Globe, Upload, Image as ImageIcon, Loader2, Tag, Plus, Video as VideoIcon } from 'lucide-react';
import { Prompt, GlobalPrompt, Dictionary, User, ThemeId } from '../types';
import { sharePrompt, updatePrompt, getUniqueModelTags } from '../services/globalService';
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
  isEditingGlobalPrompt?: boolean;
  globalPromptId?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onSuccess, prompt, user, dict, theme, isEditingGlobalPrompt = false, globalPromptId }) => {
  const [title, setTitle] = useState(prompt.title);
  const [description, setDescription] = useState(prompt.description || '');
  const [positive, setPositive] = useState(prompt.positive);
  const [negative, setNegative] = useState(prompt.negative || '');
  const [note, setNote] = useState(prompt.note || '');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [modelTags, setModelTags] = useState<string[]>(prompt.modelTags || []);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const [componentFiles, setComponentFiles] = useState<File[]>([]);
  const [componentPreviews, setComponentPreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      // Parse models from MODELS.MD
      let models: string[] = [];
      if (modelsRaw) {
        models = modelsRaw.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.startsWith('- '))
          .map((line: string) => line.substring(2));
      }

      // Get model tags from database
      const dbModelTags = await getUniqueModelTags();
      const combinedModels = Array.from(new Set([...models, ...dbModelTags])).sort();
      setAvailableModels(combinedModels);
    };
    loadModels();
  }, []);

  // Reset form when prompt changes or modal opens
  useEffect(() => {
    if (isOpen && prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description || '');
      setPositive(prompt.positive);
      setNegative(prompt.negative || '');
      setNote(prompt.note || '');
      setTags([]);
      setCurrentTag('');
      setModelTags(prompt.modelTags || []);
      setIsAnonymous(false);
      setImageFile(null);

      // Load original image if editing
      if (isEditingGlobalPrompt) {
        if ((prompt as any).image) {
            setOriginalImage((prompt as any).image);
            setImagePreview((prompt as any).image);
        }
        if ((prompt as any).componentImages) {
            setComponentPreviews((prompt as any).componentImages);
        }
        if ((prompt as any).video) {
            setVideoPreview((prompt as any).video);
        }
      } else {
        setOriginalImage(null);
        setImagePreview(null);
        setComponentPreviews([]);
        setVideoPreview(null);
      }
    }
  }, [isOpen, prompt, isEditingGlobalPrompt]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleComponentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (componentFiles.length + files.length > 4) {
        alert("Max 4 component images allowed.");
        return;
      }
      setComponentFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setComponentPreviews(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setVideoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (isEditingGlobalPrompt && originalImage) {
      setImagePreview(originalImage);
    } else {
      setImagePreview(null);
    }
  };

  const clearComponentImage = (index: number) => {
      setComponentFiles(prev => prev.filter((_, i) => i !== index));
      setComponentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearVideo = () => {
      setVideoFile(null);
      setVideoPreview(null);
  };

  const handleAddTag = () => {
    const trimmed = currentTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setCurrentTag('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePublish = async () => {
    const tagList = tags;
    setIsUploading(true);

    let imageUrl = imagePreview || undefined;
    let videoUrl = videoPreview || undefined;
    let componentUrls = [...componentPreviews];

    // Helper for upload
    const upload = async (file: File) => {
        if (!isCloudinaryConfigured()) return null; // Fallback handled by preview logic
        const res = await uploadImage(file);
        return res.secure_url;
    };

    try {
        // Upload Result Image
        if (imageFile) {
            const url = await upload(imageFile);
            if (url) imageUrl = url;
        }

        // Upload Video
        if (videoFile) {
            const url = await upload(videoFile);
            if (url) videoUrl = url;
        }

        // Upload Component Images (Replace file placeholders in array? No, handle separately)
        // We assume previews contain old URLs if editing. New files need upload.
        // Simplified: Upload new files, then merge with existing URLs (if editing).
        // Since componentPreviews has mix of base64 and URLs, we need to replace base64 with uploaded URLs.
        
        // Better strategy: Clear previews? No.
        // We iterate componentFiles (new ones). Upload them.
        // We need to insert them into the correct order? Or just append?
        // User just adds.
        
        // Actually, logic is: existing URLs in componentPreviews should stay. Base64s should be replaced.
        // But aligning componentFiles with componentPreviews indices is hard if we delete.
        // Simple approach: Upload all new files. Append to existing URLs (from prompt).
        
        const newComponentUrls: string[] = [];
        if (isCloudinaryConfigured()) {
            for (const file of componentFiles) {
                const url = await upload(file);
                if (url) newComponentUrls.push(url);
            }
        }
        
        // Mix: If editing, we might have kept old URLs.
        // If not Cloudinary, we use base64.
        if (isCloudinaryConfigured()) {
             // Keep old URLs (filter out base64s from previews)
             const oldUrls = componentPreviews.filter(p => p.startsWith('http'));
             componentUrls = [...oldUrls, ...newComponentUrls];
        } else {
             // Use previews (base64)
             componentUrls = componentPreviews;
        }

    } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Saving with previews/placeholders.');
    }

    setIsUploading(false);

    const promptData = {
        title,
        description,
        positive,
        negative,
        note,
        authorId: user?.id || 'guest',
        authorName: user?.displayName || 'Guest',
        authorAvatar: user?.photoURL,
        tags: tagList,
        modelTags: modelTags,
        image: imageUrl,
        componentImages: componentUrls,
        video: videoUrl,
        updatedAt: Date.now()
    };

    if (isEditingGlobalPrompt && globalPromptId) {
      await updatePrompt({ ...promptData, id: globalPromptId } as GlobalPrompt);
      alert('Updated Global Prompt!');
    } else {
      await sharePrompt({ 
          ...promptData, 
          id: generateId(), 
          rating: 0, 
          ratingCount: 0, 
          comments: [], 
          views: 0, 
          createdAt: Date.now() 
      } as GlobalPrompt);
      alert('Published to Global Prompts!');
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  // Theme Styles
  let bgClass = 'bg-white text-slate-800';
  let inputClass = 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500';
  let modelButtonUnselectedClass = 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200';

  if (theme === 'dark') {
    bgClass = 'bg-slate-800 text-white';
    inputClass = 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500';
    modelButtonUnselectedClass = 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600';
  } else if (theme === 'binder') {
    bgClass = 'bg-[#1e1e1e] text-slate-200';
    inputClass = 'bg-[#2d2d2d] border-[#3d3d3d] text-slate-200 placeholder-slate-500 focus:border-blue-500';
    modelButtonUnselectedClass = 'bg-[#3d3d3d] border-[#4d4d4d] text-slate-200 hover:bg-[#4d4d4d]';
  } else if (theme === 'journal') {
    bgClass = 'bg-white text-[#2c2c2c] font-[Poppins]';
    inputClass = 'bg-white border-slate-200 text-[#2c2c2c] placeholder-slate-400 focus:border-[#80c63c]';
    modelButtonUnselectedClass = 'bg-slate-100 border-slate-200 text-[#2c2c2c] hover:bg-slate-200';
  } else if (theme === 'glass') {
    bgClass = 'bg-white/60 text-slate-800 backdrop-blur-xl border border-white/20 shadow-2xl';
    inputClass = 'bg-white/40 border-white/30 text-slate-900 placeholder-slate-500 focus:border-white/50 focus:bg-white/60';
    modelButtonUnselectedClass = 'bg-white/30 border-white/20 text-slate-800 hover:bg-white/40';
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
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                    <input 
                      value={currentTag} 
                      onChange={e => setCurrentTag(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={handleAddTag}
                      placeholder="Type tag and press Enter or Comma..."
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                    />
                    <button 
                        onClick={handleAddTag}
                        className={`p-2 rounded-lg border transition-colors ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Plus size={16} />
                    </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Models</label>
                <div className="flex flex-wrap gap-2">
                  {availableModels.map(model => (
                    <button
                      key={model}
                      onClick={() => {
                        setModelTags(prev =>
                          prev.includes(model)
                            ? prev.filter(m => m !== model)
                            : [...prev, model]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        modelTags.includes(model)
                          ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                          : modelButtonUnselectedClass
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
               {/* Result Image */}
               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Result Image (Main)</label>
                  <div className={`relative w-full h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors ${
                      imagePreview ? 'border-blue-500' : 'border-gray-500/30 hover:border-blue-400'
                  }`}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={32} className="opacity-30 mb-2" />
                        <span className="text-xs opacity-50 text-center px-4">Upload Main Image</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </>
                    )}
                  </div>
               </div>

               {/* Component Images */}
               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Component Images (Max 4)</label>
                  <div className="grid grid-cols-4 gap-2">
                      {componentPreviews.map((preview, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-500/20 group">
                              <img src={preview} className="w-full h-full object-cover" alt={`Comp ${idx}`} />
                              <button onClick={() => clearComponentImage(idx)} className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                          </div>
                      ))}
                      {componentPreviews.length < 4 && (
                          <div className="aspect-square rounded-lg border-2 border-dashed border-gray-500/30 hover:border-blue-400 flex items-center justify-center relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <Plus size={20} className="opacity-50" />
                              <input type="file" accept="image/*" multiple onChange={handleComponentUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                      )}
                  </div>
               </div>

               {/* Video Upload */}
               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Video (Max 1)</label>
                  <div className={`relative w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors ${
                      videoPreview ? 'border-blue-500' : 'border-gray-500/30 hover:border-blue-400'
                  }`}>
                    {videoPreview ? (
                      <>
                        <video src={videoPreview} className="w-full h-full object-cover" controls />
                        <button onClick={clearVideo} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <VideoIcon size={24} className="opacity-30 mb-1" />
                        <span className="text-xs opacity-50 text-center px-4">Upload Video</span>
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
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
              <><Upload size={16} /> {isEditingGlobalPrompt ? 'Update' : dict.publish}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
