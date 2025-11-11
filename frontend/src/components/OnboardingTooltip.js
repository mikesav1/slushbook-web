import React, { useEffect, useState } from 'react';

/**
 * Simple custom onboarding tooltip component
 * Compatible with React 19
 */
const OnboardingTooltip = ({ steps, currentStep, onNext, onSkip, onFinish }) => {
  const [position, setPosition] = useState({ isMobile: false, targetCenterX: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      const target = document.querySelector(step.target);
      
      if (target) {
        const rect = target.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        
        console.log('[Tooltip] Setup:', {
          isMobile,
          windowWidth: window.innerWidth,
          targetTop: rect.top,
          targetLeft: rect.left
        });
        
        // Highlight target
        target.style.position = 'relative';
        target.style.zIndex = '9999';
        target.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.5)';
        target.style.borderRadius = '12px';
        
        setPosition({
          isMobile,
          targetCenterX: rect.left + (rect.width / 2)
        });
        
        setShow(true);
      }
    } else {
      setShow(false);
    }
  }, [currentStep, steps]);

  if (!show || currentStep < 0 || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={onSkip} />
      
      {/* Tooltip - Different positioning for mobile vs desktop */}
      <div
        className={`fixed z-[10000] bg-yellow-50 border-3 border-yellow-400 rounded-xl shadow-2xl p-5 w-80 max-w-[calc(100vw-40px)] ${
          position.isMobile 
            ? 'left-1/2 -translate-x-1/2' // Mobile: horizontally centered
            : ''
        }`}
        style={position.isMobile ? {
          bottom: '120px' // Mobile: fixed 120px from bottom (above nav)
        } : {
          // Desktop: use normal positioning (this will be set by parent or default)
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        {/* Simple arrow pointing up on mobile, otherwise skip for now */}
        {position.isMobile && (
          <div 
            className="absolute -top-3 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"
            style={{
              left: `${position.targetCenterX || window.innerWidth / 2}px`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
        
        {/* Content */}
        <div className="text-gray-800 mb-4 text-base font-medium">
          {step.content}
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center gap-3">
            {/* Step indicator */}
            <span className="text-sm text-gray-600 font-medium">
              {currentStep + 1} / {steps.length}
            </span>
            
            {isLast ? (
              <button
                onClick={onFinish}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold text-base shadow-md hover:shadow-lg transition-all"
              >
                Færdig ✓
              </button>
            ) : (
              <button
                onClick={onNext}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold text-base shadow-md hover:shadow-lg transition-all"
              >
                Næste →
              </button>
            )}
          </div>
          
          {/* Skip button with info */}
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 text-center"
          >
            Spring over (kan genstartes under Indstillinger ⚙️)
          </button>
        </div>
      </div>
    </>
  );
};

export default OnboardingTooltip;
