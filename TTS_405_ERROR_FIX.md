# TTS 405 Error Fix

## Issue

Getting a **405 Method Not Allowed** error when trying to use Azure TTS:

```
api/cloud-tts/speak:1 Failed to load resource: the server responded with a status of 405
❌ Azure TTS error: Error: Cloud TTS request failed: 405
⚠️ Falling back to browser TTS
```

## Root Cause

The 405 error typically occurs due to:
1. **CORS Preflight Issue**: The OPTIONS request is not being handled properly
2. **Route Registration Issue**: The route might not be registered correctly
3. **Authentication Token Issue**: The token might not be sent or verified correctly

## Solution Applied

### 1. Added Debug Logging
- Added comprehensive logging to track requests
- Logs when TTS requests are received
- Shows what language and text length is being processed

### 2. Added CORS OPTIONS Handler
- Explicitly handle OPTIONS preflight requests
- Ensures CORS works properly for cross-origin requests

### 3. Enhanced Error Messages
- Better error logging with stack traces
- Clearer indication of Azure vs fallback TTS
- Helps identify exactly where failures occur

## How to Test

### Step 1: Restart Your Server
```bash
cd server
npm start
```

### Step 2: Check Server Logs
You should see these logs when the route is registered:
```
✅ [ROUTES] cloudTts routes registered at /api/cloud-tts
```

### Step 3: Test Voice in Application
1. Go to conversation page
2. Click "Test Voice" button
3. Check browser console and server logs

### Step 4: Look for These Logs

**✅ Success (Azure working):**
```
🎙️ [CLOUD-TTS] Received speech request
🎙️ [CLOUD-TTS] Request body: {"text":"Hello..."}
🎙️ [CLOUD-TTS] Processing TTS for language: et-EE, text length: 45
✅ [CLOUD-TTS] Microsoft Azure TTS: Generated speech for et using et-EE-AnuNeural
```

**⚠️ CORS Preflight:**
```
✅ [CLOUD-TTS] CORS preflight request received
```

**❌ Error:**
```
❌ [CLOUD-TTS] Cloud TTS error: [error details]
❌ [CLOUD-TTS] Error stack: [stack trace]
```

## Additional Checks

### Check 1: Verify Route is Registered
Look for this in server startup logs:
```
app.use('/api/cloud-tts', cloudTtsRoutes);
```

### Check 2: Verify Authentication Token
Check browser DevTools → Network → Request Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check 3: Verify Request Method
In Network tab, the request should show:
- Method: `POST`
- URL: `/api/cloud-tts/speak`
- Content-Type: `application/json`

### Check 4: Check CORS Headers
Response should include:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Possible Issues & Solutions

### Issue 1: "405 Method Not Allowed"
**Cause**: CORS preflight failing or route not found

**Solution**:
1. Verify server is running latest code
2. Check CORS configuration includes your origin
3. Verify OPTIONS handler is working (check logs)

### Issue 2: "401 Unauthorized"
**Cause**: Authentication token missing or invalid

**Solution**:
1. Check user is logged in
2. Verify token is in localStorage: `localStorage.getItem('token')`
3. Check token is being sent in Authorization header

### Issue 3: "404 Not Found"
**Cause**: Route not registered or wrong URL

**Solution**:
1. Verify route is registered: `app.use('/api/cloud-tts', cloudTtsRoutes);`
2. Check API endpoint in frontend: `private apiEndpoint = '/api/cloud-tts/speak';`
3. Restart server to ensure routes are loaded

### Issue 4: Still Getting 405
**Workaround**: Test the API directly with curl:

```bash
# Get your auth token from browser localStorage
TOKEN="your-token-here"

# Test the endpoint
curl -X POST http://localhost:5002/api/cloud-tts/speak \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "text": "Hello, this is a test",
    "language": "en-US",
    "rate": 0.92,
    "pitch": 0.98,
    "volume": 0.85
  }' \
  --output test-audio.mp3
```

If this works, the issue is in the frontend request.
If this fails, the issue is in the backend route.

## Environment Variables Check

Make sure Azure keys are set:

```env
AZURE_SPEECH_KEY_1=your-key-here
AZURE_SPEECH_KEY_2=your-backup-key-here
AZURE_SPEECH_REGION=westeurope
AZURE_ENDPOINT=https://westeurope.api.cognitive.microsoft.com
```

**Verify they're loaded:**
```javascript
// In server/routes/cloudTts.js, check the logs:
console.log('Azure Key 1:', process.env.AZURE_SPEECH_KEY_1 ? 'SET' : 'NOT SET');
console.log('Azure Key 2:', process.env.AZURE_SPEECH_KEY_2 ? 'SET' : 'NOT SET');
console.log('Azure Region:', process.env.AZURE_SPEECH_REGION || 'NOT SET');
console.log('Azure Endpoint:', process.env.AZURE_ENDPOINT || 'NOT SET');
```

## Next Steps

1. ✅ Update server code (already done)
2. ✅ Restart server
3. ✅ Test voice in application
4. ✅ Check server logs for detailed error messages
5. ✅ If still failing, test with curl command above

## Expected Behavior After Fix

1. Voice test triggers POST request to `/api/cloud-tts/speak`
2. Server logs show: `🎙️ [CLOUD-TTS] Received speech request`
3. Azure TTS generates audio
4. Audio is returned to client
5. Browser plays realistic, human-like voice

## Status

- ✅ Added debug logging
- ✅ Added OPTIONS handler for CORS
- ✅ Enhanced error messages
- ⏳ Waiting for server restart and testing

---

**Next**: Restart your server and test the voice. Check logs for the new debug messages!

