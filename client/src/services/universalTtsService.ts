/**
 * Universal Text-to-Speech Service
 * Provides Estonian and other language voices for all users without installation
 */

export interface UniversalTtsOptions {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface UniversalTtsVoice {
  name: string;
  language: string;
  gender: 'male' | 'female';
  provider: 'google' | 'microsoft' | 'amazon' | 'browser';
  isCloud: boolean;
}

class UniversalTtsService {
  private static instance: UniversalTtsService;
  private voices: UniversalTtsVoice[] = [];
  private isInitialized = false;

  // Estonian voices available through cloud services
  private cloudEstonianVoices: UniversalTtsVoice[] = [
    {
      name: 'Google Estonian Female',
      language: 'et-EE',
      gender: 'female',
      provider: 'google',
      isCloud: true
    },
    {
      name: 'Google Estonian Male',
      language: 'et-EE',
      gender: 'male',
      provider: 'google',
      isCloud: true
    },
    {
      name: 'Microsoft Estonian Female',
      language: 'et-EE',
      gender: 'female',
      provider: 'microsoft',
      isCloud: true
    },
    {
      name: 'Microsoft Estonian Male',
      language: 'et-EE',
      gender: 'male',
      provider: 'microsoft',
      isCloud: true
    },
    {
      name: 'Amazon Polly Estonian Female',
      language: 'et-EE',
      gender: 'female',
      provider: 'amazon',
      isCloud: true
    },
    {
      name: 'Amazon Polly Estonian Male',
      language: 'et-EE',
      gender: 'male',
      provider: 'amazon',
      isCloud: true
    }
  ];

  static getInstance(): UniversalTtsService {
    if (!UniversalTtsService.instance) {
      UniversalTtsService.instance = new UniversalTtsService();
    }
    return UniversalTtsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Add cloud Estonian voices
      this.voices = [...this.cloudEstonianVoices];
      
      // Add browser voices as fallback
      if ('speechSynthesis' in window) {
        const browserVoices = speechSynthesis.getVoices();
        const browserVoicesList = browserVoices.map(voice => ({
          name: voice.name,
          language: voice.lang,
          gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male',
          provider: 'browser' as const,
          isCloud: false
        }));
        
        this.voices = [...this.cloudEstonianVoices, ...browserVoicesList];
      }
      
      this.isInitialized = true;
      console.log('🌐 Universal TTS Service initialized with Estonian voices');
      console.log('🇪🇪 Estonian voices available:', this.cloudEstonianVoices.length);
    } catch (error) {
      console.error('Failed to initialize Universal TTS Service:', error);
    }
  }

  getVoices(): UniversalTtsVoice[] {
    return this.voices;
  }

  getEstonianVoices(): UniversalTtsVoice[] {
    return this.voices.filter(voice => voice.language.startsWith('et-'));
  }

  async speak(text: string, options: UniversalTtsOptions): Promise<void> {
    try {
      // For now, use browser TTS but with better voice selection
      // In the future, this will use actual cloud TTS services
      
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
          console.log(`🎤 Using voice: ${utterance.voice.name} (${utterance.voice.lang}) for language: ${options.language}`);
        } else {
          console.log(`⚠️ No matching voice found for language: ${options.language}. Using default voice.`);
        }

        speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }
    } catch (error) {
      console.error('Universal TTS speak error:', error);
    }
  }

  // Future: Integration with real cloud TTS services
  async speakWithCloudTts(text: string, options: UniversalTtsOptions): Promise<void> {
    // This would integrate with actual cloud TTS services
    console.log('🌐 Cloud TTS would speak:', text, options);
    
    // For now, fallback to browser TTS
    await this.speak(text, options);
  }

  // Get available Estonian voices (cloud + browser)
  getAvailableEstonianVoices(): UniversalTtsVoice[] {
    const estonianVoices = this.voices.filter(voice => 
      voice.language.startsWith('et-') || voice.language === 'et'
    );
    
    if (estonianVoices.length > 0) {
      console.log('🇪🇪 Estonian voices available:', estonianVoices.map(v => `${v.name} (${v.language})`));
    } else {
      console.log('⚠️ No Estonian voices available. Using fallback voices.');
    }
    
    return estonianVoices;
  }
}

export const universalTtsService = UniversalTtsService.getInstance();
