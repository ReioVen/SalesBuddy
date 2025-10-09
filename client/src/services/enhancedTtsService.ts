/**
 * Enhanced Text-to-Speech Service
 * Provides realistic, natural-sounding voices with multiple provider options
 */

export interface EnhancedTtsOptions {
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  useCloud?: boolean; // Whether to use cloud TTS instead of browser
  speakingStyle?: 'neutral' | 'empathetic' | 'professional' | 'friendly' | 'excited';
  addPauses?: boolean; // Add natural pauses
  ssmlEnabled?: boolean; // Use SSML for enhanced control
}

export interface EnhancedVoice {
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: 'google' | 'amazon' | 'microsoft' | 'elevenlabs' | 'browser';
  quality: 'standard' | 'neural' | 'wavenet' | 'studio';
  isCloud: boolean;
  naturalness: number; // 1-10 scale
  description?: string;
}

class EnhancedTtsService {
  private static instance: EnhancedTtsService;
  private isInitialized = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private apiEndpoint = '/api/cloud-tts/speak'; // Backend endpoint for cloud TTS
  private currentAudio: HTMLAudioElement | null = null;

  // Neural voices configuration for realistic speech
  private neuralVoices: EnhancedVoice[] = [
    // English voices
    {
      name: 'Google Neural2 - Emma (US Female)',
      language: 'en-US',
      gender: 'female',
      provider: 'google',
      quality: 'neural',
      isCloud: true,
      naturalness: 9,
      description: 'Very natural female voice, ideal for professional communication'
    },
    {
      name: 'Google Neural2 - Christopher (US Male)',
      language: 'en-US',
      gender: 'male',
      provider: 'google',
      quality: 'neural',
      isCloud: true,
      naturalness: 9,
      description: 'Natural male voice with warm tone'
    },
    {
      name: 'Google Wavenet - Joanna (US Female)',
      language: 'en-US',
      gender: 'female',
      provider: 'google',
      quality: 'wavenet',
      isCloud: true,
      naturalness: 8,
      description: 'Clear female voice with natural intonation'
    },
    // Estonian voices
    {
      name: 'Google Neural2 - Estonian Female',
      language: 'et-EE',
      gender: 'female',
      provider: 'google',
      quality: 'neural',
      isCloud: true,
      naturalness: 9,
      description: 'Natural Estonian female voice'
    },
    {
      name: 'Microsoft Neural - Estonian Female',
      language: 'et-EE',
      gender: 'female',
      provider: 'microsoft',
      quality: 'neural',
      isCloud: true,
      naturalness: 8,
      description: 'Estonian female voice with clear pronunciation'
    },
    // Russian voices
    {
      name: 'Google Neural2 - Russian Female',
      language: 'ru-RU',
      gender: 'female',
      provider: 'google',
      quality: 'neural',
      isCloud: true,
      naturalness: 9,
      description: 'Natural Russian female voice'
    },
    {
      name: 'Google Neural2 - Russian Male',
      language: 'ru-RU',
      gender: 'male',
      provider: 'google',
      quality: 'neural',
      isCloud: true,
      naturalness: 9,
      description: 'Natural Russian male voice'
    },
    // Spanish voices
    {
      name: 'Google Neural2 - Spanish Female',
      language: 'es-ES',
      gender: 'female',
      provider: 'google',
      quality: 'neural',
      isCloud: true,
      naturalness: 9,
      description: 'Natural Spanish female voice'
    }
  ];

  static getInstance(): EnhancedTtsService {
    if (!EnhancedTtsService.instance) {
      EnhancedTtsService.instance = new EnhancedTtsService();
    }
    return EnhancedTtsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('🎙️ Enhanced TTS Service initialized with neural voices');
  }

  /**
   * Preprocess text for more natural speech
   * Adds appropriate pauses, fixes pronunciations, etc.
   */
  private preprocessText(text: string, options: EnhancedTtsOptions): string {
    let processedText = text;

    if (options.addPauses !== false) {
      // Add short pauses after commas for more natural flow
      processedText = processedText.replace(/,/g, ', ');
      
      // Add medium pauses after periods
      processedText = processedText.replace(/\./g, '. ');
      
      // Add pauses after question marks and exclamation points
      processedText = processedText.replace(/\?/g, '? ');
      processedText = processedText.replace(/!/g, '! ');
      
      // Add pause after colons
      processedText = processedText.replace(/:/g, ': ');
      
      // Clean up multiple spaces
      processedText = processedText.replace(/\s+/g, ' ').trim();
    }

    // Break up long sentences for better pacing
    if (processedText.length > 100 && !processedText.includes('.')) {
      // Add slight pauses at logical breaking points
      processedText = processedText.replace(/ and /g, ' and, ');
      processedText = processedText.replace(/ but /g, ' but, ');
      processedText = processedText.replace(/ or /g, ' or, ');
      processedText = processedText.replace(/ so /g, ' so, ');
    }

    return processedText;
  }

