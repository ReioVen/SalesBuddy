import axios from 'axios';

// Force the correct API URL to override any environment variable that might be set incorrectly
const API_BASE_URL = 'https://api.salesbuddy.pro';

export type Language = 'en' | 'et' | 'es' | 'ru' | 'lv' | 'lt' | 'fi' | 'sv' | 'no' | 'da' | 'de' | 'fr' | 'it' | 'pt' | 'pl' | 'cs' | 'sk' | 'hu' | 'ro' | 'bg' | 'hr' | 'sl' | 'el' | 'tr' | 'ar' | 'he' | 'ja' | 'ko' | 'zh' | 'hi' | 'th' | 'vi' | 'id' | 'ms' | 'tl';

interface TranslationResponse {
  language: string;
  translations: { [key: string]: string };
  count: number;
}

// Comprehensive static translations for when database fails
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
    
    // Additional common phrases
    'improving clarity of communication': 'Suhtluse selguse parandamine',
    'sales process understanding': 'Müügiprotsessi mõistmine',
    'assertiveness': 'Enesekindlus',
    'practice opening statements': 'Harjuta avamise väiteid',
    'learn about discovery techniques': 'Õpi avastamise tehnikaid',
    'study closing techniques': 'Uuri sulgemise tehnikaid',
    
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
    
    // AI Insights specific content
    'professional and respectful communication style': 'Professionaalne ja lugupidav suhtlemisstiil',
    'professional and respectful suhtlemisstiil': 'Professionaalne ja lugupidav suhtlemisstiil',
    'professional and respectful': 'Professionaalne ja lugupidav',
    'clear and direct approach': 'Selge ja otsene lähenemine',
    'clear and direct': 'Selge ja otsene',
    'discovery questions': 'Avastamise küsimused',
    'practice discovery techniques': 'Harjuta avastamise tehnikaid',
    'study objection responses': 'Õpi vastuväidetele vastama',
    'work on closing skills': 'Tööta sulgemise oskuste kallal',
    'work on': 'Tööta',
    'closing skills': 'sulgemise oskuste kallal',
    
    // Specific feedback content
    'professional communication': 'Professionaalne suhtlus',
    'good product knowledge': 'Hea toote tundmine',
    'respectful approach': 'Väärikas lähenemine',
    'ask more discovery questions': 'Küsi rohkem avastamise küsimusi',
    'practice objection handling': 'Harjuta vastuväidete käsitlemist',
    'improve closing techniques': 'Paranda sulgemise tehnikaid',
    'build better rapport': 'Ehita paremat kontakti',
    'enhance listening skills': 'Paranda kuulamise oskusi',
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
    'improve questioning techniques': 'Paranda küsimuste esitamise tehnikaid',
    'enhance closing confidence': 'Paranda sulgemise enesekindlust',
    'work on objection handling': 'Tööta vastuväidete käsitlemise kallal',
    
    // Additional common phrases from logs
    'self-introduction': 'Enesetutvustus',
    'product offering': 'Toote pakkumine',
    'discovery questioning': 'Avastamise küsimine',
    'product presentation': 'Toote esitlus',
    'closing techniques': 'Sulgemise tehnikad',
    'discovery skills': 'Avastamise oskused',
    'product knowledge': 'Toote tundmine',
    'learn more about your product': 'Õpi oma tootest rohkem',
    'give detailed descriptions and presentations': 'Anna üksikasjalikke kirjeldusi ja esitlusi',
    'practice closing techniques and asking for the sale': 'Harjuta sulgemise tehnikaid ja müügi küsimist',
    'good use of language': 'Hea keelekasutus',
    'discovery phase': 'Avastamise faas',
    'presentation of products': 'Toodete esitlus',
    'closing technique': 'Sulgemise tehnika',
    'presentation skills': 'Esitluse oskused',
    'prepare detailed product information': 'Valmista üksikasjalik tooteinfo ette',
    'develop responses for common objections': 'Arenda vastuseid tavalistele vastuväidetele',
    'learn and practice closing techniques': 'Õpi ja harjuta sulgemise tehnikaid',
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
    
    // AI Insights specific content
    'professional and respectful communication style': 'Estilo de comunicación profesional y respetuoso',
    'clear and direct approach': 'Enfoque claro y directo',
    'discovery questions': 'Preguntas de descubrimiento',
    'practice discovery techniques': 'Practicar técnicas de descubrimiento',
    'study objection responses': 'Estudiar respuestas a objeciones',
    'work on closing skills': 'Trabajar en habilidades de cierre',
    
    // Specific feedback content
    'professional communication': 'Comunicación profesional',
    'good product knowledge': 'Buen conocimiento del producto',
    'respectful approach': 'Enfoque respetuoso',
    'ask more discovery questions': 'Hacer más preguntas de descubrimiento',
    'practice objection handling': 'Practicar manejo de objeciones',
    'improve closing techniques': 'Mejorar técnicas de cierre',
    'build better rapport': 'Construir mejor rapport',
    'enhance listening skills': 'Mejorar habilidades de escucha',
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
    'improve questioning techniques': 'Mejorar técnicas de cuestionamiento',
    'enhance closing confidence': 'Mejorar confianza en el cierre',
    
    // Additional common phrases from logs
    'self-introduction': 'Autopresentación',
    'product offering': 'Oferta de producto',
    'discovery questioning': 'Cuestionamiento de descubrimiento',
    'product presentation': 'Presentación de producto',
    'closing techniques': 'Técnicas de cierre',
    'discovery skills': 'Habilidades de descubrimiento',
    'product knowledge': 'Conocimiento del producto',
    'learn more about your product': 'Aprende más sobre tu producto',
    'give detailed descriptions and presentations': 'Dar descripciones detalladas y presentaciones',
    'practice closing techniques and asking for the sale': 'Practica técnicas de cierre y pide la venta',
    'good use of language': 'Buen uso del lenguaje',
    'discovery phase': 'Fase de descubrimiento',
    'presentation of products': 'Presentación de productos',
    'closing technique': 'Técnica de cierre',
    'presentation skills': 'Habilidades de presentación',
    'practice asking open-ended questions': 'Practica hacer preguntas abiertas',
    'prepare detailed product information': 'Prepara información detallada del producto',
    'develop responses for common objections': 'Desarrolla respuestas para objeciones comunes',
    'learn and practice closing techniques': 'Aprende y practica técnicas de cierre',
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

