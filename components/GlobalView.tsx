
import React, { useState, useEffect } from 'react';
import { GlobalPrompt, Dictionary, ThemeId, User } from '../types';
import GlobalPromptCard from './GlobalPromptCard';
import * as globalService from '../services/globalService';
import { LayoutGrid, Search, Filter } from 'lucide-react';
// @ts-ignore
import modelsRaw from '../MODELS.MD?raw';

interface GlobalViewProps {
  user: User | null;
  dict: Dictionary;
  theme: ThemeId;
  viewMode?: 'all' | 'collection';
  collectedIds?: string[];
  onToggleCollect?: (id: string) => void;
}

// Common tags for navigation
const POPULAR_TAGS = ['All', 'Portrait', 'Landscape', 'Sci-Fi', 'Fantasy', 'Anime', 'Realistic', 'Cyberpunk', 'Architecture'];

const GlobalView: React.FC<GlobalViewProps> = ({ user, dict, theme, viewMode = 'all', collectedIds = [], onToggleCollect }) => {
  const [prompts, setPrompts] = useState<GlobalPrompt[]>([]);
  const [activeTag, setActiveTag] = useState('All');
  const [activeModel, setActiveModel] = useState('All');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadPrompts = async () => {
      const data = await globalService.getGlobalPrompts();
      setPrompts(data);
    };
    loadPrompts();

    if (modelsRaw) {
       const models = modelsRaw.split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.startsWith('- '))
        .map((line: string) => line.substring(2));
       setAvailableModels(models);
    }
  }, []);

  const filteredPrompts = prompts.filter(p => {
    const matchTag = activeTag === 'All' || p.tags.some(t => t.toLowerCase() === activeTag.toLowerCase());
    const matchModel = activeModel === 'All' || (p.modelTags && p.modelTags.includes(activeModel));
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                        p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCollection = viewMode === 'collection' ? collectedIds.includes(p.id) : true;
    
    return matchTag && matchSearch && matchModel && matchCollection;
  });

  const isDark = theme === 'dark' || theme === 'binder';

  return (
    <div className="flex flex-col h-full">
       {/* Top Navigation Bar (Tags) */}
       <div className={`sticky top-0 z-10 px-8 py-4 border-b flex flex-col gap-4 backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-white/5' : 'bg-white/80 border-slate-200/50'}`}>
          
          <div className="flex items-center justify-between">
             <h2 className={`text-xl font-bold ${theme === 'journal' ? 'text-[#2c2c2c]' : 'bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent'}`}>
                {viewMode === 'collection' ? 'GP Collection' : dict.globalPrompts}
             </h2>
             
             <div className="flex items-center gap-3">
               {/* Model Filter */}
               <div className="relative">
                 <select
                   value={activeModel}
                   onChange={e => setActiveModel(e.target.value)}
                   className={`appearance-none pl-8 pr-8 py-1.5 rounded-full text-xs font-medium border outline-none cursor-pointer ${
                      isDark ? 'bg-black/20 border-white/10 focus:border-white/30 text-white' : 
                      'bg-slate-100 border-transparent focus:bg-white focus:border-slate-300 text-slate-700'
                   }`}
                 >
                   <option value="All">All Models</option>
                   {availableModels.map(model => (
                     <option key={model} value={model}>{model}</option>
                   ))}
                 </select>
                 <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
               </div>

               {/* Mini Search for Global */}
               <div className="relative w-48 lg:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={dict.searchPlaceholder}
                    className={`w-full pl-9 pr-3 py-1.5 rounded-full text-xs border outline-none ${
                       isDark ? 'bg-black/20 border-white/10 focus:border-white/30' : 
                       theme === 'journal' ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-[#80c63c] focus:ring-1 focus:ring-[#80c63c]/20' :
                       'bg-slate-100 border-transparent focus:bg-white focus:border-slate-300'
                    }`}
                  />
               </div>
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
             {POPULAR_TAGS.map(tag => (
                <button
                   key={tag}
                   onClick={() => setActiveTag(tag)}
                   className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                      activeTag === tag
                        ? (theme === 'journal' ? 'bg-[#80c63c] text-white border-[#80c63c] shadow-md shadow-[#80c63c]/20' : 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20')
                        : `${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-100 border-transparent hover:bg-slate-200'} opacity-70 hover:opacity-100`
                   }`}
                >
                   {tag}
                </button>
             ))}
          </div>
       </div>

       {/* Content Grid */}
       <div className="flex-1 overflow-y-auto p-8">
          {filteredPrompts.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-40">
                <LayoutGrid size={48} strokeWidth={1} />
                <p className="mt-4 text-sm font-medium">No global prompts found.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {filteredPrompts.map(prompt => (
                   <GlobalPromptCard 
                      key={prompt.id} 
                      prompt={prompt} 
                      user={user}
                      dict={dict}
                      theme={theme}
                      isCollected={collectedIds.includes(prompt.id)}
                      onToggleCollect={onToggleCollect}
                   />
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

export default GlobalView;
