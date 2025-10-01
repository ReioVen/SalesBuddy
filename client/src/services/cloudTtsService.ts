/**
 * Cloud-based Text-to-Speech Service
 * Provides Estonian and other language voices for all users
 */

export interface CloudTtsOptions {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface CloudTtsVoice {
  name: string;
  language: string;
  gender: 'male' | 'female';
  provider: 'google' | 'microsoft' | 'amazon';
}

export class CloudTtsService {
  private static instance: CloudTtsService;
  private voices: CloudTtsVoice[] = [];
  private isInitialized = false;

  // Estonian voices from different providers
  private estonianVoices: CloudTtsVoice[] = [
    {
      name: 'Google Estonian Female',
      language: 'et-EE',
      gender: 'female',
      provider: 'google'
    },
    {
      name: 'Google Estonian Male',
      language: 'et-EE',
      gender: 'male',
      provider: 'google'
    },
    {
      name: 'Microsoft Estonian Female',
      language: 'et-EE',
      gender: 'female',
      provider: 'microsoft'
    },
    {
      name: 'Microsoft Estonian Male',
      language: 'et-EE',
      gender: 'male',
      provider: 'microsoft'
    }
  ];

  static getInstance(): CloudTtsService {
    if (!CloudTtsService.instance) {
      CloudTtsService.instance = new CloudTtsService();
    }
    return CloudTtsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize with Estonian voices
      this.voices = [...this.estonianVoices];
      this.isInitialized = true;
      console.log('🌐 Cloud TTS Service initialized with Estonian voices');
    } catch (error) {
      console.error('Failed to initialize Cloud TTS Service:', error);
    }
  }

  getVoices(): CloudTtsVoice[] {
    return this.voices;
  }

  getEstonianVoices(): CloudTtsVoice[] {
    return this.voices.filter(voice => voice.language.startsWith('et-'));
  }

  async speak(text: string, options: CloudTtsOptions): Promise<void> {
    try {
      // For now, we'll use the browser's built-in TTS but with better voice selection
      // In the future, this can be extended to use actual cloud TTS services
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.language;
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        // Try to find the best voice for the language
        const voices = speechSynthesis.getVoices();
        const matchingVoices = voices.filter(voice => 
          voice.lang.startsWith(options.language.split('-')[0]) ||
          voice.lang === options.language
        );

        if (matchingVoices.length > 0) {
          utterance.voice = matchingVoices[0];
        }

        speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }
    } catch (error) {
      console.error('Cloud TTS speak error:', error);
    }
  }

  // Future: Integration with actual cloud TTS services
  async speakWithGoogle(text: string, options: CloudTtsOptions): Promise<void> {
    // This would integrate with Google Cloud Text-to-Speech API
    console.log('Google TTS would speak:', text, options);
  }

  async speakWithMicrosoft(text: string, options: CloudTtsOptions): Promise<void> {
    // This would integrate with Microsoft Azure Cognitive Services
    console.log('Microsoft TTS would speak:', text, options);
  }

  async speakWithAmazon(text: string, options: CloudTtsOptions): Promise<void> {
    // This would integrate with Amazon Polly
    console.log('Amazon Polly would speak:', text, options);
  }
}

export const cloudTtsService = CloudTtsService.getInstance();