class DatabaseTranslationService {
  private cache: { [language: string]: { [key: string]: string } } = {};
  private cacheTimestamp: { [language: string]: number } = {};
  private translationCache: { [key: string]: string } = {}; // Cache for dynamic translations
  private lastTranslationRequest = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private batchTranslationInProgress: { [language: string]: boolean } = {}; // Prevent concurrent batch translations

  /**
   * Get all translations for a specific language
   */
  async getTranslations(language: Language): Promise<{ [key: string]: string }> {
    // Check cache first
    if (this.isCacheValid(language)) {
      return this.cache[language];
    }

    try {
      const response = await axios.get<TranslationResponse>(`${API_BASE_URL}/api/translations/${language}`, {
        withCredentials: true
      });
      const translations = response.data.translations;

      // Update cache
      this.cache[language] = translations;
      this.cacheTimestamp[language] = Date.now();

      return translations;
    } catch (error) {
      console.error('Error fetching translations from database:', error);
      
      // Return static translations as fallback
      return staticTranslations[language] || {};
    }
  }

  /**
   * Translate a single text using database translations
   */
  async translateText(text: string, language: Language): Promise<string> {
    if (language === 'en') {
      return text;
    }

    const translations = await this.getTranslations(language);
    
    // Try to find exact match first
    if (translations[text]) {
      return translations[text];
    }

    // Try to find partial matches for common patterns
    let translatedText = text;
    
    // Replace common patterns
    for (const [key, translation] of Object.entries(translations)) {
      // Case-insensitive replacement
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      translatedText = translatedText.replace(regex, translation);
    }

    return translatedText;
  }

