# 🔍 TTS Debugging Guide - Find the Issue

## 🎯 **Comprehensive Logging Added**

I've added detailed logging at every step of the TTS pipeline. Now we can see exactly where it's failing.

---

## 📊 **Expected Console Log Flow:**

### **When AI Responds, You Should See:**

#### **Step 1: Conversations.tsx (AI receives response)**
```
🎙️ Speaking AI response in call mode
🎤 AI Response type: string Length: 85
🎤 AI Response content: Tere! Ma olen teie müügiassistent...
🎤 Callback exists: true
✅ TTS callback executed
```

#### **Step 2: SpeechInput.tsx (Callback called)**
```
🔊 [SPEECH-INPUT] speakAIResponse called with: string Tere! Ma olen teie müügiass...
🎙️ [SPEECH-INPUT] Speaking AI response with language: et-EE voice: default
🎤 TTS Request: Language="et-EE", Voice="default", Text="Tere! Ma olen teie müügiassistent..."
```

#### **Step 3: EnhancedTtsService.ts (TTS processing)**
```
🎙️ Speaking with enhanced TTS: "Tere! Ma olen teie müügiassistent..."
☁️ Using cloud TTS for et (no downloads needed)
☁️ [ENHANCED-TTS] speakWithCloudTTS called for: et-EE
📝 [ENHANCED-TTS] Text: Tere! Ma olen teie müügiassistent...
🔐 [ENHANCED-TTS] Token status: Present (eyJhbGciOiJIUzI1NiIs...)
🌐 [ENHANCED-TTS] API Endpoint: https://salesbuddy-production.up.railway.app/api/cloud-tts/speak
```

#### **Step 4: Cloud TTS Response**
```
🎙️ Playing cloud TTS audio for: et-EE
✅ Cloud TTS speech completed
✅ Successfully spoke AI response
```

---

## 🚨 **Where It Might Be Failing:**

### **Scenario A: Callback Not Being Called**

**You see:**
```
🎙️ Speaking AI response in call mode
🎤 AI Response type: string Length: 85
🎤 Callback exists: true
✅ TTS callback executed
```

**But DON'T see:**
```
🔊 [SPEECH-INPUT] speakAIResponse called with: ...
```

**Problem:** The callback function is null or not the right function
**Solution:** Check which SpeechInput component is registering the callback

---

### **Scenario B: Function Called But Validation Fails**

**You see:**
```
🔊 [SPEECH-INPUT] speakAIResponse called with: string Tere...
❌ [SPEECH-INPUT] Invalid response type: ...
```
**OR**
```
❌ [SPEECH-INPUT] TTS not supported in this browser
```

**Problem:** Validation failing or TTS not supported
**Solution:** Check browser compatibility or response format

---

### **Scenario C: Enhanced TTS Not Being Called**

**You see:**
```
🎙️ [SPEECH-INPUT] Speaking AI response with language: et-EE
```

**But DON'T see:**
```
☁️ [ENHANCED-TTS] speakWithCloudTTS called for: et-EE
```

**Problem:** Enhanced TTS service not being invoked
**Solution:** Check if cloud TTS languages list includes 'et'

---

### **Scenario D: API Request Failing**

**You see:**
```
☁️ [ENHANCED-TTS] speakWithCloudTTS called for: et-EE
📝 [ENHANCED-TTS] Text: ...
🔐 [ENHANCED-TTS] Token status: Missing
```

**Problem:** No authentication token
**Solution:** User needs to log in, or token key is wrong

---

### **Scenario E: Audio Not Playing**

**You see all the logs including:**
```
🎙️ Playing cloud TTS audio for: et-EE
```

**But DON'T hear audio**

**Problem:** Audio playback issue
**Solution:** Check browser audio permissions, volume, or audio file format

---

## 🧪 **How to Test:**

### **Step 1: Open Browser Console**
- Press F12
- Go to Console tab
- Clear console (click trash icon)

### **Step 2: Start Call Mode**
1. Create new conversation
2. Select Estonian voice (🇪🇪)
3. Click "Start Call" (if available) OR enable hands-free mode
4. Send a message

### **Step 3: Watch Console**
Look for the sequence of logs above. Find where it stops.

---

## 🔧 **Quick Fixes:**

### **If Callback Exists: false**
```javascript
// Problem: Callback not registered
// Check: Are you in call mode? 
// The hidden SpeechInput should register the callback
```

### **If Token Status: Missing**
```javascript
// Problem: No auth token
// Fix: Make sure user is logged in
// Check localStorage for 'sb_token' or 'token'
```

### **If No Logs After "Speaking AI response"**
```javascript
// Problem: Callback never executed
// The callback might be overwritten or null
// Check: Multiple SpeechInput components?
```

---

## 📝 **What to Report:**

When testing, copy and paste:

1. **All console logs** starting from "🎙️ Speaking AI response"
2. **Where the logs stop** (which step didn't appear)
3. **Any error messages** (red text in console)
4. **Browser name and version**

This will help us identify exactly where the TTS pipeline is breaking!

---

## 🎯 **Most Likely Issues:**

Based on common patterns:

1. ⭐ **Callback registration timing** - Multiple SpeechInput components overwriting each other
2. ⭐ **Language code mismatch** - Using 'et' instead of 'et-EE'
3. ⭐ **Authentication** - Missing or wrong token key
4. **API endpoint** - Wrong URL or CORS issue
5. **Audio playback** - Browser permissions or audio format

---

## ✅ **Success Looks Like:**

```
🎙️ Speaking AI response in call mode
🎤 AI Response type: string Length: 85
🎤 Callback exists: true
✅ TTS callback executed
🔊 [SPEECH-INPUT] speakAIResponse called with: string Tere...
🎙️ [SPEECH-INPUT] Speaking AI response with language: et-EE
🎤 TTS Request: Language="et-EE", Voice="default", Text="Tere..."
🎙️ Speaking with enhanced TTS: "Tere..."
☁️ Using cloud TTS for et (no downloads needed)
☁️ [ENHANCED-TTS] speakWithCloudTTS called for: et-EE
📝 [ENHANCED-TTS] Text: Tere! Ma olen...
🔐 [ENHANCED-TTS] Token status: Present
🌐 [ENHANCED-TTS] API Endpoint: https://salesbuddy-production...
🎙️ Playing cloud TTS audio for: et-EE
✅ Cloud TTS speech completed
✅ Successfully spoke AI response
```

**And you hear Estonian voice speaking!** 🎉

---

**Test now and send me the console output - we'll find the exact issue!** 🔍✨
