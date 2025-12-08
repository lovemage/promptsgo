import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { Dictionary, ThemeId } from '../types';

interface WebViewWarningProps {
  dict: Dictionary;
  theme: ThemeId;
  webViewType: string | null;
  onClose: () => void;
}

const WebViewWarning: React.FC<WebViewWarningProps> = ({ dict, theme, webViewType, onClose }) => {
  const [copied, setCopied] = useState(false);
  const websiteUrl = 'https://www.promptsgo.cc/';

  const handleCopy = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme-based styling
  let bgClass = 'bg-white';
  let textClass = 'text-slate-900';
  let borderClass = 'border-slate-200';
  let buttonClass = 'bg-blue-600 hover:bg-blue-500 text-white';
  let closeButtonClass = 'hover:bg-slate-100';

  if (theme === 'dark') {
    bgClass = 'bg-slate-800';
    textClass = 'text-white';
    borderClass = 'border-slate-700';
    buttonClass = 'bg-blue-600 hover:bg-blue-500 text-white';
    closeButtonClass = 'hover:bg-slate-700';
  } else if (theme === 'binder') {
    bgClass = 'bg-[#2d2d2d]';
    textClass = 'text-slate-200';
    borderClass = 'border-[#4d4d4d]';
    buttonClass = 'bg-slate-200 hover:bg-white text-slate-800';
    closeButtonClass = 'hover:bg-[#3d3d3d]';
  } else if (theme === 'journal') {
    bgClass = 'bg-[#f9f7f4]';
    textClass = 'text-slate-900';
    borderClass = 'border-[#d4c5a9]';
    buttonClass = 'bg-[#80c63c] hover:bg-[#6fae32] text-white';
    closeButtonClass = 'hover:bg-[#e8dcc8]';
  } else if (theme === 'glass') {
    bgClass = 'bg-white/90 backdrop-blur-xl';
    textClass = 'text-slate-900';
    borderClass = 'border-white/40';
    buttonClass = 'bg-blue-400/60 hover:bg-blue-400/80 text-white backdrop-blur-md';
    closeButtonClass = 'hover:bg-white/20';
  } else if (theme === 'royal') {
    bgClass = 'bg-gradient-to-br from-purple-900 to-indigo-900';
    textClass = 'text-amber-50';
    borderClass = 'border-amber-500/30';
    buttonClass = 'bg-amber-500 hover:bg-amber-400 text-purple-900';
    closeButtonClass = 'hover:bg-white/10';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative max-w-md w-full ${bgClass} ${textClass} rounded-2xl border ${borderClass} shadow-2xl p-6`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${closeButtonClass}`}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${theme === 'dark' || theme === 'binder' || theme === 'royal' ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
            <ExternalLink size={32} className="text-yellow-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-3">
          {dict.webViewWarningTitle}
        </h2>

        {/* Message */}
        <p className="text-center mb-4 opacity-80">
          {webViewType 
            ? dict.webViewWarningMessage.replace('{app}', webViewType)
            : dict.webViewWarningMessageGeneric
          }
        </p>

        {/* URL Display */}
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${borderClass} mb-4 ${theme === 'dark' || theme === 'binder' ? 'bg-black/20' : 'bg-slate-50'}`}>
          <code className="flex-1 text-sm truncate">{websiteUrl}</code>
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-all ${buttonClass}`}
            title={dict.copy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Instructions */}
        <p className="text-sm text-center opacity-70 mb-4">
          {dict.webViewWarningInstructions}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-medium transition-all ${buttonClass}`}
        >
          {dict.webViewWarningClose}
        </button>
      </div>
    </div>
  );
};

export default WebViewWarning;

