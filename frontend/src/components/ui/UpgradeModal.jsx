import { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import '../../styles/ui/UpgradeModal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  sessionsUsed = 0, 
  sessionsLimit = 3,
  onUpgradeSuccess 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/payment/create-checkout-session`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Redirect to Stripe Checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(
        err.response?.data?.detail || 
        'Failed to start checkout process. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="upgrade-modal-close-button" 
          onClick={onClose} 
          aria-label="Close modal"
          disabled={isLoading}
        >
          <svg height="20px" viewBox="0 0 384 512" aria-hidden="true" focusable="false">
            <path
              d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
            ></path>
          </svg>
        </button>
        
        <div className="upgrade-modal-content">
          <div className="upgrade-modal-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              <path d="M12 2v20"/>
            </svg>
          </div>
          
          <h2 className="upgrade-modal-title">Upgrade to Premium</h2>
          
          <p className="upgrade-modal-message">
            You've used all {sessionsLimit} free AI cooking sessions. 
            Upgrade to Premium for unlimited access!
          </p>

          <div className="upgrade-modal-stats">
            <div className="upgrade-stat">
              <span className="stat-label">Sessions Used:</span>
              <span className="stat-value">{sessionsUsed} / {sessionsLimit}</span>
            </div>
          </div>

          <div className="upgrade-modal-benefits">
            <h3>Premium Benefits:</h3>
            <ul>
              <li>✨ Unlimited AI cooking sessions</li>
              <li>🎯 Priority support</li>
              <li>🚀 Early access to new features</li>
              <li>💎 Ad-free experience</li>
            </ul>
          </div>

          {error && (
            <div className="upgrade-modal-error">
              {error}
            </div>
          )}
        </div>

        <div className="upgrade-modal-button-wrapper">
          <button 
            className="upgrade-modal-button-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Maybe Later
          </button>
          <button 
            className="upgrade-modal-button-primary" 
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}