  /**
   * Translate an array of texts
   */
  async translateArray(texts: string[], language: Language): Promise<string[]> {
    if (language === 'en' || !texts || texts.length === 0) {
      return texts;
    }

    const translations = await this.getTranslations(language);
    const results: string[] = [];

    for (const text of texts) {
      let translatedText = text;
      
      // Try exact match first
      if (translations[text]) {
        translatedText = translations[text];
      } else {
        // Try partial matches
        for (const [key, translation] of Object.entries(translations)) {
          const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          translatedText = translatedText.replace(regex, translation);
        }
      }

      results.push(translatedText);
    }

    return results;
  }

  /**
   * Translate conversation summary content (synchronous version)
   */
  translateSummaryContentSync(summary: any, language: Language): any {
    if (language === 'en') {
      return summary;
    }

    // Get cached translations synchronously, fallback to static translations
    const translations = this.cache[language] || staticTranslations[language] || {};
    
    const translatedSummary = { ...summary };

    // Translate strengths
    if (summary.strengths && Array.isArray(summary.strengths)) {
      console.log('Translating strengths:', summary.strengths);
      translatedSummary.strengths = summary.strengths.map(text => {
        const translated = this.translateTextSync(text, language, translations);
        console.log(`Strength translation: "${text}" -> "${translated}"`);
        return translated;
      });
      console.log('Translated strengths:', translatedSummary.strengths);
    }

    // Translate improvements
    if (summary.improvements && Array.isArray(summary.improvements)) {
      console.log('Translating improvements:', summary.improvements);
      translatedSummary.improvements = summary.improvements.map(text => {
        const translated = this.translateTextSync(text, language, translations);
        console.log(`Improvement translation: "${text}" -> "${translated}"`);
        return translated;
      });
      console.log('Translated improvements:', translatedSummary.improvements);
    }

    // Translate stage ratings feedback
    if (summary.stageRatings) {
      translatedSummary.stageRatings = {};
      for (const [stage, rating] of Object.entries(summary.stageRatings)) {
        translatedSummary.stageRatings[stage] = {
          ...rating,
          feedback: this.translateTextSync(rating.feedback, language, translations)
        };
      }
    }

    // Translate AI analysis
    if (summary.aiAnalysis) {
      const translatedAiAnalysis = { ...summary.aiAnalysis };
      
      if (translatedAiAnalysis.personalityInsights) {
        translatedAiAnalysis.personalityInsights = this.translateTextSync(
          translatedAiAnalysis.personalityInsights, 
          language,
          translations
        );
      }
      
      if (translatedAiAnalysis.communicationStyle) {
        translatedAiAnalysis.communicationStyle = this.translateTextSync(
          translatedAiAnalysis.communicationStyle, 
          language,
          translations
        );
      }
      
      if (translatedAiAnalysis.recommendedFocus && Array.isArray(translatedAiAnalysis.recommendedFocus)) {
        translatedAiAnalysis.recommendedFocus = translatedAiAnalysis.recommendedFocus.map(
          text => this.translateTextSync(text, language, translations)
        );
      }
      
      if (translatedAiAnalysis.nextSteps && Array.isArray(translatedAiAnalysis.nextSteps)) {
        translatedAiAnalysis.nextSteps = translatedAiAnalysis.nextSteps.map(
          text => this.translateTextSync(text, language, translations)
        );
      }
      
      translatedSummary.aiAnalysis = translatedAiAnalysis;
    }

    return translatedSummary;
  }

