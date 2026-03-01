import axios from 'axios';

class TTSService {
  constructor() {
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentAudio = null;
  }

  async initialize() {
    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume audio context if suspended (required for autoplay)
      if (this.audioContext.state === 'suspended') {
        // Try to resume on user interaction
        const resumeAudio = async () => {
          try {
            await this.audioContext.resume();
            console.log('TTS: Audio context resumed on user interaction');
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
          } catch (error) {
            console.error('TTS: Failed to resume audio context:', error);
          }
        };
        
        // Listen for user interaction to resume
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
      }
      
      console.log('TTS service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
      return false;
    }
  }

  async playAudioStream(audioUrl) {
    try {
      // Stop any currently playing audio
      if (this.isPlaying && this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      // Resume audio context if suspended (required for autoplay)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('TTS: Audio context resumed');
      }

      // Construct full URL if it's a relative path
      const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${audioUrl}`;
      console.log('TTS: Playing audio from URL:', fullUrl);

      // Create audio element for streaming
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      // Set up audio event handlers
      audio.onloadstart = () => {
        console.log('TTS: Starting to load audio stream');
        this.isPlaying = true;
        this.currentAudio = audio;
      };

      // Set up event handlers before setting src
      const playPromise = new Promise((resolve, reject) => {
        let playbackStarted = false;

        audio.onloadeddata = async () => {
          console.log('TTS: Audio data loaded');
          if (!playbackStarted) {
            playbackStarted = true;
            try {
              // Resume audio context if needed
              if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('TTS: Audio context resumed');
              }
              
              await audio.play();
              console.log('TTS: Audio playback started successfully');
            } catch (error) {
              console.error('TTS: Failed to play audio:', error);
              // Don't reject here, let onerror handle it
            }
          }
        };

        audio.oncanplay = async () => {
          console.log('TTS: Audio can start playing');
          if (!playbackStarted) {
            playbackStarted = true;
            try {
              // Resume audio context if needed
              if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('TTS: Audio context resumed in oncanplay');
              }
              
              await audio.play();
              console.log('TTS: Audio playback started from oncanplay');
            } catch (error) {
              console.error('TTS: Failed to play audio in oncanplay:', error);
              // Try one more time after a short delay
              setTimeout(async () => {
                try {
                  await audio.play();
                  console.log('TTS: Audio playback started after retry');
                } catch (retryError) {
                  console.error('TTS: Failed to play audio after retry:', retryError);
                }
              }, 100);
            }
          }
        };

        audio.onerror = (error) => {
          console.error('TTS: Audio playback error:', error, audio.error);
          this.isPlaying = false;
          this.currentAudio = null;
          reject(new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`));
        };

        audio.onended = () => {
          console.log('TTS: Audio playback ended');
          this.isPlaying = false;
          this.currentAudio = null;
          resolve();
        };

        // Set timeout to reject if audio doesn't load
        setTimeout(() => {
          if (!playbackStarted && audio.readyState < 2) {
            console.error('TTS: Audio loading timeout');
            reject(new Error('Audio loading timeout'));
          }
        }, 10000); // 10 second timeout
      });

      // Start loading the audio stream
      audio.src = fullUrl;
      audio.load(); // Explicitly load the audio
      
      // Wait for playback to complete or error
      await playPromise;
      
      return true;
    } catch (error) {
      console.error('TTS: Failed to play audio stream:', error);
      this.isPlaying = false;
      this.currentAudio = null;
      return false;
    }
  }

  async playText(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/assistant/tts',
        { text, voice_id: voiceId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // Create blob URL for the audio
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      // Play the audio
      await this.playAudioStream(audioUrl);

      // Clean up blob URL after playback
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 10000); // Clean up after 10 seconds

      return true;
    } catch (error) {
      console.error('TTS: Failed to generate and play text:', error);
      return false;
    }
  }

  async playStreamingResponse(responseId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/assistant/tts/stream/${responseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create blob URL for the audio
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      // Play the audio
      await this.playAudioStream(audioUrl);

      // Clean up blob URL after playback
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 10000); // Clean up after 10 seconds

      return true;
    } catch (error) {
      console.error('TTS: Failed to play streaming response:', error);
      return false;
    }
  }

  stop() {
    if (this.isPlaying && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.isPlaying = false;
      console.log('TTS: Audio playback stopped');
    }
  }

  pause() {
    if (this.isPlaying && this.currentAudio) {
      this.currentAudio.pause();
      console.log('TTS: Audio playback paused');
    }
  }

  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(error => {
        console.error('TTS: Failed to resume audio:', error);
      });
      console.log('TTS: Audio playback resumed');
    }
  }

  getStatus() {
    return {
      isInitialized: !!this.audioContext,
      isPlaying: this.isPlaying,
      hasAudio: !!this.currentAudio
    };
  }

  // Queue management for multiple audio requests
  addToQueue(audioUrl) {
    this.audioQueue.push(audioUrl);
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.audioQueue.length === 0 || this.isPlaying) {
      return;
    }

    const nextAudio = this.audioQueue.shift();
    await this.playAudioStream(nextAudio);
  }

  clearQueue() {
    this.audioQueue = [];
    console.log('TTS: Audio queue cleared');
  }
}

// Create singleton instance
const ttsService = new TTSService();
export default ttsService;
