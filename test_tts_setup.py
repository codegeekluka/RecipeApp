"""
Quick TTS Setup Test Script
Run this to check if your ElevenLabs TTS is configured correctly.
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path.parent))

# Try to load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Loaded .env file")
except ImportError:
    print("⚠️  python-dotenv not installed, checking system environment only")

print("\n" + "="*60)
print("TTS Configuration Test")
print("="*60 + "\n")

# Check API Key
api_key = os.getenv("ELEVENLABS_API_KEY")
print(f"1. API Key Check:")
print(f"   - ELEVENLABS_API_KEY is set: {bool(api_key)}")
if api_key:
    print(f"   - API Key length: {len(api_key)} characters")
    print(f"   - API Key starts with: {api_key[:10]}...")
else:
    print("   ❌ ELEVENLABS_API_KEY is NOT set!")
    print("   → Set it in your environment or .env file")
    sys.exit(1)

# Check ElevenLabs package
print(f"\n2. ElevenLabs Package Check:")
try:
    from elevenlabs.client import ElevenLabs
    print("   ✅ elevenlabs package is installed")
except ImportError:
    print("   ❌ elevenlabs package is NOT installed!")
    print("   → Run: pip install elevenlabs")
    sys.exit(1)

# Test client initialization
print(f"\n3. ElevenLabs Client Initialization:")
try:
    client = ElevenLabs(api_key=api_key)
    print("   ✅ ElevenLabs client initialized successfully")
except Exception as e:
    print(f"   ❌ Failed to initialize client: {e}")
    sys.exit(1)

# Test TTS service
print(f"\n4. TTS Service Test:")
try:
    from backend.services.tts_service import tts_service
    print(f"   - TTS service is_available: {tts_service.is_available}")
    
    if tts_service.is_available:
        print("   ✅ TTS service is available and ready")
        
        # Try a simple test
        print("\n5. TTS Synthesis Test:")
        print("   - Attempting to generate audio for 'Hello, this is a test'...")
        try:
            audio_bytes = tts_service.synthesize("Hello, this is a test")
            if audio_bytes:
                print(f"   ✅ TTS synthesis successful! Generated {len(audio_bytes)} bytes")
            else:
                print("   ❌ TTS synthesis returned None (check logs for errors)")
        except Exception as e:
            print(f"   ❌ TTS synthesis failed: {e}")
            print(f"   → This might indicate:")
            print(f"     - Invalid API key")
            print(f"     - Quota/limit exceeded")
            print(f"     - Network connectivity issue")
    else:
        print("   ❌ TTS service is NOT available")
        print("   → Check ELEVENLABS_API_KEY configuration")
except Exception as e:
    print(f"   ❌ Error importing TTS service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*60)
print("Test Complete!")
print("="*60)
print("\nIf all checks passed, TTS should work in your application.")
print("If any checks failed, follow the diagnostic checklist:")
print("docs/debug/TTS_DIAGNOSTIC_CHECKLIST.md\n")








