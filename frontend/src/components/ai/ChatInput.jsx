import React from 'react';

const ChatInput = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  startRecording,
  stopRecording,
  isRecording,
  isLoading,
  sessionId,
  activeRecipe,
  isMobile,
  inputRef,
  handleKeyPress
}) => {
  const getPlaceholder = () => {
    if (!sessionId) {
      return isMobile ? "Start session to chat" : "Start a cooking session to chat with Cheffy...";
    }
    if (activeRecipe) {
      return `Ask me about ${activeRecipe.title}...`;
    }
    return "Start cooking with a recipe to ask questions...";
  };

  const getMicTitle = () => {
    if (!sessionId) {
      return 'Start a cooking session to use voice input';
    }
    return isRecording ? 'Stop Recording' : 'Start Voice Recording';
  };

  const getSendTitle = () => {
    if (!sessionId) {
      return 'Start a cooking session to send messages';
    }
    return 'Send Message';
  };

  return (
    <div className="input-area">
      <form onSubmit={handleSendMessage} className="input-form">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            disabled={isLoading || isRecording || !sessionId}
            rows="1"
          />
          <div className="input-buttons">
            <button
              type="button"
              className={`mic-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || !sessionId}
              title={getMicTitle()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <button
              type="submit"
              className="send-button"
              disabled={!inputMessage.trim() || isLoading || isRecording || !sessionId}
              title={getSendTitle()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </div>
        </div>
      </form>
      
      {isRecording && (
        <div className="recording-indicator">
          <span className="pulse"></span>
          Recording... Click to stop
        </div>
      )}
    </div>
  );
};

export default ChatInput;
