import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit, Save, Loader2 } from 'lucide-react';
import { uploadImage } from '../services/cloudinaryService';
import * as globalService from '../services/globalService';

interface HeroCarouselProps {
  isAdmin: boolean;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ isAdmin }) => {
  const [banners, setBanners] = useState<{id: string, url: string}[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    const data = await globalService.getBanners();
    setBanners(data);
  };

  useEffect(() => {
    if (banners.length > 1 && !isEditing) {
      const interval = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length, isEditing]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadImage(file);
      await globalService.addBanner(res.secure_url);
      await loadBanners();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed");
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this banner?")) {
        await globalService.deleteBanner(id);
        await loadBanners();
        setActiveIndex(0);
    }
  };

  if (banners.length === 0 && !isAdmin) return null;

  return (
    <div className="relative w-full aspect-[16/5] overflow-hidden rounded-2xl shadow-xl group mb-6 bg-gray-100 dark:bg-gray-800">
      {/* Slides */}
      {banners.length > 0 ? (
        banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={banner.url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        ))
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
           No banners
        </div>
      )}

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <button 
             onClick={() => setActiveIndex(prev => (prev - 1 + banners.length) % banners.length)}
             className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
             <ChevronLeft size={24} />
          </button>
          <button 
             onClick={() => setActiveIndex(prev => (prev + 1) % banners.length)}
             className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
             <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2">
           {isEditing ? (
              <div className="flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm animate-in fade-in">
                 <label className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer relative overflow-hidden">
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
                 </label>
                 {banners.length > 0 && (
                    <button onClick={() => handleDelete(banners[activeIndex].id)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded">
                       <Trash2 size={16} />
                    </button>
                 )}
                 <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded">
                    <Save size={16} />
                 </button>
              </div>
           ) : (
              <button onClick={() => setIsEditing(true)} className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm">
                 <Edit size={16} />
              </button>
           )}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
