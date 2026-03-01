import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../contexts/AuthContext';
import useAIAssistantStore from '../stores/aiAssistantStore';
import { getActiveRecipe } from '../services/getActiveRecipe';
import { removeActiveRecipe } from '../services/removeActiveRecipe';
import '../styles/ai/Cheffy.css';
import '../styles/ai/HelpModals.css';
import PillNav from '../components/layout/PillNav.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import ChatMessage from '../components/ai/ChatMessage.jsx';
import AiPageRecipeCard from '../components/ai/AiPageRecipeCard.jsx';
import ChatInput from '../components/ai/ChatInput.jsx';
import RecipeActivationModal from '../components/ai/RecipeActivationModal.jsx';
import UpgradeModal from '../components/ui/UpgradeModal.jsx';
import subscriptionService from '../services/subscriptionService';

const Cheffy = () => {
  const { userProfile } = useContext(AuthContext);
  const {
    sessionId,
    messages,
    isRecording,
    isLoading,
    error,
    sessionStatus,
    servicesInitialized,
    initializeServices,
    startSession,
    sendMessage,
    sendAudioMessage,
    setIsRecording,
    endSession,
    clearError,
    checkExistingSession,
    showUpgradeModal,
    upgradeModalData,
    closeUpgradeModal,
    subscriptionStatus,
    setSubscriptionStatus
  } = useAIAssistantStore();

  const [inputMessage, setInputMessage] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [isLoadingActiveRecipe, setIsLoadingActiveRecipe] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingRecipeId, setPendingRecipeId] = useState(null);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const sessionIdRef = React.useRef(null);

  // Helper function to construct full image URL
  const getImageUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    // If it's already a full URL, return as is
    if (relativeUrl.startsWith('http')) return relativeUrl;
    // Otherwise, prepend the backend URL
    return `http://localhost:8000${relativeUrl}`;
  };

  // Get hero image with fallbacks
  const getHeroImageStyle = () => {
    if (userProfile?.hero_image_url) {
      const fullImageUrl = getImageUrl(userProfile.hero_image_url);
      return {
        backgroundImage: `url('${fullImageUrl}')`,
        backgroundSize: '1200px 400px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    } else {
      // Fallback to default image
      return {
        backgroundImage: `url('pexels-enginakyurt-1435895.jpg')`,
        backgroundSize: '1200px 400px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
  };

  // Help Dropdown Component
  const HelpDropdown = () => (
    <div className="help-dropdown">
      <button 
        className="help-close-button"
        onClick={() => setShowHelpDropdown(false)}
        title="Close"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div className="help-content">
                <h4>Getting Started</h4>
        <ol>
          <li>Make sure you have an active recipe selected</li>
          <li>Click "Start Session" above</li>
          <li>Use the microphone button to record voice commands</li>
          <li>I'll guide you through the cooking process!</li>
        </ol>
        <h4>I can help you with:</h4>
        <ul>
          <li>Step-by-step guidance through the recipe</li>
          <li>Ingredient substitutions and alternatives</li>
          <li>Cooking techniques and tips</li>
          <li>Kitchen safety and best practices</li>
          <li>Answering any questions about the recipe</li>
        </ul>
      </div>
    </div>
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update sessionId ref when sessionId changes
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Handle session cleanup on unmount
  useEffect(() => {
    return () => {
      // Only end session on actual component unmount, not on re-renders
      if (sessionIdRef.current) {
        endSession();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Handle click outside to close help dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHelpDropdown) {
        // Check if click is outside the help dropdown and not on the info button
        const helpDropdown = document.querySelector('.help-dropdown');
        const infoButton = document.querySelector('.info-button');
        
        if (helpDropdown && 
            !helpDropdown.contains(event.target) && 
            infoButton && 
            !infoButton.contains(event.target)) {
          setShowHelpDropdown(false);
        }
      }
    };

    if (showHelpDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHelpDropdown]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize AI Assistant services on component mount
  useEffect(() => {
    const initServices = async () => {
      try {
        console.log('Cheffy: Initializing AI Assistant services...');
        
        // Debug: Check environment variables
        console.log('Cheffy: Environment check:', {
          VITE_PICOVOICE_ACCESS_KEY: import.meta.env.VITE_PICOVOICE_ACCESS_KEY ? 'Set' : 'Not set',
          VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'Not set'
        });
        
        await initializeServices();
        console.log('Cheffy: Services initialization completed');
      } catch (error) {
        console.error('Cheffy: Failed to initialize AI Assistant services:', error);
      }
    };

    initServices();
  }, [initializeServices]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('Cheffy: State updated:', {
      servicesInitialized,
      sessionStatus,
      sessionId,
      isRecording
    });
  }, [servicesInitialized, sessionStatus, sessionId, isRecording]);

  // Fetch active recipe on component mount
  useEffect(() => {
    const fetchActiveRecipe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const recipe = await getActiveRecipe(token);
          setActiveRecipe(recipe);
        }
      } catch (error) {
        console.error('Failed to fetch active recipe:', error);
      } finally {
        setIsLoadingActiveRecipe(false);
      }
    };

    fetchActiveRecipe();
  }, []);

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const status = await subscriptionService.getSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchSubscriptionStatus();
  }, [setSubscriptionStatus]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    try {
      await sendMessage(inputMessage.trim());
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        try {
          await sendAudioMessage(audioBlob);
        } catch (error) {
          console.error('Failed to send audio message:', error);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setMediaRecorder(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleStartCooking = async (recipeId) => {
    if (!recipeId) return;
    
    try {
      // Check for existing session
      const existingSession = await checkExistingSession();
      
      if (existingSession && existingSession.recipe_title !== activeRecipe?.title) {
        // Show confirmation dialog
        setPendingRecipeId(recipeId);
        setShowConfirmation(true);
        return;
      }
      
      // Start session directly
      await startSession(recipeId);
    } catch (error) {
      console.error('Failed to start session with active recipe:', error);
    }
  };

  const handleConfirmSessionSwitch = async () => {
    if (!pendingRecipeId) return;
    
    try {
      // End existing session first
      if (sessionId) {
        await endSession();
      }
      
      // Start new session
      await startSession(pendingRecipeId);
      setShowConfirmation(false);
      setPendingRecipeId(null);
    } catch (error) {
      console.error('Failed to switch sessions:', error);
    }
  };

  const handleCancelSessionSwitch = () => {
    setShowConfirmation(false);
    setPendingRecipeId(null);
  };

  const handleEndSession = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleRemoveActiveRecipe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await removeActiveRecipe(token);
        // Refresh the active recipe state
        const recipe = await getActiveRecipe(token);
        setActiveRecipe(recipe);
      }
    } catch (error) {
      console.error('Failed to remove active recipe:', error);
    }
  };

  const handleRecipeActivated = async () => {
    // Refresh active recipe after activation
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const activeRecipe = await getActiveRecipe(token);
        setActiveRecipe(activeRecipe);
      }
    } catch (error) {
      console.error('Failed to fetch active recipe:', error);
    }
  };

  if (error) {
    return (
      <div className="cheffy-container">
        <PillNav />
        <BottomNav />
        <div className="ai-assistant-error">
          <div className="error-content">
            <h3>AI Assistant Error</h3>
            <p>{error}</p>
            <button onClick={clearError}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cheffy-container">
      {/* Hero Section */}
      <div className="cheffy-hero" style={getHeroImageStyle()}>
        <h1>Cheffy AI Assistant</h1>
        <p>Your personal AI cooking companion</p>
      </div>
      
      <PillNav />
      <BottomNav />
      
      {/* AI Assistant Chat Panel */}
      <div className="ai-chat-panel">
        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Switch Cooking Session?</h3>
              <p>You already have an active cooking session for <strong>{activeRecipe?.title}</strong>.</p>
              <p>Do you want to switch to this recipe?</p>
              <div className="confirmation-buttons">
                <button 
                  className="help-cancel-button"
                  onClick={handleCancelSessionSwitch}
                >
                  Cancel
                </button>
                <button 
                  className="help-confirm-button"
                  onClick={handleConfirmSessionSwitch}
                >
                  Switch Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Centered Recipe Card - Only show when no session, floating above chat */}
        {!sessionId && (
          <div className="ai-recipe-selection-container">
            {activeRecipe ? (
              <AiPageRecipeCard
                activeRecipe={activeRecipe}
                isLoadingActiveRecipe={isLoadingActiveRecipe}
                onStartCooking={handleStartCooking}
                isLoading={isLoading}
              />
            ) : (
              <div className="no-active-recipe-prompt">
                <div className="prompt-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3>No Active Recipe</h3>
                <p>Select a recipe to start cooking with Cheffy AI Assistant</p>
                <button
                  className="browse-recipes-button"
                  onClick={() => setShowRecipeModal(true)}
                >
                  Browse Recipes
                </button>
              </div>
            )}
            {activeRecipe && (
              <button
                className="browse-recipes-button-secondary"
                onClick={() => setShowRecipeModal(true)}
              >
                Browse Recipes
              </button>
            )}
          </div>
        )}

        {/* Chat Interface */}
        <div className={`chat-interface ${!sessionId ? 'disabled' : ''}`}>
          {/* Header - Always visible */}
          <div className="chat-header">
            {sessionId && activeRecipe ? (
              <>
                <h3>Cooking: {activeRecipe.title}</h3>
                <div className="header-actions">
                  {/* Session Counter */}
                  {subscriptionStatus && !subscriptionStatus.is_premium && (
                    <div className="session-counter">
                      <span className="session-counter-label">Sessions:</span>
                      <span className="session-counter-value">
                        {subscriptionStatus.sessions_used} / {subscriptionStatus.sessions_limit}
                      </span>
                    </div>
                  )}
                  {subscriptionStatus && subscriptionStatus.is_premium && (
                    <div className="session-counter premium">
                      <span className="session-counter-label">Premium</span>
                      <span className="session-counter-value">∞</span>
                    </div>
                  )}
                                     <button 
                     className={`session-active-button ${isRecording ? 'listening' : ''}`}
                     disabled
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                       <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                     </svg>
                     {!servicesInitialized ? 'Initializing...' : 
                      sessionStatus === 'listening' ? 'Recording...' :
                      sessionStatus === 'thinking' ? 'Processing...' :
                      sessionStatus === 'speaking' ? 'Speaking...' : 'Active'}
                   </button>
                                     <button 
                     className="end-session-button"
                     onClick={handleEndSession}
                     disabled={isLoading}
                   >
                     End Session
                   </button>
                </div>
              </>
            ) : (
              <h3>AI Chef Assistant</h3>
            )}
            <div className="header-actions">
              {!sessionId && activeRecipe && (
                <button 
                  className="remove-active-button"
                  onClick={handleRemoveActiveRecipe}
                  title="Remove Active Recipe"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Remove
                </button>
              )}
              <button 
                className="info-button"
                onClick={() => setShowHelpDropdown(!showHelpDropdown)}
                title="Help Information"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M10 8.484C10.5 7.494 11 7 12 7c1.246 0 2.453.45 2.5 1.5 0 .5-.5 1-1 1.5-.5.5-1 1-1 1.5v1"/>
                  <circle cx="12" cy="16" r="0.8"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {sessionId && messages.length === 0 && !isLoading ? (
              <div className="welcome-message">
                <div className="welcome-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4>Welcome to Cheffy!</h4>
                {activeRecipe ? (
                  <>
                    <p>I'm ready to help you cook <strong>{activeRecipe.title}</strong>!</p>
                    <p>Ask me anything about the recipe, cooking techniques, or get step-by-step guidance.</p>
                  </>
                ) : (
                  <>
                    <p>I'm here to help you with cooking!</p>
                    <p>To get started, go to "My Recipes" and activate a recipe.</p>
                  </>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  formatTime={formatTime}
                />
              ))
            )}
            {isLoading && (
              <div className="loading-message">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>Cheffy is thinking...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            startRecording={startRecording}
            stopRecording={stopRecording}
            isRecording={isRecording}
            isLoading={isLoading}
            sessionId={sessionId}
            activeRecipe={activeRecipe}
            isMobile={isMobile}
            inputRef={inputRef}
            handleKeyPress={handleKeyPress}
          />
         </div>
       </div>
       
       {/* Help Dropdown Portal */}
       {showHelpDropdown && createPortal(<HelpDropdown />, document.body)}
       
       {/* Recipe Activation Modal */}
       <RecipeActivationModal
         isOpen={showRecipeModal}
         onClose={() => setShowRecipeModal(false)}
         onRecipeActivated={handleRecipeActivated}
       />
       
       {/* Upgrade Modal */}
       <UpgradeModal
         isOpen={showUpgradeModal}
         onClose={closeUpgradeModal}
         sessionsUsed={upgradeModalData?.sessionsUsed || 3}
         sessionsLimit={upgradeModalData?.sessionsLimit || 3}
         onUpgradeSuccess={() => {
           // Refresh subscription status after upgrade
           subscriptionService.getSubscriptionStatus()
             .then(status => setSubscriptionStatus(status))
             .catch(err => console.error('Failed to refresh subscription:', err));
         }}
       />
     </div>
   );
 };

export default Cheffy;
