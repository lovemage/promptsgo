
import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Palette, Code, PenTool, Camera, Music, Video, Gamepad2, Cpu, Globe, Zap, Heart, Star, Smile, Briefcase, Rocket, Coffee } from 'lucide-react';
import { Category, Dictionary, ThemeId } from '../types';
import { generateId } from '../services/storageService';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  dict: Dictionary;
  theme: ThemeId;
}

const COLORS = [
  'bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
  'bg-pink-500', 'bg-rose-500'
];

const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Code, PenTool, Camera, Music, Video, Gamepad2, 
  Cpu, Globe, Zap, Heart, Star, Smile, Briefcase, Rocket, Coffee
};

const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen, onClose, categories, onAddCategory, onDeleteCategory, dict, theme
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLORS[11]); 
  const [newCatIcon, setNewCatIcon] = useState('Star');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    const newCategory: Category = {
      id: generateId(),
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon
    };
    onAddCategory(newCategory);
    setNewCatName('');
  };

  const isDark = theme === 'dark' || theme === 'binder';
  
  // Theme Styles for Modal
  let modalBg = 'bg-white text-slate-800';
  let inputClass = 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500';
  let itemBg = 'border-slate-200 bg-slate-50';
  
  if (theme === 'dark') {
    modalBg = 'bg-slate-800 text-white';
    inputClass = 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500';
    itemBg = 'border-slate-700 bg-slate-900/50';
  } else if (theme === 'binder') {
    modalBg = 'bg-[#1e1e1e] text-slate-200';
    inputClass = 'bg-[#2d2d2d] border-[#3d3d3d] text-slate-200 placeholder-slate-500 focus:border-blue-500';
    itemBg = 'border-[#333] bg-[#252525]';
  } else if (theme === 'journal') {
    modalBg = 'bg-white text-[#2c2c2c] font-[Poppins]';
    inputClass = 'bg-white border-slate-200 text-[#2c2c2c] placeholder-slate-400 focus:border-[#80c63c]';
    itemBg = 'border-slate-100 bg-slate-50';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col ${modalBg}`}>
        
        <div className="flex items-center justify-between p-5 border-b border-gray-500/10">
          <h2 className="text-lg font-semibold">{dict.manageCategories}</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* List Existing */}
          <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map(cat => {
              const IconComp = ICON_MAP[cat.icon] || Star;
              return (
                <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg border ${itemBg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color} text-white shadow-sm`}>
                      <IconComp size={16} />
                    </div>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                        if (window.confirm(dict.confirmDelete)) {
                            onDeleteCategory(cat.id);
                        }
                    }}
                    className="p-1.5 opacity-60 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
            {categories.length === 0 && (
               <p className="text-center text-sm opacity-50 py-4">No categories yet.</p>
            )}
          </div>

          {/* Add New */}
          <div className={`p-4 rounded-xl border ${itemBg}`}>
            <h3 className="text-sm font-semibold mb-3 opacity-80">{dict.addCategory}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 opacity-70">{dict.categoryName}</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                  placeholder="e.g. 3D Art"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-medium mb-2 opacity-70">{dict.categoryIcon}</label>
                <div className="grid grid-cols-8 gap-2">
                  {Object.keys(ICON_MAP).map(iconName => {
                    const IconComp = ICON_MAP[iconName];
                    const isSelected = newCatIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        onClick={() => setNewCatIcon(iconName)}
                        className={`aspect-square flex items-center justify-center rounded-lg transition-all border ${
                          isSelected 
                            ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                            : `hover:bg-black/5 dark:hover:bg-white/10 border-transparent`
                        }`}
                        title={iconName}
                      >
                        <IconComp size={16} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium mb-2 opacity-70">{dict.categoryColor}</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCatColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${color} ${newCatColor === color ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110 opacity-80 hover:opacity-100'} ${isDark ? 'ring-offset-slate-800' : 'ring-offset-white'}`}
                    >
                      {newCatColor === color && <Check size={12} className="text-white mx-auto" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleAdd}
                disabled={!newCatName.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {dict.create}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
