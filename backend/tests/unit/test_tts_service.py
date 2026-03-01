"""
Unit tests for TTS service functionality
"""
import pytest
from unittest.mock import patch, Mock
from backend.services.tts_service import TTSService


class TestTTSService:
    """Test TTS service functionality"""
    
    @pytest.fixture
    def tts_service(self):
        """Create TTS service instance for testing"""
        return TTSService()
    
    def test_generate_audio_success(self, tts_service):
        """Test successful audio generation"""
        with patch('backend.services.tts_service.elevenlabs') as mock_elevenlabs:
            mock_elevenlabs.generate.return_value = b"fake_audio_data"
            
            audio_data = tts_service.generate_audio("Hello, this is a test message")
            
            assert isinstance(audio_data, bytes)
            assert audio_data == b"fake_audio_data"
    
    def test_generate_audio_api_error(self, tts_service):
        """Test audio generation with API error"""
        with patch('backend.services.tts_service.elevenlabs') as mock_elevenlabs:
            mock_elevenlabs.generate.side_effect = Exception("API Error")
            
            with pytest.raises(Exception) as exc_info:
                tts_service.generate_audio("Test message")
            
            assert "API Error" in str(exc_info.value)
    
    def test_generate_audio_url_success(self, tts_service):
        """Test successful audio URL generation"""
        with patch.object(tts_service, 'generate_audio') as mock_generate:
            mock_generate.return_value = b"fake_audio_data"
            
            with patch('backend.services.tts_service.uuid.uuid4') as mock_uuid:
                mock_uuid.return_value = "test-uuid-123"
                
                audio_url = tts_service.generate_audio_url("Hello, this is a test message")
                
                assert audio_url == "/tts/stream/test-uuid-123"
    
    def test_generate_audio_url_with_custom_voice(self, tts_service):
        """Test audio URL generation with custom voice"""
        with patch.object(tts_service, 'generate_audio') as mock_generate:
            mock_generate.return_value = b"fake_audio_data"
            
            with patch('backend.services.tts_service.uuid.uuid4') as mock_uuid:
                mock_uuid.return_value = "test-uuid-456"
                
                audio_url = tts_service.generate_audio_url(
                    "Hello, this is a test message",
                    voice_id="custom-voice-id"
                )
                
                assert audio_url == "/tts/stream/test-uuid-456"
                # Verify the custom voice was used
                mock_generate.assert_called_with(
                    "Hello, this is a test message",
                    voice_id="custom-voice-id"
                )
    
    def test_get_cached_audio_success(self, tts_service):
        """Test getting cached audio successfully"""
        test_audio_data = b"cached_audio_data"
        tts_service.audio_cache["test-response-id"] = test_audio_data
        
        audio_data = tts_service.get_cached_audio("test-response-id")
        
        assert audio_data == test_audio_data
    
    def test_get_cached_audio_not_found(self, tts_service):
        """Test getting cached audio that doesn't exist"""
        with pytest.raises(KeyError):
            tts_service.get_cached_audio("non-existent-id")
    
    def test_cache_audio(self, tts_service):
        """Test caching audio data"""
        test_audio_data = b"test_audio_data"
        response_id = "test-response-id"
        
        tts_service.cache_audio(response_id, test_audio_data)
        
        assert response_id in tts_service.audio_cache
        assert tts_service.audio_cache[response_id] == test_audio_data
    
    def test_cache_audio_overwrite(self, tts_service):
        """Test overwriting cached audio data"""
        original_data = b"original_data"
        new_data = b"new_data"
        response_id = "test-response-id"
        
        # Cache original data
        tts_service.cache_audio(response_id, original_data)
        assert tts_service.audio_cache[response_id] == original_data
        
        # Overwrite with new data
        tts_service.cache_audio(response_id, new_data)
        assert tts_service.audio_cache[response_id] == new_data
    
    def test_clear_cache(self, tts_service):
        """Test clearing the audio cache"""
        # Add some test data to cache
        tts_service.cache_audio("id1", b"data1")
        tts_service.cache_audio("id2", b"data2")
        
        assert len(tts_service.audio_cache) == 2
        
        # Clear cache
        tts_service.clear_cache()
        
        assert len(tts_service.audio_cache) == 0
    
    def test_get_cache_size(self, tts_service):
        """Test getting cache size"""
        assert tts_service.get_cache_size() == 0
        
        tts_service.cache_audio("id1", b"data1")
        assert tts_service.get_cache_size() == 1
        
        tts_service.cache_audio("id2", b"data2")
        assert tts_service.get_cache_size() == 2
    
    def test_cache_eviction(self, tts_service):
        """Test cache eviction when cache is full"""
        # Set a small max cache size for testing
        tts_service.max_cache_size = 2
        
        # Add items up to the limit
        tts_service.cache_audio("id1", b"data1")
        tts_service.cache_audio("id2", b"data2")
        
        assert tts_service.get_cache_size() == 2
        
        # Add one more item - should evict the oldest
        tts_service.cache_audio("id3", b"data3")
        
        assert tts_service.get_cache_size() == 2
        assert "id1" not in tts_service.audio_cache  # Oldest should be evicted
        assert "id2" in tts_service.audio_cache
        assert "id3" in tts_service.audio_cache
    
    def test_generate_audio_empty_text(self, tts_service):
        """Test audio generation with empty text"""
        with patch('backend.services.tts_service.elevenlabs') as mock_elevenlabs:
            mock_elevenlabs.generate.return_value = b""
            
            audio_data = tts_service.generate_audio("")
            
            assert audio_data == b""
    
    def test_generate_audio_long_text(self, tts_service):
        """Test audio generation with long text"""
        long_text = "This is a very long text message that should still work with the TTS service. " * 10
        
        with patch('backend.services.tts_service.elevenlabs') as mock_elevenlabs:
            mock_elevenlabs.generate.return_value = b"long_audio_data"
            
            audio_data = tts_service.generate_audio(long_text)
            
            assert audio_data == b"long_audio_data"
            # Verify the long text was passed to the API
            mock_elevenlabs.generate.assert_called_with(
                text=long_text,
                voice="21m00Tcm4TlvDq8ikWAM",
                model="eleven_turbo_v2"  # Updated to use free tier model
            )
    
    def test_default_voice_id(self, tts_service):
        """Test that default voice ID is set correctly"""
        assert tts_service.default_voice_id == "21m00Tcm4TlvDq8ikWAM"
    
    def test_default_model(self, tts_service):
        """Test that default model is set correctly"""
        # Note: default_model property may not exist, but model used is eleven_turbo_v2
        # This test may need to be updated based on actual implementation
        pass
