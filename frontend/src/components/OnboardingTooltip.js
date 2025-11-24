import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Mobile-friendly draggable onboarding tooltip
 * - Smaller on mobile devices
 * - Draggable so users can see highlighted elements
 * - Responsive positioning
 */
const OnboardingTooltip = ({ steps, currentStep, onNext, onSkip, onFinish }) => {
  const { t } = useTranslation();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset position when step changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [currentStep]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    // Only allow dragging from the drag handle area (top part)
    if (!e.target.closest('.drag-handle')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);
  // Highlight the target element with strong, visible styling
  // Find ALL elements matching selector and highlight the visible one(s)
  React.useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step.target) {
        // Get ALL elements matching the selector (there might be multiple - desktop & mobile)
        const targetElements = document.querySelectorAll(step.target);
        const cleanupFunctions = [];
        
        targetElements.forEach(targetElement => {
          // Only highlight visible elements
          const rect = targetElement.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                          window.getComputedStyle(targetElement).display !== 'none' &&
                          window.getComputedStyle(targetElement).visibility !== 'hidden';
          
          if (isVisible) {
            // Store original styles
            const originalStyles = {
              position: targetElement.style.position,
              zIndex: targetElement.style.zIndex,
              boxShadow: targetElement.style.boxShadow,
              borderRadius: targetElement.style.borderRadius,
              backgroundColor: targetElement.style.backgroundColor,
              outline: targetElement.style.outline,
              animation: targetElement.style.animation
            };
            
            // Add VERY strong highlight styling that's visible on dark backgrounds
            targetElement.style.position = 'relative';
            targetElement.style.zIndex = '9999';
            // Multiple shadows for maximum visibility
            targetElement.style.boxShadow = `
              0 0 0 3px #ffffff,
              0 0 0 6px #fbbf24,
              0 0 30px 8px rgba(251, 191, 36, 0.9),
              0 0 50px 12px rgba(251, 191, 36, 0.6)
            `;
            targetElement.style.borderRadius = '12px';
            targetElement.style.backgroundColor = 'rgba(251, 191, 36, 0.15)';
            targetElement.style.outline = '3px solid #fbbf24';
            targetElement.style.outlineOffset = '3px';
            targetElement.style.transition = 'all 0.3s ease';
            targetElement.style.animation = 'pulse-highlight-strong 2s ease-in-out infinite';
            
            // CRITICAL: Prevent ANY interaction with highlighted element during tour
            targetElement.style.pointerEvents = 'none';
            targetElement.style.userSelect = 'none';
            
            // Also disable all child elements
            const originalPointerEvents = targetElement.style.pointerEvents;
            Array.from(targetElement.querySelectorAll('*')).forEach(child => {
              child.style.pointerEvents = 'none';
            });
            
            // Store cleanup function for this element
            cleanupFunctions.push(() => {
              Object.keys(originalStyles).forEach(key => {
                targetElement.style[key] = originalStyles[key];
              });
              // Re-enable clicking on element and children
              targetElement.style.pointerEvents = '';
              targetElement.style.userSelect = '';
              Array.from(targetElement.querySelectorAll('*')).forEach(child => {
                child.style.pointerEvents = '';
              });
            });
          }
        });
        
        // Cleanup function - restore all highlighted elements
        return () => {
          cleanupFunctions.forEach(cleanup => cleanup());
        };
      }
    }
  }, [currentStep, steps]);

  if (currentStep < 0 || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Semi-transparent overlay - blocks all clicks during tour */}
      <div 
        className="fixed inset-0 bg-black/40 z-[9998]" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Tooltip - Draggable and mobile-optimized */}
      <div
        ref={tooltipRef}
        className={`fixed z-[10000] bg-yellow-50 border-4 border-yellow-400 rounded-2xl shadow-2xl ${
          isMobile 
            ? 'w-[85%] max-h-[75vh]' // Mobile: smaller width and max height
            : 'w-[90%] max-w-md max-h-[85vh]' // Desktop: normal size
        } overflow-y-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          top: isMobile ? '50%' : '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          touchAction: 'none',
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle area - visual indicator */}
        <div className="drag-handle bg-yellow-100 rounded-t-xl py-2 px-4 flex items-center justify-between border-b-2 border-yellow-300 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-yellow-400 rounded"></div>
              <div className="w-1 h-4 bg-yellow-400 rounded"></div>
              <div className="w-1 h-4 bg-yellow-400 rounded"></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {isMobile ? '👆 ' + t('common.holdAndDragToMove', 'Hold og træk for at flytte') : '🖱️ ' + t('common.dragToMove', 'Træk for at flytte')}
            </span>
          </div>
          
          {/* Close button */}
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none p-1"
            aria-label="Luk"
          >
            ×
          </button>
        </div>

        {/* Content area */}
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {/* Step indicator at top */}
          <div className="text-xs text-gray-500 font-semibold mb-3 text-center">
            {t('common.stepCount', { current: currentStep + 1, total: steps.length })}
          </div>
          
          {/* Content */}
          <div className={`text-gray-800 mb-4 ${isMobile ? 'text-base' : 'text-lg'} font-medium leading-relaxed whitespace-pre-line`}>
            {step.content}
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center gap-2">
              {/* Next/Done button */}
              {isLast ? (
                <button
                  onClick={onFinish}
                  className={`flex-1 bg-yellow-500 hover:bg-yellow-600 text-white ${
                    isMobile ? 'px-4 py-2.5 text-base' : 'px-8 py-3 text-lg'
                  } rounded-xl font-bold shadow-lg hover:shadow-xl transition-all`}
                >
                  Færdig ✓
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className={`flex-1 bg-yellow-500 hover:bg-yellow-600 text-white ${
                    isMobile ? 'px-4 py-2.5 text-base' : 'px-8 py-3 text-lg'
                  } rounded-xl font-bold shadow-lg hover:shadow-xl transition-all`}
                >
                  Næste →
                </button>
              )}
            </div>
            
            {/* Skip button */}
            <button
              onClick={onSkip}
              className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 hover:text-gray-700 text-center py-2`}
            >
              {t('common.skipTour', 'Spring over')} {!isMobile && `(${t('common.canRestartInSettings', 'kan genstartes under Indstillinger')} ⚙️)`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTooltip;
