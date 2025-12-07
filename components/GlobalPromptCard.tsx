
import React, { useState } from 'react';
import { Star, MessageSquare, Copy, Check, User as UserIcon, Calendar, Image as ImageIcon, Bookmark, Share2, Edit2, Send, X, Mail, Trash2 } from 'lucide-react';
import { GlobalPrompt, Dictionary, ThemeId, Comment, User } from '../types';
import { generateId } from '../services/storageService';
import * as globalService from '../services/globalService';

interface GlobalPromptCardProps {
  prompt: GlobalPrompt;
  user: User | null;
  dict: Dictionary;
  theme: ThemeId;
  isCollected?: boolean;
  onToggleCollect?: (id: string) => void;
  onShare?: (prompt: GlobalPrompt) => void;
  onRefreshLocal?: () => void;
  onEdit?: (prompt: GlobalPrompt) => void;
  onDelete?: (id: string) => void;
}

const GlobalPromptCard: React.FC<GlobalPromptCardProps> = ({ prompt: initialPrompt, user, dict, theme, isCollected, onToggleCollect, onShare, onRefreshLocal, onEdit, onDelete }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  const isDark = theme === 'dark' || theme === 'binder';

  // Styles based on theme (simplified inheritance)
  const cardBorder = isDark ? 'border-white/10' : 'border-black/10';
  const cardBg = theme === 'dark' ? 'bg-slate-800' : theme === 'binder' ? 'bg-[#2c2c2c] text-white' : theme === 'journal' ? 'bg-white hover:bg-[#fefbf6] border-slate-200 hover:border-[#80c63c] transition-colors' : 'bg-white';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  // Check if user has shared this prompt
  React.useEffect(() => {
    const sharedPrompts = JSON.parse(localStorage.getItem('promptsgo_shared_prompts') || '{}');
    const userSharedKey = user?.id || 'guest';
    setHasShared(sharedPrompts[userSharedKey]?.includes(prompt.id) || false);
  }, [prompt.id, user?.id]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(type);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    const comment: Comment = {
      id: generateId(),
      userId: user.id,
      userName: user.displayName || 'User',
      userAvatar: user.photoURL,
      content: newComment,
      rating: userRating,
      createdAt: Date.now()
    };

    await globalService.addComment(prompt.id, comment);
    // Refresh local state to show new comment immediately (optimistic)
    const updatedComments = [comment, ...prompt.comments];
    const newCount = prompt.ratingCount + 1;
    const newAvg = ((prompt.rating * prompt.ratingCount) + userRating) / newCount;

    setPrompt({
        ...prompt,
        comments: updatedComments,
        rating: parseFloat(newAvg.toFixed(1)),
        ratingCount: newCount
    });
    setNewComment('');
  };

  const handleShareToSocial = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this prompt: ${prompt.title}`;

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(prompt.title)}&body=${encodeURIComponent(text + '\n' + url)}`,
      copy: url
    };

    // Record share action
    const sharedPrompts = JSON.parse(localStorage.getItem('promptsgo_shared_prompts') || '{}');
    const userSharedKey = user?.id || 'guest';
    if (!sharedPrompts[userSharedKey]) {
      sharedPrompts[userSharedKey] = [];
    }
    if (!sharedPrompts[userSharedKey].includes(prompt.id)) {
      sharedPrompts[userSharedKey].push(prompt.id);
    }
    localStorage.setItem('promptsgo_shared_prompts', JSON.stringify(sharedPrompts));
    setHasShared(true);

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopiedId('share-link');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden flex flex-col ${cardBg} ${cardBorder}`}>
      {/* Image Preview */}
      {prompt.image ? (
        <div className="w-full h-48 overflow-hidden bg-gray-900 relative group">
           <img src={prompt.image} alt={prompt.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
         // No image placeholder
         null
      )}

      <div className="p-5 flex flex-col gap-3">
         {/* Header */}
         <div className="flex justify-between items-start">
            <div>
               <h3 className="font-bold text-lg leading-tight mb-1">{prompt.title}</h3>
               <div className={`flex items-center gap-2 text-xs ${textMuted}`}>
                  <span className="flex items-center gap-1">
                    <UserIcon size={12} /> {prompt.authorName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                     <Star size={12} className="text-yellow-500 fill-yellow-500" /> 
                     {prompt.rating} ({prompt.ratingCount})
                  </span>
               </div>
            </div>
         </div>

         {/* Model Tags */}
         {prompt.modelTags && prompt.modelTags.length > 0 && (
           <div className="flex flex-wrap gap-1.5">
             {prompt.modelTags.map(tag => (
               <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                 {tag}
               </span>
             ))}
           </div>
         )}

         {/* Tags */}
         {prompt.tags.length > 0 && (
           <div className="flex flex-wrap gap-1.5">
             {prompt.tags.map(tag => (
               <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                 #{tag}
               </span>
             ))}
           </div>
         )}

         {/* Prompts */}
         <div className="space-y-2 mt-2">
            <div className={`relative p-3 rounded-lg text-xs font-mono border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
               <p className="line-clamp-4">{prompt.positive}</p>
               <button 
                  onClick={() => handleCopy(prompt.positive, 'pos')}
                  className="absolute top-2 right-2 p-1.5 rounded bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                >
                  {copiedId === 'pos' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
            </div>
            {prompt.negative && (
              <div className={`relative p-2 rounded-lg text-xs font-mono border opacity-80 ${isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50/50 border-red-100'}`}>
                 <p className="line-clamp-2">{prompt.negative}</p>
                 <button 
                    onClick={() => handleCopy(prompt.negative!, 'neg')}
                    className="absolute top-2 right-2 p-1.5 rounded bg-black/5 hover:bg-black/10 transition-colors"
                  >
                    {copiedId === 'neg' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
              </div>
            )}
         </div>

         {/* Actions */}
         <div className={`flex items-center justify-between pt-3 mt-auto border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
            <span className={`text-[10px] ${textMuted}`}>
               {new Date(prompt.createdAt).toLocaleDateString()}
            </span>

            <div className="flex gap-1 items-center">
               {/* Edit button - only for author */}
               {onEdit && user && (prompt.authorId === user.id || prompt.authorId === 'anonymous') && (
                  <button
                     onClick={() => onEdit(prompt)}
                     title="Edit"
                     className="p-2 rounded-lg transition-colors hover:bg-blue-500/10 text-blue-600"
                  >
                     <Edit2 size={16} />
                  </button>
               )}

               {/* Delete button - only for author */}
               {onDelete && user && (prompt.authorId === user.id || prompt.authorId === 'anonymous') && (
                  <button
                     onClick={() => {
                        if (confirm(`Delete "${prompt.title}"?`)) {
                           onDelete(prompt.id);
                        }
                     }}
                     title="Delete"
                     className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-red-600"
                  >
                     <Trash2 size={16} />
                  </button>
               )}

               {/* Collect button */}
               {onToggleCollect && (
                  <div className="relative group">
                     <button
                        onClick={() => onToggleCollect(prompt.id)}
                        title={isCollected ? 'Collected' : 'Collect'}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                           isCollected
                              ? 'bg-yellow-500/20 text-yellow-600 shadow-md shadow-yellow-500/30 hover:bg-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/40'
                              : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                     >
                        <Bookmark size={16} className={isCollected ? "fill-yellow-600 animate-pulse" : ""} />
                     </button>
                     {prompt.collectCount !== undefined && prompt.collectCount > 0 && (
                        <span className={`absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all ${
                           isCollected
                              ? 'bg-yellow-500 shadow-md shadow-yellow-500/50'
                              : 'bg-yellow-400'
                        }`}>
                           {prompt.collectCount > 99 ? '99+' : prompt.collectCount}
                        </span>
                     )}
                  </div>
               )}

               {/* Share to social button */}
               <div className="relative">
                  <button
                     onClick={() => setShowShareMenu(!showShareMenu)}
                     title={hasShared ? 'Shared' : 'Share'}
                     className={`p-2 rounded-lg transition-colors ${
                        hasShared
                           ? 'bg-green-500/10 text-green-600'
                           : 'hover:bg-blue-500/10 text-blue-600'
                     }`}
                  >
                     <Share2 size={16} className={hasShared ? "fill-green-600" : ""} />
                  </button>

                  {showShareMenu && (
                     <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg z-50 ${isDark ? 'bg-slate-700' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <button
                           onClick={() => handleShareToSocial('twitter')}
                           className="w-full text-left px-4 py-2 hover:bg-blue-500/10 text-sm flex items-center gap-2 first:rounded-t-lg"
                        >
                           <X size={14} /> Twitter
                        </button>
                        <button
                           onClick={() => handleShareToSocial('facebook')}
                           className="w-full text-left px-4 py-2 hover:bg-blue-500/10 text-sm flex items-center gap-2"
                        >
                           <Send size={14} /> Facebook
                        </button>
                        <button
                           onClick={() => handleShareToSocial('linkedin')}
                           className="w-full text-left px-4 py-2 hover:bg-blue-500/10 text-sm flex items-center gap-2"
                        >
                           <Send size={14} /> LinkedIn
                        </button>
                        <button
                           onClick={() => handleShareToSocial('email')}
                           className="w-full text-left px-4 py-2 hover:bg-blue-500/10 text-sm flex items-center gap-2"
                        >
                           <Mail size={14} /> Email
                        </button>
                        <button
                           onClick={() => handleShareToSocial('copy')}
                           className="w-full text-left px-4 py-2 hover:bg-blue-500/10 text-sm flex items-center gap-2 last:rounded-b-lg"
                        >
                           {copiedId === 'share-link' ? <Check size={14} /> : <Copy size={14} />}
                           {copiedId === 'share-link' ? 'Copied!' : 'Copy Link'}
                        </button>
                     </div>
                  )}
               </div>

               {/* Comments button */}
               <button
                  onClick={() => setShowComments(!showComments)}
                  title={`${dict.comments} (${prompt.comments.length})`}
                  className={`p-2 rounded-lg transition-colors ${showComments ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
               >
                  <MessageSquare size={16} />
               </button>

               {/* Spacer */}
               <div className="flex-1" />
            </div>
         </div>

         {/* Comments Section */}
         {showComments && (
           <div className={`mt-2 pt-3 border-t animate-in slide-in-from-top-2 fade-in duration-200 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              
              {/* Comment List */}
              <div className="max-h-40 overflow-y-auto space-y-3 mb-3 pr-1 custom-scrollbar">
                 {prompt.comments.length === 0 ? (
                    <p className={`text-xs text-center py-2 ${textMuted}`}>{dict.noComments}</p>
                 ) : (
                    prompt.comments.map(c => (
                       <div key={c.id} className="text-xs">
                          <div className="flex justify-between items-center mb-1">
                             <span className="font-bold opacity-80">{c.userName}</span>
                             <div className="flex items-center gap-0.5">
                                <Star size={8} className="fill-yellow-500 text-yellow-500" />
                                <span>{c.rating}</span>
                             </div>
                          </div>
                          <p className="opacity-70 leading-relaxed">{c.content}</p>
                       </div>
                    ))
                 )}
              </div>

              {/* Add Comment */}
              {user ? (
                 <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs mb-1">
                       <span className="opacity-70">{dict.rating}:</span>
                       {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setUserRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                             <Star size={14} className={star <= userRating ? "fill-yellow-500 text-yellow-500" : "text-gray-400"} />
                          </button>
                       ))}
                    </div>
                    <div className="flex gap-2">
                       <input 
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder={dict.writeComment}
                          className={`flex-1 px-3 py-1.5 rounded text-xs border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                       />
                       <button 
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim()}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
                       >
                          Post
                       </button>
                    </div>
                 </div>
              ) : (
                 <p className={`text-xs text-center italic ${textMuted}`}>{dict.loginToComment}</p>
              )}
           </div>
         )}
      </div>
    </div>
  );
};

export default GlobalPromptCard;
