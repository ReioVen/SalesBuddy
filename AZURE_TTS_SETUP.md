# 🎙️ Azure Text-to-Speech Setup - Complete Guide

## ✨ Overview

Your SalesBuddy application now uses **Microsoft Azure Cognitive Services Text-to-Speech** for ALL voice interactions. This provides incredibly realistic, human-like voices that make conversations feel natural and professional.

### 🎯 Why Azure TTS?

- **🗣️ Natural & Human-like**: Neural voices sound like real people
- **🌍 20+ Languages**: High-quality voices for Estonian, English, Spanish, Russian, and more
- **🎭 Expressive**: Proper intonation, emotion, and pacing
- **⚡ Fast**: Low latency for real-time conversations
- **💰 Free Tier**: 5 million characters/month included

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Azure Account

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign up for a free account
   - Get **$200 credit** for first 30 days
   - **12 months of free services**
   - No credit card required for free tier

### Step 2: Create Speech Service

1. In Azure Portal, click **"Create a resource"**
2. Search for **"Speech"**
3. Select **"Speech"** (under Cognitive Services)
4. Click **"Create"**

**Configuration:**
- **Subscription**: Your Azure subscription
- **Resource Group**: Create new → `salesbuddy-tts`
- **Region**: **West Europe** (recommended for EU/Estonia)
- **Name**: `salesbuddy-speech` (must be globally unique)
- **Pricing Tier**: **Free F0** (5M characters/month)

5. Click **"Review + create"**
6. Click **"Create"**
7. Wait ~1 minute for deployment

### Step 3: Get API Keys & Configure