  /**
   * Convert text to SSML for enhanced control (when supported)
   */
  private textToSSML(text: string, options: EnhancedTtsOptions): string {
    if (!options.ssmlEnabled) return text;

    const { speakingStyle = 'neutral', rate = 1.0 } = options;
    
    let ssml = '<speak>';
    
    // Add prosody for rate and pitch control
    ssml += `<prosody rate="${this.rateToSSMLPercent(rate)}" pitch="${this.pitchToSSMLValue(options.pitch || 1.0)}">`;
    
    // Add emphasis based on speaking style
    switch (speakingStyle) {
      case 'empathetic':
        ssml += '<prosody pitch="+2%" volume="soft">';
        break;
      case 'professional':
        ssml += '<prosody pitch="-1%" volume="medium">';
        break;
      case 'friendly':
        ssml += '<prosody pitch="+3%" volume="medium">';
        break;
      case 'excited':
        ssml += '<prosody pitch="+5%" volume="loud" rate="105%">';
        break;
    }
    
    // Add the actual text with automatic pause insertion
    ssml += this.addSSMLPauses(text);
    
    if (speakingStyle !== 'neutral') {
      ssml += '</prosody>';
    }
    
    ssml += '</prosody></speak>';
    
    return ssml;
  }

  private addSSMLPauses(text: string): string {
    // Add pauses after sentences
    let result = text.replace(/\. /g, '.<break time="500ms"/> ');
    result = result.replace(/\? /g, '?<break time="500ms"/> ');
    result = result.replace(/! /g, '!<break time="500ms"/> ');
    
    // Add shorter pauses after commas
    result = result.replace(/, /g, ',<break time="250ms"/> ');
    
    return result;
  }

  private rateToSSMLPercent(rate: number): string {
    // Convert rate (0.5-2.0) to SSML percentage (50%-200%)
    return `${Math.round(rate * 100)}%`;
  }

  private pitchToSSMLValue(pitch: number): string {
    // Convert pitch (0.5-2.0) to SSML value
    if (pitch < 1) {
      return `${Math.round((pitch - 1) * 50)}%`;
    } else if (pitch > 1) {
      return `+${Math.round((pitch - 1) * 50)}%`;
    }
    return '0%';
  }

