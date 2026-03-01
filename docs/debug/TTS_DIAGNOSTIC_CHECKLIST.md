# TTS (Text-to-Speech) Diagnostic Checklist

## Issue: "No audio URL provided for TTS"

This checklist will help you identify why the TTS service is not generating audio URLs.

---

## Step 1: Check Backend Logs (Most Important)

**Action:** Look at your backend console/terminal where the FastAPI server is running.

**What to look for:**

1. **TTS Service Initialization:**
   - ✅ Good: `"TTS service initialized successfully"`
   - ❌ Bad: `"ELEVENLABS_API_KEY not found or ElevenLabs not available. TTS will be disabled."`

2. **When processing voice input, look for:**
   - `"Generating TTS audio for voice response"`
   - `"TTS service is not available"` ← This means API key is missing
   - `"TTS service returned None for audio_url"` ← This means API call failed
   - `"Error generating TTS audio: ..."` ← This shows the actual error

3. **Specific error messages:**
   - `"ElevenLabs quota/limit exceeded"` → You've run out of tokens/quota
   - `"ElevenLabs API key is invalid or expired"` → API key is wrong
   - `"ElevenLabs rate limit exceeded"` → Too many requests too quickly

---

## Step 2: Verify Environment Variable

**Action:** Check if `ELEVENLABS_API_KEY` is set in your environment.

### Windows (PowerShell):
```powershell
# Check if it's set
$env:ELEVENLABS_API_KEY

# If empty, you need to set it
# Option 1: Set in current session
$env:ELEVENLABS_API_KEY = "your-api-key-here"

# Option 2: Set permanently (requires restart)
[System.Environment]::SetEnvironmentVariable("ELEVENLABS_API_KEY", "your-api-key-here", "User")
```

### Windows (Command Prompt):
```cmd
# Check if it's set
echo %ELEVENLABS_API_KEY%

# If empty, set it (temporary for current session)
set ELEVENLABS_API_KEY=your-api-key-here
```

### Linux/Mac:
```bash
# Check if it's set
echo $ELEVENLABS_API_KEY

# If empty, set it
export ELEVENLABS_API_KEY="your-api-key-here"
```

### Using .env file:
If you're using a `.env` file, make sure:
1. The file exists in your project root (same level as `backend/` folder)
2. It contains: `ELEVENLABS_API_KEY=your-api-key-here`
3. The backend is loading it (check if `python-dotenv` is installed and `load_dotenv()` is called)

---

## Step 3: Test TTS Status Endpoint

**Action:** Use the new status endpoint to check TTS configuration.

### Using curl (PowerShell/Command Prompt):
```powershell
# First, get your auth token from browser DevTools > Application > Local Storage > token
$token = "your-token-here"
$headers = @{
    "Authorization" = "Bearer $token"
}
Invoke-RestMethod -Uri "http://localhost:8000/ai/tts/status" -Headers $headers
```

### Using curl (Linux/Mac):
```bash
# Get your token from browser DevTools > Application > Local Storage > token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/ai/tts/status
```

