const TranslationKey = require('../models/TranslationKey');
const Translation = require('../models/Translation');
const axios = require('axios');
const googleTranslateService = require('./googleTranslateService');

// Comprehensive static translations for when AI fails
const staticTranslations = {
  et: {
    // Common sales terms
    'strengths': 'Tugevused',
    'improvements': 'Parandamise alad',
    'opening': 'Avamine',
    'discovery': 'Avastamine',
    'presentation': 'Esitlus',
    'objection handling': 'Vastuväidete käsitlemine',
    'closing': 'Sulgemine',
    'personality insights': 'Isiksuse ülevaated',
    'communication style': 'Suhtlemisstiil',
    'recommended focus': 'Soovitatav fookus',
    'next steps': 'Järgmised sammud',
    
    // Sales feedback phrases
    'clear introductions': 'Selged tutvustused',
    'good product offering': 'Hea toote pakkumine',
    'willingness to engage': 'Valmidus suhtlema',
    'professional approach': 'Professionaalne lähenemine',
    'good listening skills': 'Head kuulamise oskused',
    'clear communication': 'Selge suhtlus',
    'effective questioning': 'Tõhus küsimuste esitamine',
    'strong closing': 'Tugev sulgemine',
    'handles objections well': 'Käsitleb vastuväiteid hästi',
    'builds rapport': 'Loob kontakti',
    
    // Improvement areas
    'needs better discovery': 'Vajab paremat avastamist',
    'improve presentation skills': 'Paranda esitluse oskusi',
    'work on closing techniques': 'Tööta sulgemise tehnikate kallal',
    'enhance objection handling': 'Paranda vastuväidete käsitlemist',
    'develop better questions': 'Arenda paremaid küsimusi',
    'improve active listening': 'Paranda aktiivset kuulamist',
    'build stronger relationships': 'Ehita tugevamaid suhteid',
    'focus on customer needs': 'Keskendu kliendi vajadustele',
    'improve follow-up': 'Paranda järelkontrolli',
    'enhance product knowledge': 'Paranda toote tundmist',
    
    // Stage ratings feedback
    'excellent opening': 'Suurepärane avamine',
    'good opening': 'Hea avamine',
    'needs improvement in opening': 'Vajab parandamist avamises',
    'strong discovery phase': 'Tugev avastamise faas',
    'good discovery': 'Hea avastamine',
    'weak discovery': 'Nõrk avastamine',
    'compelling presentation': 'Veenev esitlus',
    'good presentation': 'Hea esitlus',
    'needs better presentation': 'Vajab paremat esitlust',
    'excellent objection handling': 'Suurepärane vastuväidete käsitlemine',
    'good objection handling': 'Hea vastuväidete käsitlemine',
    'poor objection handling': 'Halb vastuväidete käsitlemine',
    'strong closing': 'Tugev sulgemine',
    'good closing': 'Hea sulgemine',
    'weak closing': 'Nõrk sulgemine',
    
    // AI Analysis terms
    'personality analysis': 'Isiksuse analüüs',
    'communication analysis': 'Suhtluse analüüs',
    'sales technique analysis': 'Müügitehnika analüüs',
    'recommendations': 'Soovitused',
    'action items': 'Tegevuskavad',
    'development areas': 'Arendamise alad',
    'strengths to leverage': 'Kasutatavad tugevused',
    'areas for growth': 'Kasvu alad',
    'skill development': 'Oskuste arendamine',
    'performance improvement': 'Tulemuste parandamine',
    
    // Specific feedback content
    'professional communication': 'Professionaalne suhtlus',
    'good product knowledge': 'Hea toote tundmine',
    'respectful approach': 'Väärikas lähenemine',
    'ask more discovery questions': 'Küsi rohkem avastamise küsimusi',
    'practice objection handling': 'Harjuta vastuväidete käsitlemist',
    'improve closing techniques': 'Paranda sulgemise tehnikaid',
    'build better rapport': 'Ehita paremat kontakti',
    'enhance listening skills': 'Paranda kuulamise oskusi',
    'develop stronger relationships': 'Arenda tugevamaid suhteid',
    'focus on customer needs': 'Keskendu kliendi vajadustele',
    'improve follow-up process': 'Paranda järelkontrolli protsessi',
    'work on presentation skills': 'Tööta esitluse oskuste kallal',
    'enhance questioning techniques': 'Paranda küsimuste esitamise tehnikaid',
    'develop closing confidence': 'Arenda sulgemise enesekindlust',
    'improve objection responses': 'Paranda vastuväidetele vastamist',
    'build trust with prospects': 'Ehita usaldust potentsiaalsete klientidega',
    'enhance product demonstrations': 'Paranda toote demonstratsioone',
    'improve time management': 'Paranda ajakasutust',
    'develop negotiation skills': 'Arenda läbirääkimise oskusi',
    'enhance customer service': 'Paranda klienditeenindust',
    
    // Specific feedback sentences
    'good opening approach': 'Hea avamise lähenemine',
    'consider personalizing your introductions more': 'Kaaluge oma tutvustuste isikupärastamist',
    'ask more probing questions': 'Küsi rohkem uurivaid küsimusi',
    'understand customer needs better': 'mõista kliendi vajadusi paremini',
    'clear presentation style': 'Selge esitluse stiil',
    'work on adapting to different customer types': 'Tööta erinevate klienditüüpidega kohanemise kallal',
    'address objections directly': 'Käsitle vastuväiteid otse',
    'practice common objection responses': 'Harjuta tavaliste vastuväidetele vastamist',
    'be more direct with closing attempts': 'Ole sulgemiskatsetega otsesem',
    'practice assumptive closing techniques': 'Harjuta eelduslikke sulgemise tehnikaid',
    'excellent rapport building': 'Suurepärane kontakti loomine',
    'strong product knowledge': 'Tugev toote tundmine',
    'needs improvement in discovery': 'Vajab parandamist avastamises',
    'good listening skills': 'Head kuulamise oskused',
    'improve questioning techniques': 'Paranda küsimuste esitamise tehnikaid',
    'enhance closing confidence': 'Paranda sulgemise enesekindlust',
    'work on objection handling': 'Tööta vastuväidete käsitlemise kallal',
    'develop stronger relationships': 'Arenda tugevamaid suhteid',
    'focus on customer pain points': 'Keskendu kliendi probleemidele',
    'improve follow-up consistency': 'Paranda järelkontrolli järjekindlust',
    
    // Complete feedback sentences (exact matches from your examples)
    'Good opening approach. Consider personalizing your introductions more.': 'Hea avamise lähenemine. Kaaluge oma tutvustuste isikupärastamist.',
    'Ask more probing questions to understand customer needs better.': 'Küsi rohkem uurivaid küsimusi, et mõista kliendi vajadusi paremini.',
    'Clear presentation style. Work on adapting to different customer types.': 'Selge esitluse stiil. Tööta erinevate klienditüüpidega kohanemise kallal.',
    'Address objections directly. Practice common objection responses.': 'Käsitle vastuväiteid otse. Harjuta tavaliste vastuväidetele vastamist.',
    'Be more direct with closing attempts. Practice assumptive closing techniques.': 'Ole sulgemiskatsetega otsesem. Harjuta eelduslikke sulgemise tehnikaid.',
    
    // Alternative versions without periods
    'Good opening approach. Consider personalizing your introductions more': 'Hea avamise lähenemine. Kaaluge oma tutvustuste isikupärastamist',
    'Ask more probing questions to understand customer needs better': 'Küsi rohkem uurivaid küsimusi, et mõista kliendi vajadusi paremini',
    'Clear presentation style. Work on adapting to different customer types': 'Selge esitluse stiil. Tööta erinevate klienditüüpidega kohanemise kallal',
    'Address objections directly. Practice common objection responses': 'Käsitle vastuväiteid otse. Harjuta tavaliste vastuväidetele vastamist',
    'Be more direct with closing attempts. Practice assumptive closing techniques': 'Ole sulgemiskatsetega otsesem. Harjuta eelduslikke sulgemise tehnikaid',
    
    // Lowercase versions
    'good opening approach. consider personalizing your introductions more.': 'Hea avamise lähenemine. Kaaluge oma tutvustuste isikupärastamist.',
    'ask more probing questions to understand customer needs better.': 'Küsi rohkem uurivaid küsimusi, et mõista kliendi vajadusi paremini.',
    'clear presentation style. work on adapting to different customer types.': 'Selge esitluse stiil. Tööta erinevate klienditüüpidega kohanemise kallal.',
    'address objections directly. practice common objection responses.': 'Käsitle vastuväiteid otse. Harjuta tavaliste vastuväidetele vastamist.',
    'be more direct with closing attempts. practice assumptive closing techniques.': 'Ole sulgemiskatsetega otsesem. Harjuta eelduslikke sulgemise tehnikaid.',
    
    'good opening approach. consider personalizing your introductions more': 'Hea avamise lähenemine. Kaaluge oma tutvustuste isikupärastamist',
    'ask more probing questions to understand customer needs better': 'Küsi rohkem uurivaid küsimusi, et mõista kliendi vajadusi paremini',
    'clear presentation style. work on adapting to different customer types': 'Selge esitluse stiil. Tööta erinevate klienditüüpidega kohanemise kallal',
    'address objections directly. practice common objection responses': 'Käsitle vastuväiteid otse. Harjuta tavaliste vastuväidetele vastamist',
    'be more direct with closing attempts. practice assumptive closing techniques': 'Ole sulgemiskatsetega otsesem. Harjuta eelduslikke sulgemise tehnikaid'
  },
  es: {
    'strengths': 'Fortalezas',
    'improvements': 'Áreas de mejora',
    'opening': 'Apertura',
    'discovery': 'Descubrimiento',
    'presentation': 'Presentación',
    'objection handling': 'Manejo de objeciones',
    'closing': 'Cierre',
    'personality insights': 'Perspectivas de personalidad',
    'communication style': 'Estilo de comunicación',
    'recommended focus': 'Enfoque recomendado',
    'next steps': 'Próximos pasos',
    
    // Sales feedback phrases
    'clear introductions': 'Presentaciones claras',
    'good product offering': 'Buena oferta de producto',
    'willingness to engage': 'Disposición para interactuar',
    'professional approach': 'Enfoque profesional',
    'good listening skills': 'Buenas habilidades de escucha',
    'clear communication': 'Comunicación clara',
    'effective questioning': 'Cuestionamiento efectivo',
    'strong closing': 'Cierre fuerte',
    'handles objections well': 'Maneja bien las objeciones',
    'builds rapport': 'Construye rapport',
    
    // Improvement areas
    'needs better discovery': 'Necesita mejor descubrimiento',
    'improve presentation skills': 'Mejorar habilidades de presentación',
    'work on closing techniques': 'Trabajar en técnicas de cierre',
    'enhance objection handling': 'Mejorar manejo de objeciones',
    'develop better questions': 'Desarrollar mejores preguntas',
    'improve active listening': 'Mejorar escucha activa',
    'build stronger relationships': 'Construir relaciones más fuertes',
    'focus on customer needs': 'Enfocarse en necesidades del cliente',
    'improve follow-up': 'Mejorar seguimiento',
    'enhance product knowledge': 'Mejorar conocimiento del producto',
    
    // Stage ratings feedback
    'excellent opening': 'Excelente apertura',
    'good opening': 'Buena apertura',
    'needs improvement in opening': 'Necesita mejora en apertura',
    'strong discovery phase': 'Fase de descubrimiento fuerte',
    'good discovery': 'Buen descubrimiento',
    'weak discovery': 'Descubrimiento débil',
    'compelling presentation': 'Presentación convincente',
    'good presentation': 'Buena presentación',
    'needs better presentation': 'Necesita mejor presentación',
    'excellent objection handling': 'Excelente manejo de objeciones',
    'good objection handling': 'Buen manejo de objeciones',
    'poor objection handling': 'Malo manejo de objeciones',
    'strong closing': 'Cierre fuerte',
    'good closing': 'Buen cierre',
    'weak closing': 'Cierre débil',
    
    // AI Analysis terms
    'personality analysis': 'Análisis de personalidad',
    'communication analysis': 'Análisis de comunicación',
    'sales technique analysis': 'Análisis de técnica de ventas',
    'recommendations': 'Recomendaciones',
    'action items': 'Elementos de acción',
    'development areas': 'Áreas de desarrollo',
    'strengths to leverage': 'Fortalezas a aprovechar',
    'areas for growth': 'Áreas de crecimiento',
    'skill development': 'Desarrollo de habilidades',
    'performance improvement': 'Mejora del rendimiento',
    
    // Specific feedback content
    'professional communication': 'Comunicación profesional',
    'good product knowledge': 'Buen conocimiento del producto',
    'respectful approach': 'Enfoque respetuoso',
    'ask more discovery questions': 'Hacer más preguntas de descubrimiento',
    'practice objection handling': 'Practicar manejo de objeciones',
    'improve closing techniques': 'Mejorar técnicas de cierre',
    'build better rapport': 'Construir mejor rapport',
    'enhance listening skills': 'Mejorar habilidades de escucha',
    'develop stronger relationships': 'Desarrollar relaciones más fuertes',
    'focus on customer needs': 'Enfocarse en necesidades del cliente',
    'improve follow-up process': 'Mejorar proceso de seguimiento',
    'work on presentation skills': 'Trabajar en habilidades de presentación',
    'enhance questioning techniques': 'Mejorar técnicas de cuestionamiento',
    'develop closing confidence': 'Desarrollar confianza en el cierre',
    'improve objection responses': 'Mejorar respuestas a objeciones',
    'build trust with prospects': 'Construir confianza con prospectos',
    'enhance product demonstrations': 'Mejorar demostraciones de producto',
    'improve time management': 'Mejorar gestión del tiempo',
    'develop negotiation skills': 'Desarrollar habilidades de negociación',
    'enhance customer service': 'Mejorar servicio al cliente',
    
    // Specific feedback sentences
    'good opening approach': 'Buen enfoque de apertura',
    'consider personalizing your introductions more': 'Considera personalizar más tus presentaciones',
    'ask more probing questions': 'Haz más preguntas exploratorias',
    'understand customer needs better': 'entender mejor las necesidades del cliente',
    'clear presentation style': 'Estilo de presentación claro',
    'work on adapting to different customer types': 'Trabaja en adaptarte a diferentes tipos de clientes',
    'address objections directly': 'Aborda las objeciones directamente',
    'practice common objection responses': 'Practica respuestas comunes a objeciones',
    'be more direct with closing attempts': 'Sé más directo con los intentos de cierre',
    'practice assumptive closing techniques': 'Practica técnicas de cierre asumptivo',
    'excellent rapport building': 'Excelente construcción de rapport',
    'strong product knowledge': 'Fuerte conocimiento del producto',
    'needs improvement in discovery': 'Necesita mejora en descubrimiento',
    'good listening skills': 'Buenas habilidades de escucha',
    'improve questioning techniques': 'Mejorar técnicas de cuestionamiento',
    'enhance closing confidence': 'Mejorar confianza en el cierre',
    'work on objection handling': 'Trabajar en manejo de objeciones',
    'develop stronger relationships': 'Desarrollar relaciones más fuertes',
    'focus on customer pain points': 'Enfocarse en puntos de dolor del cliente',
    'improve follow-up consistency': 'Mejorar consistencia en seguimiento',
    
    // Complete feedback sentences
    'good opening approach. consider personalizing your introductions more': 'Buen enfoque de apertura. Considera personalizar más tus presentaciones',
    'ask more probing questions to understand customer needs better': 'Haz más preguntas exploratorias para entender mejor las necesidades del cliente',
    'clear presentation style. work on adapting to different customer types': 'Estilo de presentación claro. Trabaja en adaptarte a diferentes tipos de clientes',
    'address objections directly. practice common objection responses': 'Aborda las objeciones directamente. Practica respuestas comunes a objeciones',
    'be more direct with closing attempts. practice assumptive closing techniques': 'Sé más directo con los intentos de cierre. Practica técnicas de cierre asumptivo'
  },
  ru: {
    'strengths': 'Сильные стороны',
    'improvements': 'Области для улучшения',
    'opening': 'Открытие',
    'discovery': 'Исследование',
    'presentation': 'Презентация',
    'objection handling': 'Работа с возражениями',
    'closing': 'Закрытие',
    'personality insights': 'Анализ личности',
    'communication style': 'Стиль общения',
    'recommended focus': 'Рекомендуемый фокус',
    'next steps': 'Следующие шаги',
    
    // Sales feedback phrases
    'clear introductions': 'Четкие представления',
    'good product offering': 'Хорошее предложение продукта',
    'willingness to engage': 'Готовность к взаимодействию',
    'professional approach': 'Профессиональный подход',
    'good listening skills': 'Хорошие навыки слушания',
    'clear communication': 'Четкое общение',
    'effective questioning': 'Эффективное задавание вопросов',
    'strong closing': 'Сильное закрытие',
    'handles objections well': 'Хорошо работает с возражениями',
    'builds rapport': 'Строит раппорт',
    
    // Improvement areas
    'needs better discovery': 'Нужно лучшее исследование',
    'improve presentation skills': 'Улучшить навыки презентации',
    'work on closing techniques': 'Работать над техниками закрытия',
    'enhance objection handling': 'Улучшить работу с возражениями',
    'develop better questions': 'Разработать лучшие вопросы',
    'improve active listening': 'Улучшить активное слушание',
    'build stronger relationships': 'Строить более крепкие отношения',
    'focus on customer needs': 'Фокусироваться на потребностях клиента',
    'improve follow-up': 'Улучшить последующую работу',
    'enhance product knowledge': 'Улучшить знание продукта',
    
    // Stage ratings feedback
    'excellent opening': 'Отличное открытие',
    'good opening': 'Хорошее открытие',
    'needs improvement in opening': 'Нужно улучшение в открытии',
    'strong discovery phase': 'Сильная фаза исследования',
    'good discovery': 'Хорошее исследование',
    'weak discovery': 'Слабое исследование',
    'compelling presentation': 'Убедительная презентация',
    'good presentation': 'Хорошая презентация',
    'needs better presentation': 'Нужна лучшая презентация',
    'excellent objection handling': 'Отличная работа с возражениями',
    'good objection handling': 'Хорошая работа с возражениями',
    'poor objection handling': 'Плохая работа с возражениями',
    'strong closing': 'Сильное закрытие',
    'good closing': 'Хорошее закрытие',
    'weak closing': 'Слабое закрытие',
    
    // AI Analysis terms
    'personality analysis': 'Анализ личности',
    'communication analysis': 'Анализ общения',
    'sales technique analysis': 'Анализ техники продаж',
    'recommendations': 'Рекомендации',
    'action items': 'Пункты действий',
    'development areas': 'Области развития',
    'strengths to leverage': 'Сильные стороны для использования',
    'areas for growth': 'Области для роста',
    'skill development': 'Развитие навыков',
    'performance improvement': 'Улучшение производительности',
    
    // Specific feedback content
    'professional communication': 'Профессиональное общение',
    'good product knowledge': 'Хорошее знание продукта',
    'respectful approach': 'Уважительный подход',
    'ask more discovery questions': 'Задавать больше вопросов для исследования',
    'practice objection handling': 'Практиковать работу с возражениями',
    'improve closing techniques': 'Улучшить техники закрытия',
    'build better rapport': 'Строить лучший раппорт',
    'enhance listening skills': 'Улучшить навыки слушания',
    'develop stronger relationships': 'Развивать более крепкие отношения',
    'focus on customer needs': 'Фокусироваться на потребностях клиента',
    'improve follow-up process': 'Улучшить процесс последующей работы',
    'work on presentation skills': 'Работать над навыками презентации',
    'enhance questioning techniques': 'Улучшить техники задавания вопросов',
    'develop closing confidence': 'Развивать уверенность в закрытии',
    'improve objection responses': 'Улучшить ответы на возражения',
    'build trust with prospects': 'Строить доверие с потенциальными клиентами',
    'enhance product demonstrations': 'Улучшить демонстрации продукта',
    'improve time management': 'Улучшить управление временем',
    'develop negotiation skills': 'Развивать навыки переговоров',
    'enhance customer service': 'Улучшить обслуживание клиентов',
    
    // Specific feedback sentences
    'good opening approach': 'Хороший подход к открытию',
    'consider personalizing your introductions more': 'Рассмотрите возможность более персонализированных представлений',
    'ask more probing questions': 'Задавайте больше зондирующих вопросов',
    'understand customer needs better': 'лучше понимать потребности клиента',
    'clear presentation style': 'Четкий стиль презентации',
    'work on adapting to different customer types': 'Работайте над адаптацией к разным типам клиентов',
    'address objections directly': 'Обращайтесь к возражениям напрямую',
    'practice common objection responses': 'Практикуйте общие ответы на возражения',
    'be more direct with closing attempts': 'Будьте более прямыми в попытках закрытия',
    'practice assumptive closing techniques': 'Практикуйте предположительные техники закрытия',
    'excellent rapport building': 'Отличное построение раппорта',
    'strong product knowledge': 'Сильное знание продукта',
    'needs improvement in discovery': 'Нужно улучшение в исследовании',
    'good listening skills': 'Хорошие навыки слушания',
    'improve questioning techniques': 'Улучшить техники задавания вопросов',
    'enhance closing confidence': 'Улучшить уверенность в закрытии',
    'work on objection handling': 'Работать над обработкой возражений',
    'develop stronger relationships': 'Развивать более крепкие отношения',
    'focus on customer pain points': 'Фокусироваться на болевых точках клиента',
    'improve follow-up consistency': 'Улучшить последовательность последующей работы',
    
    // Complete feedback sentences
    'good opening approach. consider personalizing your introductions more': 'Хороший подход к открытию. Рассмотрите возможность более персонализированных представлений',
    'ask more probing questions to understand customer needs better': 'Задавайте больше зондирующих вопросов, чтобы лучше понимать потребности клиента',
    'clear presentation style. work on adapting to different customer types': 'Четкий стиль презентации. Работайте над адаптацией к разным типам клиентов',
    'address objections directly. practice common objection responses': 'Обращайтесь к возражениям напрямую. Практикуйте общие ответы на возражения',
    'be more direct with closing attempts. practice assumptive closing techniques': 'Будьте более прямыми в попытках закрытия. Практикуйте предположительные техники закрытия'
  }
};

