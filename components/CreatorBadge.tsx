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
      
      {/* Badges */}
      <div className="flex items-center -space-x-1">
         {/* Gold Coins */}
         {Array.from({ length: golds }).map((_, i) => (
            <img 
               key={`gold-${i}`} 
               src="/gold.png" 
               alt="Gold" 
               className="w-4 h-4 object-contain"
               title={`Gold Badge`}
            />
         ))}
         
         {/* Stars */}
         {Array.from({ length: stars }).map((_, i) => (
            <img 
               key={`star-${i}`} 
               src="/star.png" 
               alt="Star" 
               className="w-4 h-4 object-contain"
               title={`Star Badge`}
            />
         ))}
         
         {/* Silvers */}
         {Array.from({ length: silvers }).map((_, i) => (
            <img 
               key={`silver-${i}`} 
               src="/silver.png" 
               alt="Silver" 
               className="w-4 h-4 object-contain"
               title={`Silver Badge`}
            />
         ))}
      </div>
    </div>
  );
};

export default CreatorBadge;
