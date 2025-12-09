
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, LayoutGrid, Settings, Trash2, 
  Copy, Edit2, Tag, Globe, ChevronsUpDown, Check, Palette as PaletteIcon,
  // Icon Imports for mapping
  Palette, Code, PenTool, Camera, Music, Video, Gamepad2, 
  Cpu, Zap, Heart, Star, Smile, Briefcase, Rocket, Coffee,
  User, LogOut, StickyNote, Share2, Bookmark, Menu
} from 'lucide-react';
import { Prompt, Category, ThemeId, LanguageCode, User as UserType } from './types';
import { TRANSLATIONS, DEFAULT_CATEGORIES } from './constants';
import { loadState, saveState, generateId } from './services/storageService';
import { signInWithGoogle, signOut, onAuthStateChanged } from './services/authService';
import * as globalService from './services/globalService';
import PromptModal from './components/PromptModal';
import CategoryManager from './components/CategoryManager';
import GlobalView from './components/GlobalView';
import ShareModal from './components/ShareModal';
import LegalView from './components/LegalView';
import WebViewWarning from './components/WebViewWarning';
import OnboardingTour, { TourStep } from './components/OnboardingTour';
import { isWebView, getWebViewType } from './utils/webviewDetector';

// Icon mapping helper
const getIconComponent = (iconName: string) => {
  const map: Record<string, React.ElementType> = {
    Palette, Code, PenTool, Camera, Music, Video, Gamepad2, 
    Cpu, Zap, Heart, Star, Smile, Briefcase, Rocket, Coffee
  };
  return map[iconName] || Star;
};

// Custom Compass Logo Component
const PromptsGoLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5" />
    <path d="M20 3V6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M20 34V37" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M37 20H34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M6 20H3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <g transform="rotate(45 20 20)">
      <path d="M20 9L24 20H16L20 9Z" fill="currentColor" />
      <path d="M20 31L16 20H24L20 31Z" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="20" cy="20" r="2" fill="currentColor" />
      <circle cx="20" cy="20" r="0.8" fill="var(--logo-bg, white)" />
    </g>
  </svg>
);

