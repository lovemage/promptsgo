
import React from 'react';
import { X, Check } from 'lucide-react';
import { Dictionary, ThemeId } from '../types';
import CreatorBadge from './CreatorBadge';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeName: string;
  currentCount: number;
  requiredCount: number;
  dict?: Dictionary;
  theme?: ThemeId;
  language?: string;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ 
  isOpen, onClose, themeName, currentCount, requiredCount, dict, theme, language = 'en' 
}) => {
  if (!isOpen) return null;

  const isJournal = theme === 'journal';
  const buttonColor = isJournal ? 'bg-[#80c63c] hover:bg-[#6fae32] shadow-[#80c63c]/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20';
  const textColor = isJournal ? 'text-[#2c2c2c]' : 'text-slate-800';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Modal Content */}
        <div className={`relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-xs w-full animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700 ${isJournal ? 'font-[Poppins]' : ''}`}>
            
            {/* Mascot / Icon */}
            <div className={`absolute -top-10 left-1/2 -translate-x-1/2 rounded-full shadow-lg ring-4 ring-white dark:ring-slate-800 overflow-hidden w-20 h-20 bg-white`}>
                <img src="/ComfyUI_00048_.PNG" alt="mascot" className="w-full h-full object-cover" />
            </div>

            <button 
                onClick={onClose}
                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
                <X size={20} />
            </button>

            <div className="mt-10 text-center">
                <h3 className={`font-bold text-xl mb-3 dark:text-white ${textColor}`}>
                    Unlock {themeName}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    Please share more prompts to unlock the <b>{themeName}</b> theme!
                </p>

                {/* Progress Box */}
                <div className="flex flex-col items-center gap-3 mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-blue-100 dark:border-slate-600">
                    <div className="flex items-center gap-4 w-full justify-center">
                        <CreatorBadge count={currentCount} language={language} showTitle={false} theme={theme} size="lg" />
                        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                           {currentCount} / {requiredCount}
                        </div>
                    </div>
                    
                    {/* Badge Progression Preview - 3D Animated */}
                    <div className="w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-300 dark:border-slate-600 relative">
                        <div 
                           className="h-full rounded-full transition-all duration-1000 ease-out relative flex items-center min-w-[10px]"
                           style={{ 
                             width: `${Math.min(100, Math.max(2, (currentCount / requiredCount) * 100))}%`,
                             boxShadow: '0 2px 5px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)'
                           }}
                        >
                           {/* Colorful Gradient Background */}
                           <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
                           
                           {/* Animated Stripes Texture */}
                           <div className="absolute inset-0 w-full h-full animate-stripes"
                                style={{
                                  backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)',
                                  backgroundSize: '1rem 1rem'
                                }}
                           />
                           
                           {/* Shine Effect */}
                           <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {requiredCount - currentCount > 0 
                           ? `${requiredCount - currentCount} more to go!` 
                           : 'Goal Reached!'}
                    </div>
                </div>
                
                {/* Theme Icons / Badges Strip */}
                <div className="flex justify-center items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all mb-6">
                    <div className="flex flex-col items-center gap-1">
                       <img src="/gp-logo.png" alt="Base" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-slate-300">→</span>
                    <div className="flex flex-col items-center gap-1">
                       <img src="/silver.png" alt="Silver" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-slate-300">→</span>
                    <div className="flex flex-col items-center gap-1">
                       <img src="/star.png" alt="Star" className="w-6 h-6 object-contain" />
                    </div>
                     <span className="text-slate-300">→</span>
                    <div className="flex flex-col items-center gap-1">
                       <img src="/gold.png" alt="Gold" className="w-6 h-6 object-contain" />
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className={`w-full py-2.5 rounded-xl font-medium text-white shadow-lg transition-transform active:scale-95 ${buttonColor}`}
                >
                    Keep Sharing!
                </button>
            </div>
        </div>
    </div>
  );
};

export default UnlockModal;
