import React, { useState, useRef } from 'react';
import '../../styles/planner/AIPlanningSection.css';

const AIPlanningSection = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        // MVP: Just show placeholder message
        setIsProcessing(true);
        setTimeout(() => {
          setTranscribedText('I have chicken, rice, and vegetables in my fridge.');
          setSuggestedRecipes([
            { id: 1, title: 'Chicken Fried Rice', match: '95%' },
            { id: 2, title: 'Vegetable Stir Fry', match: '88%' },
            { id: 3, title: 'Chicken and Rice Bowl', match: '82%' }
          ]);
          setIsProcessing(false);
        }, 1500);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearInput = () => {
    setTranscribedText('');
    setSuggestedRecipes([]);
  };

  return (
    <div className="ai-planning-section">
      <div className="ai-planning-header">
        <div className="ai-planning-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.2"/>
            <path d="M12 1l1 1M23 12l-1 1M12 23l-1-1M1 12l1-1" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <path d="M9 9l1.5 1.5M15 9l-1.5 1.5M9 15l1.5-1.5M15 15l-1.5-1.5" strokeWidth="1" opacity="0.6"/>
          </svg>
        </div>
        <div className="ai-planning-title">
          <h2>Plan with AI</h2>
          <p>Tell me what ingredients you have, and I'll suggest recipes</p>
        </div>
      </div>

      <div className="ai-planning-content">
        {/* Voice Input Section */}
        <div className="voice-input-section">
          <div className="voice-input-header">
            <h3>What ingredients do you have?</h3>
            <p className="voice-hint">Click the microphone to speak</p>
          </div>
          
          <div className="voice-controls">
            {!isRecording ? (
              <button
                className="record-button"
                onClick={startRecording}
                title="Start Recording"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                className="stop-button"
                onClick={stopRecording}
                title="Stop Recording"
              >
                <div className="recording-indicator"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                <span>Stop Recording</span>
              </button>
            )}
          </div>

          {/* Transcribed Text Display */}
          {transcribedText && (
            <div className="transcribed-text-container">
              <div className="transcribed-text-header">
                <span className="transcribed-label">You said:</span>
                <button
                  className="clear-button"
                  onClick={clearInput}
                  title="Clear"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="transcribed-text">
                {transcribedText}
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="processing-indicator">
              <div className="processing-spinner"></div>
              <span>Analyzing your ingredients...</span>
            </div>
          )}
        </div>

        {/* Suggested Recipes Section */}
        {suggestedRecipes.length > 0 && (
          <div className="suggested-recipes-section">
            <div className="suggested-recipes-header">
              <h3>Suggested Recipes</h3>
              <p className="suggested-hint">Based on your ingredients</p>
            </div>
            
            <div className="suggested-recipes-list">
              {suggestedRecipes.map((recipe) => (
                <div key={recipe.id} className="suggested-recipe-card">
                  <div className="recipe-match-badge">
                    <span>{recipe.match} match</span>
                  </div>
                  <div className="recipe-info">
                    <h4>{recipe.title}</h4>
                    <p className="recipe-placeholder">Recipe details coming soon</p>
                  </div>
                  <button className="view-recipe-button" disabled>
                    <span>View Recipe</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MVP Notice */}
        <div className="mvp-notice">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>This is an MVP feature. Full AI integration coming soon!</span>
        </div>
      </div>
    </div>
  );
};

export default AIPlanningSection;