class MultiLanguageTranslationService {
  constructor() {
    this.supportedLanguages = ['et', 'es', 'ru'];
    this.translationCache = {};
    this.aiTranslationCache = {}; // Cache for AI translations
    this.offlineMode = false; // When true, use only static translations
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      isOpen: false,
      threshold: 5, // Open circuit after 5 failures
      timeout: 300000 // 5 minutes timeout
    };
  }

  /**
   * Generate translations for all supported languages
   */
  async generateAllTranslations(summaryData) {
    const translations = {};

    for (const language of this.supportedLanguages) {
      try {
        translations[language] = await this.translateSummaryForLanguage(summaryData, language);
      } catch (error) {
        console.error(`Error translating to ${language}:`, error);
        // Continue with other languages even if one fails
        translations[language] = null;
      }
    }

    return translations;
  }

  /**
   * Translate summary content for a specific language using AI
   */
  async translateSummaryForLanguage(summaryData, language) {
    const languageNames = {
      'et': 'Estonian',
      'es': 'Spanish', 
      'ru': 'Russian'
    };

    const languageName = languageNames[language];
    
    const translatedSummary = {
      strengths: [],
      improvements: [],
      stageRatings: {},
      aiAnalysis: {}
    };

    try {
      // Translate strengths
      if (summaryData.strengths && Array.isArray(summaryData.strengths)) {
        translatedSummary.strengths = await this.translateArrayWithAI(summaryData.strengths, languageName);
      }

      // Translate improvements
      if (summaryData.improvements && Array.isArray(summaryData.improvements)) {
        translatedSummary.improvements = await this.translateArrayWithAI(summaryData.improvements, languageName);
      }

      // Translate stage ratings
      if (summaryData.stageRatings) {
        translatedSummary.stageRatings = {};
        
        for (const [stage, stageRating] of Object.entries(summaryData.stageRatings)) {
          if (stageRating) {
            translatedSummary.stageRatings[stage] = {
              rating: stageRating.rating, // Keep rating as number
              feedback: await this.translateTextWithAI(stageRating.feedback, languageName)
            };
          }
        }
      }

      // Translate AI analysis
      if (summaryData.aiAnalysis) {
        translatedSummary.aiAnalysis = {
          personalityInsights: await this.translateTextWithAI(summaryData.aiAnalysis.personalityInsights, languageName),
          communicationStyle: await this.translateTextWithAI(summaryData.aiAnalysis.communicationStyle, languageName),
          recommendedFocus: summaryData.aiAnalysis.recommendedFocus ? 
            await this.translateArrayWithAI(summaryData.aiAnalysis.recommendedFocus, languageName) : [],
          nextSteps: summaryData.aiAnalysis.nextSteps ? 
            await this.translateArrayWithAI(summaryData.aiAnalysis.nextSteps, languageName) : []
        };
      }

      return translatedSummary;
    } catch (error) {
      console.error(`Error translating to ${languageName}:`, error);
      throw error;
    }
  }

  /**
   * Get translations for a specific language
   */
  async getTranslationsForLanguage(language) {
    // Check cache first
    if (this.translationCache[language]) {
      return this.translationCache[language];
    }

    try {
      // Get all active translation keys with their translations
      const translations = await TranslationKey.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'translations',
            let: { keyId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$translationKey', '$$keyId'] },
                      { $eq: ['$language', language] },
                      { $eq: ['$isActive', true] }
                    ]
                  }
                }
              }
            ],
            as: 'translation'
          }
        },
        {
          $project: {
            key: 1,
            text: { $arrayElemAt: ['$translation.text', 0] }
          }
        }
      ]);

      // Convert to object format for easy lookup
      const translationObject = {};
      translations.forEach(item => {
        if (item.text) {
          translationObject[item.key] = item.text;
        }
      });

      // Cache the translations
      this.translationCache[language] = translationObject;
      
      return translationObject;
    } catch (error) {
      console.error(`Error fetching translations for ${language}:`, error);
      return {};
    }
  }

  /**
   * Translate a single text using AI with retry logic and static fallback
   */
  async translateTextWithAI(text, targetLanguage, maxRetries = 3) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // First try static translation for common terms
    const staticTranslation = this.getStaticTranslation(text, targetLanguage);
    if (staticTranslation !== text) {
      return staticTranslation;
    }

    // Check cache first
    const cachedTranslation = this.getCachedTranslation(text, targetLanguage);
    if (cachedTranslation) {
      return cachedTranslation;
    }

    // Check if offline mode is enabled
    if (this.offlineMode) {
      console.log(`Offline mode enabled for ${targetLanguage}. Using original text.`);
      return text;
    }

    // Check if circuit breaker is open
    if (this.isCircuitBreakerOpen()) {
      console.log(`Circuit breaker is open for ${targetLanguage}. Using original text.`);
      return text;
    }

    const languageNames = {
      'et': 'Estonian',
      'es': 'Spanish', 
      'ru': 'Russian'
    };

    const languageName = languageNames[targetLanguage];

    // If no static translation available, try AI
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${languageName}. Maintain the same tone, style, and meaning. Return only the translated text without any explanations or additional formatting.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        const translation = response.data.choices[0].message.content.trim();
        
        // Cache the translation
        this.cacheTranslation(text, targetLanguage, translation);
        
        // Success - reset circuit breaker
        this.recordSuccess();
        return translation;
      } catch (error) {
        console.error(`AI translation error for ${targetLanguage} (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (error.response?.status === 429) {
          // Rate limited - record failure and wait longer before retry
          this.recordFailure();
          const waitTime = Math.pow(2, attempt) * 2000; // Exponential backoff: 4s, 8s, 16s
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt === maxRetries) {
          // Final attempt failed - record failure and return original text
          this.recordFailure();
          console.error(`Final attempt failed for ${targetLanguage}. Using original text.`);
          return text;
        } else {
          // Other error - record failure, wait a bit and retry
          this.recordFailure();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    return text; // Fallback
  }

  /**
   * Get static translation for common terms with smart matching
   */
  getStaticTranslation(text, targetLanguage) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    const lowerText = text.toLowerCase().trim();
    const translations = staticTranslations[targetLanguage];
    
    if (!translations) {
      return text;
    }

    // Try exact match first (case-sensitive)
    if (translations[text]) {
      console.log(`Server: Found exact match for "${text}" -> "${translations[text]}"`);
      return translations[text];
    }

    // Try exact match (case-insensitive)
    if (translations[lowerText]) {
      console.log(`Server: Found case-insensitive exact match for "${text}" -> "${translations[lowerText]}"`);
      return translations[lowerText];
    }

    // Try case-insensitive exact match by iterating
    for (const [key, translation] of Object.entries(translations)) {
      if (key.toLowerCase() === lowerText) {
        console.log(`Server: Found case-insensitive exact match for "${text}" -> "${translation}"`);
        return translation;
      }
    }

    // Only if no exact match found, try partial matches
    let translatedText = text;
    let hasTranslation = false;
    
    for (const [key, translation] of Object.entries(translations)) {
      const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(translatedText)) {
        translatedText = translatedText.replace(regex, translation);
        hasTranslation = true;
        console.log(`Server: Partial match "${key}" -> "${translation}" in "${text}"`);
      }
    }

    if (hasTranslation) {
      console.log(`Server: Translation result: "${text}" -> "${translatedText}"`);
    } else {
      console.log(`Server: No translation found for: "${text}"`);
    }

    return hasTranslation ? translatedText : text;
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitBreakerOpen() {
    if (!this.circuitBreaker.isOpen) {
      return false;
    }

    // Check if timeout has passed
    const now = Date.now();
    if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
      // Reset circuit breaker
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      console.log('Circuit breaker reset - attempting AI translation again');
      return false;
    }

    return true;
  }

  /**
   * Record a failure in the circuit breaker
   */
  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      console.log(`Circuit breaker opened after ${this.circuitBreaker.failures} failures. Using static translations only.`);
    }
  }

  /**
   * Record a success in the circuit breaker
   */
  recordSuccess() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.isOpen = false;
  }

  /**
   * Manually reset the circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.lastFailureTime = null;
    console.log('Circuit breaker manually reset');
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      isOpen: this.circuitBreaker.isOpen,
      failures: this.circuitBreaker.failures,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      timeUntilReset: this.circuitBreaker.isOpen ? 
        Math.max(0, this.circuitBreaker.timeout - (Date.now() - this.circuitBreaker.lastFailureTime)) : 0
    };
  }

  /**
   * Enable offline mode (static translations only)
   */
  enableOfflineMode() {
    this.offlineMode = true;
    console.log('Offline mode enabled - using static translations only');
  }

  /**
   * Disable offline mode (allow AI translations)
   */
  disableOfflineMode() {
    this.offlineMode = false;
    console.log('Offline mode disabled - AI translations allowed');
  }

  /**
   * Get offline mode status
   */
  isOfflineMode() {
    return this.offlineMode;
  }

  /**
   * Translate an array of texts using AI with batch processing
   */
  async translateArrayWithAI(texts, targetLanguage) {
    if (!texts || !Array.isArray(texts)) {
      return texts;
    }

    // Check if offline mode is enabled
    if (this.offlineMode) {
      console.log(`Offline mode enabled for ${targetLanguage}. Using original texts.`);
      return texts;
    }

    // Check if circuit breaker is open
    if (this.isCircuitBreakerOpen()) {
      console.log(`Circuit breaker is open for ${targetLanguage}. Using original texts.`);
      return texts;
    }

    // Try to batch translate multiple texts in one API call
    try {
      const batchSize = 3; // Translate 3 texts at once
      const translatedTexts = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        try {
          const batchTranslated = await this.translateBatchWithAI(batch, targetLanguage);
          translatedTexts.push(...batchTranslated);
          
          // Add delay between batches
          if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay between batches
          }
        } catch (error) {
          console.error(`Error translating batch to ${targetLanguage}:`, error);
          // Fallback to individual translation for this batch
          for (const text of batch) {
            const translated = await this.translateTextWithAI(text, targetLanguage);
            translatedTexts.push(translated);
          }
        }
      }
      
      return translatedTexts;
    } catch (error) {
      console.error(`Error in batch translation for ${targetLanguage}:`, error);
      return texts; // Return original texts as fallback
    }
  }

  /**
   * Translate a batch of texts in a single API call
   */
  async translateBatchWithAI(texts, targetLanguage, maxRetries = 2) {
    if (!texts || texts.length === 0) {
      return texts;
    }

    // Check if offline mode is enabled
    if (this.offlineMode) {
      return texts;
    }

    // Check if circuit breaker is open
    if (this.isCircuitBreakerOpen()) {
      return texts;
    }

    const languageNames = {
      'et': 'Estonian',
      'es': 'Spanish', 
      'ru': 'Russian'
    };

    const languageName = languageNames[targetLanguage];
    const batchText = texts.join('\n---SEPARATOR---\n');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following texts to ${languageName}. Each text is separated by "---SEPARATOR---". Maintain the same tone, style, and meaning for each text. Return the translations in the same order, separated by "---SEPARATOR---". Return only the translated texts without any explanations or additional formatting.`
            },
            {
              role: 'user',
              content: batchText
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        const translatedBatch = response.data.choices[0].message.content.trim();
        const translatedTexts = translatedBatch.split('---SEPARATOR---').map(text => text.trim());
        
        // Ensure we have the same number of translations as inputs
        if (translatedTexts.length === texts.length) {
          this.recordSuccess();
          return translatedTexts;
        } else {
          throw new Error(`Translation count mismatch: expected ${texts.length}, got ${translatedTexts.length}`);
        }
      } catch (error) {
        console.error(`Batch translation error for ${languageName} (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (error.response?.status === 429) {
          this.recordFailure();
          const waitTime = Math.pow(2, attempt) * 3000; // Longer delays for batch requests
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt === maxRetries) {
          this.recordFailure();
          console.error(`Final batch attempt failed for ${languageName}. Using original texts.`);
          return texts;
        } else {
          this.recordFailure();
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    return texts; // Fallback
  }

  /**
   * Get cached AI translation
   */
  getCachedTranslation(text, targetLanguage) {
    const cacheKey = `${targetLanguage}:${text}`;
    return this.aiTranslationCache[cacheKey];
  }

  /**
   * Cache AI translation
   */
  cacheTranslation(text, targetLanguage, translation) {
    const cacheKey = `${targetLanguage}:${text}`;
    this.aiTranslationCache[cacheKey] = translation;
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache = {};
    this.aiTranslationCache = {};
  }

  /**
   * Clear cache for a specific language
   */
  clearCacheForLanguage(language) {
    delete this.translationCache[language];
  }

  /**
   * Translate dynamic AI-generated content using Google Translate
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @param {string} context - Context for better translation
   * @returns {Promise<string>} Translated text
   */
  async translateDynamicContent(text, targetLanguage, context = 'general') {
    if (!text || targetLanguage === 'en') {
      return text;
    }

    // For AI-generated content (personality insights, communication style, etc.), 
    // skip static translations and use Google Translate for full sentence translation
    const aiContentContexts = ['sales_feedback', 'personalityInsights', 'communicationStyle', 'recommendedFocus', 'nextSteps', 'strength_comment', 'improvement_suggestion', 'stage_rating'];
    
    if (aiContentContexts.includes(context)) {
      console.log(`Using Google Translate for AI content: "${text}" (${targetLanguage}, context: ${context})`);
      try {
        const result = await googleTranslateService.translateWithContext(text, targetLanguage, context);
        console.log(`Google Translate result: "${text}" -> "${result}"`);
        return result;
      } catch (error) {
        console.error('Google Translate error:', error);
        return text; // Return original text on error
      }
    }

    // For other content, first try static translations for common terms
    const staticTranslation = this.getStaticTranslation(text, targetLanguage);
    if (staticTranslation !== text) {
      console.log(`Using static translation for dynamic content: "${text}" -> "${staticTranslation}"`);
      return staticTranslation;
    }

    // For other content that's not in static translations, use Google Translate
    console.log(`Using Google Translate for dynamic content: "${text}" (${targetLanguage})`);
    try {
      const result = await googleTranslateService.translateWithContext(text, targetLanguage, context);
      console.log(`Google Translate result: "${text}" -> "${result}"`);
      return result;
    } catch (error) {
      console.error('Google Translate error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Translate stage feedback with sales context
   * @param {string} feedback - Stage feedback text
   * @param {string} targetLanguage - Target language
   * @returns {Promise<string>} Translated feedback
   */
  async translateStageFeedback(feedback, targetLanguage) {
    return await this.translateDynamicContent(feedback, targetLanguage, 'stage_rating');
  }

  /**
   * Translate AI analysis content with appropriate context
   * @param {string} content - AI analysis content
   * @param {string} targetLanguage - Target language
   * @param {string} analysisType - Type of analysis (personalityInsights, communicationStyle, etc.)
   * @returns {Promise<string>} Translated content
   */
  async translateAiAnalysis(content, targetLanguage, analysisType = 'general') {
    const contextMap = {
      'personalityInsights': 'sales_feedback',
      'communicationStyle': 'sales_feedback',
      'recommendedFocus': 'improvement_suggestion',
      'nextSteps': 'improvement_suggestion'
    };

    const context = contextMap[analysisType] || 'general';
    return await this.translateDynamicContent(content, targetLanguage, context);
  }
}

module.exports = new MultiLanguageTranslationService();
