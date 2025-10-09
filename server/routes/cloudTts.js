const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

// Microsoft Azure Text-to-Speech service for high-quality, human-like voices
// Uses Azure Neural TTS for realistic speech in all supported languages
// Provides Estonian and 20+ other languages without requiring client installation
// Automatic fallback to Google Translate if Azure is not configured

/**
 * Generate speech using cloud TTS service
 * POST /api/cloud-tts/speak
 */
router.post('/speak', authenticateToken, async (req, res) => {
  try {
    const { text, language, voice, rate = 0.92, pitch = 0.98, volume = 0.85 } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Extract language code (e.g., 'et' from 'et-EE')
    const langCode = language ? language.split('-')[0] : 'en';
    
    // Microsoft Azure TTS configuration
    // Try KEY_1 first, fallback to KEY_2 if KEY_1 is not available
    const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY_1 || process.env.AZURE_SPEECH_KEY_2;
    const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'westeurope';
    const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
    
    // Voice mapping for Microsoft Azure Neural voices (high-quality, human-like)
    const voiceMap = {
      // Estonian voices - Neural, very natural
      'et': 'et-EE-AnuNeural',          // Female, warm and professional
      'et-EE': 'et-EE-AnuNeural',
      'et-female': 'et-EE-AnuNeural',
      'et-male': 'et-EE-KertNeural',    // Male, clear and friendly
      
      // English voices - Multiple options for natural speech
      'en': 'en-US-JennyNeural',        // Female US, conversational
      'en-US': 'en-US-JennyNeural',
      'en-female': 'en-US-JennyNeural',
      'en-male': 'en-US-GuyNeural',     // Male US, warm
      'en-GB': 'en-GB-LibbyNeural',     // Female UK
      'en-AU': 'en-AU-NatashaNeural',   // Female Australian
      
      // Spanish voices
      'es': 'es-ES-ElviraNeural',       // Female Spain
      'es-ES': 'es-ES-ElviraNeural',
      'es-female': 'es-ES-ElviraNeural',
      'es-male': 'es-ES-AlvaroNeural',  // Male Spain
      'es-MX': 'es-MX-DaliaNeural',     // Female Mexico
      
      // Russian voices
      'ru': 'ru-RU-SvetlanaNeural',     // Female, professional
      'ru-RU': 'ru-RU-SvetlanaNeural',
      'ru-female': 'ru-RU-SvetlanaNeural',
      'ru-male': 'ru-RU-DmitryNeural',  // Male
      
      // German voices
      'de': 'de-DE-KatjaNeural',        // Female
      'de-DE': 'de-DE-KatjaNeural',
      'de-female': 'de-DE-KatjaNeural',
      'de-male': 'de-DE-ConradNeural',  // Male
      
      // French voices
      'fr': 'fr-FR-DeniseNeural',       // Female
      'fr-FR': 'fr-FR-DeniseNeural',
      'fr-female': 'fr-FR-DeniseNeural',
      'fr-male': 'fr-FR-HenriNeural',   // Male
      
      // Italian voices
      'it': 'it-IT-ElsaNeural',         // Female
      'it-IT': 'it-IT-ElsaNeural',
      'it-female': 'it-IT-ElsaNeural',
      'it-male': 'it-IT-DiegoNeural',   // Male
      
      // Portuguese voices
      'pt': 'pt-PT-RaquelNeural',       // Female Portugal
      'pt-PT': 'pt-PT-RaquelNeural',
      'pt-female': 'pt-PT-RaquelNeural',
      'pt-male': 'pt-PT-DuarteNeural',  // Male
      
      // Dutch voices
      'nl': 'nl-NL-ColetteNeural',      // Female
      'nl-NL': 'nl-NL-ColetteNeural',
      'nl-female': 'nl-NL-ColetteNeural',
      'nl-male': 'nl-NL-MaartenNeural', // Male
      
      // Nordic voices
      'sv': 'sv-SE-SofieNeural',        // Swedish female
      'sv-SE': 'sv-SE-SofieNeural',
      'no': 'nb-NO-PernilleNeural',     // Norwegian female
      'nb-NO': 'nb-NO-PernilleNeural',
      'da': 'da-DK-ChristelNeural',     // Danish female
      'da-DK': 'da-DK-ChristelNeural',
      'fi': 'fi-FI-NooraNeural',        // Finnish female
      'fi-FI': 'fi-FI-NooraNeural',
      
      // Baltic voices
      'lv': 'lv-LV-EveritaNeural',      // Latvian female
      'lv-LV': 'lv-LV-EveritaNeural',
      'lt': 'lt-LT-OnaNeural',          // Lithuanian female
      'lt-LT': 'lt-LT-OnaNeural',
      
      // Polish voice
      'pl': 'pl-PL-ZofiaNeural',        // Female
      'pl-PL': 'pl-PL-ZofiaNeural'
    };
    
    // Select voice with multiple fallbacks for best match
    const selectedVoice = voice || voiceMap[language] || voiceMap[langCode] || voiceMap['en'];
    
    // Check if Azure credentials are configured
    if (!AZURE_SPEECH_KEY) {
      console.warn('⚠️ Azure Speech Key not configured. Using Google Translate fallback.');
      return await useGoogleTranslateFallback(langCode, text, res);
    }
    
    try {
      // Create SSML for Microsoft Azure TTS with prosody control
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language || 'et-EE'}">
          <voice name="${selectedVoice}">
            <prosody rate="${Math.round(rate * 100)}%" pitch="${pitch > 1 ? '+' : ''}${Math.round((pitch - 1) * 50)}%">
              ${text}
            </prosody>
          </voice>
        </speak>
      `.trim();
      
      // Get access token
      // Use custom endpoint if provided, otherwise use default regional endpoint
      const tokenEndpoint = AZURE_ENDPOINT 
        ? `${AZURE_ENDPOINT}/sts/v1.0/issueToken`
        : `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
      
      const tokenResponse = await axios.post(
        tokenEndpoint,
        null,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY
          }
        }
      );
      
      const accessToken = tokenResponse.data;
      
      // Request speech synthesis
      // Use custom endpoint if provided, otherwise use default regional endpoint
      const ttsEndpoint = AZURE_ENDPOINT
        ? `${AZURE_ENDPOINT}/tts/cognitiveservices/v1`
        : `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
      
      const ttsResponse = await axios.post(
        ttsEndpoint,
        ssml,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'SalesBuddy'
          },
          responseType: 'arraybuffer'
        }
      );
      
      const audioBuffer = Buffer.from(ttsResponse.data);
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
        'Cache-Control': 'public, max-age=3600'
      });
      
      console.log(`✅ Microsoft Azure TTS: Generated speech for ${langCode} using ${selectedVoice}`);
      return res.send(audioBuffer);
      
    } catch (azureError) {
      console.error('❌ Microsoft Azure TTS error:', azureError.message);
      console.log('Falling back to Google Translate TTS...');
      return await useGoogleTranslateFallback(langCode, text, res);
    }

  } catch (error) {
    console.error('Cloud TTS error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      useBrowserTts: true 
    });
  }
});

// Fallback function for Google Translate TTS (free, no API key)
async function useGoogleTranslateFallback(langCode, text, res) {
  const supportedLanguages = ['et', 'en', 'ru', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl', 'fi', 'sv', 'no', 'da', 'lv', 'lt'];
  
  if (!supportedLanguages.includes(langCode)) {
    return res.json({
      success: true,
      message: 'Language not supported, using browser TTS',
      useBrowserTts: true
    });
  }
  
  try {
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encodedText}`;
    
    // Try using global fetch (Node 18+)
    if (typeof fetch !== 'undefined') {
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'public, max-age=3600'
        });
        
        console.log(`✅ Google Translate TTS: Generated speech for ${langCode}`);
        return res.send(audioBuffer);
      }
    } else {
      // Fallback to https module for older Node versions
      const https = require('https');
      const url = require('url');
      
      const parsedUrl = url.parse(ttsUrl);
      
      return new Promise((resolve, reject) => {
        https.get({
          hostname: parsedUrl.hostname,
          path: parsedUrl.path,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }, (response) => {
          if (response.statusCode === 200) {
            const chunks = [];
            
            response.on('data', (chunk) => {
              chunks.push(chunk);
            });
            
            response.on('end', () => {
              const audioBuffer = Buffer.concat(chunks);
              
              res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length,
                'Cache-Control': 'public, max-age=3600'
              });
              
              console.log(`✅ Google Translate TTS: Generated speech for ${langCode}`);
              res.send(audioBuffer);
              resolve();
            });
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        }).on('error', reject);
      });
    }
  } catch (error) {
    console.error('Google Translate TTS fallback error:', error);
    return res.json({
      success: true,
      message: 'Using browser TTS fallback',
      useBrowserTts: true
    });
  }
}

