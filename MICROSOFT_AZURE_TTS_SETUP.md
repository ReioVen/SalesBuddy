# 🎙️ Microsoft Azure Text-to-Speech Setup

## ✅ **High-Quality Estonian Voices with Microsoft Azure**

Your cloud TTS now uses **Microsoft Azure Cognitive Services** for the **best Estonian voice quality**!

### 🎯 **Estonian Voices Available:**
- **Anu** (et-EE-AnuNeural) - Female, Neural voice - **Excellent quality!**
- **Kert** (et-EE-KertNeural) - Male, Neural voice - **Excellent quality!**

These are premium neural voices that sound very natural and realistic.

---

## 🆓 **Free Tier:**

Microsoft Azure offers a **FREE tier** for Text-to-Speech:
- **5 million characters per month** (neural voices)
- No credit card required for first 12 months
- More than enough for most applications

---

## 🚀 **Setup Instructions:**

### **Step 1: Create Azure Account**

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign up for free account (get $200 credit + 12 months free services)
3. No credit card required for free tier

### **Step 2: Create Speech Service**

1. In Azure Portal, click **"Create a resource"**
2. Search for **"Speech"**
3. Click **"Speech"** (Cognitive Services)
4. Click **"Create"**

**Configuration:**
- **Subscription**: Your Azure subscription
- **Resource Group**: Create new → `salesbuddy-resources`
- **Region**: Choose **West Europe** (good for Estonia)
- **Name**: `salesbuddy-speech` (or any unique name)
- **Pricing Tier**: **Free F0** (5M characters/month)

5. Click **"Review + create"**
6. Click **"Create"**

### **Step 3: Get Your API Key**

