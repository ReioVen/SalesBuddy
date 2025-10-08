const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Free TTS service using ResponsiveVoice (no API key needed) or fallback to edge-tts
// This provides Estonian and other language voices without requiring client installation

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

    // For now, we'll use a fallback approach:
    // 1. Try to use browser's built-in voices on the client side
    // 2. For Estonian specifically, we can use Google Translate's TTS API (free, no auth needed)
    // 3. Or integrate with a proper TTS service
    
    // Extract language code (e.g., 'et' from 'et-EE')
    const langCode = language ? language.split('-')[0] : 'en';
    
    // Supported languages for cloud TTS (free via Google Translate)
    const supportedLanguages = ['et', 'en', 'ru', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl', 'fi', 'sv', 'no', 'da', 'lv', 'lt'];
    
    if (supportedLanguages.includes(langCode)) {
      // Use Google Translate TTS (free, no API key needed)
      const encodedText = encodeURIComponent(text);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encodedText}`;
      
      // Fetch the audio from Google Translate using native fetch or https module
      try {
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
        console.error('Google Translate TTS error:', error);
      }
    }
    
    // For other languages or if Estonian fails, return success and let client use browser TTS
    res.json({
      success: true,
      message: 'Using browser TTS fallback',
      useBrowserTts: true
    });

  } catch (error) {
    console.error('Cloud TTS error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      useBrowserTts: true 
    });
  }
});

/**
 * Get available cloud voices
 * GET /api/cloud-tts/voices
 */
router.get('/voices', authenticateToken, (req, res) => {
  const cloudVoices = [
    // Estonian voices (via Google Translate TTS)
    {
      language: 'et-EE',
      name: 'Google Estonian',
      gender: 'female',
      provider: 'google-translate',
      quality: 'standard',
      isCloud: true,
      requiresDownload: false
    },
    // English voices
    {
      language: 'en-US',
      name: 'Google English US',
      gender: 'female',
      provider: 'google-translate',
      quality: 'standard',
      isCloud: true,
      requiresDownload: false
    },
    {
      language: 'en-GB',
      name: 'Google English UK',
      gender: 'female',
      provider: 'google-translate',
      quality: 'standard',
      isCloud: true,
      requiresDownload: false
    },
    // Russian voices
    {
      language: 'ru-RU',
      name: 'Google Russian',
      gender: 'female',
      provider: 'google-translate',
      quality: 'standard',
      isCloud: true,
      requiresDownload: false
    },
    // Spanish voices
    {
      language: 'es-ES',
      name: 'Google Spanish',
      gender: 'female',
      provider: 'google-translate',
      quality: 'standard',
      isCloud: true,
      requiresDownload: false
    }
  ];

  res.json({
    success: true,
    voices: cloudVoices
  });
});

module.exports = router;
