
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { Dictionary } from '../types';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  dict?: Dictionary;
  theme?: string;
  onStepChange?: (index: number) => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onClose, onComplete, dict, theme, onStepChange }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  // Update target rect on step change or resize
  useEffect(() => {
    if (!isOpen) return;

    let rafId: number;
    const updateRect = () => {
      const step = steps[currentStepIndex];
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Add some padding
        const padding = 8;
        
        // Use requestAnimationFrame to avoid thrashing
        rafId = requestAnimationFrame(() => {
            setTargetRect({
                x: rect.x - padding,
                y: rect.y - padding,
                width: rect.width + (padding * 2),
                height: rect.height + (padding * 2),
                top: rect.top - padding,
                right: rect.right + padding,
                bottom: rect.bottom + padding,
                left: rect.left - padding,
                toJSON: () => {}
            } as DOMRect);
        });
      } else {
        setTargetRect(null);
      }
    };

    // Initial update and scroll
    const initStep = () => {
        const step = steps[currentStepIndex];
        const el = document.getElementById(step.targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Allow scroll to start before calculating rect
            setTimeout(updateRect, 100); 
            setTimeout(updateRect, 500); // Check again after settle
        } else {
            updateRect();
        }
    };

    initStep();
    
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true); 

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentStepIndex, isOpen, steps]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(nextIndex);
    }
  };

  // Note: We removed the useEffect that called onStepChange(0) on mount/open
  // because it caused re-render loops in some cases or conflicted with Parent state updates.
  // The Parent (App.tsx) should handle the initial state setup (e.g. opening sidebar) 
  // when setting isTourOpen(true).

  // Determine tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const spacing = 16;
    let position = currentStep.position || 'bottom';
    
    // Mobile adjustment: Force 'top' or 'bottom' if screen width is small
    const isMobile = window.innerWidth < 768;
    if (isMobile && (position === 'left' || position === 'right')) {
        // Decide based on vertical space
        if (targetRect.bottom + 200 > window.innerHeight) {
            position = 'top';
        } else {
            position = 'bottom';
        }
    }

    // Simple positioning logic
    let top = 0;
    let left = 0;
    let transform = '';

    const tooltipWidth = 288; // w-72 = 18rem = 288px
    const tooltipHeight = 200; // Estimated height

    switch (position) {
        case 'top':
            top = targetRect.top - spacing;
            left = targetRect.left + (targetRect.width / 2);
            transform = 'translate(-50%, -100%)';
            break;
        case 'bottom':
            top = targetRect.bottom + spacing;
            left = targetRect.left + (targetRect.width / 2);
            transform = 'translate(-50%, 0)';
            break;
        case 'left':
            top = targetRect.top + (targetRect.height / 2);
            left = targetRect.left - spacing;
            transform = 'translate(-100%, -50%)';
            break;
        case 'right':
            top = targetRect.top + (targetRect.height / 2);
            left = targetRect.right + spacing;
            transform = 'translate(0, -50%)';
            break;
    }

    // Boundary check (keep within screen)
    // Adjust logic to prevent overflow
    
    // Only apply horizontal clamping for top/bottom
    if (position === 'top' || position === 'bottom') {
        const halfWidth = tooltipWidth / 2;
        const screenWidth = window.innerWidth;
        
        let actualLeft = left - halfWidth;
        let actualRight = left + halfWidth;
        
        let shiftX = 0;
        
        if (actualLeft < 10) {
            shiftX = 10 - actualLeft;
        } else if (actualRight > screenWidth - 10) {
            shiftX = (screenWidth - 10) - actualRight;
        }
        
        if (shiftX !== 0) {
            left += shiftX;
        }
    }

    // Mobile vertical clamp
    if (isMobile) {
        if (top < 10) top = 10;
        if (top > window.innerHeight - 10) top = window.innerHeight - 10;
    }
    
    return { top, left, transform };
  };

  const isJournal = theme === 'journal';
  const primaryColor = isJournal ? 'bg-[#80c63c]' : 'bg-blue-500';
  const buttonColor = isJournal ? 'bg-[#80c63c] hover:bg-[#6fae32] shadow-[#80c63c]/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20';
  const textColor = isJournal ? 'text-[#2c2c2c]' : 'text-slate-800';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
        {/* SVG Mask Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
            <defs>
                <mask id="tour-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {targetRect && (
                        <rect 
                            x={targetRect.x} 
                            y={targetRect.y} 
                            width={targetRect.width} 
                            height={targetRect.height} 
                            rx="12" 
                            fill="black" 
                        />
                    )}
                </mask>
            </defs>
            <rect 
                x="0" y="0" width="100%" height="100%" 
                fill="rgba(0,0,0,0.6)" 
                mask="url(#tour-mask)" 
            />
        </svg>

        {/* Tooltip Content */}
        <div 
            className="absolute transition-all duration-300 z-[101]"
            style={getTooltipStyle()}
        >
            <div className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-2xl max-w-xs w-72 animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700 relative ${isJournal ? 'font-[Poppins]' : ''}`}>
                {/* Arrow (Visual decoration only for now) */}
                
                {/* Mascot / Icon */}
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 rounded-full p-2 shadow-lg ring-4 ring-white dark:ring-slate-800 ${primaryColor}`}>
                    <span className="text-2xl" role="img" aria-label="mascot">👋</span>
                </div>

                <div className="mt-4 text-center">
                    <h3 className={`font-bold text-lg mb-2 dark:text-white ${textColor}`}>
                        {currentStep.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                        {currentStep.content}
                    </p>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                        {steps.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    idx === currentStepIndex ? primaryColor : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-1 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg ${buttonColor}`}
                    >
                        {isLastStep ? (dict?.share || 'Start') : (dict?.tourNext || 'Next')}
                        {isLastStep ? <Check size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default OnboardingTour;
