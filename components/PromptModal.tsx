
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Star, Palette, Code, PenTool, Camera, Music, Video, Gamepad2, Cpu, Zap, Heart, Smile, Briefcase, Rocket, Coffee, Tag, Plus } from 'lucide-react';
import { Prompt, Category, Dictionary, ThemeId } from '../types';
import { generateId } from '../services/storageService';
import { refinePromptWithAI, generateShareMetaWithAI } from '../services/geminiService';
import { getUniqueModelTags } from '../services/globalService';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Prompt) => void;
  initialPrompt?: Prompt | null;
  categories: Category[];
  dict: Dictionary;
  theme: ThemeId;
  language: string;
}

const getIcon = (name: string) => {
  const map: any = { Palette, Code, PenTool, Camera, Music, Video, Gamepad2, Cpu, Zap, Heart, Star, Smile, Briefcase, Rocket, Coffee };
  return map[name] || Star;
};

const PromptModal: React.FC<PromptModalProps> = ({ 
  isOpen, onClose, onSave, initialPrompt, categories, dict, theme, language
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [positive, setPositive] = useState('');
  const [negative, setNegative] = useState('');
  const [note, setNote] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [modelTags, setModelTags] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    const loadTags = async () => {
      const dbTags = await getUniqueModelTags();
      const combined = Array.from(new Set([...dbTags])).sort();
      setAvailableModels(combined);
    };
    loadTags();
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setTitle(initialPrompt.title);
      setDescription(initialPrompt.description || '');
      setPositive(initialPrompt.positive);
      setNegative(initialPrompt.negative || '');
      setNote(initialPrompt.note || '');
      setSelectedCats(initialPrompt.categoryIds);
      setModelTags(initialPrompt.modelTags || []);
    } else {
      setTitle('');
      setDescription('');
      setPositive('');
      setNegative('');
      setNote('');
      setSelectedCats([]);
      setModelTags([]);
    }
  }, [initialPrompt, isOpen]);

  const handleSave = () => {
    if (!title.trim() || !positive.trim()) return;

    const newPrompt: Prompt = {
      id: initialPrompt ? initialPrompt.id : generateId(),
      title,
      description,
      positive,
      negative,
      note,
      categoryIds: selectedCats,
      modelTags: modelTags,
      createdAt: initialPrompt ? initialPrompt.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    onSave(newPrompt);
    onClose();
  };

  const handleRefine = async () => {
    if (!positive) return;
    setIsRefining(true);
    try {
      const improved = await refinePromptWithAI(positive);
      setPositive(improved);

      if ((!title.trim() || !description.trim()) && improved.trim()) {
        const meta = await generateShareMetaWithAI(improved, language);
        if (meta) {
          if (!title.trim() && meta.title.trim()) setTitle(meta.title.trim());
          if (!description.trim() && meta.description.trim()) setDescription(meta.description.trim());
        }
      }
    } finally {
      setIsRefining(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCats(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAddModelTag = (tag: string) => {
    if (tag && !modelTags.includes(tag)) {
      setModelTags([...modelTags, tag]);
    }
    setNewTag('');
  };

  const handleRemoveModelTag = (tag: string) => {
    setModelTags(modelTags.filter(t => t !== tag));
  };

  if (!isOpen) return null;

  // Theme Logic
  let bgClass = 'bg-white text-slate-800';
  let inputClass = 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500';
  let catInactiveClass = 'border-slate-300 bg-transparent opacity-60 hover:opacity-100';

  if (theme === 'dark') {
    bgClass = 'bg-slate-800 text-white';
    inputClass = 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500';
    catInactiveClass = 'border-slate-600 bg-transparent opacity-60 hover:opacity-100';
  } else if (theme === 'binder') {
    bgClass = 'bg-[#1e1e1e] text-slate-200';
    inputClass = 'bg-[#2d2d2d] border-[#3d3d3d] text-slate-200 placeholder-slate-500 focus:border-blue-500';
    catInactiveClass = 'border-[#444] bg-transparent opacity-60 hover:opacity-100';
  } else if (theme === 'journal') {
    bgClass = 'bg-white text-[#2c2c2c] font-[Poppins]';
    inputClass = 'bg-white border-slate-200 text-[#2c2c2c] placeholder-slate-400 focus:border-[#80c63c]';
    catInactiveClass = 'border-slate-200 bg-transparent opacity-60 hover:opacity-100';
  } else if (theme === 'glass') {
    bgClass = 'bg-white/60 text-slate-800 backdrop-blur-xl border border-white/20 shadow-2xl';
    inputClass = 'bg-white/40 border-white/30 text-slate-900 placeholder-slate-500 focus:border-white/50 focus:bg-white/60';
    catInactiveClass = 'border-white/30 bg-white/20 hover:bg-white/30';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${bgClass}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-500/10">
          <h2 className="text-xl font-semibold">{initialPrompt ? dict.edit : dict.newPrompt}</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-70">{dict.title}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all ${inputClass}`}
              placeholder="e.g., Cyberpunk City"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">{dict.categories}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const IconComp = getIcon(cat.icon);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      selectedCats.includes(cat.id)
                        ? `${cat.color} text-white border-transparent shadow-sm`
                        : catInactiveClass
                    }`}
                  >
                    <IconComp size={12} />
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-70">{dict.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none resize-none h-16 transition-all ${inputClass}`}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-70">{dict.note}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={dict.notePlaceholder}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none resize-none h-16 transition-all ${inputClass}`}
            />
          </div>

          {/* Model Tags */}
          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Model Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {modelTags.map(tag => (
                <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                   theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {tag}
                  <button onClick={() => handleRemoveModelTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModelTag(newTag))}
                  placeholder="Add custom tag..."
                  className={`w-full px-4 py-2 rounded-lg border outline-none text-sm ${inputClass}`}
                  list="model-suggestions"
                />
                <datalist id="model-suggestions">
                  {availableModels.map(model => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </div>
              <button 
                onClick={() => handleAddModelTag(newTag)}
                className={`p-2 rounded-lg border transition-colors ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
               {availableModels.map(model => (
                 !modelTags.includes(model) && (
                   <button 
                      key={model}
                      onClick={() => handleAddModelTag(model)}
                      className="text-[10px] px-2 py-1 rounded-full border border-dashed opacity-50 hover:opacity-100 hover:border-blue-400 hover:text-blue-500 transition-all"
                   >
                     + {model}
                   </button>
                 )
               ))}
            </div>
          </div>

          {/* Positive Prompt */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium opacity-70">{dict.positivePrompt}</label>
              <button 
                onClick={handleRefine}
                disabled={isRefining || !positive}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 disabled:opacity-50"
              >
                {isRefining ? (
                  <span className="animate-pulse">{dict.refining}</span>
                ) : (
                  <>
                    <Sparkles size={12} /> {dict.refineWithAI}
                  </>
                )}
              </button>
            </div>
            <textarea
              value={positive}
              onChange={(e) => setPositive(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none resize-y h-32 font-mono text-sm transition-all ${inputClass}`}
              placeholder="masterpiece, best quality, ..."
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-70">{dict.negativePrompt}</label>
            <textarea
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border outline-none resize-y h-20 font-mono text-sm transition-all ${inputClass}`}
              placeholder="low quality, blurry, ..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-500/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className={`px-5 py-2 rounded-lg font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5`}
          >
            {dict.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={!title || !positive}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {dict.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
