import { getTranslation, type Language } from './translations.ts';

// Translation mappings for common AI-generated content patterns
const aiContentTranslations = {
  en: {
    // Strengths patterns
    'Professional communication': 'Professional communication',
    'Good product knowledge': 'Good product knowledge',
    'Respectful approach': 'Respectful approach',
    'Clear articulation': 'Clear articulation',
    'Active listening': 'Active listening',
    'Strong closing': 'Strong closing',
    'Effective questioning': 'Effective questioning',
    'Confident presentation': 'Confident presentation',
    'Good rapport building': 'Good rapport building',
    'Persuasive techniques': 'Persuasive techniques',
    'Asking questions to understand customer needs': 'Asking questions to understand customer needs',
    'Prompt responses': 'Prompt responses',
    'Good discovery process': 'Good discovery process',
    'Strong product knowledge': 'Strong product knowledge',
    'Effective communication': 'Effective communication',
    'Professional demeanor': 'Professional demeanor',
    'Good listening skills': 'Good listening skills',
    'Clear explanations': 'Clear explanations',
    'Confident delivery': 'Confident delivery',
    'Good follow-up': 'Good follow-up',
    
    // Improvement patterns
    'Ask more discovery questions': 'Ask more discovery questions',
    'Practice objection handling': 'Practice objection handling',
    'Improve closing techniques': 'Improve closing techniques',
    'Work on building rapport': 'Work on building rapport',
    'Focus on listening skills': 'Focus on listening skills',
    'Develop presentation skills': 'Develop presentation skills',
    'Practice active listening': 'Practice active listening',
    'Improve questioning techniques': 'Improve questioning techniques',
    'Work on confidence': 'Work on confidence',
    'Develop follow-up strategies': 'Develop follow-up strategies',
    'More context in opening lines': 'More context in opening lines',
    'More specific discovery questions': 'More specific discovery questions',
    'Include presentation and closing stages': 'Include presentation and closing stages',
    'Better objection handling': 'Better objection handling',
    'Stronger closing techniques': 'Stronger closing techniques',
    'More detailed product explanations': 'More detailed product explanations',
    'Improved follow-up process': 'Improved follow-up process',
    'Better rapport building': 'Better rapport building',
    'More engaging presentation style': 'More engaging presentation style',
    'Clearer value proposition': 'Clearer value proposition',
    
    // Personality insights patterns
    'Natural communicator': 'Natural communicator',
    'Detail-oriented': 'Detail-oriented',
    'Results-driven': 'Results-driven',
    'Relationship-focused': 'Relationship-focused',
    'Analytical approach': 'Analytical approach',
    'Emotional intelligence': 'Emotional intelligence',
    'Persistent nature': 'Persistent nature',
    'Adaptive style': 'Adaptive style',
    
    // Communication style patterns
    'Direct and concise': 'Direct and concise',
    'Conversational and friendly': 'Conversational and friendly',
    'Professional and formal': 'Professional and formal',
    'Consultative approach': 'Consultative approach',
    'Solution-oriented': 'Solution-oriented',
    'Customer-centric': 'Customer-centric',
    
    // Recommended focus patterns
    'Discovery questioning': 'Discovery questioning',
    'Objection handling': 'Objection handling',
    'Closing techniques': 'Closing techniques',
    'Rapport building': 'Rapport building',
    'Active listening': 'Active listening',
    'Presentation skills': 'Presentation skills',
    'Confidence building': 'Confidence building',
    'Follow-up strategies': 'Follow-up strategies',
    
    // Next steps patterns
    'Practice discovery questions': 'Practice discovery questions',
    'Role-play objection scenarios': 'Role-play objection scenarios',
    'Study closing techniques': 'Study closing techniques',
    'Improve active listening': 'Improve active listening',
    'Develop presentation skills': 'Develop presentation skills',
    'Build confidence through practice': 'Build confidence through practice',
    'Create follow-up templates': 'Create follow-up templates',
    'Analyze successful calls': 'Analyze successful calls',
    
    // Detailed feedback patterns
    'your opening lines are a bit abrupt and lack context': 'your opening lines are a bit abrupt and lack context',
    'It\'s important to lead with a warm greeting and introduce the topic of conversation': 'It\'s important to lead with a warm greeting and introduce the topic of conversation',
    'For example, instead of': 'For example, instead of',
    'you could say': 'you could say',
    'Hi, I hope you\'re doing well': 'Hi, I hope you\'re doing well',
    'I wanted to talk to you about an amazing TV that I believe would be perfect for you': 'I wanted to talk to you about an amazing TV that I believe would be perfect for you',
    'You\'re asking questions to understand the customer\'s needs which is good': 'You\'re asking questions to understand the customer\'s needs which is good',
    'However, your questions are not specific enough': 'However, your questions are not specific enough',
    'It\'s important to ask questions that will help you understand the customer\'s specific needs': 'It\'s important to ask questions that will help you understand the customer\'s specific needs',
    'Could you tell me what specific features you\'re looking for in a TV?': 'Could you tell me what specific features you\'re looking for in a TV?',
    'The presentation stage is missing from your conversations': 'The presentation stage is missing from your conversations',
    'Once you\'ve discovered the customers\' needs, it\'s important to present your product in a way that shows it meets those needs': 'Once you\'ve discovered the customers\' needs, it\'s important to present your product in a way that shows it meets those needs',
    'Our TV comes with 4K resolution and Dolby Atmos sound which gives you an immersive viewing experience': 'Our TV comes with 4K resolution and Dolby Atmos sound which gives you an immersive viewing experience',
    'In the conversations provided, there weren\'t any notable objections to handle': 'In the conversations provided, there weren\'t any notable objections to handle',
    'However, it\'s crucial to prepare for potential objections': 'However, it\'s crucial to prepare for potential objections',
    'Understand common objections in your industry and prepare responses for them': 'Understand common objections in your industry and prepare responses for them',
    'The closing stage is missing from your conversations': 'The closing stage is missing from your conversations',
    'Once the customer is convinced about the product, you should move to close the sale': 'Once the customer is convinced about the product, you should move to close the sale',
    'So, can I put you down for a TV? We have a great discount going on right now': 'So, can I put you down for a TV? We have a great discount going on right now',
    'This opening line could use more context': 'This opening line could use more context',
    'It would be helpful to introduce the topic of conversation and use a warm greeting': 'It would be helpful to introduce the topic of conversation and use a warm greeting',
    'This discovery question is a bit vague': 'This discovery question is a bit vague',
    'It would be more helpful to ask specific questions about the customer\'s needs': 'It would be more helpful to ask specific questions about the customer\'s needs',
    'you seem to be direct and to the point': 'you seem to be direct and to the point',
    'This can be good in sales, but it\'s also important to build rapport with customers': 'This can be good in sales, but it\'s also important to build rapport with customers',
    'Try to show more warmth and empathy in your conversations': 'Try to show more warmth and empathy in your conversations',
    'Your communication style is concise': 'Your communication style is concise',
    'However, it could benefit from more detailed and engaging responses': 'However, it could benefit from more detailed and engaging responses',
    'Building rapport': 'Building rapport',
    'Asking specific discovery questions': 'Asking specific discovery questions',
    'Presenting product benefits': 'Presenting product benefits',
    'Practise warm greetings': 'Practise warm greetings',
    'Prepare a list of specific discovery questions': 'Prepare a list of specific discovery questions',
    'Develop a compelling product presentation': 'Develop a compelling product presentation',
    'Learn and practise closing techniques': 'Learn and practise closing techniques',
    
    // More specific patterns for detailed feedback
    'Reio, your opening lines are a bit abrupt and lack context': 'Reio, your opening lines are a bit abrupt and lack context',
    'Hello pls buy my tv': 'Hello pls buy my tv',
    'what makes the TV stand out': 'what makes the TV stand out',
    'what makes the TV stand out from the rest': 'what makes the TV stand out from the rest',
    'Our TV comes with 4K resolution and Dolby Atmos sound': 'Our TV comes with 4K resolution and Dolby Atmos sound',
    'which gives you an immersive viewing experience': 'which gives you an immersive viewing experience',
    'In the conversations provided, there weren\'t any notable objections to handle': 'In the conversations provided, there weren\'t any notable objections to handle',
    'However, it\'s crucial to prepare for potential objections': 'However, it\'s crucial to prepare for potential objections',
    'Understand common objections in your industry': 'Understand common objections in your industry',
    'and prepare responses for them': 'and prepare responses for them',
    'Once the customer is convinced about the product': 'Once the customer is convinced about the product',
    'you should move to close the sale': 'you should move to close the sale',
    'You could say something like': 'You could say something like',
    'So, can I put you down for a TV': 'So, can I put you down for a TV',
    'We have a great discount going on right now': 'We have a great discount going on right now',
  },
  et: {
    // Strengths patterns
    'Professional communication': 'Professionaalne suhtlus',
    'Good product knowledge': 'Hea toote tundmine',
    'Respectful approach': 'Austav lähenemine',
    'Clear articulation': 'Selge väljendamine',
    'Active listening': 'Aktiivne kuulamine',
    'Strong closing': 'Tugev sulgemine',
    'Effective questioning': 'Tõhus küsimine',
    'Confident presentation': 'Enesekindel esitlus',
    'Good rapport building': 'Hea suhtluse loomine',
    'Persuasive techniques': 'Veenevad tehnikad',
    'Asking questions to understand customer needs': 'Küsimuste esitamine kliendi vajaduste mõistmiseks',
    'Prompt responses': 'Kiired vastused',
    'Good discovery process': 'Hea avastamise protsess',
    'Strong product knowledge': 'Tugev toote tundmine',
    'Effective communication': 'Tõhus suhtlus',
    'Professional demeanor': 'Professionaalne käitumine',
    'Good listening skills': 'Head kuulamise oskused',
    'Clear explanations': 'Selged selgitused',
    'Confident delivery': 'Enesekindel esitamine',
    'Good follow-up': 'Hea järelkontroll',
    
    // Improvement patterns
    'Ask more discovery questions': 'Küsi rohkem avastamise küsimusi',
    'Practice objection handling': 'Harjuta vastuväidete käsitlemist',
    'Improve closing techniques': 'Paranda sulgemise tehnikaid',
    'Work on building rapport': 'Tööta suhtluse loomise kallal',
    'Focus on listening skills': 'Keskendu kuulamise oskustele',
    'Develop presentation skills': 'Arenda esitluse oskusi',
    'Practice active listening': 'Harjuta aktiivset kuulamist',
    'Improve questioning techniques': 'Paranda küsimiste tehnikaid',
    'Work on confidence': 'Tööta enesekindluse kallal',
    'Develop follow-up strategies': 'Arenda järelkontrolli strateegiaid',
    'More context in opening lines': 'Rohkem konteksti avavõtetes',
    'More specific discovery questions': 'Rohkem spetsiifilisi avastamise küsimusi',
    'Include presentation and closing stages': 'Kaasa esitluse ja sulgemise etapid',
    'Better objection handling': 'Parem vastuväidete käsitlemine',
    'Stronger closing techniques': 'Tugevamad sulgemise tehnikad',
    'More detailed product explanations': 'Üksikasjalikumad toote selgitused',
    'Improved follow-up process': 'Parandatud järelkontrolli protsess',
    'Better rapport building': 'Parem suhtluse loomine',
    'More engaging presentation style': 'Põnevam esitluse stiil',
    'Clearer value proposition': 'Selgem väärtuspakkumine',
    
    // Personality insights patterns
    'Natural communicator': 'Loomulik suhtleja',
    'Detail-oriented': 'Üksikasjadele orienteeritud',
    'Results-driven': 'Tulemustele orienteeritud',
    'Relationship-focused': 'Suhetesse keskendunud',
    'Analytical approach': 'Analüütiline lähenemine',
    'Emotional intelligence': 'Emotsionaalne intelligentsus',
    'Persistent nature': 'Püsiv olemus',
    'Adaptive style': 'Kohanev stiil',
    
    // Communication style patterns
    'Direct and concise': 'Otsene ja lühike',
    'Conversational and friendly': 'Vestlik ja sõbralik',
    'Professional and formal': 'Professionaalne ja formaalne',
    'Consultative approach': 'Konsultatsiooni lähenemine',
    'Solution-oriented': 'Lahendustele orienteeritud',
    'Customer-centric': 'Kliendile keskendunud',
    
    // Recommended focus patterns
    'Discovery questioning': 'Avastamise küsimused',
    'Objection handling': 'Vastuväidete käsitlemine',
    'Closing techniques': 'Sulgemise tehnikad',
    'Rapport building': 'Suhtluse loomine',
    'Active listening': 'Aktiivne kuulamine',
    'Presentation skills': 'Esitluse oskused',
    'Confidence building': 'Enesekindluse arendamine',
    'Follow-up strategies': 'Järelkontrolli strateegiad',
    
    // Next steps patterns
    'Practice discovery questions': 'Harjuta avastamise küsimusi',
    'Role-play objection scenarios': 'Mängi vastuväidete stsenaariume',
    'Study closing techniques': 'Õpi sulgemise tehnikaid',
    'Improve active listening': 'Paranda aktiivset kuulamist',
    'Develop presentation skills': 'Arenda esitluse oskusi',
    'Build confidence through practice': 'Ehita enesekindlust harjutamise kaudu',
    'Create follow-up templates': 'Loo järelkontrolli mallid',
    'Analyze successful calls': 'Analüüsi edukaid kõnesid',
    
    // Detailed feedback patterns
    'your opening lines are a bit abrupt and lack context': 'teie avavõtted on veidi järsud ja puudub kontekst',
    'It\'s important to lead with a warm greeting and introduce the topic of conversation': 'Oluline on alustada sooja tervitusega ja tutvustada vestluse teemat',
    'For example, instead of': 'Näiteks selle asemel, et',
    'you could say': 'võiksite öelda',
    'Hi, I hope you\'re doing well': 'Tere, loodan, et teil läheb hästi',
    'I wanted to talk to you about an amazing TV that I believe would be perfect for you': 'Tahtsin teiega rääkida imelisest telerist, mis ma usun oleks teie jaoks täiuslik',
    'You\'re asking questions to understand the customer\'s needs which is good': 'Te küsite küsimusi kliendi vajaduste mõistmiseks, mis on hea',
    'However, your questions are not specific enough': 'Kuid teie küsimused pole piisavalt spetsiifilised',
    'It\'s important to ask questions that will help you understand the customer\'s specific needs': 'Oluline on küsida küsimusi, mis aitavad teil mõista kliendi spetsiifilisi vajadusi',
    'Could you tell me what specific features you\'re looking for in a TV?': 'Kas saaksite mulle öelda, milliseid spetsiifilisi funktsioone telerist otsite?',
    'The presentation stage is missing from your conversations': 'Teie vestlustest puudub esitluse etapp',
    'Once you\'ve discovered the customers\' needs, it\'s important to present your product in a way that shows it meets those needs': 'Kui olete kliendi vajadused avastanud, on oluline esitleda oma toodet nii, et näidata, et see vastab neile vajadustele',
    'Our TV comes with 4K resolution and Dolby Atmos sound which gives you an immersive viewing experience': 'Meie teler tuleb 4K eraldusvõimega ja Dolby Atmos heliga, mis annab teile imendava vaatamiskogemuse',
    'In the conversations provided, there weren\'t any notable objections to handle': 'Esitatud vestlustes polnud märkimisväärseid vastuväiteid käsitleda',
    'However, it\'s crucial to prepare for potential objections': 'Kuid on oluline valmistuda võimalike vastuväidete vastu',
    'Understand common objections in your industry and prepare responses for them': 'Mõistke oma valdkonnas levinud vastuväiteid ja valmistuge nendele vastama',
    'The closing stage is missing from your conversations': 'Teie vestlustest puudub sulgemise etapp',
    'Once the customer is convinced about the product, you should move to close the sale': 'Kui klient on toote suhtes veendunud, peaksite liikuma müügi sulgemise poole',
    'So, can I put you down for a TV? We have a great discount going on right now': 'Kas ma saan teid teleri jaoks kirja panna? Meil on praegu suurepärane allahindlus',
    'This opening line could use more context': 'See avavõte vajaks rohkem konteksti',
    'It would be helpful to introduce the topic of conversation and use a warm greeting': 'Oleks kasulik tutvustada vestluse teemat ja kasutada sooja tervitust',
    'This discovery question is a bit vague': 'See avastamise küsimus on veidi ebamäärane',
    'It would be more helpful to ask specific questions about the customer\'s needs': 'Oleks kasulikum küsida spetsiifilisi küsimusi kliendi vajaduste kohta',
    'you seem to be direct and to the point': 'tundute olevat otsene ja asjale keskendunud',
    'This can be good in sales, but it\'s also important to build rapport with customers': 'See võib müügis olla hea, kuid on oluline ka luua klientidega suhtlus',
    'Try to show more warmth and empathy in your conversations': 'Proovige oma vestlustes näidata rohkem soojust ja empaatiat',
    'Your communication style is concise': 'Teie suhtlusstiil on lühike',
    'However, it could benefit from more detailed and engaging responses': 'Kuid see võiks kasu saada üksikasjalikumatest ja põnevamatest vastustest',
    'Building rapport': 'Suhtluse loomine',
    'Asking specific discovery questions': 'Spetsiifiliste avastamise küsimuste esitamine',
    'Presenting product benefits': 'Toote eeliste esitlemine',
    'Practise warm greetings': 'Harjutage sooja tervitust',
    'Prepare a list of specific discovery questions': 'Valmistage ette spetsiifiliste avastamise küsimuste loend',
    'Develop a compelling product presentation': 'Arendage veetlevat toote esitlust',
    'Learn and practise closing techniques': 'Õppige ja harjutage sulgemise tehnikaid',
    
    // More specific patterns for detailed feedback
    'Reio, your opening lines are a bit abrupt and lack context': 'Reio, teie avavõtted on veidi järsud ja puudub kontekst',
    'Hello pls buy my tv': 'Tere palun ostke mu teler',
    'what makes the TV stand out': 'mis teeb teleri silma paistvaks',
    'what makes the TV stand out from the rest': 'mis teeb teleri teistest eriliseks',
    'Our TV comes with 4K resolution and Dolby Atmos sound': 'Meie teler tuleb 4K eraldusvõimega ja Dolby Atmos heliga',
    'which gives you an immersive viewing experience': 'mis annab teile imendava vaatamiskogemuse',
    'In the conversations provided, there weren\'t any notable objections to handle': 'Esitatud vestlustes polnud märkimisväärseid vastuväiteid käsitleda',
    'However, it\'s crucial to prepare for potential objections': 'Kuid on oluline valmistuda võimalike vastuväidete vastu',
    'Understand common objections in your industry': 'Mõistke oma valdkonnas levinud vastuväiteid',
    'and prepare responses for them': 'ja valmistuge nendele vastama',
    'Once the customer is convinced about the product': 'Kui klient on toote suhtes veendunud',
    'you should move to close the sale': 'peaksite liikuma müügi sulgemise poole',
    'You could say something like': 'Võiksite öelda midagi sellist',
    'So, can I put you down for a TV': 'Kas ma saan teid teleri jaoks kirja panna',
    'We have a great discount going on right now': 'Meil on praegu suurepärane allahindlus',
  },
  es: {
    // Strengths patterns
    'Professional communication': 'Comunicación profesional',
    'Good product knowledge': 'Buen conocimiento del producto',
    'Respectful approach': 'Enfoque respetuoso',
    'Clear articulation': 'Articulación clara',
    'Active listening': 'Escucha activa',
    'Strong closing': 'Cierre fuerte',
    'Effective questioning': 'Cuestionamiento efectivo',
    'Confident presentation': 'Presentación confiada',
    'Good rapport building': 'Buena construcción de relación',
    'Persuasive techniques': 'Técnicas persuasivas',
    'Asking questions to understand customer needs': 'Hacer preguntas para entender las necesidades del cliente',
    'Prompt responses': 'Respuestas rápidas',
    'Good discovery process': 'Buen proceso de descubrimiento',
    'Strong product knowledge': 'Fuerte conocimiento del producto',
    'Effective communication': 'Comunicación efectiva',
    'Professional demeanor': 'Actitud profesional',
    'Good listening skills': 'Buenas habilidades de escucha',
    'Clear explanations': 'Explicaciones claras',
    'Confident delivery': 'Entrega confiada',
    'Good follow-up': 'Buen seguimiento',
    
    // Improvement patterns
    'Ask more discovery questions': 'Hacer más preguntas de descubrimiento',
    'Practice objection handling': 'Practicar manejo de objeciones',
    'Improve closing techniques': 'Mejorar técnicas de cierre',
    'Work on building rapport': 'Trabajar en construir relación',
    'Focus on listening skills': 'Enfocarse en habilidades de escucha',
    'Develop presentation skills': 'Desarrollar habilidades de presentación',
    'Practice active listening': 'Practicar escucha activa',
    'Improve questioning techniques': 'Mejorar técnicas de cuestionamiento',
    'Work on confidence': 'Trabajar en la confianza',
    'Develop follow-up strategies': 'Desarrollar estrategias de seguimiento',
    'More context in opening lines': 'Más contexto en líneas de apertura',
    'More specific discovery questions': 'Preguntas de descubrimiento más específicas',
    'Include presentation and closing stages': 'Incluir etapas de presentación y cierre',
    'Better objection handling': 'Mejor manejo de objeciones',
    'Stronger closing techniques': 'Técnicas de cierre más fuertes',
    'More detailed product explanations': 'Explicaciones del producto más detalladas',
    'Improved follow-up process': 'Proceso de seguimiento mejorado',
    'Better rapport building': 'Mejor construcción de relación',
    'More engaging presentation style': 'Estilo de presentación más atractivo',
    'Clearer value proposition': 'Propuesta de valor más clara',
    
    // Personality insights patterns
    'Natural communicator': 'Comunicador natural',
    'Detail-oriented': 'Orientado a los detalles',
    'Results-driven': 'Orientado a resultados',
    'Relationship-focused': 'Enfocado en relaciones',
    'Analytical approach': 'Enfoque analítico',
    'Emotional intelligence': 'Inteligencia emocional',
    'Persistent nature': 'Naturaleza persistente',
    'Adaptive style': 'Estilo adaptativo',
    
    // Communication style patterns
    'Direct and concise': 'Directo y conciso',
    'Conversational and friendly': 'Conversacional y amigable',
    'Professional and formal': 'Profesional y formal',
    'Consultative approach': 'Enfoque consultivo',
    'Solution-oriented': 'Orientado a soluciones',
    'Customer-centric': 'Centrado en el cliente',
    
    // Recommended focus patterns
    'Discovery questioning': 'Cuestionamiento de descubrimiento',
    'Objection handling': 'Manejo de objeciones',
    'Closing techniques': 'Técnicas de cierre',
    'Rapport building': 'Construcción de relación',
    'Active listening': 'Escucha activa',
    'Presentation skills': 'Habilidades de presentación',
    'Confidence building': 'Construcción de confianza',
    'Follow-up strategies': 'Estrategias de seguimiento',
    
    // Next steps patterns
    'Practice discovery questions': 'Practicar preguntas de descubrimiento',
    'Role-play objection scenarios': 'Interpretar escenarios de objeciones',
    'Study closing techniques': 'Estudiar técnicas de cierre',
    'Improve active listening': 'Mejorar escucha activa',
    'Develop presentation skills': 'Desarrollar habilidades de presentación',
    'Build confidence through practice': 'Construir confianza a través de la práctica',
    'Create follow-up templates': 'Crear plantillas de seguimiento',
    'Analyze successful calls': 'Analizar llamadas exitosas',
    
    // Detailed feedback patterns
    'your opening lines are a bit abrupt and lack context': 'tus líneas de apertura son un poco abruptas y carecen de contexto',
    'It\'s important to lead with a warm greeting and introduce the topic of conversation': 'Es importante comenzar con un saludo cálido e introducir el tema de conversación',
    'For example, instead of': 'Por ejemplo, en lugar de',
    'you could say': 'podrías decir',
    'Hi, I hope you\'re doing well': 'Hola, espero que te vaya bien',
    'I wanted to talk to you about an amazing TV that I believe would be perfect for you': 'Quería hablar contigo sobre una televisión increíble que creo que sería perfecta para ti',
    'You\'re asking questions to understand the customer\'s needs which is good': 'Estás haciendo preguntas para entender las necesidades del cliente, lo cual es bueno',
    'However, your questions are not specific enough': 'Sin embargo, tus preguntas no son lo suficientemente específicas',
    'It\'s important to ask questions that will help you understand the customer\'s specific needs': 'Es importante hacer preguntas que te ayuden a entender las necesidades específicas del cliente',
    'Could you tell me what specific features you\'re looking for in a TV?': '¿Podrías decirme qué características específicas buscas en una televisión?',
    'The presentation stage is missing from your conversations': 'La etapa de presentación falta en tus conversaciones',
    'Once you\'ve discovered the customers\' needs, it\'s important to present your product in a way that shows it meets those needs': 'Una vez que hayas descubierto las necesidades del cliente, es importante presentar tu producto de manera que muestre que las satisface',
    'Our TV comes with 4K resolution and Dolby Atmos sound which gives you an immersive viewing experience': 'Nuestra televisión viene con resolución 4K y sonido Dolby Atmos que te brinda una experiencia de visualización inmersiva',
    'In the conversations provided, there weren\'t any notable objections to handle': 'En las conversaciones proporcionadas, no hubo objeciones notables que manejar',
    'However, it\'s crucial to prepare for potential objections': 'Sin embargo, es crucial prepararse para posibles objeciones',
    'Understand common objections in your industry and prepare responses for them': 'Entiende las objeciones comunes en tu industria y prepara respuestas para ellas',
    'The closing stage is missing from your conversations': 'La etapa de cierre falta en tus conversaciones',
    'Once the customer is convinced about the product, you should move to close the sale': 'Una vez que el cliente esté convencido del producto, debes proceder a cerrar la venta',
    'So, can I put you down for a TV? We have a great discount going on right now': 'Entonces, ¿puedo anotarte para una televisión? Tenemos un gran descuento en este momento',
    'This opening line could use more context': 'Esta línea de apertura podría usar más contexto',
    'It would be helpful to introduce the topic of conversation and use a warm greeting': 'Sería útil introducir el tema de conversación y usar un saludo cálido',
    'This discovery question is a bit vague': 'Esta pregunta de descubrimiento es un poco vaga',
    'It would be more helpful to ask specific questions about the customer\'s needs': 'Sería más útil hacer preguntas específicas sobre las necesidades del cliente',
    'you seem to be direct and to the point': 'pareces ser directo y al grano',
    'This can be good in sales, but it\'s also important to build rapport with customers': 'Esto puede ser bueno en ventas, pero también es importante construir una relación con los clientes',
    'Try to show more warmth and empathy in your conversations': 'Trata de mostrar más calidez y empatía en tus conversaciones',
    'Your communication style is concise': 'Tu estilo de comunicación es conciso',
    'However, it could benefit from more detailed and engaging responses': 'Sin embargo, podría beneficiarse de respuestas más detalladas y atractivas',
    'Building rapport': 'Construir relación',
    'Asking specific discovery questions': 'Hacer preguntas específicas de descubrimiento',
    'Presenting product benefits': 'Presentar beneficios del producto',
    'Practise warm greetings': 'Practicar saludos cálidos',
    'Prepare a list of specific discovery questions': 'Preparar una lista de preguntas específicas de descubrimiento',
    'Develop a compelling product presentation': 'Desarrollar una presentación de producto convincente',
    'Learn and practise closing techniques': 'Aprender y practicar técnicas de cierre',
    
    // More specific patterns for detailed feedback
    'Reio, your opening lines are a bit abrupt and lack context': 'Reio, tus líneas de apertura son un poco abruptas y carecen de contexto',
    'Hello pls buy my tv': 'Hola por favor compra mi tv',
    'what makes the TV stand out': 'qué hace destacar al televisor',
    'what makes the TV stand out from the rest': 'qué hace destacar al televisor del resto',
    'Our TV comes with 4K resolution and Dolby Atmos sound': 'Nuestra televisión viene con resolución 4K y sonido Dolby Atmos',
    'which gives you an immersive viewing experience': 'que te brinda una experiencia de visualización inmersiva',
    'In the conversations provided, there weren\'t any notable objections to handle': 'En las conversaciones proporcionadas, no hubo objeciones notables que manejar',
    'However, it\'s crucial to prepare for potential objections': 'Sin embargo, es crucial prepararse para posibles objeciones',
    'Understand common objections in your industry': 'Entiende las objeciones comunes en tu industria',
    'and prepare responses for them': 'y prepara respuestas para ellas',
    'Once the customer is convinced about the product': 'Una vez que el cliente esté convencido del producto',
    'you should move to close the sale': 'debes proceder a cerrar la venta',
    'You could say something like': 'Podrías decir algo como',
    'So, can I put you down for a TV': 'Entonces, ¿puedo anotarte para una televisión',
    'We have a great discount going on right now': 'Tenemos un gran descuento en este momento',
  },
  ru: {
    // Strengths patterns
    'Professional communication': 'Профессиональное общение',
    'Good product knowledge': 'Хорошее знание продукта',
    'Respectful approach': 'Уважительный подход',
    'Clear articulation': 'Четкая артикуляция',
    'Active listening': 'Активное слушание',
    'Strong closing': 'Сильное закрытие',
    'Effective questioning': 'Эффективное задавание вопросов',
    'Confident presentation': 'Уверенная презентация',
    'Good rapport building': 'Хорошее построение отношений',
    'Persuasive techniques': 'Убедительные техники',
    'Asking questions to understand customer needs': 'Задавание вопросов для понимания потребностей клиента',
    'Prompt responses': 'Быстрые ответы',
    'Good discovery process': 'Хороший процесс выяснения',
    'Strong product knowledge': 'Сильное знание продукта',
    'Effective communication': 'Эффективное общение',
    'Professional demeanor': 'Профессиональное поведение',
    'Good listening skills': 'Хорошие навыки слушания',
    'Clear explanations': 'Четкие объяснения',
    'Confident delivery': 'Уверенная подача',
    'Good follow-up': 'Хороший последующий контроль',
    
    // Improvement patterns
    'Ask more discovery questions': 'Задавайте больше вопросов для выяснения',
    'Practice objection handling': 'Практикуйте работу с возражениями',
    'Improve closing techniques': 'Улучшайте техники закрытия',
    'Work on building rapport': 'Работайте над построением отношений',
    'Focus on listening skills': 'Сосредоточьтесь на навыках слушания',
    'Develop presentation skills': 'Развивайте навыки презентации',
    'Practice active listening': 'Практикуйте активное слушание',
    'Improve questioning techniques': 'Улучшайте техники задавания вопросов',
    'Work on confidence': 'Работайте над уверенностью',
    'Develop follow-up strategies': 'Разрабатывайте стратегии последующих действий',
    'More context in opening lines': 'Больше контекста в открывающих строках',
    'More specific discovery questions': 'Более конкретные вопросы для выяснения',
    'Include presentation and closing stages': 'Включите этапы презентации и закрытия',
    'Better objection handling': 'Лучшая работа с возражениями',
    'Stronger closing techniques': 'Более сильные техники закрытия',
    'More detailed product explanations': 'Более подробные объяснения продукта',
    'Improved follow-up process': 'Улучшенный процесс последующих действий',
    'Better rapport building': 'Лучшее построение отношений',
    'More engaging presentation style': 'Более увлекательный стиль презентации',
    'Clearer value proposition': 'Более четкое ценностное предложение',
    
    // Personality insights patterns
    'Natural communicator': 'Природный коммуникатор',
    'Detail-oriented': 'Ориентированный на детали',
    'Results-driven': 'Ориентированный на результаты',
    'Relationship-focused': 'Сосредоточенный на отношениях',
    'Analytical approach': 'Аналитический подход',
    'Emotional intelligence': 'Эмоциональный интеллект',
    'Persistent nature': 'Упорная природа',
    'Adaptive style': 'Адаптивный стиль',
    
    // Communication style patterns
    'Direct and concise': 'Прямой и краткий',
    'Conversational and friendly': 'Разговорный и дружелюбный',
    'Professional and formal': 'Профессиональный и формальный',
    'Consultative approach': 'Консультативный подход',
    'Solution-oriented': 'Ориентированный на решения',
    'Customer-centric': 'Ориентированный на клиента',
    
    // Recommended focus patterns
    'Discovery questioning': 'Вопросы для выяснения',
    'Objection handling': 'Работа с возражениями',
    'Closing techniques': 'Техники закрытия',
    'Rapport building': 'Построение отношений',
    'Active listening': 'Активное слушание',
    'Presentation skills': 'Навыки презентации',
    'Confidence building': 'Построение уверенности',
    'Follow-up strategies': 'Стратегии последующих действий',
    
    // Next steps patterns
    'Practice discovery questions': 'Практикуйте вопросы для выяснения',
    'Role-play objection scenarios': 'Проигрывайте сценарии возражений',
    'Study closing techniques': 'Изучайте техники закрытия',
    'Improve active listening': 'Улучшайте активное слушание',
    'Develop presentation skills': 'Развивайте навыки презентации',
    'Build confidence through practice': 'Стройте уверенность через практику',
    'Create follow-up templates': 'Создавайте шаблоны последующих действий',
    'Analyze successful calls': 'Анализируйте успешные звонки',
    
    // Detailed feedback patterns
    'your opening lines are a bit abrupt and lack context': 'ваши открывающие строки немного резкие и не хватает контекста',
    'It\'s important to lead with a warm greeting and introduce the topic of conversation': 'Важно начать с теплого приветствия и представить тему разговора',
    'For example, instead of': 'Например, вместо',
    'you could say': 'вы могли бы сказать',
    'Hi, I hope you\'re doing well': 'Привет, надеюсь, у вас все хорошо',
    'I wanted to talk to you about an amazing TV that I believe would be perfect for you': 'Я хотел поговорить с вами об удивительном телевизоре, который, я верю, будет идеальным для вас',
    'You\'re asking questions to understand the customer\'s needs which is good': 'Вы задаете вопросы, чтобы понять потребности клиента, что хорошо',
    'However, your questions are not specific enough': 'Однако ваши вопросы недостаточно конкретны',
    'It\'s important to ask questions that will help you understand the customer\'s specific needs': 'Важно задавать вопросы, которые помогут вам понять конкретные потребности клиента',
    'Could you tell me what specific features you\'re looking for in a TV?': 'Не могли бы вы сказать мне, какие конкретные функции вы ищете в телевизоре?',
    'The presentation stage is missing from your conversations': 'В ваших разговорах отсутствует этап презентации',
    'Once you\'ve discovered the customers\' needs, it\'s important to present your product in a way that shows it meets those needs': 'После того, как вы выяснили потребности клиента, важно представить ваш продукт таким образом, чтобы показать, что он удовлетворяет эти потребности',
    'Our TV comes with 4K resolution and Dolby Atmos sound which gives you an immersive viewing experience': 'Наш телевизор поставляется с разрешением 4K и звуком Dolby Atmos, что дает вам захватывающий опыт просмотра',
    'In the conversations provided, there weren\'t any notable objections to handle': 'В предоставленных разговорах не было заметных возражений для обработки',
    'However, it\'s crucial to prepare for potential objections': 'Однако важно подготовиться к потенциальным возражениям',
    'Understand common objections in your industry and prepare responses for them': 'Понимайте распространенные возражения в вашей отрасли и готовьте ответы на них',
    'The closing stage is missing from your conversations': 'В ваших разговорах отсутствует этап закрытия',
    'Once the customer is convinced about the product, you should move to close the sale': 'Как только клиент убежден в продукте, вы должны перейти к закрытию продажи',
    'So, can I put you down for a TV? We have a great discount going on right now': 'Итак, могу ли я записать вас на телевизор? У нас сейчас отличная скидка',
    'This opening line could use more context': 'Этой открывающей строке нужен больший контекст',
    'It would be helpful to introduce the topic of conversation and use a warm greeting': 'Было бы полезно представить тему разговора и использовать теплое приветствие',
    'This discovery question is a bit vague': 'Этот вопрос для выяснения немного расплывчатый',
    'It would be more helpful to ask specific questions about the customer\'s needs': 'Было бы более полезно задавать конкретные вопросы о потребностях клиента',
    'you seem to be direct and to the point': 'вы кажетесь прямым и по существу',
    'This can be good in sales, but it\'s also important to build rapport with customers': 'Это может быть хорошо в продажах, но также важно строить отношения с клиентами',
    'Try to show more warmth and empathy in your conversations': 'Старайтесь проявлять больше тепла и эмпатии в ваших разговорах',
    'Your communication style is concise': 'Ваш стиль общения лаконичен',
    'However, it could benefit from more detailed and engaging responses': 'Однако он мог бы выиграть от более подробных и увлекательных ответов',
    'Building rapport': 'Построение отношений',
    'Asking specific discovery questions': 'Задавание конкретных вопросов для выяснения',
    'Presenting product benefits': 'Представление преимуществ продукта',
    'Practise warm greetings': 'Практикуйте теплые приветствия',
    'Prepare a list of specific discovery questions': 'Подготовьте список конкретных вопросов для выяснения',
    'Develop a compelling product presentation': 'Разработайте убедительную презентацию продукта',
    'Learn and practise closing techniques': 'Изучайте и практикуйте техники закрытия',
    
    // More specific patterns for detailed feedback
    'Reio, your opening lines are a bit abrupt and lack context': 'Рейо, ваши открывающие строки немного резкие и не хватает контекста',
    'Hello pls buy my tv': 'Привет пожалуйста купи мой телевизор',
    'what makes the TV stand out': 'что делает телевизор выдающимся',
    'what makes the TV stand out from the rest': 'что делает телевизор выдающимся среди остальных',
    'Our TV comes with 4K resolution and Dolby Atmos sound': 'Наш телевизор поставляется с разрешением 4K и звуком Dolby Atmos',
    'which gives you an immersive viewing experience': 'что дает вам захватывающий опыт просмотра',
    'In the conversations provided, there weren\'t any notable objections to handle': 'В предоставленных разговорах не было заметных возражений для обработки',
    'However, it\'s crucial to prepare for potential objections': 'Однако важно подготовиться к потенциальным возражениям',
    'Understand common objections in your industry': 'Понимайте распространенные возражения в вашей отрасли',
    'and prepare responses for them': 'и готовьте ответы на них',
    'Once the customer is convinced about the product': 'Как только клиент убежден в продукте',
    'you should move to close the sale': 'вы должны перейти к закрытию продажи',
    'You could say something like': 'Вы могли бы сказать что-то вроде',
    'So, can I put you down for a TV': 'Итак, могу ли я записать вас на телевизор',
    'We have a great discount going on right now': 'У нас сейчас отличная скидка',
  },
};

