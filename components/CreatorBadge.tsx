import React from 'react';
import { calculateBadgeInfo } from '../utils/badgeUtils';

interface CreatorBadgeProps {
  count: number;
  language: string;
  className?: string;
  showTitle?: boolean;
}

const CreatorBadge: React.FC<CreatorBadgeProps> = ({ count, language, className = '', showTitle = true }) => {
  const { silvers, stars, golds, title, level } = calculateBadgeInfo(count, language);

  if (level === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
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
  );
};

export default CreatorBadge;