  /**
   * Public synchronous text translation using static translations
   */
  public translateTextSyncPublic(text: string, language: Language): string {
    if (!text || language === 'en') {
      return text;
    }

    console.log(`Translating: "${text}" to ${language}`);

    // For longer sentences (more than 50 characters), return as-is and trigger async translation
    if (text.length > 50) {
      console.log(`Long text detected (${text.length} chars), triggering Google Translate`);
      // Trigger async translation for future use
      this.translateLongTextAsync(text, language);
      return text; // Return original for now
    }

    // Try exact match in static translations
    if (staticTranslations[language] && staticTranslations[language][text]) {
      console.log(`Found static exact match for "${text}" -> "${staticTranslations[language][text]}"`);
      return staticTranslations[language][text];
    }

    // Try case-insensitive match
    const lowerText = text.toLowerCase();
    if (staticTranslations[language] && staticTranslations[language][lowerText]) {
      console.log(`Found case-insensitive static exact match for "${text}" -> "${staticTranslations[language][lowerText]}"`);
      return staticTranslations[language][lowerText];
    }

    // Try partial matching for common terms (longest matches first)
    const translations = staticTranslations[language];
    if (translations) {
      // Sort keys by length (longest first) to prioritize longer, more specific matches
      const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
      
      for (const key of sortedKeys) {
        const value = translations[key];
        if (text.toLowerCase().includes(key.toLowerCase())) {
          const result = text.replace(new RegExp(key, 'gi'), value);
          if (result !== text) {
            console.log(`Static partial match: "${key}" -> "${value}" in "${text}"`);
            console.log(`Translation result: "${text}" -> "${result}"`);
            return result;
          }
        }
      }
    }

    console.log(`No translation found for: "${text}"`);
    return text;
  }

  /**
   * Smart translation that uses Google Translate for longer sentences
   */
  public async translateTextSmart(text: string, language: Language): Promise<string> {
    if (!text || language === 'en') {
      return text;
    }

    // For longer sentences, use Google Translate
    if (text.length > 50) {
      return await this.translateLongTextSync(text, language);
    }

    // For shorter text, use static translations
    return this.translateTextSyncPublic(text, language);
  }

