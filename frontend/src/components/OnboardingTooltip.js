import React, { useEffect, useState } from 'react';

/**
 * Simple custom onboarding tooltip component
 * Compatible with React 19
 */
const OnboardingTooltip = ({ steps, currentStep, onNext, onSkip, onFinish }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      const target = document.querySelector(step.target);
      
      if (target) {
        const rect = target.getBoundingClientRect();
        
        // Calculate position, ensuring tooltip stays within viewport
        const tooltipWidth = 320; // w-80 = 320px
        let left = rect.left + window.scrollX + (rect.width / 2);
        
        // Adjust if tooltip would go off right edge
        if (left + tooltipWidth / 2 > window.innerWidth - 20) {
          left = window.innerWidth - tooltipWidth / 2 - 20;
        }
        
        // Adjust if tooltip would go off left edge
        if (left - tooltipWidth / 2 < 20) {
          left = tooltipWidth / 2 + 20;
        }
        
        // Calculate arrow position (pointing to actual target)
        const targetCenterX = rect.left + (rect.width / 2);
        const arrowOffset = targetCenterX - (left - tooltipWidth / 2);
        
        setPosition({
          top: rect.bottom + window.scrollY + 10,
          left: left,
          arrowOffset: Math.max(20, Math.min(arrowOffset, tooltipWidth - 20)) // Keep arrow within tooltip bounds
        });
        
        // Highlight target with glow effect
        target.style.position = 'relative';
        target.style.zIndex = '9999';
        target.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.5)';
        target.style.borderRadius = '12px';
        
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
      
      {/* Tooltip */}
      <div
        className="fixed z-[10000] bg-yellow-50 border-3 border-yellow-400 rounded-xl shadow-2xl p-5 w-80"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100vw - 40px)'
        }}
      >
        {/* Arrow */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400" />
        
        {/* Content */}
        <div className="text-gray-800 mb-4 text-base font-medium">
          {step.content}
        </div>
        
        {/* Buttons */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={onSkip}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Spring over
          </button>
          
          <div className="flex gap-3 items-center">
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
        </div>
      </div>
    </>
  );
};

export default OnboardingTooltip;
