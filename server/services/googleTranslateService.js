const axios = require('axios');

class GoogleTranslateService {
  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    console.log('Google Translate Service initialized:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      baseUrl: this.baseUrl
    });
  }

  /**
   * Translate text using Google Translate API with sales context
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (et, es, ru)
   * @param {string} context - Context for better translation (e.g., 'sales_feedback', 'improvement_suggestion')
   * @returns {Promise<string>} Translated text
   */
  async translateWithContext(text, targetLanguage, context = 'general') {
    if (!text || !targetLanguage || targetLanguage === 'en') {
      return text;
    }

    // Check if text is already in target language (basic detection)
    if (this.isAlreadyInTargetLanguage(text, targetLanguage)) {
      console.log(`Text appears to already be in ${targetLanguage}, skipping translation: "${text}"`);
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${targetLanguage}_${context}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`Google Translate: Using cached translation for "${text}"`);
      return cached.translation;
    }

    if (!this.apiKey) {
      console.warn('Google Translate API key not found, returning original text');
      console.log('Environment variables check:', {
        GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV
      });
      return text;
    }

    console.log('Google Translate API key found, proceeding with translation...');

    try {
      // Add context to improve translation quality
      const contextualText = this.addContext(text, context);
      
      // For AI insights, ensure we're translating complete sentences
      const finalText = this.ensureCompleteSentenceTranslation(contextualText, context);
      
      console.log('Making Google Translate API request:', {
        url: this.baseUrl,
        text: finalText,
        targetLanguage,
        context,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0
      });
      
      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        q: finalText,
        target: targetLanguage,
        source: 'en',
        format: 'text',
        model: 'nmt' // Use Neural Machine Translation
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.data && response.data.data.translations) {
        let translation = response.data.data.translations[0].translatedText;
        
        // Clean up the translation by removing the translated instruction prefix
        translation = this.cleanupTranslation(translation, targetLanguage, context);
        
        // Cache the result
        this.cache.set(cacheKey, {
          translation,
          timestamp: Date.now()
        });

        console.log(`Google Translate: "${text}" -> "${translation}" (${targetLanguage})`);
        return translation;
      }

      throw new Error('Invalid response from Google Translate API');
    } catch (error) {
      console.error('Google Translate API error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      return text; // Return original text on error
    }
  }

  /**
   * Add context to text to improve translation quality
   * @param {string} text - Original text
   * @param {string} context - Context type
   * @returns {string} Text with context
   */
  addContext(text, context) {
    const contextPrefixes = {
      'sales_feedback': 'Sales feedback: ',
      'improvement_suggestion': 'Improvement suggestion: ',
      'strength_comment': 'Strength comment: ',
      'stage_rating': 'Sales stage rating feedback: ',
      'personalityInsights': 'Personality analysis: ',
      'communicationStyle': 'Communication style analysis: ',
      'recommendedFocus': 'Recommended focus area: ',
      'nextSteps': 'Next step: ',
      'general': ''
    };

    const prefix = contextPrefixes[context] || '';
    return prefix + text;
  }

  /**
   * Ensure complete sentence translation for AI insights
   * @param {string} text - Text to prepare for translation
   * @param {string} context - Context type
   * @returns {string} Text prepared for complete translation
   */
  ensureCompleteSentenceTranslation(text, context) {
    // For AI insights, add instructions to translate the entire text as one unit
    const aiInsightContexts = ['personalityInsights', 'communicationStyle', 'recommendedFocus', 'nextSteps', 'sales_feedback', 'improvement_suggestion'];
    
    if (aiInsightContexts.includes(context)) {
      // Add instruction to translate the complete text as one unit
      return `Translate this complete text as one unit: ${text}`;
    }
    
    return text;
  }

  /**
   * Clean up translation by removing translated instruction prefixes
   * @param {string} translation - Raw translation from Google Translate
   * @param {string} targetLanguage - Target language code
   * @param {string} context - Context type
   * @returns {string} Cleaned translation
   */
  cleanupTranslation(translation, targetLanguage, context) {
    // Define translated instruction prefixes for different languages
    const instructionPrefixes = {
      'et': [
        'Tõlkige kogu tekst ühe ühikuna:',
        'Tõlgi kogu tekst ühe ühikuna:',
        'Müügi tagasiside:',
        'Parandamise soovitus:',
        'Tugevuse kommentaar:',
        'Müügi etapi hinnangu tagasiside:',
        'Isiksuse analüüs:',
        'Suhtlusstiili analüüs:',
        'Soovitatav fookuse ala:',
        'Järgmine samm:'
      ],
      'es': [
        'Traduce este texto completo como una unidad:',
        'Traducir este texto completo como una unidad:',
        'Comentarios de ventas:',
        'Sugerencia de mejora:',
        'Comentario de fortaleza:',
        'Comentarios de calificación de etapa de ventas:',
        'Análisis de personalidad:',
        'Análisis de estilo de comunicación:',
        'Área de enfoque recomendada:',
        'Siguiente paso:'
      ],
      'ru': [
        'Переведите весь этот текст как единое целое:',
        'Переводите весь этот текст как единое целое:',
        'Отзыв о продажах:',
        'Предложение по улучшению:',
        'Комментарий о сильных сторонах:',
        'Отзыв о рейтинге этапа продаж:',
        'Анализ личности:',
        'Анализ стиля общения:',
        'Рекомендуемая область фокуса:',
        'Следующий шаг:'
      ]
    };

    const prefixes = instructionPrefixes[targetLanguage] || [];
    
    // Remove instruction prefixes
    for (const prefix of prefixes) {
      if (translation.startsWith(prefix)) {
        translation = translation.substring(prefix.length).trim();
        break;
      }
    }

    // Remove any remaining context prefixes that might have been translated
    const contextPrefixes = {
      'sales_feedback': ['Müügi tagasiside:', 'Comentarios de ventas:', 'Отзыв о продажах:'],
      'improvement_suggestion': ['Parandamise soovitus:', 'Sugerencia de mejora:', 'Предложение по улучшению:'],
      'strength_comment': ['Tugevuse kommentaar:', 'Comentario de fortaleza:', 'Комментарий о сильных сторонах:'],
      'stage_rating': ['Müügi etapi hinnangu tagasiside:', 'Comentarios de calificación de etapa de ventas:', 'Отзыв о рейтинге этапа продаж:'],
      'personalityInsights': ['Isiksuse analüüs:', 'Análisis de personalidad:', 'Анализ личности:'],
      'communicationStyle': ['Suhtlusstiili analüüs:', 'Análisis de estilo de comunicación:', 'Анализ стиля общения:'],
      'recommendedFocus': ['Soovitatav fookuse ala:', 'Área de enfoque recomendada:', 'Рекомендуемая область фокуса:'],
      'nextSteps': ['Järgmine samm:', 'Siguiente paso:', 'Следующий шаг:']
    };

    const contextPrefixesToRemove = contextPrefixes[context] || [];
    for (const prefix of contextPrefixesToRemove) {
      if (translation.startsWith(prefix)) {
        translation = translation.substring(prefix.length).trim();
        break;
      }
    }

    return translation;
  }

  /**
   * Translate multiple texts in batch
   * @param {Array} texts - Array of text objects with text, context, and targetLanguage
   * @returns {Promise<Array>} Array of translated texts
   */
  async translateBatch(texts) {
    const results = [];
    
    for (const item of texts) {
      try {
        const translation = await this.translateWithContext(
          item.text, 
          item.targetLanguage, 
          item.context
        );
        results.push({
          ...item,
          translatedText: translation
        });
      } catch (error) {
        console.error(`Error translating "${item.text}":`, error.message);
        results.push({
          ...item,
          translatedText: item.text // Return original on error
        });
      }
    }

    return results;
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Google Translate cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Basic language detection to avoid translating already translated content
   */
  isAlreadyInTargetLanguage(text, targetLanguage) {
    const languagePatterns = {
      'et': /[äöüõšž]/i, // Estonian characters
      'es': /[ñáéíóúü]/i, // Spanish characters
      'ru': /[а-яё]/i    // Russian characters
    };

    const pattern = languagePatterns[targetLanguage];
    if (!pattern) return false;

    // If text contains target language characters, it's likely already translated
    const hasTargetChars = pattern.test(text);
    
    // Additional check: if more than 30% of characters are target language specific, consider it translated
    if (hasTargetChars) {
      const targetCharCount = (text.match(pattern) || []).length;
      const totalChars = text.length;
      const targetCharPercentage = (targetCharCount / totalChars) * 100;
      
      if (targetCharPercentage > 5) { // Lower threshold for better detection
        console.log(`Text appears to be in ${targetLanguage} (${targetCharPercentage.toFixed(1)}% target chars): "${text}"`);
        return true;
      }
    }

    return false;
  }
}

module.exports = new GoogleTranslateService();
