import React from 'react';
import { ThemeId, Dictionary } from '../types';

interface FooterProps {
  theme: ThemeId;
  dict: Dictionary;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

const Footer: React.FC<FooterProps> = ({ theme, dict, onOpenTerms, onOpenPrivacy }) => {
  const borderClass = theme === 'dark' ? 'border-slate-800' : theme === 'light' ? 'border-slate-200' : 'border-white/10';
  const textClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const copyrightClass = theme === 'dark' ? 'text-slate-500' : 'text-slate-400';

  return (
    <footer className={`px-6 py-4 border-t ${borderClass}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            onClick={onOpenTerms}
            className={`text-xs opacity-70 hover:opacity-100 hover:underline transition-all ${textClass}`}
          >
            {dict.termsOfService}
          </button>
          <button
            onClick={onOpenPrivacy}
            className={`text-xs opacity-70 hover:opacity-100 hover:underline transition-all ${textClass}`}
          >
            {dict.privacyPolicy}
          </button>
        </div>
        <div className={`text-[10px] opacity-50 ${copyrightClass}`}>
          © 2025 PromptsGo
        </div>
      </div>
    </footer>
  );
};

export default Footer;
