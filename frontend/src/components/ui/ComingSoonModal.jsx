import { createPortal } from 'react-dom';
import '../../styles/ui/ComingSoonModal.css';

export default function ComingSoonModal({ isOpen, onClose, title = "Coming Soon", message = "Share your recipes with your friends!" }) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="coming-soon-overlay" onClick={onClose}>
      <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
        <button className="coming-soon-close-button" onClick={onClose} aria-label="Close modal">
          <svg height="20px" viewBox="0 0 384 512" aria-hidden="true" focusable="false">
            <path
              d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
            ></path>
          </svg>
        </button>
        <div className="coming-soon-content">
          <div className="coming-soon-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="coming-soon-title">{title}</h2>
          <p className="coming-soon-message">{message}</p>
        </div>
        <div className="coming-soon-button-wrapper">
          <button className="coming-soon-button" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

