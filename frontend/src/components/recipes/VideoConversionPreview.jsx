import React, { useState } from 'react';
import '../../styles/recipes/VideoConversionPreview.css';
import ComingSoonModal from '../ui/ComingSoonModal';

const VideoConversionPreview = () => {
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);

  return (
    <div className="video-conversion-section">
      <div className="video-platforms">
        {/* TikTok/Instagram Reels Card */}
        <div className="platform-card tiktok-card">
          <div className="platform-icon-wrapper">
            <div className="platform-icon tiktok-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </div>
          </div>
          <div className="platform-content">
            <h3>TikTok & Instagram Reels</h3>
            <p className="platform-description">
              Paste a link to your favorite TikTok or Instagram Reel and let AI extract the recipe for you
            </p>
            <div className="platform-features">
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Automatic ingredient extraction</span>
              </div>
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Step-by-step instructions</span>
              </div>
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Smart cooking time detection</span>
              </div>
            </div>
            <button 
              className="platform-button tiktok-button"
              onClick={() => setShowTikTokModal(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>Convert Reel</span>
            </button>
          </div>
        </div>

        {/* YouTube Card */}
        <div className="platform-card youtube-card">
          <div className="platform-icon-wrapper">
            <div className="platform-icon youtube-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
          </div>
          <div className="platform-content">
            <h3>YouTube Videos</h3>
            <p className="platform-description">
              Extract recipes from YouTube cooking videos with AI-powered transcription and analysis
            </p>
            <div className="platform-features">
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Video transcription</span>
              </div>
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Ingredient list generation</span>
              </div>
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Detailed cooking steps</span>
              </div>
            </div>
            <button 
              className="platform-button youtube-button"
              onClick={() => setShowYouTubeModal(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>Convert Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* MVP Notice */}
      <div className="video-mvp-notice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span>These features are coming soon! AI-powered video conversion will be available in a future update.</span>
      </div>

      {/* Modals */}
      <ComingSoonModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
        title="Coming Soon"
        message="TikTok and Instagram Reel conversion will be available soon! Paste your video link and let AI extract the recipe automatically."
      />

      <ComingSoonModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        title="Coming Soon"
        message="YouTube video conversion will be available soon! Extract recipes from cooking videos with AI-powered transcription and analysis."
      />
    </div>
  );
};

export default VideoConversionPreview;

