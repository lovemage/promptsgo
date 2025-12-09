
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
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onClose, onComplete, dict }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  // Update target rect on step change or resize
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      const step = steps[currentStepIndex];
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Add some padding
        const padding = 8;
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
        
        // Scroll element into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Element not found, verify if we can skip or wait?
        console.warn(`Tour target ${step.targetId} not found.`);
        // Just center it? Or null.
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true); // Capture scroll

    // Small delay to allow layout to settle (e.g. sidebar animation)
    const timeout = setTimeout(updateRect, 500);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      clearTimeout(timeout);
    };
  }, [currentStepIndex, isOpen, steps]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  // Determine tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const spacing = 16;
    const position = currentStep.position || 'bottom';
    
    // Simple positioning logic
    let top = 0;
    let left = 0;
    let transform = '';

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

    // Boundary check (keep within screen) - Simplified
    // Note: A robust solution would check window.innerWidth/Height and flip if needed.
    
    return { top, left, transform };
  };

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
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-2xl max-w-xs w-72 animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700 relative">
                {/* Arrow (Visual decoration only for now) */}
                
                {/* Mascot / Icon */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 rounded-full p-2 shadow-lg ring-4 ring-white dark:ring-slate-800">
                    <span className="text-2xl" role="img" aria-label="mascot">👋</span>
                </div>

                <div className="mt-4 text-center">
                    <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">
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
                                    idx === currentStepIndex ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {isLastStep ? (dict?.share || 'Start') : 'Next'}
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