/**
 * Get available cloud voices
 * GET /api/cloud-tts/voices
 */
router.get('/voices', authenticateToken, (req, res) => {
  const cloudVoices = [
    // Estonian voices (Microsoft Azure Neural)
    {
      language: 'et-EE',
      name: 'Anu (Estonian Female)',
      voiceId: 'et-EE-AnuNeural',
      gender: 'female',
      provider: 'microsoft-azure',
      quality: 'neural',
      isCloud: true,
      requiresDownload: false
    },
    {
      language: 'et-EE',
      name: 'Kert (Estonian Male)',
      voiceId: 'et-EE-KertNeural',
      gender: 'male',
      provider: 'microsoft-azure',
      quality: 'neural',
      isCloud: true,
      requiresDownload: false
    },
    // English voices
    {
      language: 'en-US',
      name: 'Jenny (English US Female)',
      voiceId: 'en-US-JennyNeural',
      gender: 'female',
      provider: 'microsoft-azure',
      quality: 'neural',
      isCloud: true,
      requiresDownload: false
    },
    // Russian voices
    {
      language: 'ru-RU',
      name: 'Svetlana (Russian Female)',
      voiceId: 'ru-RU-SvetlanaNeural',
      gender: 'female',
      provider: 'microsoft-azure',
      quality: 'neural',
      isCloud: true,
      requiresDownload: false
    },
    // Spanish voices
    {
      language: 'es-ES',
      name: 'Elvira (Spanish Female)',
      voiceId: 'es-ES-ElviraNeural',
      gender: 'female',
      provider: 'microsoft-azure',
      quality: 'neural',
      isCloud: true,
      requiresDownload: false
    }
  ];

  res.json({
    success: true,
    voices: cloudVoices,
    provider: process.env.AZURE_SPEECH_KEY ? 'microsoft-azure' : 'google-translate-fallback'
  });
});

module.exports = router;