1. Go to your **Speech resource** (after it's created)
2. Click **"Keys and Endpoint"** in the left menu
3. Copy **KEY 1** (you can use KEY 2 as backup)
4. Note the **Location/Region** (e.g., `westeurope`)

**Add to your environment variables:**

```env
# Microsoft Azure Speech Service
AZURE_SPEECH_KEY=your-actual-key-from-step-3
AZURE_SPEECH_REGION=westeurope
```

**Important**: 
- Replace `your-actual-key-from-step-3` with your actual key
- Make sure the region matches what you selected
- No quotes needed around the values
- No spaces around the `=` sign

---

## 🔧 Platform-Specific Setup

### Local Development

1. Open your `server/.env` file (or create it)
2. Add the Azure environment variables:
   ```env
   AZURE_SPEECH_KEY=abc123yourActualKey456
   AZURE_SPEECH_REGION=westeurope
   ```
3. Restart your server:
   ```bash
   cd server
   npm start
   ```

### Railway (Production)

1. Go to your Railway project dashboard
2. Click on your **server** service
3. Click **"Variables"** tab
4. Add new variables:
   - Name: `AZURE_SPEECH_KEY`
   - Value: Your key from Azure
   - Name: `AZURE_SPEECH_REGION`
   - Value: `westeurope`
5. Click **"Redeploy"** or push a new commit

### Heroku

1. Go to your app dashboard
2. Click **"Settings"**
3. Click **"Reveal Config Vars"**
4. Add:
   - KEY: `AZURE_SPEECH_KEY`, VALUE: Your key
   - KEY: `AZURE_SPEECH_REGION`, VALUE: `westeurope`
5. App will automatically restart

### Vercel / Netlify

1. Go to your project settings
2. Find **"Environment Variables"**
3. Add both variables
4. Redeploy your application

---

## 🎤 Supported Languages & Voices

Azure Neural TTS is now used for ALL these languages:

| Language | Code | Voice Name | Gender | Quality |
|----------|------|------------|--------|---------|
| 🇪🇪 Estonian | et | et-EE-AnuNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇪🇪 Estonian | et-male | et-EE-KertNeural | Male | ⭐⭐⭐⭐⭐ |
| 🇺🇸 English (US) | en | en-US-JennyNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇺🇸 English (US) | en-male | en-US-GuyNeural | Male | ⭐⭐⭐⭐⭐ |
| 🇬🇧 English (UK) | en-GB | en-GB-LibbyNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇦🇺 English (AU) | en-AU | en-AU-NatashaNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇪🇸 Spanish | es | es-ES-ElviraNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇲🇽 Spanish (MX) | es-MX | es-MX-DaliaNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇷🇺 Russian | ru | ru-RU-SvetlanaNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇩🇪 German | de | de-DE-KatjaNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇫🇷 French | fr | fr-FR-DeniseNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇮🇹 Italian | it | it-IT-ElsaNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇵🇹 Portuguese | pt | pt-PT-RaquelNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇳🇱 Dutch | nl | nl-NL-ColetteNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇸🇪 Swedish | sv | sv-SE-SofieNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇳🇴 Norwegian | no | nb-NO-PernilleNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇩🇰 Danish | da | da-DK-ChristelNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇫🇮 Finnish | fi | fi-FI-NooraNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇱🇻 Latvian | lv | lv-LV-EveritaNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇱🇹 Lithuanian | lt | lt-LT-OnaNeural | Female | ⭐⭐⭐⭐⭐ |
| 🇵🇱 Polish | pl | pl-PL-ZofiaNeural | Female | ⭐⭐⭐⭐⭐ |

**All voices are Neural TTS** - meaning they use AI to sound extremely natural and human-like!

---

## ✅ Testing

### 1. Check Server Logs

After restarting your server, check the console output:

**✅ Success (Azure working):**
```
✅ Microsoft Azure TTS: Generated speech for et using et-EE-AnuNeural
🎙️ Using Azure TTS for realistic speech...
✅ Playing Azure TTS audio for: et-EE
```

**⚠️ Fallback (Azure not configured):**
```
⚠️ Azure Speech Key not configured. Using Google Translate fallback.
⚠️ Falling back to browser TTS
```

### 2. Test in Application

1. Start a new conversation
2. Enable voice/speech
3. Send a message
4. Listen to the AI response
5. You should hear a natural, human-like voice!

### 3. Test Different Languages

Try conversations in different languages to hear the quality:
- Estonian: Very natural, clear Estonian accent
- English: Conversational, warm tone
- Spanish: Native Spanish pronunciation

---

## 💰 Pricing & Limits

### Free Tier (F0) - Recommended for most users

**Included Free:**
- **5 million characters per month** (Neural TTS)
- **500,000 characters per month** (Standard TTS)
- No credit card required
- No expiration

**What this means:**
- Average AI response: ~200 characters
- **5M = ~25,000 AI responses per month**
- **~833 conversations per day**
- More than enough for most applications!

### Paid Tier (S0) - Only if you need more

**Pricing:**
- **$16 per 1 million characters** (Neural voices)
- Pay only for what you use beyond free tier
- Still very affordable for production

**Example:**
- 10,000 AI responses/month = ~2M characters
- Cost: **Free** (under free tier limit!)
- 50,000 AI responses/month = ~10M characters
- Cost: **$80/month** (5M free + 5M paid)

### Check Your Usage

1. Go to [Azure Portal](https://portal.azure.com/)
2. Find your Speech resource
3. Click **"Metrics"** in left menu
4. View character usage graphs

---

## 🔄 Automatic Fallback System

Your application has a smart fallback system:

1. **Primary**: Azure Neural TTS (best quality) ✨
2. **Fallback 1**: Google Translate TTS (if Azure fails) 🔄
3. **Fallback 2**: Browser TTS (if all else fails) 🔄

This ensures **your application always works**, even without Azure configured!

---

## 🐛 Troubleshooting

### "Azure Speech Key not configured"

**Solution:**
1. Check `.env` file has the correct format:
   ```env
   AZURE_SPEECH_KEY=your-key-here
   AZURE_SPEECH_REGION=westeurope
   ```
2. No quotes, no spaces around `=`
3. Restart server after adding key
4. Check for typos in variable names

### "401 Unauthorized" Error

**Causes:**
- Wrong API key
- Key has wrong permissions
- Key is expired

**Solution:**
1. Go back to Azure Portal
2. Get a fresh key (KEY 1 or KEY 2)
3. Copy it exactly (no extra spaces)
4. Update your environment variable
5. Restart application

### "403 Forbidden" Error

**Causes:**
- Azure subscription not active
- Free tier exhausted
- Wrong region

**Solution:**
1. Check subscription status in Azure Portal
2. Verify you haven't exceeded free tier (check Metrics)
3. Make sure region matches (e.g., both `westeurope`)
4. Try regenerating keys

### Still hearing robotic voice

**Possible causes:**
- Azure not configured → using fallback
- Browser TTS being used instead
- Client-side TTS not calling server

**Solution:**
1. Check server console - should say "Azure TTS"
2. Check Network tab in browser DevTools
3. Look for requests to `/api/cloud-tts/speak`
4. Verify response is audio/mpeg (not JSON)
5. Clear browser cache and refresh

### Voice quality is poor

**Check:**
1. Make sure you're using Neural voices (all listed above)
2. Internet connection is stable
3. Not using fallback TTS
4. Check server logs for Azure confirmation

---

## 🎯 How It Works

### Architecture

```
User speaks/types
    ↓
AI generates response
    ↓
Enhanced TTS Service (frontend)
    ↓
Calls /api/cloud-tts/speak (backend)
    ↓
Azure Speech Service
    ↓
Returns MP3 audio
    ↓
Plays in browser
```

### Files Modified

**Backend:**
- `server/routes/cloudTts.js` - Azure TTS implementation
- Expanded voice mapping to 70+ voice variations
- Added all Neural TTS voices

**Frontend:**
- `client/src/services/enhancedTtsService.ts` - Updated to prioritize Azure
- Better logging for debugging
- Improved fallback handling

**Configuration:**
- `env.example` - Added Azure variables
- Documentation updated

---

## 📊 Benefits Summary

### Before Azure TTS:
- ❌ Robotic, computer-like voices
- ❌ Limited language support
- ❌ Poor Estonian quality
- ❌ Unnatural pacing

### After Azure TTS:
- ✅ Natural, human-like speech
- ✅ 20+ languages with Neural voices
- ✅ Excellent Estonian quality
- ✅ Proper intonation and emotion
- ✅ Professional sound
- ✅ Better user engagement

---

## 🎓 Best Practices

1. **Always set up Azure** for production apps
2. **Use free tier** for development/testing
3. **Monitor usage** in Azure Portal monthly
4. **Keep keys secret** - never commit to git
5. **Use environment variables** - never hardcode keys
6. **Test fallback** - ensure app works without Azure

---

## 📚 Additional Resources

- [Azure Speech Service Documentation](https://learn.microsoft.com/azure/cognitive-services/speech-service/)
- [Azure Neural Voices List](https://learn.microsoft.com/azure/cognitive-services/speech-service/language-support?tabs=stt-tts)
- [Azure Speech Service Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/)
- [SSML Documentation](https://learn.microsoft.com/azure/cognitive-services/speech-service/speech-synthesis-markup)

---

## ✨ Quick Reference

**Environment Variables:**
```env
AZURE_SPEECH_KEY=your-key-here
AZURE_SPEECH_REGION=westeurope
```

**Test Command:**
```bash
# Restart server
cd server && npm start

# Watch for this in logs:
# ✅ Microsoft Azure TTS: Generated speech...
```

**Success Indicators:**
- Natural-sounding voices
- Server logs show "Azure TTS"
- No robotic sound
- Clear pronunciation

---

**Setup Complete!** 🎉

Your SalesBuddy now has professional-grade, human-like voices powered by Microsoft Azure!