// Function to translate AI-generated content
export const translateAIContent = (content: string, language: Language): string => {
  if (language === 'en') {
    return content; // No translation needed for English
  }

  const translations = aiContentTranslations[language];
  if (!translations) {
    return content; // Fallback to original content
  }

  // Try to find exact matches first
  if (translations[content]) {
    return translations[content];
  }

  // Try to find partial matches and translate sentence by sentence
  let translatedContent = content;
  
  // Split by sentences and try to translate each
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (translations[trimmedSentence]) {
      translatedContent = translatedContent.replace(sentence, translations[trimmedSentence]);
    } else {
      // Try to find partial matches within the sentence
      for (const [key, translation] of Object.entries(translations)) {
        if (trimmedSentence.includes(key)) {
          translatedContent = translatedContent.replace(key, translation);
        }
      }
    }
  }

  // Also try to translate common phrases within the content
  for (const [key, translation] of Object.entries(translations)) {
    if (translatedContent.includes(key)) {
      translatedContent = translatedContent.replace(key, translation);
    }
  }

  return translatedContent;
};

// Function to translate arrays of AI content
export const translateAIArray = (items: string[], language: Language): string[] => {
  return items.map(item => translateAIContent(item, language));
};

// Function to translate AI analysis object
export const translateAIAnalysis = (analysis: any, language: Language): any => {
  if (!analysis) return analysis;

  return {
    ...analysis,
    personalityInsights: analysis.personalityInsights ? translateAIContent(analysis.personalityInsights, language) : analysis.personalityInsights,
    communicationStyle: analysis.communicationStyle ? translateAIContent(analysis.communicationStyle, language) : analysis.communicationStyle,
    recommendedFocus: analysis.recommendedFocus ? translateAIArray(analysis.recommendedFocus, language) : analysis.recommendedFocus,
    nextSteps: analysis.nextSteps ? translateAIArray(analysis.nextSteps, language) : analysis.nextSteps,
  };
};
