# 🎙️ Voice Call AI Speaking - Debugging Guide

## ✅ Changes Made

I've added comprehensive logging and error handling to track exactly what's happening when the AI tries to speak in voice call mode.

### Files Modified:
1. **`client/src/services/enhancedTtsService.ts`** - Enhanced Azure TTS with detailed logging
2. **`client/src/components/SpeechInput.tsx`** - Added callback registration tracking

---

## 🔍 How to Debug

### Step 1: Open Browser Console
When testing voice calls, **open your browser's developer console** (F12) to see detailed logs.

### Step 2: Start a Voice Call
1. Click "Start New Conversation"
2. Select "Voice Call" mode (📞)
3. Configure your client and voice settings
4. Click "Start Call"

### Step 3: Send a Message
Speak into your microphone or type a message. Watch the console for these log sequences:

---

## 📋 Expected Log Sequence

### 1. **Callback Registration** (When call starts)
```
🔧 [SPEECH-INPUT] Callback registration effect triggered
🔧 [SPEECH-INPUT] onAIResponse exists: true
🔧 [SPEECH-INPUT] speakAIResponse exists: true
✅ [SPEECH-INPUT] ========== TTS CALLBACK REGISTERED ==========
✅ [SPEECH-INPUT] Configuration: { handsFreeMode: true, language: "et-EE", ... }
```

**✅ If you see this:** The TTS system is set up correctly.
**❌ If missing:** The SpeechInput component isn't mounting properly.

---

### 2. **AI Response Received** (After AI responds)
```
🎙️ Speaking AI response in call mode
🎤 AI Response type: string Length: 127
🎤 AI Response content: "Tere! Kuidas ma saan teid aidata?"
🎤 Callback exists: true
✅ TTS callback executed
```

**✅ If you see this:** The callback is being triggered.
**❌ If you see "Not speaking AI response":** Check the conditions logged.

---

### 3. **TTS Function Called** (Inside SpeechInput)
```
🎙️ [SPEECH-INPUT] ========== AI RESPONSE SPEAKING ==========
🔊 [SPEECH-INPUT] speakAIResponse called!
📝 [SPEECH-INPUT] Response type: string
📝 [SPEECH-INPUT] Response preview: "Tere! Kuidas ma saan teid aidata?"
🎤 [SPEECH-INPUT] TTS supported: true
🌍 [SPEECH-INPUT] Language: et-EE
🗣️ [SPEECH-INPUT] Selected voice: Microsoft Anu
✅ [SPEECH-INPUT] All validations passed, proceeding with TTS...
🚀 [SPEECH-INPUT] Calling enhancedTtsService.speak()...
```

**✅ If you see this:** The TTS function is being called correctly.
**❌ If it stops here:** Check for validation errors above.

---

### 4. **Azure TTS Request** (Cloud TTS)
```
🎙️ [ENHANCED-TTS] ========== CLOUD TTS REQUEST ==========
☁️ [ENHANCED-TTS] Language: et-EE
📝 [ENHANCED-TTS] Text: "Tere! Kuidas ma saan teid aidata?"
🎤 [ENHANCED-TTS] Voice: Microsoft Anu
🔐 [ENHANCED-TTS] Token: ✅ Present
🌐 [ENHANCED-TTS] Endpoint: https://salesbuddy-production.up.railway.app/api/cloud-tts/speak
📡 [ENHANCED-TTS] Response status: 200
📄 [ENHANCED-TTS] Content-Type: audio/mpeg
```

**✅ If status is 200 and content-type is audio:** Azure TTS is working!
**❌ If status is 401:** Authentication token issue.
**❌ If status is 500:** Azure TTS configuration issue on server.

---

