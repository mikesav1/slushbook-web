import React from 'react';

/**
 * Simple centered onboarding tooltip
 * No complex positioning - always centered on screen
 * Highlights target element
 */
const OnboardingTooltip = ({ steps, currentStep, onNext, onSkip, onFinish }) => {
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
            // IMPORTANT: Prevent clicking on highlighted element during tour
            targetElement.style.pointerEvents = 'none';
            
            // Store cleanup function for this element
            cleanupFunctions.push(() => {
              Object.keys(originalStyles).forEach(key => {
                targetElement.style[key] = originalStyles[key];
              });
              // Re-enable clicking
              targetElement.style.pointerEvents = '';
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
          // Only allow closing via X button or skip button, not by clicking overlay
        }}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Tooltip - Always centered on screen */}
      <div
        className="fixed z-[10000] bg-yellow-50 border-4 border-yellow-400 rounded-2xl shadow-2xl p-6 w-[90%] max-w-md"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          aria-label="Luk"
        >
          ×
        </button>
        
        {/* Content */}
        <div className="text-gray-800 mb-5 text-lg font-medium leading-relaxed whitespace-pre-line">
          {step.content}
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center gap-3">
            {/* Step indicator */}
            <span className="text-sm text-gray-600 font-semibold">
              {currentStep + 1} / {steps.length}
            </span>
            
            {/* Next/Done button */}
            {isLast ? (
              <button
                onClick={onFinish}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Færdig ✓
              </button>
            ) : (
              <button
                onClick={onNext}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Næste →
              </button>
            )}
          </div>
          
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 text-center py-2"
          >
            Spring over (kan genstartes under Indstillinger ⚙️)
          </button>
        </div>
      </div>
    </>
  );
};

export default OnboardingTooltip;
