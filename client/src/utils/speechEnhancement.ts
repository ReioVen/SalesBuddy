// Speech enhancement utilities for better transcription quality

export interface SpeechEnhancementOptions {
  addPunctuation?: boolean;
  fixCapitalization?: boolean;
  removeFillerWords?: boolean;
  detectLanguage?: boolean;
  confidenceThreshold?: number;
}

export interface EnhancedTranscript {
  text: string;
  confidence: number;
  language: string;
  enhancements: string[];
}

/**
 * Enhance speech transcription with AI-powered improvements
 */
export const enhanceTranscript = async (
  transcript: string,
  options: SpeechEnhancementOptions = {}
): Promise<EnhancedTranscript> => {
  const {
    addPunctuation = true,
    fixCapitalization = true,
    removeFillerWords = true,
    detectLanguage = true,
    confidenceThreshold = 0.7
  } = options;

  let enhancedText = transcript;
  const enhancements: string[] = [];

  // Remove filler words
  if (removeFillerWords) {
    enhancedText = removeFillerWordsFromText(enhancedText);
    enhancements.push('Removed filler words');
  }

  // Fix capitalization
  if (fixCapitalization) {
    enhancedText = fixCapitalizationInText(enhancedText);
    enhancements.push('Fixed capitalization');
  }

  // Add punctuation (this would typically use an AI service)
  if (addPunctuation && enhancedText.length > 10) {
    enhancedText = await addPunctuationToText(enhancedText);
    enhancements.push('Added punctuation');
  }

  // Detect language
  const language = detectLanguage ? detectLanguageFromText(enhancedText) : 'en';

  return {
    text: enhancedText,
    confidence: calculateConfidence(enhancedText, transcript),
    language,
    enhancements
  };
};

/**
 * Remove common filler words and phrases
 */
const removeFillerWordsFromText = (text: string): string => {
  const fillerWords = [
    'um', 'uh', 'ah', 'er', 'like', 'you know', 'so', 'well', 'actually',
    'basically', 'literally', 'obviously', 'definitely', 'probably',
    'kind of', 'sort of', 'you see', 'right', 'okay', 'alright'
  ];

  let cleanedText = text;
  
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, '');
  });

  // Clean up multiple spaces
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
};

/**
 * Fix capitalization in transcribed text
 */
const fixCapitalizationInText = (text: string): string => {
  // Capitalize first letter
  let fixed = text.charAt(0).toUpperCase() + text.slice(1);
  
  // Capitalize after periods, exclamation marks, and question marks
  fixed = fixed.replace(/([.!?])\s*([a-z])/g, (match, punctuation, letter) => {
    return punctuation + ' ' + letter.toUpperCase();
  });
  
  // Capitalize "I" when it's a standalone word
  fixed = fixed.replace(/\bi\b/g, 'I');
  
  return fixed;
};

/**
 * Add punctuation to text using simple heuristics
 * In a real implementation, this would use an AI service
 */
const addPunctuationToText = async (text: string): Promise<string> => {
  // Simple heuristics for adding punctuation
  let punctuated = text;
  
  // Add periods after sentences (look for common sentence endings)
  const sentenceEnders = ['thank you', 'please', 'thanks', 'goodbye', 'bye'];
  sentenceEnders.forEach(ender => {
    const regex = new RegExp(`\\b${ender}\\b(?![.!?])`, 'gi');
    punctuated = punctuated.replace(regex, ender + '.');
  });
  
  // Add question marks after question words
  const questionWords = ['what', 'where', 'when', 'why', 'how', 'who', 'which'];
  questionWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b.*(?![.!?])$`, 'gi');
    if (regex.test(punctuated)) {
      punctuated = punctuated.replace(/([^.!?])$/, '$1?');
    }
  });
  
  // Add exclamation marks after exclamatory words
  const exclamatoryWords = ['wow', 'amazing', 'incredible', 'fantastic', 'great'];
  exclamatoryWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b(?![.!?])`, 'gi');
    punctuated = punctuated.replace(regex, word + '!');
  });
  
  return punctuated;
};

/**
 * Detect language from text (simplified version)
 */
const detectLanguageFromText = (text: string): string => {
  // Simple language detection based on common words
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo'];
  const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour'];
  
  const lowerText = text.toLowerCase();
  
  const englishCount = englishWords.reduce((count, word) => 
    count + (lowerText.includes(word) ? 1 : 0), 0);
  const spanishCount = spanishWords.reduce((count, word) => 
    count + (lowerText.includes(word) ? 1 : 0), 0);
  const frenchCount = frenchWords.reduce((count, word) => 
    count + (lowerText.includes(word) ? 1 : 0), 0);
  
  if (spanishCount > englishCount && spanishCount > frenchCount) return 'es';
  if (frenchCount > englishCount && frenchCount > spanishCount) return 'fr';
  return 'en';
};

/**
 * Calculate confidence score based on text quality
 */
const calculateConfidence = (enhanced: string, original: string): number => {
  let confidence = 0.8; // Base confidence
  
  // Increase confidence if text is longer (more context)
  if (enhanced.length > 50) confidence += 0.1;
  if (enhanced.length > 100) confidence += 0.1;
  
  // Decrease confidence if many filler words were removed
  const fillerRemoved = original.length - enhanced.length;
  if (fillerRemoved > original.length * 0.3) confidence -= 0.2;
  
  // Increase confidence if punctuation was added successfully
  if (enhanced.includes('.') || enhanced.includes('!') || enhanced.includes('?')) {
    confidence += 0.1;
  }
  
  return Math.min(Math.max(confidence, 0), 1);
};

/**
 * Voice Activity Detection (VAD) utilities
 */
export class VoiceActivityDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isListening = false;
  private threshold = 0.01;
  private onVoiceStart: (() => void) | null = null;
  private onVoiceEnd: (() => void) | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
  }

  async startListening(
    onVoiceStart: () => void,
    onVoiceEnd: () => void,
    threshold: number = 0.01
  ): Promise<void> {
    this.onVoiceStart = onVoiceStart;
    this.onVoiceEnd = onVoiceEnd;
    this.threshold = threshold;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      this.isListening = true;
      this.detectVoiceActivity();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
  }

  private detectVoiceActivity(): void {
    if (!this.isListening) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const volume = average / 255;

    // Detect voice activity
    if (volume > this.threshold) {
      this.onVoiceStart?.();
    } else {
      this.onVoiceEnd?.();
    }

    // Continue monitoring
    requestAnimationFrame(() => this.detectVoiceActivity());
  }
}

/**
 * Real-time transcription with WebSocket support
 */
export class RealTimeTranscription {
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext;
  private processor: ScriptProcessorNode | null = null;
  private isRecording = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async startTranscription(
    websocketUrl: string,
    onTranscript: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      this.websocket = new WebSocket(websocketUrl);
      
      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onTranscript(data.transcript, data.isFinal);
      };

      this.websocket.onerror = () => {
        onError('WebSocket connection failed');
      };

      // Start audio capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);
      
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (event) => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          const audioData = event.inputBuffer.getChannelData(0);
          this.websocket.send(audioData);
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;

    } catch (error) {
      onError(`Failed to start transcription: ${error}`);
    }
  }

  stopTranscription(): void {
    this.isRecording = false;
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
  }
}