### 5. **Audio Playback** (Final step)
```
🎵 [ENHANCED-TTS] Audio received, creating Audio element...
📦 [ENHANCED-TTS] Audio blob size: 45234 bytes
🔊 [ENHANCED-TTS] Volume set to: 0.7
📊 [ENHANCED-TTS] Audio loaded - Duration: 3.2 seconds
✅ [ENHANCED-TTS] Audio ready to play
🎬 [ENHANCED-TTS] Attempting to play audio...
✅ [ENHANCED-TTS] Audio play() successful
▶️ [ENHANCED-TTS] Audio playback started
✅ [ENHANCED-TTS] Audio playback completed
✅ [SPEECH-INPUT] Successfully spoke AI response!
```

**✅ If you see all this:** Audio should be playing! 🎉
**❌ If "Audio play() failed":** Browser autoplay policy is blocking it.

---

## 🚫 Common Issues & Solutions

### Issue 1: Autoplay Blocked
**Symptoms:**
```
❌ [ENHANCED-TTS] Audio play() failed: NotAllowedError
🚫 [ENHANCED-TTS] AUTOPLAY BLOCKED - Browser requires user interaction
```

**Solution:**
- This usually only happens on the **first** message
- Send another message - subsequent ones should work
- Or click anywhere on the page before starting the call
- Check browser settings: Some browsers block autoplay by default

**Workaround:**
The system will automatically fall back to browser TTS if Azure fails.

---

### Issue 2: Token Missing
**Symptoms:**
```
🔐 [ENHANCED-TTS] Token: ❌ Missing
```

**Solution:**
- You're not logged in properly
- Try logging out and logging back in
- Check that `localStorage` has `sb_token`

---

### Issue 3: Azure TTS Server Error
**Symptoms:**
```
📡 [ENHANCED-TTS] Response status: 500
❌ [ENHANCED-TTS] Server error: ...
```

**Solution:**
- Azure TTS credentials might be invalid
- Check server logs for Azure errors
- The system will fall back to browser TTS automatically

---

### Issue 4: No Audio Element Created
**Symptoms:**
```
🎵 [ENHANCED-TTS] Audio received, creating Audio element...
📦 [ENHANCED-TTS] Audio blob size: 0 bytes
```

**Solution:**
- Azure returned empty audio
- Check if Azure TTS has credits/quota remaining
- Will fall back to browser TTS

---

## 🔧 Quick Fixes

### If callback is not registered:
1. Check if `SpeechInput` component is mounted (should be hidden but present)
2. Look for the hidden div at line 1849-1880 in `Conversations.tsx`
3. Verify `currentConversation.conversationMode === 'call'`

### If TTS is not triggered:
1. Check `shouldSpeakResponse` conditions in console
2. Verify `handsFreeMode` is `true` (should be automatic in call mode)
3. Confirm `speakAIResponseRef.current` exists

### If audio doesn't play:
1. Check browser volume settings
2. Check if headphones/speakers are connected
3. Try a different browser (Chrome/Edge usually work best)
4. Disable ad blockers or privacy extensions that might block audio

---

## 🧪 Testing Checklist

- [ ] Browser console is open
- [ ] Started a voice call (not chat)
- [ ] Sent a message (voice or text)
- [ ] Checked for callback registration logs
- [ ] Checked for AI response logs
- [ ] Checked for Azure TTS request logs
- [ ] Checked for audio playback logs
- [ ] Volume is turned up (both browser and system)
- [ ] No browser extensions blocking audio

---

## 📊 What to Send Me

If the issue persists, please copy and paste **ALL** console logs from:
1. When you start the call
2. When you send a message
3. When the AI responds

Send me everything between these markers:
```
✅ [SPEECH-INPUT] ========== TTS CALLBACK REGISTERED ==========
...
✅ [ENHANCED-TTS] Audio playback completed
```

This will tell me exactly where the issue is!

---

## 🎯 Next Steps

1. **Deploy these changes** to your production environment
2. **Test a voice call** with browser console open
3. **Check the logs** to see where it fails
4. **Report back** with the console logs

The enhanced logging will tell us **exactly** what's happening! 🚀

