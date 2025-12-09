
import React, { useState } from 'react';
import { Star, MessageSquare, Copy, Check, User as UserIcon, Calendar, Image as ImageIcon, Bookmark, Share2, Edit2, Send, X, Mail, Trash2, ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react';
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
  isDetailView?: boolean;
  onOpenDetail?: (prompt: GlobalPrompt) => void;
}

const GlobalPromptCard: React.FC<GlobalPromptCardProps> = ({ prompt: initialPrompt, user, dict, theme, isCollected, onToggleCollect, onShare, onRefreshLocal, onEdit, onDelete, isDetailView, onOpenDetail }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [commentMediaFile, setCommentMediaFile] = useState<File | null>(null);
  const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [commentMediaModal, setCommentMediaModal] = useState<string | null>(null);
  
  // Check if user has already rated/commented (rating > 0)
  const userHasRated = user && prompt.comments.some(c => c.userId === user.id && c.rating > 0);
  const uniqueCommenters = Array.from(new Set(prompt.comments.map(c => c.userName))).filter(name => name !== user?.displayName);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const isDark = theme === 'dark' || theme === 'binder';

  const mediaList = [
      ...(prompt.video ? [{ type: 'video', url: prompt.video }] : []),
      ...(prompt.componentImages || []).map(url => ({ type: 'image', url })),
      ...(prompt.image ? [{ type: 'image', url: prompt.image, label: 'Result' }] : [])
  ];

  // Styles based on theme (simplified inheritance)
  const cardBorder = isDark ? 'border-white/10' : 'border-black/10';
  const cardBg = theme === 'dark' ? 'bg-slate-800' : theme === 'binder' ? 'bg-[#2c2c2c] text-white' : theme === 'journal' ? 'bg-white hover:bg-[#fefbf6] border-slate-200 hover:border-[#80c63c] transition-colors' : theme === 'glass' ? 'bg-white/40 backdrop-blur-md border-white/30 hover:bg-white/50 text-slate-800 shadow-sm hover:shadow-md transition-all' : 'bg-white';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  // Sync prompt state when initialPrompt changes
  React.useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  // Check if user has shared this prompt
  React.useEffect(() => {
    const sharedPrompts = JSON.parse(localStorage.getItem('promptsgo_shared_prompts') || '{}');
    const userSharedKey = user?.id || 'guest';
    setHasShared(sharedPrompts[userSharedKey]?.includes(prompt.id) || false);
  }, [prompt.id, user?.id]);

  const handleCopy = (text: string, type: string) => {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback to old method if modern API fails
        copyToClipboardFallback(text);
      });
    } else {
      // Fallback for older browsers
      copyToClipboardFallback(text);
    }
    setCopiedId(type);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyToClipboardFallback = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    document.body.removeChild(textarea);
  };

  const handleCommentMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type (image or video)
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please upload an image or video file');
      return;
    }

    setCommentMediaFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCommentMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearCommentMedia = () => {
    setCommentMediaFile(null);
    setCommentMediaPreview(null);
  };

  const uploadMediaToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'promptsgo');

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const response = await fetch(`https://api.cloudinary.com/v1_1/dtwacse1e/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsUploadingMedia(true);

    try {
      const isReply = userHasRated;
      const ratingToSave = isReply ? 0 : userRating;

      // Upload media if exists
      let mediaUrl: string | null = null;
      if (commentMediaFile) {
        mediaUrl = await uploadMediaToCloudinary(commentMediaFile);
      }

      const comment: Comment = {
        id: generateId(),
        userId: user.id,
        userName: user.displayName || 'User',
        userAvatar: user.photoURL,
        content: newComment,
        rating: ratingToSave,
        media: mediaUrl,
        createdAt: Date.now()
      };

      await globalService.addComment(prompt.id, comment);

      // Optimistic update
      const updatedComments = [comment, ...prompt.comments];

      // Only update rating if it's not a reply
      let newRating = prompt.rating;
      let newCount = prompt.ratingCount;

      if (!isReply) {
         newCount = prompt.ratingCount + 1;
         const newAvg = ((prompt.rating * prompt.ratingCount) + ratingToSave) / newCount;
         newRating = parseFloat(newAvg.toFixed(1));
      }

      setPrompt({
          ...prompt,
          comments: updatedComments,
          rating: newRating,
          ratingCount: newCount
      });
      setNewComment('');
      clearCommentMedia();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleMention = (name: string) => {
     setNewComment(prev => prev + `@${name} `);
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
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(() => {
          // Fallback to old method if modern API fails
          copyToClipboardFallback(url);
        });
      } else {
        // Fallback for older browsers
        copyToClipboardFallback(url);
      }
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
        <>
          <div
            onClick={() => {
                // Determine start index. User wants "Result Image" (Main) on card.
                // But in Gallery, it's the LAST one.
                // So start at index 0 (first component or video) or last?
                // User said "Clicking card pops up component images 1-4 finally result image".
                // This implies starting at the beginning of the sequence.
                setActiveMediaIndex(0);
                setShowGallery(true);
            }}
            className="w-full h-48 overflow-hidden bg-gray-900 relative group cursor-pointer"
            onContextMenu={(e) => e.preventDefault()}
          >
             <img
               src={prompt.image}
               alt={prompt.title}
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
               draggable={false}
               onContextMenu={(e) => e.preventDefault()}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             
             {/* Media Count Indicator */}
             {mediaList.length > 1 && (
                 <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                     <ImageIcon size={12} />
                     {mediaList.length}
                 </div>
             )}
          </div>

          {/* Gallery Modal */}
          {showGallery && mediaList.length > 0 && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setShowGallery(false)}
            >
              {/* Close Button - Moved outside content container to avoid overlap/z-index issues */}
              <button
                  onClick={(e) => { e.stopPropagation(); setShowGallery(false); }}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/40 p-2 rounded-full hover:bg-black/60 z-[60]"
                  title="Close"
              >
                  <X size={32} />
              </button>

              <div
                className="relative w-full max-w-5xl h-[85vh] flex flex-col items-center justify-center"
                onClick={e => e.stopPropagation()}
              >
                {/* Main Media View */}
                <div className="flex-1 w-full flex items-center justify-center relative min-h-0">
                    {mediaList[activeMediaIndex].type === 'video' ? (
                        <video 
                            src={mediaList[activeMediaIndex].url} 
                            controls 
                            className="max-w-full max-h-full rounded-lg shadow-2xl"
                        />
                    ) : (
                        <img
                          src={mediaList[activeMediaIndex].url}
                          alt={prompt.title}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                    )}
                    
                    {/* Navigation Arrows */}
                    {mediaList.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(prev => (prev - 1 + mediaList.length) % mediaList.length); }}
                                className="absolute left-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(prev => (prev + 1) % mediaList.length); }}
                                className="absolute right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnails */}
                {mediaList.length > 1 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto max-w-full pb-2 px-2">
                        {mediaList.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveMediaIndex(idx)}
                                className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                                    idx === activeMediaIndex ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                            >
                                {item.type === 'video' ? (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-white border-b-4 border-b-transparent ml-1"></div>
                                    </div>
                                ) : (
                                    <img src={item.url} className="w-full h-full object-cover" alt="" />
                                )}
                                {(item as any).label && (
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                        {(item as any).label}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

              </div>
            </div>
          )}
        </>
      ) : (
         // No image placeholder
         null
      )}

      <div className="p-5 flex flex-col gap-3">
         {/* Header */}
         <div className="flex justify-between items-start">
            <div>
               {isDetailView ? (
                 <h3 className="font-bold text-lg leading-tight mb-1">{prompt.title}</h3>
               ) : (
                 <h3 
                    onClick={() => onOpenDetail?.(prompt)} 
                    className="font-bold text-lg leading-tight mb-1 cursor-pointer hover:text-blue-500 transition-colors"
                 >
                    {prompt.title}
                 </h3>
               )}
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
               {user && (
                 <button 
                    onClick={() => handleCopy(prompt.positive, 'pos')}
                    className="absolute top-2 right-2 p-1.5 rounded bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                  >
                    {copiedId === 'pos' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
               )}
            </div>
            {prompt.negative && (
              <div className={`relative p-2 rounded-lg text-xs font-mono border opacity-80 ${isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50/50 border-red-100'}`}>
                 <p className="line-clamp-2">{prompt.negative}</p>
                 {user && (
                   <button 
                      onClick={() => handleCopy(prompt.negative!, 'neg')}
                      className="absolute top-2 right-2 p-1.5 rounded bg-black/5 hover:bg-black/10 transition-colors"
                    >
                      {copiedId === 'neg' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                 )}
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

               {/* Source Button (Detail View Only) */}
               {isDetailView && prompt.sourceUrl && (
                  <a
                     href={prompt.sourceUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     title={dict.source}
                     className="p-2 rounded-lg transition-colors hover:bg-blue-500/10 text-blue-600 flex items-center gap-1.5"
                  >
                     <LinkIcon size={16} />
                     <span className="text-xs font-semibold">{dict.source}</span>
                  </a>
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
                  title={`${dict.comments}`}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${showComments ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
               >
                  <MessageSquare size={16} />
                  {prompt.comments.length > 0 && <span className="text-xs font-semibold">{prompt.comments.length}</span>}
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
                             {c.rating > 0 && (
                                <div className="flex items-center gap-0.5">
                                    <Star size={8} className="fill-yellow-500 text-yellow-500" />
                                    <span>{c.rating}</span>
                                </div>
                             )}
                          </div>
                          <p className="opacity-70 leading-relaxed whitespace-pre-wrap">
                            {c.content.split(' ').map((word, i) =>
                               word.startsWith('@') ? <span key={i} className="text-blue-500 font-medium">{word} </span> : word + ' '
                            )}
                          </p>
                          {/* Comment Media - Small Thumbnail */}
                          {c.media && (
                             <div className="mt-2">
                                {c.media.includes('/video/') ? (
                                   <video
                                      src={c.media}
                                      controls
                                      className="max-w-[120px] max-h-[80px] rounded-lg border border-black/10 cursor-pointer"
                                   />
                                ) : (
                                   <img
                                      src={c.media}
                                      alt="Comment attachment"
                                      className="max-w-[120px] max-h-[80px] object-cover rounded-lg border border-black/10 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setCommentMediaModal(c.media!)}
                                   />
                                )}
                             </div>
                          )}
                       </div>
                    ))
                 )}
              </div>

              {/* Add Comment */}
              {user ? (
                 <div className="space-y-2">
                    {!userHasRated && (
                        <div className="flex items-center gap-1 text-xs mb-1">
                           <span className="opacity-70">{dict.rating}:</span>
                           {[1, 2, 3, 4, 5].map(star => (
                              <button key={star} onClick={() => setUserRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                                 <Star size={14} className={star <= userRating ? "fill-yellow-500 text-yellow-500" : "text-gray-400"} />
                              </button>
                           ))}
                        </div>
                    )}
                    
                    {/* Mention Suggestions */}
                    {uniqueCommenters.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {uniqueCommenters.map(name => (
                                <button 
                                    key={name} 
                                    onClick={() => handleMention(name)}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border opacity-70 hover:opacity-100 whitespace-nowrap ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}
                                >
                                    @{name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Media Preview */}
                    {commentMediaPreview && (
                       <div className="relative inline-block">
                          {commentMediaFile?.type.startsWith('video/') ? (
                             <video
                                src={commentMediaPreview}
                                className="max-h-20 rounded border border-black/10"
                             />
                          ) : (
                             <img
                                src={commentMediaPreview}
                                alt="Preview"
                                className="max-h-20 rounded border border-black/10"
                             />
                          )}
                          <button
                             onClick={clearCommentMedia}
                             className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                             <X size={12} />
                          </button>
                       </div>
                    )}

                    <div className="flex gap-2">
                       <input
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder={userHasRated ? "Reply to discussion..." : dict.writeComment}
                          className={`flex-1 px-3 py-1.5 rounded text-xs border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                       />

                       {/* Upload Media Button */}
                       <label className="cursor-pointer">
                          <input
                             type="file"
                             accept="image/*,video/*"
                             onChange={handleCommentMediaChange}
                             className="hidden"
                          />
                          <div className={`p-1.5 rounded border transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}>
                             <ImageIcon size={16} />
                          </div>
                       </label>

                       <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isUploadingMedia}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
                       >
                          {isUploadingMedia ? 'Uploading...' : (userHasRated ? 'Reply' : 'Post')}
                       </button>
                    </div>
                 </div>
              ) : (
                 <p className={`text-xs text-center italic ${textMuted}`}>{dict.loginToComment}</p>
              )}
           </div>
         )}

         {/* Comment Media Preview Modal */}
         {commentMediaModal && (
            <div
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
               onClick={() => setCommentMediaModal(null)}
            >
               <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200">
                  <button
                     onClick={() => setCommentMediaModal(null)}
                     className="absolute -top-10 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                     aria-label="Close"
                  >
                     <X size={24} />
                  </button>
                  <img
                     src={commentMediaModal}
                     alt="Comment media preview"
                     className="max-w-full max-h-[90vh] object-contain rounded-lg"
                     onClick={(e) => e.stopPropagation()}
                  />
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default GlobalPromptCard;
