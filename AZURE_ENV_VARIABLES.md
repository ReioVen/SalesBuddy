# Azure Speech Service Environment Variables

## ✅ Correct Environment Variables

Your Azure Speech Service uses these **exact** environment variable names:

```env
# Microsoft Azure Speech Service - Realistic TTS
AZURE_SPEECH_KEY_1=your-primary-key-here
AZURE_SPEECH_KEY_2=your-secondary-key-here
AZURE_SPEECH_REGION=westeurope
AZURE_ENDPOINT=https://westeurope.api.cognitive.microsoft.com
```

---

## 📋 Variable Descriptions

### `AZURE_SPEECH_KEY_1` (Required)
- **Description**: Your primary Azure Speech Service subscription key
- **Where to find**: Azure Portal → Speech Service → Keys and Endpoint → KEY 1
- **Example**: `abc123def456ghi789jkl012mno345pqr`

### `AZURE_SPEECH_KEY_2` (Optional - Backup)
- **Description**: Your secondary Azure Speech Service subscription key
- **Purpose**: Automatic fallback if KEY_1 fails or is being rotated
- **Where to find**: Azure Portal → Speech Service → Keys and Endpoint → KEY 2
- **Note**: System tries KEY_1 first, then KEY_2 if KEY_1 is not available

### `AZURE_SPEECH_REGION` (Required)
- **Description**: The Azure region where your Speech Service is deployed
- **Common values**: 
  - `westeurope` (Europe)
  - `eastus` (US East)
  - `westus` (US West)
  - `northeurope` (Europe North)
  - `southeastasia` (Asia Southeast)
- **Where to find**: Azure Portal → Speech Service → Keys and Endpoint → Location/Region
- **Default**: `westeurope` (if not specified)

### `AZURE_ENDPOINT` (Optional - Custom Endpoint)
- **Description**: Custom Azure endpoint URL for Speech Service
- **Purpose**: Override default regional endpoints if needed
- **Format**: `https://{region}.api.cognitive.microsoft.com`
- **Example**: `https://westeurope.api.cognitive.microsoft.com`
- **Note**: If not provided, system uses default regional endpoint based on AZURE_SPEECH_REGION

---

## 🔧 How the System Works

### Key Priority
1. **Try AZURE_SPEECH_KEY_1 first**
2. **Fallback to AZURE_SPEECH_KEY_2** if KEY_1 is not set
3. **Use Google Translate fallback** if both keys are missing

```javascript
// Backend logic
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY_1 || process.env.AZURE_SPEECH_KEY_2;
```

### Endpoint Selection
1. **Custom endpoint** if `AZURE_ENDPOINT` is set
2. **Default regional endpoint** using `AZURE_SPEECH_REGION`

```javascript
// Token endpoint
const tokenEndpoint = AZURE_ENDPOINT 
  ? `${AZURE_ENDPOINT}/sts/v1.0/issueToken`
  : `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

// TTS endpoint
const ttsEndpoint = AZURE_ENDPOINT
  ? `${AZURE_ENDPOINT}/tts/cognitiveservices/v1`
  : `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
```

---

## 📝 Setup Examples

### Minimum Setup (Only KEY_1)
```env
AZURE_SPEECH_KEY_1=abc123def456ghi789
AZURE_SPEECH_REGION=westeurope
```

### Recommended Setup (With Backup Key)
```env
AZURE_SPEECH_KEY_1=abc123def456ghi789
AZURE_SPEECH_KEY_2=xyz789uvw456rst123
AZURE_SPEECH_REGION=westeurope
```

### Full Setup (With Custom Endpoint)
```env
AZURE_SPEECH_KEY_1=abc123def456ghi789
AZURE_SPEECH_KEY_2=xyz789uvw456rst123
AZURE_SPEECH_REGION=westeurope
AZURE_ENDPOINT=https://westeurope.api.cognitive.microsoft.com
```

---

## 🎯 Getting Your Keys

