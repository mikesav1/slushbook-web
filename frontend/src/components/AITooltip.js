import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

/**
 * Simple tooltip that shows once per feature using localStorage
 * @param {string} storageKey - Unique key for localStorage
 * @param {string} message - Tooltip message to display
 * @param {boolean} show - Whether tooltip should be visible (controlled by parent)
 * @param {function} onClose - Callback when user closes tooltip
 */
const AITooltip = ({ storageKey, message, show, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if tooltip has been shown before
    const hasBeenShown = localStorage.getItem(storageKey);
    if (!hasBeenShown && show) {
      setVisible(true);
    }
  }, [storageKey, show]);

  const handleClose = () => {
    // Mark as shown in localStorage
    localStorage.setItem(storageKey, 'true');
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition"
      >
        <FaTimes size={14} />
      </button>
      <div className="pr-6">
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      <div className="mt-3">
        <button
          onClick={handleClose}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-semibold transition"
        >
          Forstået
        </button>
      </div>
    </div>
  );
};

export default AITooltip;
