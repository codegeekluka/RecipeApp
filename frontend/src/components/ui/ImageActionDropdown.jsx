import React, { useState, useRef, useEffect } from 'react';
import '../../styles/ui/ImageActionDropdown.css';

const ImageActionDropdown = ({ onEdit, onDelete, onSelectNew, isVisible = true, hasImage = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  if (!isVisible) return null;

  return (
    <div className="image-action-dropdown" ref={dropdownRef}>
      <button
        className="dropdown-trigger"
        onClick={handleToggle}
        aria-label="Image actions"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {hasImage && (
            <button
              className="dropdown-item"
              onClick={() => handleAction(onEdit)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit
            </button>
          )}
          
          <button
            className="dropdown-item"
            onClick={() => handleAction(onSelectNew)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            {hasImage ? 'Select New' : 'Select Image'}
          </button>
          
          {hasImage && (
            <button
              className="dropdown-item delete"
              onClick={() => handleAction(onDelete)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageActionDropdown;