### Using Browser DevTools:
1. Open DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
fetch('http://localhost:8000/ai/tts/status', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "is_available": true,
  "has_api_key": true,
  "redis_available": false,
  "message": "TTS service is available"
}
```

**If `is_available: false`:**
- Check `has_api_key` - if `false`, the environment variable is not set
- Read the `message` field for more details

---

## Step 4: Check ElevenLabs Account

**Action:** Log into your ElevenLabs account and verify:

1. **API Key is Valid:**
   - Go to https://elevenlabs.io/app/settings/api-keys
   - Verify your API key matches what's in your environment
   - If you regenerated it, update your environment variable and restart the backend

2. **Check Usage/Quota:**
   - Go to https://elevenlabs.io/app/usage
   - Check if you've exceeded your character limit
   - Free tier: 10,000 characters/month
   - If exceeded, you'll need to wait for reset or upgrade

3. **Check Account Status:**
   - Make sure your account is active
   - Check for any payment issues if on a paid plan

---

## Step 5: Test TTS Directly

**Action:** Test the TTS endpoint directly to see the actual error.

### Using curl (PowerShell):
```powershell
$token = "your-token-here"
$body = @{
    text = "Hello, this is a test"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:8000/ai/tts" -Method POST -Headers $headers -Body $body
```

### Using Browser DevTools:
```javascript
fetch('http://localhost:8000/ai/tts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ text: 'Hello, this is a test' })
})
.then(r => {
  if (r.ok) {
    return r.blob();
  } else {
    return r.json().then(err => Promise.reject(err));
  }
})
.then(blob => {
  console.log('Success! Audio blob:', blob);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
})
.catch(err => console.error('Error:', err));
```

**If this fails, check:**
- Backend logs for the exact error
- Network tab in DevTools for HTTP status code
- Response body for error details

---

## Step 6: Check Network Tab

**Action:** Open browser DevTools > Network tab and look at the API response.

1. **Find the `/ai/upload_audio` or `/ai/ask` request**
2. **Check the Response:**
   - Look for `audio_url` field
   - If it's `null` or missing, the backend didn't generate it
   - Check the Response Headers for any error codes

3. **Check Request Headers:**
   - Make sure `Authorization: Bearer ...` is present
   - Verify the token is valid

---

## Step 7: Verify Backend is Loading Environment Variables

**Action:** Add a temporary debug endpoint or check startup logs.

### Check if backend loads .env:
Look at backend startup logs for:
- `"Loading environment variables from .env"`
- Or check if `python-dotenv` is installed: `pip list | findstr dotenv`

### Add debug logging (temporary):
In `backend/Apis/ai_assistant.py`, add at the top of a route:
```python
import os
logger.info(f"ELEVENLABS_API_KEY is set: {bool(os.getenv('ELEVENLABS_API_KEY'))}")
logger.info(f"ELEVENLABS_API_KEY length: {len(os.getenv('ELEVENLABS_API_KEY', ''))}")
```

**⚠️ Remove this after debugging - don't log actual API keys!**

---

## Step 8: Check Python Package Installation

**Action:** Verify ElevenLabs package is installed.

```bash
# In your backend virtual environment
pip list | findstr elevenlabs  # Windows
pip list | grep elevenlabs     # Linux/Mac
```

**If not installed:**
```bash
pip install elevenlabs
```

**If installed but errors occur:**
```bash
pip install --upgrade elevenlabs
```

---

## Step 9: Restart Backend Server

**Action:** After making any environment variable changes, restart the backend.

1. Stop the backend server (Ctrl+C)
2. Make sure environment variables are set
3. Start the backend server again
4. Check startup logs for TTS initialization message

---

## Common Issues & Solutions

### Issue: "TTS service is not available"
**Solution:** 
- API key is missing or not loaded
- Check Step 2 and Step 7
- Restart backend after setting environment variable

### Issue: "Quota/limit exceeded"
**Solution:**
- You've used up your ElevenLabs character limit
- Wait for monthly reset or upgrade plan
- Check Step 4

### Issue: "API key is invalid"
**Solution:**
- Regenerate API key in ElevenLabs dashboard
- Update environment variable
- Restart backend

### Issue: "Rate limit exceeded"
**Solution:**
- Too many requests too quickly
- Wait a few seconds and try again
- Consider implementing request throttling

### Issue: Backend logs show no TTS-related messages
**Solution:**
- TTS service might not be initialized
- Check if `tts_service` is imported correctly
- Verify `backend/services/tts_service.py` exists and is working

---

## Quick Test Script

Save this as `test_tts.py` in your project root:

```python
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ELEVENLABS_API_KEY")
print(f"API Key is set: {bool(api_key)}")
print(f"API Key length: {len(api_key) if api_key else 0}")

if api_key:
    try:
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=api_key)
        print("✅ ElevenLabs client initialized successfully")
        
        # Test a simple synthesis
        audio = client.text_to_speech.convert(
            voice_id="21m00Tcm4TlvDq8ikWAM",
            text="Test"
        )
        print("✅ TTS synthesis test successful")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("❌ ELEVENLABS_API_KEY is not set")
```

Run it:
```bash
python test_tts.py
```

---

## Still Having Issues?

If none of these steps resolve the issue:

1. **Share backend logs** - Copy the full error messages from your backend console
2. **Share TTS status response** - Run Step 3 and share the JSON response
3. **Check ElevenLabs status page** - https://status.elevenlabs.io/ (check for service outages)
4. **Verify network connectivity** - Make sure backend can reach ElevenLabs API (no firewall blocking)








