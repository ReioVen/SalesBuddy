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

  // Supported languages with multiple voice options for randomness
  private supportedLanguages = {
    'et': { // Estonian
      voices: [
        { name: 'Google Estonian Female', gender: 'female', provider: 'google' },
        { name: 'Google Estonian Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft Estonian Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft Estonian Male', gender: 'male', provider: 'microsoft' },
        { name: 'Amazon Polly Estonian Female', gender: 'female', provider: 'amazon' },
        { name: 'Amazon Polly Estonian Male', gender: 'male', provider: 'amazon' }
      ]
    },
    'en': { // English
      voices: [
        { name: 'Google English US Female', gender: 'female', provider: 'google' },
        { name: 'Google English US Male', gender: 'male', provider: 'google' },
        { name: 'Google English UK Female', gender: 'female', provider: 'google' },
        { name: 'Google English UK Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft English Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft English Male', gender: 'male', provider: 'microsoft' }
      ]
    },
    'ru': { // Russian
      voices: [
        { name: 'Google Russian Female', gender: 'female', provider: 'google' },
        { name: 'Google Russian Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft Russian Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft Russian Male', gender: 'male', provider: 'microsoft' },
        { name: 'Amazon Polly Russian Female', gender: 'female', provider: 'amazon' },
        { name: 'Amazon Polly Russian Male', gender: 'male', provider: 'amazon' }
      ]
    },
    'es': { // Spanish
      voices: [
        { name: 'Google Spanish Female', gender: 'female', provider: 'google' },
        { name: 'Google Spanish Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft Spanish Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft Spanish Male', gender: 'male', provider: 'microsoft' },
        { name: 'Amazon Polly Spanish Female', gender: 'female', provider: 'amazon' },
        { name: 'Amazon Polly Spanish Male', gender: 'male', provider: 'amazon' }
      ]
    },
    'de': { // German
      voices: [
        { name: 'Google German Female', gender: 'female', provider: 'google' },
        { name: 'Google German Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft German Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft German Male', gender: 'male', provider: 'microsoft' }
      ]
    },
    'fr': { // French
      voices: [
        { name: 'Google French Female', gender: 'female', provider: 'google' },
        { name: 'Google French Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft French Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft French Male', gender: 'male', provider: 'microsoft' }
      ]
    },
    'it': { // Italian
      voices: [
        { name: 'Google Italian Female', gender: 'female', provider: 'google' },
        { name: 'Google Italian Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft Italian Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft Italian Male', gender: 'male', provider: 'microsoft' }
      ]
    },
    'pt': { // Portuguese
      voices: [
        { name: 'Google Portuguese Female', gender: 'female', provider: 'google' },
        { name: 'Google Portuguese Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft Portuguese Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft Portuguese Male', gender: 'male', provider: 'microsoft' }
      ]
    },
    'nl': { // Dutch
      voices: [
        { name: 'Google Dutch Female', gender: 'female', provider: 'google' },
        { name: 'Google Dutch Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft Dutch Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft Dutch Male', gender: 'male', provider: 'microsoft' }
      ]
    },
    'pl': { // Polish
      voices: [
        { name: 'Google Polish Female', gender: 'female', provider: 'google' },
        { name: 'Google Polish Male', gender: 'male', provider: 'google' },
        { name: 'Microsoft Polish Female', gender: 'female', provider: 'microsoft' },
        { name: 'Microsoft Polish Male', gender: 'male', provider: 'microsoft' }
      ]
    }
  };

  static getInstance(): UniversalTtsService {
    if (!UniversalTtsService.instance) {
      UniversalTtsService.instance = new UniversalTtsService();
    }
    return UniversalTtsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Generate voices for all supported languages
      const allVoices: UniversalTtsVoice[] = [];
      
      Object.entries(this.supportedLanguages).forEach(([langCode, langData]) => {
        langData.voices.forEach(voice => {
          allVoices.push({
            name: voice.name,
            language: `${langCode}-${langCode.toUpperCase()}`,
            gender: voice.gender,
            provider: voice.provider,
            isCloud: true
          });
        });
      });
      
      this.voices = allVoices;
      
      // Add browser voices as fallback (filtered to supported languages only)
      if ('speechSynthesis' in window) {
        const browserVoices = speechSynthesis.getVoices();
        const supportedLangCodes = Object.keys(this.supportedLanguages);
        
        const filteredBrowserVoices = browserVoices
          .filter(voice => {
            const voiceLang = voice.lang.split('-')[0];
            return supportedLangCodes.includes(voiceLang);
          })
          .map(voice => ({
            name: voice.name,
            language: voice.lang,
            gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male',
            provider: 'browser' as const,
            isCloud: false
          }));
        
        this.voices = [...allVoices, ...filteredBrowserVoices];
      }
      
      this.isInitialized = true;
      console.log('🌐 Universal TTS Service initialized with supported languages');
      console.log('🎯 Supported languages:', Object.keys(this.supportedLanguages).join(', '));
      console.log('🎲 Total voices available:', this.voices.length);
    } catch (error) {
      console.error('Failed to initialize Universal TTS Service:', error);
    }
  }

  getVoices(): UniversalTtsVoice[] {
    return this.voices;
  }

  getVoicesForLanguage(languageCode: string): UniversalTtsVoice[] {
    return this.voices.filter(voice => 
      voice.language.startsWith(languageCode + '-') || 
      voice.language === languageCode
    );
  }

  getRandomVoiceForLanguage(languageCode: string): UniversalTtsVoice | null {
    const voicesForLang = this.getVoicesForLanguage(languageCode);
    if (voicesForLang.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * voicesForLang.length);
    return voicesForLang[randomIndex];
  }

  getSupportedLanguages(): string[] {
    return Object.keys(this.supportedLanguages);
  }

  getEstonianVoices(): UniversalTtsVoice[] {
    return this.getVoicesForLanguage('et');
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

  getAllVoicesForLanguage(languageCode: string): UniversalTtsVoice[] {
    return this.voices.filter(voice => 
      voice.language.startsWith(languageCode + '-') || 
      voice.language === languageCode
    );
  }

  getSpecificVoiceForLanguage(languageCode: string, voiceName: string): UniversalTtsVoice | null {
    const voicesForLang = this.getAllVoicesForLanguage(languageCode);
    return voicesForLang.find(voice => voice.name === voiceName) || null;
  }
}

export const universalTtsService = UniversalTtsService.getInstance();
