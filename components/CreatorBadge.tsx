import React from 'react';
import { calculateBadgeInfo } from '../utils/badgeUtils';
import { ThemeId } from '../types';

interface CreatorBadgeProps {
  count: number;
  language: string;
  className?: string;
  showTitle?: boolean;
  theme?: ThemeId;
}

const CreatorBadge: React.FC<CreatorBadgeProps> = ({ count, language, className = '', showTitle = true, theme = 'light' }) => {
  const { silvers, stars, golds, title, level } = calculateBadgeInfo(count, language);

  // Calculate progress (0-100%)
  // New users should still see a small progress bar (min 5%).
  // For exact boundaries (e.g. 5, 10, 15...), show 100% instead of 0%.
  const rawProgress = ((count % 5) / 5) * 100;
  const progress = count === 0 ? 5 : rawProgress === 0 ? 100 : Math.max(5, rawProgress);

  const getProgressColor = () => {
    switch (theme) {
      case 'journal': return 'bg-[#80c63c]';
      case 'dark': return 'bg-blue-500';
      case 'binder': return 'bg-slate-600';
      case 'glass': return 'bg-blue-400';
      case 'royal': return 'bg-[#547A9E]';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className={`flex flex-col justify-center ${className}`}>
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-0.5 opacity-80">
        <div 
          className={`h-full transition-all duration-300 ${getProgressColor()}`} 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-1">
      {/* Title */}
      {showTitle && (
         <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap ${
            golds > 0 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
            stars > 0 ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
            'bg-slate-500/10 text-slate-600 border-slate-500/20'
         }`}>
           {title}
         </span>
      )}

      {/* Badges - Optimized Layout */}
      <div className="flex items-center gap-0.5">
         {/* Gold Coins */}
         {Array.from({ length: golds }).map((_, i) => (
            <div key={`gold-${i}`} className="relative w-5 h-5 flex items-center justify-center">
               <img
                  src="/gold.png"
                  alt="Gold"
                  className="w-full h-full object-contain drop-shadow-sm"
                  title={`Gold Badge ${i + 1}`}
                  loading="lazy"
               />
            </div>
         ))}

         {/* Stars */}
         {Array.from({ length: stars }).map((_, i) => (
            <div key={`star-${i}`} className="relative w-5 h-5 flex items-center justify-center">
               <img
                  src="/star.png"
                  alt="Star"
                  className="w-full h-full object-contain drop-shadow-sm"
                  title={`Star Badge ${i + 1}`}
                  loading="lazy"
               />
            </div>
         ))}

         {/* Silvers */}
         {Array.from({ length: silvers }).map((_, i) => (
            <div key={`silver-${i}`} className="relative w-5 h-5 flex items-center justify-center">
               <img
                  src="/silver.png"
                  alt="Silver"
                  className="w-full h-full object-contain drop-shadow-sm"
                  title={`Silver Badge ${i + 1}`}
                  loading="lazy"
               />
            </div>
         ))}
      </div>
    </div>
    </div>
  );
};

export default CreatorBadge;