1. Go to your **Speech resource** (after it's created)
2. Click **"Keys and Endpoint"** in left menu
3. Copy **KEY 1** (or KEY 2)
4. Note the **Location/Region** (e.g., `westeurope`)

### **Step 4: Add to Environment Variables**

#### **For Local Development:**

Create or update `.env` file in your `server/` directory:

```env
# Microsoft Azure Speech Service
AZURE_SPEECH_KEY=your-key-here
AZURE_SPEECH_REGION=westeurope
```

Replace `your-key-here` with your actual key from Step 3.

#### **For Railway (Production):**

1. Go to your Railway project
2. Click on your service
3. Go to **Variables** tab
4. Add new variables:
   - `AZURE_SPEECH_KEY` = `your-key-here`
   - `AZURE_SPEECH_REGION` = `westeurope`
5. Redeploy

#### **For Other Hosting:**

Add the environment variables in your hosting platform's settings:
- Heroku: Settings → Config Vars
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables

---

## 🧪 **Testing:**

### **1. Restart Your Server**
```bash
cd server
npm start
```

### **2. Check Logs**

You should see:
```
✅ Microsoft Azure TTS: Generated speech for et using et-EE-AnuNeural
```

If you see:
```
⚠️ Azure Speech Key not configured. Using Google Translate fallback.
```

Then the key isn't set correctly.

### **3. Test Estonian Voice**

1. Go to your app
2. Click "New Chat"
3. Select **🇪🇪 Estonian**
4. Click **"Test Voice"**
5. Listen to the quality!

---

## 📊 **Voice Quality Comparison:**

| Provider | Quality | Naturalness | Setup |
|----------|---------|-------------|-------|
| **Microsoft Azure Neural** | ⭐⭐⭐⭐⭐ | Very Natural | API Key needed |
| Google Translate (fallback) | ⭐⭐⭐ | Robotic | No setup |
| Browser TTS | ⭐⭐ | Very Robotic | No setup |

---

## 💰 **Pricing:**

### **Free Tier:**
- **5 million characters/month** - Neural voices
- **500,000 characters/month** - Standard voices
- Perfect for development and small-medium usage

### **Paid Tier (if needed):**
- **$16 per 1 million characters** - Neural voices
- Very reasonable for production use

### **Example Usage:**
- Average conversation: ~500 characters per AI response
- 5M free characters = **~10,000 AI responses per month**
- More than enough for most apps!

---

## 🔄 **Automatic Fallback:**

If Azure key is not configured or fails:
1. ✅ Automatically falls back to **Google Translate TTS** (free)
2. ✅ Still works, just slightly lower quality
3. ✅ No errors for users

This ensures **your app always works**, even without Azure configured!

---

## 🌍 **Supported Languages (Azure):**

All with high-quality neural voices:

- 🇪🇪 **Estonian** (et-EE-AnuNeural, et-EE-KertNeural)
- 🇺🇸 English (en-US-JennyNeural)
- 🇷🇺 Russian (ru-RU-SvetlanaNeural)
- 🇪🇸 Spanish (es-ES-ElviraNeural)
- 🇩🇪 German (de-DE-KatjaNeural)
- 🇫🇷 French (fr-FR-DeniseNeural)
- 🇮🇹 Italian (it-IT-ElsaNeural)
- 🇵🇹 Portuguese (pt-PT-RaquelNeural)
- 🇳🇱 Dutch (nl-NL-ColetteNeural)
- 🇵🇱 Polish (pl-PL-ZofiaNeural)
- 🇫🇮 Finnish (fi-FI-NooraNeural)
- 🇸🇪 Swedish (sv-SE-SofieNeural)
- 🇳🇴 Norwegian (nb-NO-PernilleNeural)
- 🇩🇰 Danish (da-DK-ChristelNeural)
- 🇱🇻 Latvian (lv-LV-EveritaNeural)
- 🇱🇹 Lithuanian (lt-LT-OnaNeural)

---

## 🔧 **Troubleshooting:**

### **Issue: "Azure Speech Key not configured"**

**Solution:**
1. Check `.env` file has `AZURE_SPEECH_KEY=your-actual-key`
2. Restart server after adding key
3. Make sure no spaces around `=` in `.env`
4. Key should not have quotes

### **Issue: "401 Unauthorized"**

**Solution:**
1. Check key is correct (copy from Azure Portal again)
2. Make sure region matches (e.g., `westeurope`)
3. Key might be expired (regenerate in Azure Portal)

### **Issue: "403 Forbidden"**

**Solution:**
1. Check Azure subscription is active
2. Free tier might be exhausted (check usage in Azure Portal)
3. Resource might be in wrong region

### **Issue: Still hearing robotic voice**

**Solution:**
1. Check server console for TTS provider being used
2. Should say "Microsoft Azure TTS" not "Google Translate"
3. Clear browser cache and test again
4. Check network tab - should see request to Azure endpoint

---

## 📝 **Console Messages:**

### **With Azure Configured (Good):**
```
✅ Microsoft Azure TTS: Generated speech for et using et-EE-AnuNeural
```

### **Without Azure (Fallback):**
```
⚠️ Azure Speech Key not configured. Using Google Translate fallback.
✅ Google Translate TTS: Generated speech for et
```

Both work, but Azure quality is much better!

---

## 🎉 **Expected Result:**

Once configured:
1. ✅ **Estonian voice is natural and realistic**
2. ✅ Clear pronunciation
3. ✅ Proper intonation
4. ✅ Professional quality
5. ✅ No robotic sound

**The Estonian voice will sound significantly better than the free alternatives!**

---

## 📚 **Additional Resources:**

- [Azure Speech Service Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/)
- [Azure Neural Voices List](https://learn.microsoft.com/azure/cognitive-services/speech-service/language-support?tabs=stt-tts)
- [Azure Speech Service Docs](https://learn.microsoft.com/azure/cognitive-services/speech-service/)

---

## 🚀 **Quick Start (TL;DR):**

```bash
# 1. Sign up for Azure (free)
# 2. Create Speech Service resource (Free F0 tier)
# 3. Copy your key and region

# 4. Add to server/.env:
AZURE_SPEECH_KEY=your-key-here
AZURE_SPEECH_REGION=westeurope

# 5. Restart server
cd server
npm start

# 6. Test Estonian voice - enjoy the quality! 🇪🇪✨
```

---

## ✅ **Summary:**

- 🎙️ **Microsoft Azure Neural voices** for best Estonian quality
- 🆓 **Free tier**: 5M characters/month (plenty!)
- 🔄 **Automatic fallback** to Google Translate if needed
- 🌍 **16+ languages** supported
- ⚙️ **Easy setup**: Just add 2 environment variables
- 🎯 **Production ready** with excellent voice quality

**Your Estonian AI voice will now sound professional and natural!** 🇪🇪✨
