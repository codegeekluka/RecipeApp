import asyncio
import logging
import os
import uuid
from typing import Dict, Optional

# Configure logging
logger = logging.getLogger(__name__)

# Try to import ElevenLabs, but don't fail if not available
try:
    from elevenlabs import stream
    from elevenlabs.client import ElevenLabs

    ELEVENLABS_AVAILABLE = True
    logger.info("ElevenLabs package imported successfully")
except ImportError as e:
    logger.warning(f"ElevenLabs not available. TTS will be disabled. Error: {e}")
    ELEVENLABS_AVAILABLE = False

# Try to import Redis, but don't fail if not available
try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    logger.warning("Redis not available. Caching will be disabled.")
    REDIS_AVAILABLE = False


class TTSService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.is_available = bool(self.api_key) and ELEVENLABS_AVAILABLE

        if not self.is_available:
            logger.warning(
                "ELEVENLABS_API_KEY not found or ElevenLabs not available. TTS will be disabled."
            )
            return

        try:
            self.client = ElevenLabs(api_key=self.api_key)
            logger.info("ElevenLabs API key configured successfully")
        except Exception as e:
            logger.error(f"Failed to configure ElevenLabs API key: {e}")
            self.is_available = False
            return

        # Initialize Redis for caching (optional)
        self.redis_client = None
        if REDIS_AVAILABLE:
            try:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = redis.from_url(redis_url)
                logger.info("Redis client initialized for TTS caching")
            except Exception as e:
                logger.warning(f"Redis not available for TTS caching: {e}")

        # Default voice for Cheffy - Rachel's voice ID
        self.default_voice = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice ID

        # Cache for audio responses
        self.audio_cache: Dict[str, bytes] = {}

        logger.info("TTS service initialized successfully")

    def synthesize(self, text: str, voice: str = "Rachel") -> Optional[bytes]:
        """Simple synthesize method that should work with most ElevenLabs versions"""
        if not self.is_available:
            logger.warning("TTS not available. Returning None.")
            return None

        try:
            logger.info(
                f"Generating TTS audio for text: '{text[:50]}...' with voice: {voice}"
            )

            # Use the correct API method: text_to_speech.stream
            # Updated to use eleven_turbo_v2 which is available on free tier
            # eleven_monolingual_v1 and eleven_multilingual_v1 are deprecated for free tier
            logger.info("Using text_to_speech.stream method")
            audio_stream = self.client.text_to_speech.stream(
                text=text,
                voice_id=voice,
                model_id="eleven_turbo_v2",  # Available on free tier, fast and efficient
            )

            # Convert stream to bytes
            logger.info("Converting stream to bytes")
            audio_bytes = b""
            chunk_count = 0
            for chunk in audio_stream:
                if isinstance(chunk, bytes):
                    audio_bytes += chunk
                    chunk_count += 1

            logger.info(
                f"TTS audio generated successfully - {len(audio_bytes)} bytes from {chunk_count} chunks"
            )
            return audio_bytes

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error generating TTS audio: {error_msg}", exc_info=True)
            
            # Check for specific error types
            if "model_deprecated" in error_msg.lower() or "deprecated" in error_msg.lower():
                logger.error("ElevenLabs model is deprecated. The model has been updated to eleven_turbo_v2.")
            elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
                logger.error("ElevenLabs quota/limit exceeded. Check your account usage.")
            elif "unauthorized" in error_msg.lower() or "401" in error_msg:
                logger.error("ElevenLabs API key is invalid or expired.")
            elif "rate" in error_msg.lower():
                logger.error("ElevenLabs rate limit exceeded. Please wait and try again.")
            
            return None

    async def generate_audio(self, text: str, voice_id: Optional[str] = None) -> bytes:
        """Generate audio for given text using ElevenLabs"""
        voice = voice_id or self.default_voice
        result = self.synthesize(text, voice)
        return result if result else b""

    async def generate_audio_url(
        self, text: str, voice_id: Optional[str] = None
    ) -> Optional[str]:
        """Generate audio and return a cached URL for streaming"""
        if not self.is_available:
            logger.warning("TTS not available. No audio URL generated.")
            return None

        try:
            logger.info(f"Generating audio URL for text: '{text[:50]}...'")

            # Generate unique response ID
            response_id = str(uuid.uuid4())
            logger.info(f"Generated response ID: {response_id}")

            # Generate audio
            audio_data = await self.generate_audio(text, voice_id)
            logger.info(
                f"Audio data generated, length: {len(audio_data) if audio_data else 0} bytes"
            )

            if not audio_data:
                logger.warning("No audio data generated, returning None")
                return None

            # Cache the audio data
            self.audio_cache[response_id] = audio_data
            logger.info(f"Audio cached with ID: {response_id}")

            # Also cache in Redis if available
            if self.redis_client:
                try:
                    self.redis_client.setex(
                        f"tts:{response_id}", 3600, audio_data  # Cache for 1 hour
                    )
                    logger.info(f"Audio also cached in Redis: {response_id}")
                except Exception as e:
                    logger.warning(f"Failed to cache audio in Redis: {e}")

            # Return the streaming URL
            url = f"/ai/tts/stream/{response_id}"
            logger.info(f"Returning audio URL: {url}")
            return url

        except Exception as e:
            logger.error(f"Error generating audio URL: {e}", exc_info=True)
            return None

    async def get_cached_audio(self, response_id: str) -> bytes:
        """Get cached audio data for a response ID"""
        try:
            # First check local cache
            if response_id in self.audio_cache:
                logger.info(f"Retrieved audio from local cache: {response_id}")
                return self.audio_cache[response_id]

            # Check Redis cache
            if self.redis_client:
                try:
                    cached_audio = self.redis_client.get(f"tts:{response_id}")
                    if cached_audio:
                        logger.info(f"Retrieved audio from Redis cache: {response_id}")
                        return cached_audio
                except Exception as e:
                    logger.warning(f"Failed to retrieve from Redis cache: {e}")

            # If not found, raise error
            raise ValueError(f"Audio not found for response ID: {response_id}")

        except Exception as e:
            logger.error(f"Error retrieving cached audio: {e}")
            raise

    async def generate_streaming_audio(self, text: str, voice_id: Optional[str] = None):
        """Generate streaming audio response"""
        if not self.is_available:
            logger.warning("TTS not available. No streaming audio generated.")
            return

        try:
            voice = voice_id or self.default_voice

            logger.info(f"Generating streaming TTS audio for text: {text[:50]}...")

            # For now, just generate regular audio and yield it
            # Streaming can be implemented later if needed
            audio_data = await self.generate_audio(text, voice_id)
            if audio_data:
                yield audio_data

        except Exception as e:
            logger.error(f"Error generating streaming TTS audio: {e}")
            return

    def cleanup_cache(self, max_age_hours: int = 1):
        """Clean up old cached audio data"""
        try:
            logger.info("Cleaning up TTS cache")
        except Exception as e:
            logger.error(f"Error cleaning up TTS cache: {e}")

    def get_available_voices(self):
        """Get list of available voices"""
        if not self.is_available:
            return []

        try:
            return [
                {
                    "voice_id": self.default_voice,
                    "name": "Rachel",
                    "description": "Default Cheffy voice",
                }
            ]
        except Exception as e:
            logger.error(f"Error getting available voices: {e}")
            return []

    def get_status(self):
        """Get TTS service status"""
        return {
            "is_initialized": True,
            "is_available": self.is_available,
            "api_key_configured": bool(self.api_key),
            "elevenlabs_available": ELEVENLABS_AVAILABLE,
            "redis_available": REDIS_AVAILABLE and bool(self.redis_client),
            "cache_size": len(self.audio_cache),
            "default_voice": self.default_voice,
        }


# Create singleton instance
tts_service = TTSService()