  /**
   * Translate longer text using Google Translate asynchronously
   */
  private async translateLongTextAsync(text: string, language: Language): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/dynamic-translation/translate`, {
        text: text,
        targetLanguage: language,
        context: 'sales_feedback'
      }, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.translatedText) {
        console.log(`Google Translate result: "${text}" -> "${response.data.translatedText}"`);
        // Store in cache for future use
        if (!this.cache[language]) {
          this.cache[language] = {};
        }
        this.cache[language][text] = response.data.translatedText;
      }
    } catch (error) {
      console.error('Google Translate error:', error);
    }
  }

  // Rate limiting for Google Translate
  private translationQueue: Array<{text: string, language: Language, resolve: Function, reject: Function}> = [];
  private isProcessingQueue = false;
  private lastTranslationTime = 0;
  private readonly TRANSLATION_DELAY = 1000; // 1 second between requests

  /**
   * Translate longer text using Google Translate with rate limiting
   */
  public async translateLongTextSync(text: string, language: Language): Promise<string> {
    if (!text || language === 'en') {
      return text;
    }

    // Check cache first
    if (this.cache[language] && this.cache[language][text]) {
      return this.cache[language][text];
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/dynamic-translation/translate`, {
        text: text,
        targetLanguage: language,
        context: 'sales_feedback'
      }, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.translatedText) {
        console.log(`Google Translate result: "${text}" -> "${response.data.translatedText}"`);
        // Store in cache for future use
        if (!this.cache[language]) {
          this.cache[language] = {};
        }
        this.cache[language][text] = response.data.translatedText;
        return response.data.translatedText;
      }
    } catch (error) {
      console.error('Google Translate error:', error);
    }

    return text; // Return original if translation fails
  }

  /**
   * Batch translate multiple texts to reduce API calls
   */
  public async batchTranslateTexts(texts: string[], language: Language): Promise<string[]> {
    if (!texts || texts.length === 0 || language === 'en') {
      return texts;
    }

    // Wait if batch translation is already in progress for this language
    while (this.batchTranslationInProgress[language]) {
      console.log(`Batch translation in progress for ${language}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Filter out texts that are already cached
    const uncachedTexts: string[] = [];
    const results: string[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (this.cache[language] && this.cache[language][text]) {
        results[i] = this.cache[language][text];
      } else {
        uncachedTexts.push(text);
        results[i] = text; // Default to original
      }
    }

    // If all texts are cached, return results
    if (uncachedTexts.length === 0) {
      console.log('All texts cached, returning cached results:', results);
      return results;
    }

    // Mark batch translation as in progress
    this.batchTranslationInProgress[language] = true;

    try {
      // Batch translate uncached texts
      console.log('Batch translation request:', {
        textsCount: uncachedTexts.length,
        targetLanguage: language,
        usingCookies: true
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/dynamic-translation/batch-translate`, {
        texts: uncachedTexts,
        targetLanguage: language,
        context: 'sales_feedback'
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Batch translation response:', {
        success: response.data.success,
        translationsCount: response.data.translations ? response.data.translations.length : 0,
        method: response.data.method,
        firstTranslation: response.data.translations ? response.data.translations[0] : 'none'
      });
      
      if (response.data.success && response.data.translations) {
        // Update cache and results
        let uncachedIndex = 0;
        for (let i = 0; i < texts.length; i++) {
          if (!this.cache[language] || !this.cache[language][texts[i]]) {
            const translatedText = response.data.translations[uncachedIndex];
            console.log(`Updating cache for "${texts[i]}" -> "${translatedText}"`);
            if (translatedText) {
              if (!this.cache[language]) {
                this.cache[language] = {};
              }
              this.cache[language][texts[i]] = translatedText;
              results[i] = translatedText;
            }
            uncachedIndex++;
          }
        }
        console.log('Final results after cache update:', results);
      }
    } catch (error) {
      console.error('Batch translation error:', error);
      // Return original texts if translation fails
    } finally {
      // Mark batch translation as complete
      this.batchTranslationInProgress[language] = false;
    }

    return results;
  }

  /**
   * Synchronous text translation using cached translations
   */
  private translateTextSync(text: string, language: Language, translations: { [key: string]: string }): string {
    if (!text || language === 'en') {
      return text;
    }

    // First, try exact match in cache
    if (translations[text]) {
      console.log(`Found exact match for "${text}" -> "${translations[text]}"`);
      return translations[text];
    }

    // Then try exact match in static translations
    if (staticTranslations[language] && staticTranslations[language][text]) {
      console.log(`Found static exact match for "${text}" -> "${staticTranslations[language][text]}"`);
      return staticTranslations[language][text];
    }

    // Debug: Check if the text exists in static translations
    if (staticTranslations[language]) {
      const staticKeys = Object.keys(staticTranslations[language]);
      const matchingKeys = staticKeys.filter(key => key.toLowerCase() === text.toLowerCase());
      if (matchingKeys.length > 0) {
        console.log(`Found case-insensitive match in static translations:`, matchingKeys);
      } else {
        console.log(`No exact match found in static translations for: "${text}"`);
        console.log(`Available keys containing similar text:`, staticKeys.filter(key => key.includes(text.substring(0, 10))));
      }
    }

    // Try case-insensitive exact match in static translations
    if (staticTranslations[language]) {
      const staticTranslationsForLang = staticTranslations[language];
      const lowerText = text.toLowerCase();
      
      for (const [key, translation] of Object.entries(staticTranslationsForLang)) {
        if (key.toLowerCase() === lowerText) {
          console.log(`Found case-insensitive static exact match for "${text}" -> "${translation}"`);
          return translation;
        }
      }
    }

    // Only if no exact match found, try partial matches
    let translatedText = text;

    // Try partial matches in cache first
    for (const [key, translation] of Object.entries(translations)) {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (regex.test(translatedText)) {
        translatedText = translatedText.replace(regex, translation);
        console.log(`Partial match: "${key}" -> "${translation}" in "${text}"`);
      }
    }

    // Try partial matches in static translations
    if (staticTranslations[language]) {
      const staticTranslationsForLang = staticTranslations[language];
      
      for (const [key, translation] of Object.entries(staticTranslationsForLang)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (regex.test(translatedText)) {
          translatedText = translatedText.replace(regex, translation);
          console.log(`Static partial match: "${key}" -> "${translation}" in "${text}"`);
        }
      }
    }

    if (translatedText !== text) {
      console.log(`Translation result: "${text}" -> "${translatedText}"`);
    } else {
      console.log(`No translation found for: "${text}"`);
    }

    return translatedText;
  }

  /**
   * Check if cache is valid for a language
   */
  private isCacheValid(language: Language): boolean {
    if (!this.cache[language] || !this.cacheTimestamp[language]) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - this.cacheTimestamp[language];
    
    return cacheAge < this.CACHE_DURATION;
  }

  /**
   * Clear cache for a specific language or all languages
   */
  clearCache(language?: Language): void {
    if (language) {
      delete this.cache[language];
      delete this.cacheTimestamp[language];
    } else {
      this.cache = {};
      this.cacheTimestamp = {};
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { [language: string]: { count: number; age: number } } {
    const stats: { [language: string]: { count: number; age: number } } = {};
    
    Object.keys(this.cache).forEach(language => {
      const count = Object.keys(this.cache[language]).length;
      const age = this.cacheTimestamp[language] ? Date.now() - this.cacheTimestamp[language] : 0;
      
      stats[language] = { count, age };
    });
    
    return stats;
  }

  /**
   * Force refresh translations for a language
   */
  async forceRefreshTranslations(language: Language) {
    delete this.cache[language];
    delete this.cacheTimestamp[language];
    return await this.getTranslations(language);
  }

  /**
   * Clear cache for a specific language to prevent cross-contamination
   */
  clearLanguageCache(language: Language) {
    delete this.cache[language];
    delete this.cacheTimestamp[language];
    console.log(`Cleared cache for language: ${language}`);
  }

  /**
   * Smart translation function that uses Google Translate for latest conversations
   * and static translations for older conversations
   */
  async translateConversationFeedbackSmart(
    feedback: string, 
    language: Language, 
    conversationIndex: number,
    totalConversations: number
  ): Promise<string> {
    if (!feedback || language === 'en') {
      return feedback;
    }

    // Determine if this is one of the latest 3 conversations
    // Conversations are typically ordered with newest first (index 0 is newest)
    const isLatestConversation = conversationIndex < 3;
    
    console.log(`Translating conversation feedback (index: ${conversationIndex}/${totalConversations}, isLatest: ${isLatestConversation}):`, feedback);

    if (isLatestConversation) {
      // Use Google Translate for latest 3 conversations
      return await this.translateConversationFeedback(feedback, language);
    } else {
      // Use static translations for older conversations
      return this.translateConversationFeedbackStatic(feedback, language);
    }
  }

  /**
   * Translate AI feedback for conversations using Google Translate
   * This is used for the latest 3 conversations to ensure fresh, accurate translations
   */
  async translateConversationFeedback(feedback: string, language: Language): Promise<string> {
    if (!feedback || language === 'en') {
      return feedback;
    }

    // Check cache first
    const cacheKey = `conversation_feedback_${feedback}_${language}`;
    if (this.translationCache[cacheKey]) {
      console.log(`Using cached conversation feedback translation for: "${feedback}"`);
      return this.translationCache[cacheKey];
    }

    try {
      // Rate limiting: wait if requests are too frequent
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastTranslationRequest;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${waitTime}ms before next conversation feedback request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.lastTranslationRequest = Date.now();

      const response = await fetch(`${API_BASE_URL}/api/dynamic-translation/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          text: feedback,
          targetLanguage: language,
          context: 'sales_feedback'
        })
      });

      if (!response.ok) {
        throw new Error(`Conversation feedback translation API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`Conversation feedback translation: "${feedback}" -> "${result.translatedText}" (${language})`);
        // Cache the result
        this.translationCache[cacheKey] = result.translatedText;
        return result.translatedText;
      } else {
        console.error('Conversation feedback translation failed:', result.message);
        return feedback;
      }
    } catch (error) {
      console.error('Conversation feedback translation error:', error);
      return feedback;
    }
  }

  /**
   * Translate AI feedback using static translations for older conversations
   */
  private translateConversationFeedbackStatic(feedback: string, language: Language): string {
    if (!feedback || language === 'en') {
      return feedback;
    }

    // Use the existing static translations from the staticTranslations object
    const translations = staticTranslations[language];
    if (!translations) {
      return feedback;
    }

    // Try exact match first
    if (translations[feedback]) {
      return translations[feedback];
    }

    // Try case-insensitive match
    const lowerFeedback = feedback.toLowerCase();
    if (translations[lowerFeedback]) {
      return translations[lowerFeedback];
    }

    // Try partial matching for common terms
    let translatedFeedback = feedback;
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      const value = translations[key];
      if (feedback.toLowerCase().includes(key.toLowerCase())) {
        const result = feedback.replace(new RegExp(key, 'gi'), value);
        if (result !== feedback) {
          translatedFeedback = result;
          break;
        }
      }
    }

    return translatedFeedback;
  }

  /**
   * Clear translation cache
   */
  clearTranslationCache() {
    this.translationCache = {};
    console.log('Translation cache cleared');
  }

  /**
   * Translate dynamic AI-generated content using Google Translate API
   */
  async translateDynamicContent(text: string, language: Language, context: string = 'general'): Promise<string> {
    if (!text || language === 'en') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${language}_${context}`;
    if (this.translationCache[cacheKey]) {
      console.log(`Using cached dynamic translation for: "${text}"`);
      return this.translationCache[cacheKey];
    }

    try {
      // Rate limiting: wait if requests are too frequent
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastTranslationRequest;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.lastTranslationRequest = Date.now();

      const response = await fetch(`${API_BASE_URL}/api/dynamic-translation/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          text,
          targetLanguage: language,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`Dynamic translation: "${text}" -> "${result.translatedText}" (${language})`);
        // Cache the result
        this.translationCache[cacheKey] = result.translatedText;
        return result.translatedText;
      } else {
        console.error('Translation failed:', result.message);
        return text;
      }
    } catch (error) {
      console.error('Dynamic translation error:', error);
      return text;
    }
  }

  /**
   * Translate stage feedback with sales context
   */
  async translateStageFeedback(feedback: string, language: Language): Promise<string> {
    if (!feedback || language === 'en') {
      return feedback;
    }

    // Check if feedback is already in target language (basic detection)
    if (this.isAlreadyInTargetLanguage(feedback, language)) {
      console.log(`Feedback already in ${language}, skipping translation: "${feedback}"`);
      return feedback;
    }

    // Check cache first
    const cacheKey = `${feedback}_${language}`;
    if (this.translationCache[cacheKey]) {
      console.log(`Using cached translation for: "${feedback}"`);
      return this.translationCache[cacheKey];
    }

    try {
      // Rate limiting: wait if requests are too frequent
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastTranslationRequest;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.lastTranslationRequest = Date.now();

      const response = await fetch(`${API_BASE_URL}/api/dynamic-translation/translate-stage-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          feedback,
          targetLanguage: language
        })
      });

      if (!response.ok) {
        throw new Error(`Stage feedback translation API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`Stage feedback translation: "${feedback}" -> "${result.translatedFeedback}" (${language})`);
        // Cache the result
        this.translationCache[cacheKey] = result.translatedFeedback;
        return result.translatedFeedback;
      } else {
        console.error('Stage feedback translation failed:', result.message);
        return feedback;
      }
    } catch (error) {
      console.error('Stage feedback translation error:', error);
      return feedback;
    }
  }

  /**
   * Basic language detection to avoid translating already translated content
   */
  private isAlreadyInTargetLanguage(text: string, targetLanguage: Language): boolean {
    const languagePatterns = {
      'et': /[äöüõšž]/i, // Estonian characters
      'es': /[ñáéíóúü]/i, // Spanish characters
      'ru': /[а-яё]/i    // Russian characters
    };

    const pattern = languagePatterns[targetLanguage];
    if (!pattern) return false;

    // If text contains target language characters, it's likely already translated
    return pattern.test(text);
  }
}

// Export singleton instance
export const databaseTranslationService = new DatabaseTranslationService();
export default databaseTranslationService;
