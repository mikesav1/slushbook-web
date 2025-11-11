import React from 'react';

/**
 * Simple centered onboarding tooltip
 * No complex positioning - always centered on screen
 * Highlights target element
 */
const OnboardingTooltip = ({ steps, currentStep, onNext, onSkip, onFinish }) => {
  // Highlight the target element
  React.useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step.target) {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          // Add highlight styling
          targetElement.style.position = 'relative';
          targetElement.style.zIndex = '9999';
          targetElement.style.boxShadow = '0 0 0 4px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.5)';
          targetElement.style.borderRadius = '12px';
          targetElement.style.transition = 'all 0.3s ease';
          
          // Add pulse animation
          targetElement.style.animation = 'pulse-highlight 2s ease-in-out infinite';
          
          // Cleanup function
          return () => {
            targetElement.style.position = '';
            targetElement.style.zIndex = '';
            targetElement.style.boxShadow = '';
            targetElement.style.borderRadius = '';
            targetElement.style.animation = '';
          };
        }
      }
    }
  }, [currentStep, steps]);

  if (currentStep < 0 || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Semi-transparent overlay - allows background to be visible */}
      <div 
        className="fixed inset-0 bg-black/40 z-[9998]" 
        onClick={onSkip}
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
        <div className="text-gray-800 mb-5 text-lg font-medium leading-relaxed">
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