### Step 1: Go to Azure Portal
1. Navigate to [Azure Portal](https://portal.azure.com/)
2. Find your **Speech Service** resource
3. Click on **Keys and Endpoint** in the left menu

### Step 2: Copy Values
You'll see:
- **KEY 1** → Use for `AZURE_SPEECH_KEY_1`
- **KEY 2** → Use for `AZURE_SPEECH_KEY_2`
- **Location/Region** → Use for `AZURE_SPEECH_REGION` (e.g., `westeurope`)
- **Endpoint** → Optionally use for `AZURE_ENDPOINT`

### Step 3: Add to Environment
**For Local Development (.env file):**
```env
AZURE_SPEECH_KEY_1=your-actual-key-1
AZURE_SPEECH_KEY_2=your-actual-key-2
AZURE_SPEECH_REGION=westeurope
AZURE_ENDPOINT=https://westeurope.api.cognitive.microsoft.com
```

**For Railway:**
1. Go to your Railway project
2. Click on **Variables** tab
3. Add each variable individually:
   - Name: `AZURE_SPEECH_KEY_1`, Value: Your KEY 1
   - Name: `AZURE_SPEECH_KEY_2`, Value: Your KEY 2
   - Name: `AZURE_SPEECH_REGION`, Value: `westeurope`
   - Name: `AZURE_ENDPOINT`, Value: `https://westeurope.api.cognitive.microsoft.com`

**For Heroku:**
```bash
heroku config:set AZURE_SPEECH_KEY_1=your-key-1
heroku config:set AZURE_SPEECH_KEY_2=your-key-2
heroku config:set AZURE_SPEECH_REGION=westeurope
heroku config:set AZURE_ENDPOINT=https://westeurope.api.cognitive.microsoft.com
```

---

## ✅ Verification

### Check Server Logs

**✅ Working with KEY_1:**
```
✅ Microsoft Azure TTS: Generated speech for en using en-US-JennyNeural
```

**✅ Fallback to KEY_2:**
```
Using AZURE_SPEECH_KEY_2 as fallback...
✅ Microsoft Azure TTS: Generated speech for en using en-US-JennyNeural
```

**⚠️ No keys configured:**
```
⚠️ Azure Speech Key not configured. Using Google Translate fallback.
```

### Test in Application
1. Start a conversation in any language
2. Enable voice/speech
3. Send a message
4. Listen for natural, human-like voice
5. Check server console for Azure confirmation

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep keys in environment variables only
- Use both KEY_1 and KEY_2 for redundancy
- Rotate keys periodically (use KEY_2 while rotating KEY_1)
- Set proper permissions on `.env` files
- Add `.env` to `.gitignore`

### ❌ DON'T:
- Commit keys to version control
- Share keys publicly
- Hardcode keys in source code
- Use the same keys for dev and production
- Expose keys in client-side code

---

## 🔄 Key Rotation Strategy

Having two keys allows zero-downtime key rotation:

### Step 1: Initial State
```env
AZURE_SPEECH_KEY_1=old-key-1
AZURE_SPEECH_KEY_2=old-key-2
```

### Step 2: Regenerate KEY_2 in Azure Portal
```env
AZURE_SPEECH_KEY_1=old-key-1
AZURE_SPEECH_KEY_2=new-key-2  # Updated
```

### Step 3: Update Production Environment
Deploy with new KEY_2. KEY_1 is still active as primary.

### Step 4: Switch Primary to KEY_2
```env
AZURE_SPEECH_KEY_1=new-key-2  # Now primary
AZURE_SPEECH_KEY_2=old-key-1  # Backup
```

### Step 5: Regenerate old KEY_1
```env
AZURE_SPEECH_KEY_1=new-key-2
AZURE_SPEECH_KEY_2=new-key-1  # Updated
```

**Result**: Keys rotated with zero downtime! 🎉

---

## 🐛 Troubleshooting

### "Azure Speech Key not configured"
**Problem**: Neither KEY_1 nor KEY_2 is set

**Solution**:
1. Check `.env` file has both keys
2. Restart server after adding keys
3. Verify no typos in variable names
4. Check for spaces around `=` sign

### "401 Unauthorized"
**Problem**: Invalid key or expired key

**Solution**:
1. Verify keys are copied correctly from Azure Portal
2. Try regenerating keys in Azure Portal
3. Check both KEY_1 and KEY_2
4. Ensure no extra spaces in the keys

### "Custom endpoint not working"
**Problem**: AZURE_ENDPOINT format is incorrect

**Solution**:
1. Ensure format: `https://{region}.api.cognitive.microsoft.com`
2. No trailing slash
3. Match region with AZURE_SPEECH_REGION
4. Try without AZURE_ENDPOINT to use default

---

## 📊 Summary

Your Azure TTS setup uses:

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `AZURE_SPEECH_KEY_1` | ✅ Yes | Primary subscription key | `abc123...` |
| `AZURE_SPEECH_KEY_2` | ⚠️ Optional | Backup subscription key | `xyz789...` |
| `AZURE_SPEECH_REGION` | ✅ Yes | Azure region | `westeurope` |
| `AZURE_ENDPOINT` | ❌ No | Custom endpoint (optional) | `https://...` |

**Minimum Required:**
- `AZURE_SPEECH_KEY_1`
- `AZURE_SPEECH_REGION`

**Recommended:**
- Add `AZURE_SPEECH_KEY_2` for redundancy
- `AZURE_ENDPOINT` is optional (system uses default)

---

**All set!** Add your Azure keys and enjoy realistic, human-like voices! 🎙️