function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [collectedGlobalIds, setCollectedGlobalIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshGlobal, setRefreshGlobal] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'local' | 'global' | 'collection' | 'terms' | 'privacy'>('global');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [theme, setTheme] = useState<ThemeId>('journal');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [sharingPrompt, setSharingPrompt] = useState<Prompt | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditingGlobalPrompt, setIsEditingGlobalPrompt] = useState(false);
  const [editingGlobalPromptId, setEditingGlobalPromptId] = useState<string | null>(null);
  const [highlightPromptId, setHighlightPromptId] = useState<string | null>(null);

  // WebView Detection
  const [showWebViewWarning, setShowWebViewWarning] = useState(false);
  const [webViewType, setWebViewType] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Deep Linking & Auth Listener
  useEffect(() => {
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const promptId = params.get('promptId');
    if (promptId) {
       setCurrentView('global');
       setHighlightPromptId(promptId);
    }

    // Check if running in WebView
    if (isWebView()) {
      const type = getWebViewType();
      setWebViewType(type);
      setShowWebViewWarning(true);
    }

    let timer: NodeJS.Timeout | null = null;

    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      // Check for Onboarding Tour
      if (user) {
         const hasSeenTour = localStorage.getItem(`promptsgo_tour_completed_${user.id}`);
         if (!hasSeenTour) {
            // Delay slightly to ensure UI is rendered
            timer = setTimeout(() => {
               // Ensure we are on local view for the tour
               setCurrentView('local');
               setIsTourOpen(true);
            }, 1000);
         }
      }
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Load Data when User changes
  useEffect(() => {
    if (isAuthLoading) return;

    const loaded = loadState(currentUser?.id);
    if (loaded.prompts) setPrompts(loaded.prompts);
    if (loaded.categories) setCategories(loaded.categories);
    if (loaded.language) setLanguage(loaded.language);
    if (loaded.theme) setTheme(loaded.theme);
    if (loaded.collectedGlobalIds) setCollectedGlobalIds(loaded.collectedGlobalIds);
    
    setSelectedCategoryId(null);
  }, [currentUser, isAuthLoading]);

  // Save Data
  useEffect(() => {
    if (isAuthLoading) return;
    saveState({ prompts, categories, language, theme, collectedGlobalIds }, currentUser?.id);
  }, [prompts, categories, language, theme, collectedGlobalIds, currentUser, isAuthLoading]);

  const dict = TRANSLATIONS[language];

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.positive.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId ? p.categoryIds.includes(selectedCategoryId) : true;
      const matchesUncategorized = selectedCategoryId === 'uncategorized' ? p.categoryIds.length === 0 : true;

      if (selectedCategoryId === 'uncategorized') return matchesSearch && matchesUncategorized;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, selectedCategoryId]);

  const handleSavePrompt = (prompt: Prompt) => {
    if (editingPrompt) {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? prompt : p));
    } else {
      setPrompts(prev => [prompt, ...prev]);
    }
    setEditingPrompt(null);
  };

  const handleDeletePrompt = (id: string) => {
    if (window.confirm(dict.confirmDelete)) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleCopy = (text: string, uniqueId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(uniqueId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  const handleOpenShare = (prompt: Prompt) => {
    setSharingPrompt(prompt);
    setIsShareModalOpen(true);
  };

  const handleAddCategory = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setPrompts(prev => prev.map(p => ({
      ...p,
      categoryIds: p.categoryIds.filter(cid => cid !== id)
    })));
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleToggleCollect = (id: string) => {
    setCollectedGlobalIds(prev => {
      const isCollecting = !prev.includes(id);
      const updated = isCollecting ? [...prev, id] : prev.filter(pid => pid !== id);

      // Update global collect counts
      const globalCollectCounts = JSON.parse(localStorage.getItem('promptsgo_global_collect_counts') || '{}');
      if (isCollecting) {
        globalCollectCounts[id] = (globalCollectCounts[id] || 0) + 1;
      } else {
        globalCollectCounts[id] = Math.max(0, (globalCollectCounts[id] || 0) - 1);
      }
      localStorage.setItem('promptsgo_global_collect_counts', JSON.stringify(globalCollectCounts));

      return updated;
    });
  };

  const handlePublishSuccess = () => {
    setRefreshGlobal(prev => prev + 1);
  };

  const handleShareGlobalPrompt = (globalPrompt: any) => {
    // Convert GlobalPrompt to Prompt and save to local prompts
    const newPrompt: Prompt = {
      id: generateId(),
      title: globalPrompt.title,
      description: globalPrompt.description || '',
      positive: globalPrompt.positive,
      negative: globalPrompt.negative || '',
      note: globalPrompt.note || '',
      categoryIds: [],
      modelTags: globalPrompt.modelTags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add to local prompts
    setPrompts(prev => [newPrompt, ...prev]);
    alert(`✅ "${globalPrompt.title}" 已收藏到你的本地卡片！`);
  };

  const handleEditGlobalPrompt = (globalPrompt: any) => {
    // Open ShareModal with the GP data for editing
    setSharingPrompt({
      id: globalPrompt.id,
      title: globalPrompt.title,
      description: globalPrompt.description || '',
      positive: globalPrompt.positive,
      negative: globalPrompt.negative || '',
      note: globalPrompt.note || '',
      categoryIds: [],
      modelTags: globalPrompt.modelTags || [],
      createdAt: globalPrompt.createdAt,
      updatedAt: Date.now(),
      // Include image, componentImages, and video for editing
      image: globalPrompt.image,
      componentImages: globalPrompt.componentImages,
      video: globalPrompt.video,
    } as any);
    setIsEditingGlobalPrompt(true);
    setEditingGlobalPromptId(globalPrompt.id);
    setIsShareModalOpen(true);
  };

  const handleDeleteGlobalPrompt = async (promptId: string) => {
    try {
      await globalService.deletePrompt(promptId);
      setRefreshGlobal(prev => prev + 1);
      alert('✅ 已刪除該卡片');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('❌ 刪除失敗');
    }
  };

  const handleTourComplete = () => {
     setIsTourOpen(false);
     setIsSidebarOpen(false); // Close sidebar after tour
     if (currentUser) {
        localStorage.setItem(`promptsgo_tour_completed_${currentUser.id}`, 'true');
     }
  };

  const handleTourStepChange = (index: number) => {
     // Steps 0 (Nav), 1 (New Prompt), 2 (Categories) are in sidebar
     if (index <= 2) {
        setIsSidebarOpen(true);
     } else {
        // Step 3 (Share) is in main area
        setIsSidebarOpen(false);
     }
  };

  const tourSteps: TourStep[] = [
     {
        targetId: 'nav-local-prompts',
        title: dict.tourStep1Title,
        content: dict.tourStep1Content,
        position: 'right'
     },
     {
        targetId: 'btn-new-prompt',
        title: dict.tourStep2Title,
        content: dict.tourStep2Content,
        position: 'bottom'
     },
     {
        targetId: 'btn-category-settings',
        title: dict.tourStep3Title,
        content: dict.tourStep3Content,
        position: 'right'
     },
     {
        targetId: 'btn-share-prompt-0',
        title: dict.tourStep4Title,
        content: dict.tourStep4Content,
        position: 'left'
     }
  ];

  // --- THEMING ---
  const isDark = theme === 'dark' || theme === 'binder';

  // Styles definitions
  const getStyles = () => {
    switch(theme) {
      case 'dark':
        return {
          app: 'bg-slate-900 text-slate-100',
          sidebar: 'border-slate-800 bg-slate-900/80',
          header: 'border-slate-800 bg-slate-900/50',
          card: 'bg-slate-800/50 hover:bg-slate-800 border-slate-700',
          activeItem: 'bg-slate-800 text-white',
          hoverItem: 'hover:bg-white/5',
          input: 'bg-slate-800 border-slate-700 focus:border-blue-500 placeholder-slate-500',
          positiveBox: 'bg-black/30 border-white/5',
          logoColor: 'text-blue-500',
          logoBg: '#0f172a'
        };
      case 'binder':
        return {
          app: 'bg-[#fdfbf7] text-slate-800',
          sidebar: 'border-transparent bg-[#2c2c2c] text-slate-200 shadow-xl',
          header: 'border-transparent bg-[#fdfbf7]/90 backdrop-blur-none',
          card: 'bg-white/90 hover:bg-white border-slate-200 shadow-sm hover:shadow-md',
          activeItem: 'bg-white/10 text-white',
          hoverItem: 'hover:bg-white/5',
          input: 'bg-white border-slate-300 focus:border-slate-500 focus:ring-slate-200',
          positiveBox: 'bg-slate-50 border-slate-200',
          logoColor: 'text-slate-200',
          logoBg: '#2c2c2c',
          mainAreaStyle: {
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)',
            backgroundAttachment: 'local'
          }
        };
      case 'journal':
        return {
          app: 'bg-white text-[#2c2c2c] font-[Poppins]',
          sidebar: 'border-slate-100 bg-white text-[#2c2c2c]',
          header: 'border-slate-100 bg-white/90 backdrop-blur-sm',
          card: 'bg-white hover:bg-[#fefbf6] border-slate-200 shadow-sm hover:shadow-md hover:border-[#80c63c] transition-all',
          activeItem: 'bg-[#e6ffeb] text-[#0c9e2d] font-semibold',
          hoverItem: 'hover:bg-slate-50',
          input: 'bg-white border-slate-200 focus:border-[#80c63c] focus:ring-2 focus:ring-[#80c63c]/20 placeholder-slate-400',
          positiveBox: 'bg-[#fefbf6] border-[#e6eddd]',
          logoColor: 'text-[#0fd03b]',
          logoBg: '#ffffff'
        };
      case 'glass':
        return {
          app: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-900',
          sidebar: 'border-white/30 bg-white/20 backdrop-blur-xl shadow-xl',
          header: 'border-white/20 bg-white/10 backdrop-blur-md',
          card: 'bg-white/30 hover:bg-white/40 border-white/40 shadow-lg hover:shadow-xl backdrop-blur-md',
          activeItem: 'bg-white/40 text-blue-600 shadow-md',
          hoverItem: 'hover:bg-white/10',
          input: 'bg-white/30 border-white/40 focus:border-blue-400 focus:ring-blue-200 placeholder-slate-500 backdrop-blur-sm',
          positiveBox: 'bg-white/20 border-white/30 backdrop-blur-sm',
          logoColor: 'text-blue-600',
          logoBg: 'rgba(255, 255, 255, 0.1)'
        };
      case 'royal':
        return {
          app: 'bg-[#FDF6E8] text-slate-800 font-sans',
          sidebar: 'border-[#456685] bg-[#547A9E] text-white',
          header: 'border-[#9DBDD7] bg-[#FDF6E8]/90',
          card: 'bg-white hover:bg-white border-[#9DBDD7] shadow-sm hover:shadow-md',
          activeItem: 'bg-[#9DBDD7] text-[#456685] font-semibold',
          hoverItem: 'hover:bg-[#9DBDD7]/20',
          input: 'bg-white border-[#9DBDD7] focus:border-[#547A9E] focus:ring-[#9DBDD7]/30 placeholder-slate-400',
          positiveBox: 'bg-white border-[#9DBDD7]',
          logoColor: 'text-white',
          logoBg: '#547A9E'
        };
      case 'light':
      default:
        return {
          app: 'bg-slate-50 text-slate-900',
          sidebar: 'border-slate-200 bg-white/60',
          header: 'border-slate-200/50 bg-white/50',
          card: 'bg-white/60 hover:bg-white border-white/50 shadow-sm hover:shadow-md',
          activeItem: 'bg-white shadow-sm text-blue-600',
          hoverItem: 'hover:bg-black/5',
          input: 'bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100',
          positiveBox: 'bg-slate-50 border-slate-200',
          logoColor: 'text-blue-600',
          logoBg: 'white'
        };
    }
  };

  const styles = getStyles();

  const languages: {code: LanguageCode; label: string}[] = [
    { code: 'en', label: 'English' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'ja', label: '日本語' },
  ];

  const themes: {id: ThemeId; label: string}[] = [
    { id: 'light', label: dict.themeLight },
    { id: 'dark', label: dict.themeDark },
    { id: 'binder', label: dict.themeBinder },
    { id: 'journal', label: dict.themeJournal },
    { id: 'glass', label: dict.themeGlass },
    { id: 'royal', label: dict.themeRoyal },
  ];

  // Force global view if not logged in
  const activeView = currentUser ? currentView : 'global';

  return (
    <div 
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${styles.app}`} 
      style={{ 
        '--logo-bg': styles.logoBg 
      } as React.CSSProperties}
    >
      
      {/* Mobile Header */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b backdrop-blur-md z-40 sticky top-0 ${styles.header}`}>
         <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
               <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
               <PromptsGoLogo className={`w-6 h-6 ${styles.logoColor}`} />
               <span className="font-bold">{dict.appTitle}</span>
            </div>
         </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
         <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
         />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${styles.sidebar}`}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold flex items-center gap-3 select-none">
            <PromptsGoLogo className={`w-8 h-8 ${styles.logoColor}`} />
            <span className={`${theme === 'light' || theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent' : ''}`}>
              {dict.appTitle}
            </span>
          </h1>
        </div>
        
        {/* Mobile Sidebar Header */}
        <div className="p-4 md:hidden flex items-center justify-between border-b border-gray-500/10 mb-2">
            <h1 className="text-lg font-bold flex items-center gap-2">
               <PromptsGoLogo className={`w-6 h-6 ${styles.logoColor}`} />
               {dict.appTitle}
            </h1>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
               <Menu size={20} />
            </button>
        </div>

        <div className="px-4 mb-4 mt-2 md:mt-0">
          <button
            id="btn-new-prompt"
            onClick={handleOpenNew}
            disabled={!currentUser}
            className={`w-full py-2.5 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2
              ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}
              ${theme === 'journal' ? 'bg-[#80c63c] hover:bg-[#6fae32] text-white shadow-[#80c63c]/30' :
                theme === 'binder' ? 'bg-slate-200 hover:bg-white text-slate-800 shadow-black/20' :
                theme === 'glass' ? 'bg-blue-400/60 hover:bg-blue-400/80 text-white shadow-blue-400/30 backdrop-blur-md' :
                'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
          >
            <Plus size={18} /> {dict.newPrompt}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar pb-6">
          
          {/* Global Prompts Item */}
          <button
            onClick={() => setCurrentView('global')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mb-2 ${
              activeView === 'global' ? styles.activeItem : styles.hoverItem
            }`}
          >
            <Globe size={16} className="text-pink-500" />
            {dict.globalPrompts}
          </button>
          
          {/* GP Collection Item */}
          <button
            onClick={() => setCurrentView('collection')}
            disabled={!currentUser}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mb-4 ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''} ${
              activeView === 'collection' ? styles.activeItem : styles.hoverItem
            }`}
          >
            <Bookmark size={16} className="text-yellow-500" />
            GP Collection
            <span className="ml-auto text-xs opacity-50">{collectedGlobalIds.length}</span>
          </button>

          {/* My Library (Local Prompts) */}
          <button
            id="nav-local-prompts"
            onClick={() => {
              setCurrentView('local');
              setSelectedCategoryId(null);
            }}
            disabled={!currentUser}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''} ${
              activeView === 'local' && selectedCategoryId === null ? styles.activeItem : styles.hoverItem
            }`}
          >
            <LayoutGrid size={16} />
            <div className="flex-1">
              <div>{dict.myLibrary}</div>
              <div className={`text-xs opacity-50 ${theme === 'binder' ? 'text-slate-400' : ''}`}>{dict.localPrompts}</div>
            </div>
            <span className="ml-auto text-xs opacity-50">{prompts.length}</span>
          </button>

          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider opacity-50 ${!currentUser ? 'opacity-30' : ''}`}>{dict.categories}</span>
            <button 
              id="btn-category-settings"
              onClick={() => setIsCategoryManagerOpen(true)}
              disabled={!currentUser}
              className={`p-1 rounded transition-colors ${!currentUser ? 'opacity-30 cursor-not-allowed' : styles.hoverItem}`}
              title={dict.manageCategories}
            >
              <Settings size={12} className="opacity-50" />
            </button>
          </div>
          
          {categories.map(cat => {
            const IconComp = getIconComponent(cat.icon);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCurrentView('local');
                  setSelectedCategoryId(cat.id);
                }}
                disabled={!currentUser}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''} ${
                  activeView === 'local' && selectedCategoryId === cat.id ? styles.activeItem : styles.hoverItem
                }`}
              >
                <div className={`p-1 rounded-md text-white ${cat.color} shrink-0`}>
                  <IconComp size={12} />
                </div>
                <span className="truncate">{cat.name}</span>
                <span className="ml-auto text-xs opacity-50 shrink-0">
                  {prompts.filter(p => p.categoryIds.includes(cat.id)).length}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
               setCurrentView('local');
               setSelectedCategoryId('uncategorized');
            }}
            disabled={!currentUser}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''} ${
              activeView === 'local' && selectedCategoryId === 'uncategorized' ? styles.activeItem : styles.hoverItem
            }`}
          >
            <Tag size={16} />
            {dict.uncategorized}
            <span className="ml-auto text-xs opacity-50">
              {prompts.filter(p => p.categoryIds.length === 0).length}
            </span>
          </button>

          {/* User / Settings Section */}
          <div className={`mt-6 pt-4 border-t ${theme === 'dark' ? 'border-slate-800' : theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
            
            {/* User Profile */}
            <div className="mb-3 px-2">
              {currentUser ? (
                <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${styles.hoverItem}`}>
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{currentUser.displayName}</p>
                    <button onClick={handleLogout} className="text-xs opacity-60 hover:underline flex items-center gap-1">
                      <LogOut size={10} /> {dict.logout}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-blue-500 hover:bg-blue-500/10`}
                >
                  <User size={16} />
                  {dict.login}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {/* Language Selector */}
              <div>
                <button 
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${styles.hoverItem} ${isLangMenuOpen ? 'bg-black/5 dark:bg-white/5' : ''}`}
                >
                   <div className="flex items-center gap-3">
                     <Globe size={16} /> 
                     <span>{languages.find(l => l.code === language)?.label}</span>
                   </div>
                   <ChevronsUpDown size={14} className={`opacity-50 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isLangMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-500/20 space-y-1">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          language === lang.code
                            ? 'text-blue-500 bg-blue-500/10'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {lang.label}
                        {language === lang.code && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <button 
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${styles.hoverItem} ${isThemeMenuOpen ? 'bg-black/5 dark:bg-white/5' : ''}`}
                >
                   <div className="flex items-center gap-3">
                     <PaletteIcon size={16} /> 
                     <span>{themes.find(t => t.id === theme)?.label}</span>
                   </div>
                   <ChevronsUpDown size={14} className={`opacity-50 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isThemeMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                   <div className="mt-1 ml-4 pl-4 border-l border-gray-500/20 space-y-1">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          theme === t.id
                            ? 'text-blue-500 bg-blue-500/10'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {t.label}
                        {theme === t.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Legal Links Footer */}
          <div className={`mt-auto px-4 py-4 border-t ${theme === 'dark' ? 'border-slate-800' : theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                   setCurrentView('terms');
                   if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`text-xs text-left opacity-60 hover:opacity-100 hover:underline transition-all ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
              >
                {dict.termsOfService}
              </button>
              <button
                onClick={() => {
                   setCurrentView('privacy');
                   if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`text-xs text-left opacity-60 hover:opacity-100 hover:underline transition-all ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
              >
                {dict.privacyPolicy}
              </button>
            </div>
             <div className={`text-[10px] mt-2 opacity-40 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                © 2025 PromptsGo
             </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main 
        className="flex-1 flex flex-col overflow-hidden relative"
        style={activeView === 'local' ? styles.mainAreaStyle : undefined}
      >
        
        {/* Render View based on State */}
        {currentView === 'terms' || currentView === 'privacy' ? (
           <LegalView 
              type={currentView} 
              language={language}
              theme={theme}
              onBack={() => setCurrentView('global')}
              dict={dict}
           />
        ) : activeView === 'global' || activeView === 'collection' ? (
           <GlobalView
              key={refreshGlobal}
              user={currentUser}
              dict={dict}
              theme={theme}
              viewMode={activeView === 'collection' ? 'collection' : 'all'}
              collectedIds={collectedGlobalIds}
              onToggleCollect={handleToggleCollect}
              onShareGlobalPrompt={handleShareGlobalPrompt}
              onRefreshLocal={() => setCurrentView('local')}
              onEditGlobalPrompt={handleEditGlobalPrompt}
              onDeleteGlobalPrompt={handleDeleteGlobalPrompt}
              highlightPromptId={highlightPromptId}
           />
        ) : (
           /* LOCAL VIEW */
           <>
              {/* Top Bar */}
              <header className={`h-16 flex items-center px-8 border-b backdrop-blur-sm z-10 sticky top-0 ${styles.header}`}>
                <div className={`relative flex-1 max-w-md`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  <input
                    type="text"
                    placeholder={dict.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-full border text-sm outline-none transition-all ${styles.input} ${theme === 'light' || theme === 'dark' ? 'focus:ring-2' : ''}`}
                  />
                </div>
              </header>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto p-8">
                {filteredPrompts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <LayoutGrid size={64} strokeWidth={1} />
                    <p className="mt-4 text-lg font-medium">{dict.noPrompts}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 pb-20">
                    {filteredPrompts.map((prompt, index) => (
                      <div 
                        key={prompt.id} 
                        className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${styles.card}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`font-semibold text-lg line-clamp-1 transition-colors pr-2 ${theme === 'journal' ? 'group-hover:text-[#0c9e2d]' : 'group-hover:text-blue-500'}`}>
                            {prompt.title}
                          </h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative z-20">
                            
                            {/* Note Button */}
                            <div className="group/note relative">
                               <button 
                                  disabled={!prompt.note}
                                  className={`p-1.5 rounded-md transition-colors ${!prompt.note ? 'opacity-30 cursor-default' : styles.hoverItem}`}
                                  title={prompt.note ? dict.note : ''}
                                >
                                  <StickyNote size={14} />
                                </button>
                                {prompt.note && (
                                  <div className={`absolute right-0 bottom-full mb-2 w-48 p-3 rounded-lg text-xs shadow-xl z-50 pointer-events-none opacity-0 group-hover/note:opacity-100 transition-opacity duration-200 ${
                                    isDark ? 'bg-black text-white' : 'bg-slate-800 text-white'
                                  }`}>
                                    <p className="font-semibold mb-1 opacity-70">{dict.note}:</p>
                                    <p className="whitespace-pre-wrap">{prompt.note}</p>
                                    <div className={`absolute bottom-[-4px] right-2 w-2 h-2 rotate-45 ${
                                      isDark ? 'bg-black' : 'bg-slate-800'
                                    }`}></div>
                                  </div>
                                )}
                            </div>

                            <button 
                              onClick={() => handleOpenEdit(prompt)}
                              className={`p-1.5 rounded-md transition-colors ${styles.hoverItem}`}
                              title={dict.edit}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeletePrompt(prompt.id)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500"
                              title={dict.delete}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {prompt.description && (
                          <p className="text-sm opacity-60 line-clamp-2 mb-4 h-10">
                            {prompt.description}
                          </p>
                        )}

                        {/* Model Tags */}
                        {prompt.modelTags && prompt.modelTags.length > 0 && (
                          <div className="flex gap-1.5 mb-3 overflow-hidden flex-wrap">
                            {prompt.modelTags.map(tag => (
                              <span key={tag} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                isDark ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mb-4 overflow-hidden flex-wrap h-6">
                          {prompt.categoryIds.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return null;
                            const IconComp = getIconComponent(cat.icon);
                            return (
                              <span key={catId} className={`inline-flex items-center gap-1.5 px-2 rounded-md text-[10px] font-medium border ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'
                              }`}>
                                <IconComp size={10} className={cat.color.replace('bg-', 'text-')} />
                                {cat.name}
                              </span>
                            );
                          })}
                        </div>

                        {/* Positive Prompt */}
                        <div className={`mt-auto relative rounded-lg border group/code transition-colors ${styles.positiveBox}`}>
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-inherit">
                             <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">{dict.positivePrompt}</span>
                             <button 
                                onClick={() => handleCopy(prompt.positive, `${prompt.id}-pos`)}
                                className={`p-1 rounded transition-colors ${styles.hoverItem}`}
                                title={dict.copy}
                              >
                                {copiedId === `${prompt.id}-pos` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              </button>
                          </div>
                          <div className="p-3 text-xs font-mono break-words line-clamp-3">
                            {prompt.positive}
                          </div>
                        </div>

                        {/* Negative Prompt */}
                        {prompt.negative && (
                          <div className={`mt-2 relative rounded-lg border group/code transition-colors ${
                            isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50/50 border-red-100'
                          }`}>
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-inherit">
                               <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 text-red-500/70">{dict.negativePrompt}</span>
                               <button 
                                  onClick={() => handleCopy(prompt.negative!, `${prompt.id}-neg`)}
                                  className="p-1 hover:bg-red-500/10 rounded transition-colors"
                                  title={dict.copy}
                                >
                                  {copiedId === `${prompt.id}-neg` ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-red-500/70" />}
                                </button>
                            </div>
                            <div className="p-3 text-xs font-mono break-words line-clamp-2 opacity-80">
                              {prompt.negative}
                            </div>
                          </div>
                        )}

                        {/* Footer: Share & Creation Time */}
                        <div className={`mt-3 pt-2 border-t flex justify-between items-center ${
                          isDark ? 'border-white/5' : 'border-black/5'
                        }`}>
                          <button
                               id={index === 0 ? "btn-share-prompt-0" : undefined}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleOpenShare(prompt);
                               }}
                               className={`p-1 rounded-md transition-colors opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10`}
                               title={dict.share}
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M340-320h300q50 0 85-35t35-85q0-50-35-85t-85-35q-8-58-53-99t-101-41q-51 0-92.5 26T332-600q-57 5-94.5 43.5T200-460q0 58 41 99t99 41Zm0-80q-25 0-42.5-17.5T280-460q0-25 17.5-42.5T340-520h60v-20q0-33 23.5-56.5T480-620q33 0 56.5 23.5T560-540v60h80q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400H340ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                          </button>
                          <span className="text-[10px] opacity-40">
                            {new Date(prompt.createdAt).toLocaleString(language === 'zh-TW' ? 'zh-TW' : language === 'ja' ? 'ja-JP' : 'en-US', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
           </>
        )}
      </main>

      {/* Modals */}
      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrompt}
        initialPrompt={editingPrompt}
        categories={categories}
        dict={dict}
        theme={theme}
      />

      {sharingPrompt && (
        <ShareModal
           isOpen={isShareModalOpen}
           onClose={() => {
             setIsShareModalOpen(false);
             setIsEditingGlobalPrompt(false);
             setEditingGlobalPromptId(null);
           }}
           onSuccess={handlePublishSuccess}
           prompt={sharingPrompt}
           user={currentUser}
           dict={dict}
           theme={theme}
           isEditingGlobalPrompt={isEditingGlobalPrompt}
           globalPromptId={editingGlobalPromptId || undefined}
        />
      )}

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        dict={dict}
        theme={theme}
      />

      {/* WebView Warning */}
      {showWebViewWarning && (
        <WebViewWarning
          dict={dict}
          theme={theme}
          webViewType={webViewType}
          onClose={() => setShowWebViewWarning(false)}
        />
      )}

      {/* Onboarding Tour */}
      <OnboardingTour
         steps={tourSteps}
         isOpen={isTourOpen}
         onClose={() => handleTourComplete()} // Use same handler to mark as complete if skipped
         onComplete={handleTourComplete}
         dict={dict}
         theme={theme}
         onStepChange={handleTourStepChange}
      />
    </div>
  );
}

export default App;