  /**
   * Speak using cloud TTS service (Microsoft Azure Neural TTS for realistic voices)
   */
  private async speakWithCloudTTS(text: string, options: EnhancedTtsOptions): Promise<void> {
    try {
      const processedText = this.preprocessText(text, options);
      
      const token = localStorage.getItem('token');
      
      console.log('🎙️ Using Azure TTS for realistic speech...');
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          text: processedText,
          language: options.language,
          voice: options.voice,
          rate: options.rate || 0.92,
          pitch: options.pitch || 0.98,
          volume: options.volume || 0.85,
          speakingStyle: options.speakingStyle
        })
      });

      if (!response.ok) {
        throw new Error(`Cloud TTS request failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      // Check if we got audio back
      if (contentType && contentType.includes('audio')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop any currently playing audio
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }
        
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        
        audio.volume = options.volume || 0.85;
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            console.log('✅ Cloud TTS speech completed');
            resolve();
          };
          audio.onerror = (error) => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            console.error('❌ Cloud TTS audio playback error:', error);
            reject(error);
          };
          audio.play().catch((err) => {
            console.error('❌ Cloud TTS play error:', err);
            reject(err);
          });
          
          console.log('✅ Playing Azure TTS audio for:', options.language);
        });
      } else {
        // Response is JSON, probably indicating to use browser TTS
        const data = await response.json();
        if (data.useBrowserTts) {
          console.log('☁️ Azure TTS not available, using browser TTS fallback');
          return this.speakWithBrowserTTS(text, options);
        }
        throw new Error('Unexpected response from cloud TTS');
      }
    } catch (error) {
      console.error('❌ Azure TTS error:', error);
      console.log('⚠️ Falling back to browser TTS');
      // Fallback to browser TTS
      return this.speakWithBrowserTTS(text, options);
    }
  }

  /**
   * Speak using enhanced browser TTS with optimal settings
   */
  private async speakWithBrowserTTS(text: string, options: EnhancedTtsOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Preprocess text for better flow
      const processedText = this.preprocessText(text, options);

      const utterance = new SpeechSynthesisUtterance(processedText);
      
      // Optimal settings for natural-sounding speech
      utterance.lang = options.language;
      
      // Rate: Slightly slower than default for better comprehension
      // Studies show 0.9-0.95 sounds more natural and professional
      utterance.rate = options.rate || 0.92;
      
      // Pitch: Slightly lower sounds more authoritative and natural
      // 0.95-1.0 is optimal for most voices
      utterance.pitch = options.pitch || 0.98;
      
      // Volume: Use user preference or default
      utterance.volume = options.volume || 0.85;

      // Try to select the best voice for the language
      const voices = speechSynthesis.getVoices();
      const languageCode = options.language.split('-')[0];
      
      // Prioritize:
      // 1. User's selected voice
      // 2. Local neural voices (if available)
      // 3. Remote neural voices
      // 4. Any voice matching the language
      
      if (options.voice) {
        const selectedVoice = voices.find(v => v.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      if (!utterance.voice) {
        const matchingVoices = voices.filter(voice => 
          voice.lang.startsWith(languageCode) || 
          voice.lang === options.language
        );

        if (matchingVoices.length > 0) {
          // Prefer voices with "neural", "premium", "enhanced" in name
          const neuralVoice = matchingVoices.find(v => 
            v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('premium') ||
            v.name.toLowerCase().includes('enhanced') ||
            v.name.toLowerCase().includes('natural')
          );
          
          // Prefer local voices for lower latency
          const localVoice = matchingVoices.find(v => v.localService);
          
          utterance.voice = neuralVoice || localVoice || matchingVoices[0];
          
          console.log(`🎤 Using enhanced voice: ${utterance.voice.name} (${utterance.voice.lang})`);
          console.log(`   Settings: rate=${utterance.rate.toFixed(2)}, pitch=${utterance.pitch.toFixed(2)}, volume=${utterance.volume.toFixed(2)}`);
        }
      }

      // Event handlers
      utterance.onstart = () => {
        console.log('🎙️ Speech started');
      };

      utterance.onend = () => {
        console.log('✅ Speech completed');
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        this.currentUtterance = null;
        reject(new Error(event.error));
      };

      // Handle pause and resume events
      utterance.onpause = () => {
        console.log('⏸️ Speech paused');
      };

      utterance.onresume = () => {
        console.log('▶️ Speech resumed');
      };

      this.currentUtterance = utterance;
      
      // Cancel any ongoing speech before starting new one
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      
      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Main speak method - automatically chooses best TTS method
   */
  async speak(text: string, options: EnhancedTtsOptions = { language: 'en-US' }): Promise<void> {
    if (!text || !text.trim()) {
      console.warn('⚠️ Empty text provided to TTS');
      return;
    }

    console.log(`🎙️ Speaking with enhanced TTS: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Languages that typically don't have browser voices - use cloud TTS automatically
    const languageCode = options.language?.split('-')[0] || 'en';
    const cloudTtsLanguages = ['et', 'lv', 'lt', 'fi', 'no', 'da', 'is', 'ga']; // Estonian and other less common languages
    
    const shouldUseCloudTts = options.useCloud || cloudTtsLanguages.includes(languageCode);
    
    if (shouldUseCloudTts) {
      console.log(`☁️ Using cloud TTS for ${languageCode} (no client downloads needed)`);
      return this.speakWithCloudTTS(text, options);
    } else {
      return this.speakWithBrowserTTS(text, options);
    }
  }

  /**
   * Stop current speech (both browser and cloud)
   */
  stop(): void {
    // Stop cloud audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      console.log('🛑 Cloud TTS stopped');
    }
    
    // Stop browser TTS if playing
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
      console.log('🛑 Browser TTS stopped');
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if ('speechSynthesis' in window && speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      console.log('⏸️ Speech paused');
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if ('speechSynthesis' in window && speechSynthesis.paused) {
      speechSynthesis.resume();
      console.log('▶️ Speech resumed');
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return 'speechSynthesis' in window && speechSynthesis.speaking;
  }

  /**
   * Get available neural voices
   */
  getNeuralVoices(): EnhancedVoice[] {
    return this.neuralVoices;
  }

  /**
   * Get voices for specific language
   */
  getVoicesForLanguage(languageCode: string): EnhancedVoice[] {
    return this.neuralVoices.filter(voice => 
      voice.language.startsWith(languageCode)
    );
  }

  /**
   * Test voice with sample text
   */
  async testVoice(voice: EnhancedVoice, sampleText?: string): Promise<void> {
    const defaultSamples: { [key: string]: string } = {
      'en': 'Hello! I am your AI assistant. How can I help you today?',
      'et': 'Tere! Mina olen teie AI assistent. Kuidas ma saan teid aidata?',
      'ru': 'Здравствуйте! Я ваш ИИ-помощник. Как я могу вам помочь сегодня?',
      'es': '¡Hola! Soy tu asistente de IA. ¿Cómo puedo ayudarte hoy?'
    };

    const langCode = voice.language.split('-')[0];
    const text = sampleText || defaultSamples[langCode] || defaultSamples['en'];

    return this.speak(text, {
      language: voice.language,
      voice: voice.name,
      rate: 0.92,
      pitch: 0.98,
      volume: 0.85,
      addPauses: true,
      useCloud: voice.isCloud
    });
  }
}

export const enhancedTtsService = EnhancedTtsService.getInstance();
