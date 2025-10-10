const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files (webm, wav, mp3, ogg, etc.)
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Speech-to-text using Microsoft Azure Speech Services
const speechToText = async (audioBuffer, language = 'en-US') => {
  try {
    console.log('🎤 [AZURE-STT] Processing audio for speech-to-text:', {
      bufferSize: audioBuffer.length,
      language: language
    });

    // Microsoft Azure Speech Service configuration
    const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY_1 || process.env.AZURE_SPEECH_KEY_2;
    const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'westeurope';
    const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;

    if (!AZURE_SPEECH_KEY) {
      console.log('⚠️ [AZURE-STT] Azure Speech Key not configured, using mock response');
      return {
        transcript: 'Azure Speech-to-Text not configured. Please add AZURE_SPEECH_KEY to environment variables.',
        confidence: 0.5,
        alternatives: [],
        source: 'mock'
      };
    }

    try {
      // Get access token for Azure Speech Service
      const tokenEndpoint = AZURE_ENDPOINT 
        ? `${AZURE_ENDPOINT}/sts/v1.0/issueToken`
        : `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
      
      console.log('🔐 [AZURE-STT] Getting access token...');
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
      console.log('✅ [AZURE-STT] Access token obtained');

      // Speech-to-text endpoint
      const sttEndpoint = AZURE_ENDPOINT
        ? `${AZURE_ENDPOINT}/speechtotext/v3.0/transcriptions`
        : `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;

      console.log('📡 [AZURE-STT] Sending audio to Azure STT...');
      const sttResponse = await axios.post(
        sttEndpoint,
        audioBuffer,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
            'Accept': 'application/json'
          },
          params: {
            'language': language,
            'format': 'detailed'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✅ [AZURE-STT] Transcription received from Azure');
      
      const result = sttResponse.data;
      return {
        transcript: result.DisplayText || result.RecognitionStatus === 'Success' ? result.NBest?.[0]?.Display : '',
        confidence: result.NBest?.[0]?.Confidence || 0.9,
        alternatives: result.NBest?.slice(1, 4).map(alt => alt.Display) || [],
        source: 'azure',
        recognitionStatus: result.RecognitionStatus
      };

    } catch (azureError) {
      console.error('❌ [AZURE-STT] Azure Speech-to-Text error:', azureError.message);
      console.log('🔄 [AZURE-STT] Azure STT failed, returning error info');
      
      throw new Error(`Azure STT failed: ${azureError.message}`);
    }

  } catch (error) {
    console.error('❌ [AZURE-STT] Speech-to-text error:', error);
    throw error;
  }
};

// Enhanced text processing with AI
const enhanceTranscription = async (transcript, options = {}) => {
  try {
    const {
      addPunctuation = true,
      fixCapitalization = true,
      removeFillerWords = true,
      detectLanguage = true
    } = options;

    let enhancedText = transcript;
    const enhancements = [];

    // Remove filler words
    if (removeFillerWords) {
      const fillerWords = [
        'um', 'uh', 'ah', 'er', 'like', 'you know', 'so', 'well', 'actually',
        'basically', 'literally', 'obviously', 'definitely', 'probably',
        'kind of', 'sort of', 'you see', 'right', 'okay', 'alright'
      ];

      fillerWords.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        enhancedText = enhancedText.replace(regex, '');
      });

      enhancedText = enhancedText.replace(/\s+/g, ' ').trim();
      enhancements.push('Removed filler words');
    }

    // Fix capitalization
    if (fixCapitalization) {
      enhancedText = enhancedText.charAt(0).toUpperCase() + enhancedText.slice(1);
      enhancedText = enhancedText.replace(/([.!?])\s*([a-z])/g, (match, punctuation, letter) => {
        return punctuation + ' ' + letter.toUpperCase();
      });
      enhancedText = enhancedText.replace(/\bi\b/g, 'I');
      enhancements.push('Fixed capitalization');
    }

    // Add punctuation using AI (mock implementation)
    if (addPunctuation && enhancedText.length > 10) {
      // In production, this would use OpenAI or similar AI service
      enhancedText = enhancedText.replace(/([^.!?])$/, '$1.');
      enhancements.push('Added punctuation');
    }

    return {
      text: enhancedText,
      enhancements,
      originalText: transcript
    };
  } catch (error) {
    console.error('Text enhancement error:', error);
    return {
      text: transcript,
      enhancements: [],
      originalText: transcript
    };
  }
};

