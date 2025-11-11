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
        
        // Position tooltip below target
        setPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX + (rect.width / 2)
        });
        
        // Highlight target
        target.style.position = 'relative';
        target.style.zIndex = '9999';
        
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
        className="fixed z-[10000] bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-2xl p-4 max-w-sm"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Arrow */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400" />
        
        {/* Content */}
        <div className="text-gray-800 mb-4">
          {step.content}
        </div>
        
        {/* Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onSkip}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Spring over
          </button>
          
          <div className="flex gap-2">
            {/* Step indicator */}
            <span className="text-xs text-gray-500 self-center">
              {currentStep + 1} / {steps.length}
            </span>
            
            {isLast ? (
              <button
                onClick={onFinish}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Færdig
              </button>
            ) : (
              <button
                onClick={onNext}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Næste
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTooltip;