// POST /api/speech/transcribe - Upload audio file for transcription
router.post('/transcribe', authenticateToken, upload.single('audio'), [
  body('language').optional().isIn(['en-US', 'es-ES', 'ru-RU', 'et-EE']),
  body('enhancementOptions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { language = 'en-US', enhancementOptions = {} } = req.body;

    // Process the audio file
    const transcriptionResult = await speechToText(req.file.buffer, language);

    // Enhance the transcription
    const enhancedResult = await enhanceTranscription(
      transcriptionResult.transcript,
      enhancementOptions
    );

    res.json({
      success: true,
      transcription: {
        original: transcriptionResult.transcript,
        enhanced: enhancedResult.text,
        confidence: transcriptionResult.confidence,
        alternatives: transcriptionResult.alternatives,
        enhancements: enhancedResult.enhancements,
        language: language
      }
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error.message
    });
  }
});

// POST /api/speech/stream - Real-time speech streaming endpoint
router.post('/stream', authenticateToken, [
  body('language').optional().isIn(['en-US', 'es-ES', 'ru-RU', 'et-EE'])
], async (req, res) => {
  try {
    const { language = 'en-US' } = req.body;

    // Set up Server-Sent Events for real-time streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Mock real-time transcription stream
    // In production, this would connect to a real-time speech recognition service
    const mockTranscription = [
      { text: 'Hello', isFinal: false, confidence: 0.8 },
      { text: 'Hello there', isFinal: false, confidence: 0.9 },
      { text: 'Hello there, how', isFinal: false, confidence: 0.85 },
      { text: 'Hello there, how are you doing today?', isFinal: true, confidence: 0.95 }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < mockTranscription.length) {
        const result = mockTranscription[index];
        res.write(`data: ${JSON.stringify(result)}\n\n`);
        index++;
      } else {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error('Streaming transcription error:', error);
    res.status(500).json({
      error: 'Failed to start streaming transcription',
      message: error.message
    });
  }
});

// POST /api/speech/enhance - Enhance existing text transcription
router.post('/enhance', authenticateToken, [
  body('text').trim().notEmpty().isLength({ max: 5000 }),
  body('options').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, options = {} } = req.body;

    const enhancedResult = await enhanceTranscription(text, options);

    res.json({
      success: true,
      enhancement: enhancedResult
    });

  } catch (error) {
    console.error('Text enhancement error:', error);
    res.status(500).json({
      error: 'Failed to enhance text',
      message: error.message
    });
  }
});

// GET /api/speech/supported-languages - Get supported languages
router.get('/supported-languages', authenticateToken, (req, res) => {
  const supportedLanguages = [
    {
      code: 'en-US',
      name: 'English (US)',
      nativeName: 'English (United States)'
    },
    {
      code: 'es-ES',
      name: 'Spanish (Spain)',
      nativeName: 'Español (España)'
    },
    {
      code: 'ru-RU',
      name: 'Russian',
      nativeName: 'Русский'
    },
    {
      code: 'et-EE',
      name: 'Estonian',
      nativeName: 'Eesti'
    }
  ];

  res.json({
    success: true,
    languages: supportedLanguages
  });
});

// POST /api/speech/voice-commands - Process voice commands
router.post('/voice-commands', authenticateToken, [
  body('command').trim().notEmpty().isLength({ max: 100 }),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { command, context = {} } = req.body;

    // Process voice commands
    const commandMap = {
      'send message': { action: 'send', description: 'Send the current message' },
      'clear text': { action: 'clear', description: 'Clear the input field' },
      'stop listening': { action: 'stop', description: 'Stop voice recognition' },
      'start listening': { action: 'start', description: 'Start voice recognition' },
      'new conversation': { action: 'new', description: 'Start a new conversation' },
      'end conversation': { action: 'end', description: 'End current conversation' },
      'help': { action: 'help', description: 'Show available commands' }
    };

    const normalizedCommand = command.toLowerCase().trim();
    const matchedCommand = Object.entries(commandMap).find(([phrase]) => 
      normalizedCommand.includes(phrase)
    );

    if (matchedCommand) {
      res.json({
        success: true,
        command: {
          phrase: matchedCommand[0],
          action: matchedCommand[1].action,
          description: matchedCommand[1].description,
          confidence: 0.95
        }
      });
    } else {
      res.json({
        success: false,
        error: 'Command not recognized',
        suggestions: Object.keys(commandMap)
      });
    }

  } catch (error) {
    console.error('Voice command processing error:', error);
    res.status(500).json({
      error: 'Failed to process voice command',
      message: error.message
    });
  }
});

module.exports = router;
