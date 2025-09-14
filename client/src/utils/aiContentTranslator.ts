import { type Language } from './translations.ts';

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
    
    // Additional common AI feedback patterns
    'Clear introductions': 'Clear introductions',
    'Consistency in approach': 'Consistency in approach',
    'Quick responses': 'Quick responses',
    'Need to ask more open-ended questions': 'Need to ask more open-ended questions',
    'Provide more detailed product information': 'Provide more detailed product information',
    'Improve objection handling and closing techniques': 'Improve objection handling and closing techniques',
    'Good listening skills': 'Good listening skills',
    'Professional communication style': 'Professional communication style',
    'Effective questioning techniques': 'Effective questioning techniques',
    'Strong rapport building': 'Strong rapport building',
    'Confident presentation': 'Confident presentation',
    'Adaptive communication': 'Adaptive communication',
    'Customer-focused approach': 'Customer-focused approach',
    'Solution-oriented mindset': 'Solution-oriented mindset',
    'Persuasive techniques': 'Persuasive techniques',
    'Active listening': 'Active listening',
    'Empathetic responses': 'Empathetic responses',
    'Clear value proposition': 'Clear value proposition',
    'Strong closing attempts': 'Strong closing attempts',
    'Effective follow-up': 'Effective follow-up',
    
    // Stage names
    'opening': 'opening',
    'discovery': 'discovery', 
    'presentation': 'presentation',
    'objectionHandling': 'objection handling',
    'closing': 'closing',
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
    
    // Complete English to Estonian translations with proper grammar
    'Your': 'Teie',
    'your': 'oma',
    'introductions': 'sissejuhatuses',
    'were': 'olid',
    'was': 'oli',
    'is': 'on',
    'are': 'on',
    'clear': 'selge',
    'but': 'kuid',
    'lacked': 'puudus',
    'enthusiasm': 'entusiasmi',
    'or': 'või',
    'an': 'üks',
    'engaging': 'põnev',
    
    // Additional English words that need Estonian translation
    'professional': 'professionaalne',
    'respectful': 'väärikas',
    'suhtlemise stiil': 'suhtlemisstiil',
    'direct': 'otse',
    'approach': 'lähenemine',
    'discovery': 'avastamine',
    'küsimusi': 'küsimused',
    'objection': 'vastuväide',
    'vastuseid': 'vastused',
    'study': 'õpi',
    'work on': 'tööta',
    'skills': 'oskused',
    'sulgemine': 'sulgemine',
    'practice': 'harjuta',
    'techniques': 'tehnikad',
    'hook': 'külg',
    'Try': 'Proovi',
    'try': 'proovi',
    'to': 'et',
    'make': 'teha',
    'statement': 'avaldus',
    'more': 'rohkem',
    'interesting': 'huvitav',
    'grab': 'haarata',
    'attention': 'tähelepanu',
    'about': 'umbes',
    'understanding': 'mõistmine',
    'customer': 'kliendi',
    'needs': 'vajadusi',
    'and': 'ja',
    'situation': 'olukord',
    'There': 'Seal',
    'room': 'ruumi',
    'for': 'jaoks',
    'improvement': 'parandamist',
    'here': 'siin',
    'as': 'kuna',
    'you': 'sa',
    'did': 'teginud',
    'not': 'ei',
    'ask': 'küsi',
    'enough': 'piisavalt',
    'questions': 'küsimusi',
    'many': 'mitu',
    'Always': 'Alati',
    'remember': 'mäleta',
    'open': 'avatud',
    'gather': 'koguma',
    'information': 'teavet',
    'When': 'Kui',
    'presenting': 'esitad',
    'products': 'toodeteid',
    'it\'s': 'see on',
    'important': 'oluline',
    'provide': 'pakkuma',
    'concise': 'konkreetne',
    'relevant': 'asjakohane',
    'Instead': 'Selle asemel',
    'of': 'et',
    'saying': 'öelda',
    'everything': 'kõike',
    'mention': 'mainida',
    'specific': 'spetsiifilisi',
    'features': 'funktsioone',
    'that': 'mis',
    'could': 'võiks',
    'benefit': 'kasu',
    'the': 'see',
    'client': 'klient',
    'You': 'Sa',
    'seemed': 'tundus',
    'struggle': 'võitlema',
    'with': 'koos',
    'handling': 'käsitlemine',
    'requests': 'taotlusi',
    'anticipate': 'ennetama',
    'common': 'tavalisi',
    'prepare': 'valmistuma',
    'answer': 'vastama',
    'them': 'neile',
    'If': 'Kui',
    'provide': 'pakkuma',
    'it': 'seda',
    'in': 'sisse',
    'a': 'üks',
    'detailed': 'üksikasjalik',
    'manner': 'viisil',
    'techniques': 'tehnikaid',
    'use': 'kasutama',
    'some': 'mõned',
    'Instead': 'Selle asemel',
    'waiting': 'ootama',
    'for': 'jaoks',
    'make': 'teha',
    'a': 'üks',
    'decision': 'otsus',
    'guide': 'juhtima',
    'them': 'neid',
    'towards': 'suunas',
    'by': 'poolt',
    'summarizing': 'kokkuvõtte tegemine',
    'benefits': 'eelised',
    'product': 'toode',
    'sales': 'müügi',
    'question': 'küsimus',
    
    // Sales-context Estonian translations - natural and professional
    'Your opening were clear': 'Teie sissejuhatus oli selge',
    'Your introductions were clear': 'Teie sissejuhatused olid selged',
    'but lacked enthusiasm': 'kuid puudus entusiasmi',
    'or an engaging hook': 'või põnev külg',
    'or an': 'või',
    'an engaging': 'põnev',
    'Try to make': 'Proovi teha',
    'your opening statement': 'oma sissejuhatuse avaldus',
    'more interesting': 'rohkem huvitav',
    'to grab': 'et haarata',
    'the client\'s attention': 'kliendi tähelepanu',
    'to grab the client\'s attention': 'et haarata kliendi tähelepanu',
    'Discovery is about': 'Avastamine tähendab',
    'understanding customer needs': 'kliendi vajaduste mõistmist',
    'and situation': 'ja olukorda',
    'There is room': 'Seal on ruumi',
    'for improvement here': 'parandamiseks siin',
    'as you did not': 'kuna sa ei teinud',
    'ask enough questions': 'piisavalt küsimusi',
    'about customer needs': 'kliendi vajaduste kohta',
    'or situation': 'või olukorda',
    'Always remember': 'Alati mäleta',
    'to ask open questions': 'küsida avatud küsimusi',
    'to gather more information': 'et koguda rohkem teavet',
    'When presenting': 'Kui esitad',
    'your products': 'oma tooteid',
    'it\'s important': 'see on oluline',
    'to provide clear': 'pakkuda selge',
    'concise and relevant': 'konkreetne ja asjakohane',
    'information': 'informatsiooni',
    'Instead of saying': 'Selle asemel et öelda',
    'everything': 'kõike',
    'try to mention': 'proovi mainida',
    'specific features': 'spetsiifilisi funktsioone',
    'of the TV packages': 'TV pakettide',
    'that could benefit': 'mis võiksid kasu',
    'the client': 'kliendile',
    'You seemed to struggle': 'Sa tundusid võitlevat',
    'with handling objections': 'vastuväidete käsitlemisega',
    'or requests': 'või taotlustega',
    'for more information': 'rohkem teavet',
    'Try to anticipate': 'Proovi ennetada',
    'common objections': 'tavalisi vastuväiteid',
    'and prepare': 'ja valmistuda',
    'to answer them': 'neile vastama',
    'If a customer needs': 'Kui klient vajab',
    'more information': 'rohkem teavet',
    'provide it': 'paku seda',
    'in a clear': 'selgelt',
    'and detailed manner': 'ja üksikasjalikult',
    'Your closing techniques': 'Teie sulgemise tehnikad',
    'could use': 'võiksid kasutada',
    'some improvement': 'mõningast parandamist',
    'Instead of waiting': 'Selle asemel et oodata',
    'for the customer': 'kliendilt',
    'to make a decision': 'otsuse tegemist',
    'try to guide them': 'proovi juhtida neid',
    'towards it': 'selle suunas',
    'by summarizing': 'kokkuvõtte tegemisega',
    'the benefits': 'eelised',
    'of your product': 'oma toote',
    'and asking': 'ja küsides',
    'for the sale': 'müügi järele',
    
    // Additional sales-specific translations
    'generally': 'üldiselt',
    'or': 'või',
    'to': 'et',
    'of': 'oma',
    'in a': 'selgelt',
    'and': 'ja',
    'for': 'jaoks',
    'with': 'koos',
    'by': 'poolt',
    'in': 'sisse',
    'on': 'peal',
    'at': 'juures',
    'to the': 'selle',
    'of the': 'oma',
    'and the': 'ja',
    'for the': 'selle',
    'with the': 'selle',
    'by the': 'selle',
    'in the': 'selle',
    'on the': 'selle',
    'at the': 'selle',
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
    
    // Additional common AI feedback patterns
    'Clear introductions': 'Selged tutvustused',
    'Consistency in approach': 'Ühtlane lähenemine',
    'Quick responses': 'Kiired vastused',
    'Need to ask more open-ended questions': 'Vaja küsida rohkem avatud küsimusi',
    'Provide more detailed product information': 'Esitage üksikasjalikumat toote teavet',
    'Improve objection handling and closing techniques': 'Parandage vastuväidete käsitlemist ja sulgemise tehnikaid',
    'Good listening skills': 'Head kuulamise oskused',
    'Professional communication style': 'Professionaalne suhtlusstiil',
    'Effective questioning techniques': 'Tõhusad küsimiste tehnikad',
    'Strong rapport building': 'Tugev suhtluse loomine',
    'Confident presentation': 'Enesekindel esitlus',
    'Adaptive communication': 'Kohanev suhtlus',
    'Customer-focused approach': 'Kliendile keskendunud lähenemine',
    'Solution-oriented mindset': 'Lahendustele orienteeritud mõtlemine',
    'Persuasive techniques': 'Veenevad tehnikad',
    'Active listening': 'Aktiivne kuulamine',
    'Empathetic responses': 'Empaatilised vastused',
    'Clear value proposition': 'Selge väärtuspakkumine',
    'Strong closing attempts': 'Tugevad sulgemise katsed',
    'Effective follow-up': 'Tõhus järelkontroll',
    
    // Stage names
    'opening': 'avamine',
    'discovery': 'avastamine', 
    'presentation': 'esitlus',
    'objectionHandling': 'vastuväidete käsitlemine',
    'closing': 'sulgemine',
    
    // Mixed language patterns that need translation
    'Reio\'s opening in all conversations': 'Reio avamine kõigis vestlustes',
    'Reio\'s discovery stage': 'Reio avastamise etapp',
    'Reio\'s product presentation': 'Reio toote esitlus',
    'Reio\'s product presentación': 'Reio toote esitlus',
    'Reio\'s apertura in all conversations': 'Reio avamine kõigis vestlustes',
    'Reio\'s descubrimiento stage': 'Reio avastamise etapp',
    'Reio doesn\'t effectively handle objections': 'Reio ei käsitle tõhusalt vastuväiteid',
    'Reio doesn\'t effectively move towards closing': 'Reio ei liigu tõhusalt müügi sulgemise poole',
    'Reio doesn\'t effectively move towards cierre': 'Reio ei liigu tõhusalt müügi sulgemise poole',
    'He introduces himself and mentions the product': 'Ta tutvustab ennast ja mainib toodet',
    'he is selling': 'mida ta müüb',
    'which is good': 'mis on hea',
    'However, in': 'Kuid',
    'business communication': 'ärisuhtluses',
    'it\'s often appreciated': 'hinnatakse sageli',
    'if the salesperson': 'kui müügimees',
    'shows interest': 'näitab huvi',
    'in the client': 'klienti',
    'or their business': 'või nende äri',
    'before jumping into': 'enne kui hüppab',
    'the sales pitch': 'müügikõnele',
    'stage needs improvement': 'etapp vajab parandamist',
    'He fails to ask': 'Ta ei suuda küsida',
    'open-ended questions': 'avatud küsimusi',
    'to understand': 'mõista',
    'the customer\'s needs': 'kliendi vajadusi',
    'or situation better': 'või olukorda paremini',
    'fails to ask open-ended questions to understand': 'ei suuda küsida avatud küsimusi mõistmaks',
    'the customer\'s needs or situation better': 'kliendi vajadusi või olukorda paremini',
    'Rather than making assumptions': 'Selle asemel, et teha eeldusi',
    'Reio should inquire about': 'Reio peaks küsima',
    'the customer\'s current': 'kliendi praeguse',
    'TV package': 'TV paketi',
    'or what they are looking for': 'või mida nad otsivad',
    'in a product': 'tootes',
    'is too vague': 'on liiga ebamäärane',
    'Customers asked for more details': 'Kliendid küsid rohkem üksikasju',
    'about the TV packages': 'TV pakettide kohta',
    'and products offered': 'ja pakutud toodete kohta',
    'but Reio did not provide': 'aga Reio ei andnud',
    'sufficient information': 'piisavat teavet',
    'His responses like': 'Tema vastused nagu',
    'are not helpful': 'ei ole kasulikud',
    'for a customer': 'kliendi jaoks',
    'seeking to make': 'kes soovib teha',
    'an informed decision': 'teadliku otsuse',
    'He should elaborate on': 'Ta peaks üksikasjalikumalt rääkima',
    'the features': 'funktsioonidest',
    'benefits': 'eelised',
    'and value': 'ja väärtusest',
    'of his product': 'oma toote',
    'or concerns from customers': 'või kliendite mureid',
    'When customers show': 'Kui kliendid näitavad',
    'hesitance or require': 'kõhklust või vajavad',
    'more information': 'rohkem teavet',
    'Reio should provide': 'Reio peaks andma',
    'more specific details': 'rohkem spetsiifilisi üksikasju',
    'and reassurances': 'ja rahustust',
    'to address their concerns': 'nende murede lahendamiseks',
    'towards closing a sale': 'müügi sulgemise poole',
    'He does not summarize': 'Ta ei võta kokku',
    'the benefits': 'eeliseid',
    'or ask for the sale': 'või küsi müüki',
    'He should practice': 'Ta peaks harjutama',
    'summarizing the main': 'peamiste kokkuvõtet',
    'selling points': 'müügipunkte',
    'and asking for the sale': 'ja müügi küsimist',
    'in a direct yet polite manner': 'otsese, kuid viisaka viisil',
    'considering': 'arvestades',
    'business communication norms': 'ärisuhtluse norme',
    
    // Full paragraph translations for common AI feedback
    'Reio\'s opening in all conversations is clear and to the point, but lacks a personalized touch. He introduces himself and mentions the product he is selling, which is good. However, in Estonian business communication, it\'s often appreciated if the salesperson shows interest in the client or their business before jumping into the sales pitch.': 'Reio avamine kõigis vestlustes on selge ja asjakohane, kuid puudub isiklik puudutus. Ta tutvustab ennast ja mainib toodet, mida ta müüb, mis on hea. Kuid eesti ärisuhtluses hinnatakse sageli, kui müügimees näitab huvi klienti või nende äri vastu enne müügikõnele üleminekut.',
    
    'Reio\'s discovery stage needs improvement. He fails to ask open-ended questions to understand the customer\'s needs or situation better. Rather than making assumptions, Reio should inquire about the customer\'s current TV package or what they are looking for in a product.': 'Reio avastamise etapp vajab parandamist. Ta ei suuda küsida avatud küsimusi, et mõista kliendi vajadusi või olukorda paremini. Selle asemel, et teha eeldusi, peaks Reio küsima kliendi praeguse TV paketi kohta või mida nad tootes otsivad.',
    
    'Reio\'s product presentation is too vague. Customers asked for more details about the TV packages and products offered, but Reio did not provide sufficient information. His responses like \'kõike\' (everything) are not helpful for a customer seeking to make an informed decision. He should elaborate on the features, benefits, and value of his product.': 'Reio toote esitlus on liiga ebamäärane. Kliendid küsid rohkem üksikasju TV pakettide ja pakutud toodete kohta, kuid Reio ei andnud piisavat teavet. Tema vastused nagu "kõike" ei ole kasulikud kliendi jaoks, kes soovib teha teadliku otsuse. Ta peaks üksikasjalikumalt rääkima oma toote funktsioonidest, eelistest ja väärtusest.',
    
    'Reio doesn\'t effectively handle objections or concerns from customers. When customers show hesitance or require more information, Reio should provide more specific details and reassurances to address their concerns.': 'Reio ei käsitle tõhusalt kliendite vastuväiteid ega muret. Kui kliendid näitavad kõhklust või vajavad rohkem teavet, peaks Reio andma rohkem spetsiifilisi üksikasju ja rahustust nende murede lahendamiseks.',
    
    'Reio doesn\'t effectively move towards closing a sale. He does not summarize the benefits of his product or ask for the sale. He should practice summarizing the main selling points and asking for the sale in a direct yet polite manner, considering Estonian business communication norms.': 'Reio ei liigu tõhusalt müügi sulgemise poole. Ta ei võta kokku oma toote eeliseid ega küsi müüki. Ta peaks harjutama peamiste müügipunktide kokkuvõtet ja müügi küsimist otsese, kuid viisaka viisil, arvestades eesti ärisuhtluse norme.',
    
    // Example-related translations
    'In this excerpt': 'Selles väljavõttes',
    'the customer is asking': 'kürib kliendit',
    'for more specifics': 'rohkem üksikasju',
    'about TV packages': 'TV pakettide kohta',
    'but Reio responds with': 'kuid Reio vastab',
    'which is not helpful': 'mis ei ole kasulik',
    'for the customer': 'kliendi jaoks',
    'asking for more specifics': 'rohkem üksikasju kürib',
    'TV packages': 'TV paketid',
    'responds with': 'vastab',
    'not helpful': 'ei ole kasulik',
    'customer': 'klient',
    'excerpt': 'väljavõte',
    'this excerpt': 'see väljavõte',
    'the excerpt': 'väljavõte',
    
    // AI Insights related translations
    'Reio seems to have': 'Reio tundub omavat',
    'a direct and straightforward approach': 'otse ja sirge lähenemine',
    'which can be seen as confident': 'mida võib pidada enesekindlaks',
    'he needs to balance': 'ta peab tasakaalustama',
    'with more empathy': 'rohkem empaatiaga',
    'and attention to': 'ja tähelepanu',
    'customer needs': 'kliendi vajadustele',
    'communication style': 'suhtlemise stiil',
    'is brief and to the point': 'on lühike ja asjakohane',
    'but lacks detail': 'kuid puudub detailid',
    'and depth': 'ja sügavus',
    'He should work on': 'Ta peaks töötama',
    'providing more comprehensive': 'pakkuma rohkem põhjalikku',
    'responses': 'vastuseid',
    'and demonstrating': 'ja näitama',
    'product knowledge': 'toote tundmist',
    'Improving product knowledge': 'Toote tundmise parandamine',
    'Practice objection handling': 'Harjuta vastuväidete käsitlemist',
    'techniques': 'tehnikaid',
    'Developing closing': 'Sulgemise arendamine',
    'techniques': 'tehnikaid',
    'Role-play sales conversations': 'Rollimäng müügivestlusi',
    'with a focus on': 'keskendudes',
    'the discovery': 'avastamisele',
    'and presentation stages': 'ja esitluse etappidele',
    'Study product details': 'Õpi toote üksikasju',
    'to provide in-depth': 'et pakkuda põhjalikku',
    'information': 'informatsiooni',
    'Learn and practice': 'Õpi ja harjuta',
    'effective closing': 'tõhusat sulgemist',
    'techniques appropriate': 'tehnikaid sobivaid',
    'for Estonian business culture': 'eesti ärikultuurile',
    'Next Steps': 'Järgmised sammud',
    'Recommended Focus Areas': 'Soovitatavad fookuse alad',
    'Personality Insights': 'Isiksuse vihjed',
    'Communication Style': 'Suhtlemise stiil',
    
    // Conversation summary translations
    'Vestluse Kokkuvõte': 'Vestluse kokkuvõte',
    'Practice with Mariana Villegas': 'Harjutus Mariana Villegasega',
    'general': 'üldine',
    'Raskusaste': 'Raskusaste',
    'Keskmine': 'Keskmine',
    'Kestus': 'Kestus',
    'sõnumid': 'sõnumid',
    'Kogutulemus': 'Kogutulemus',
    'introduction': 'sissejuhatus',
    'mapping': 'kaardistamine',
    'product Presentation': 'toote esitlus',
    'objection Handling': 'vastuväidete käsitlemine',
    'close': 'sulgemine',
    'AI Tagasiside': 'AI tagasiside',
    
    // AI Feedback content translations
    'The salesperson did well in the introduction phase by greeting the client and introducing themselves. However, they missed the opportunity to properly map the client\'s needs and preferences. The client was interested in learning more about the TV packages, channels, services, quality, user support, and potential benefits for their large family. The salesperson should have engaged in a mapping phase to understand the client\'s requirements better. Additionally, the salesperson could have provided a more detailed product presentation, addressed the client\'s questions about package contents, additional services, and discounts, and handled the client\'s request for more information effectively. It\'s important to actively listen to the client\'s needs, ask probing questions, and tailor the presentation to match those needs. The conversation did not end early, but the salesperson missed opportunities to fully engage the client and address their concerns.': 'Müügimees tegi hästi sissejuhatuse faasis, tervitades klienti ja tutvustades ennast. Kuid nad jätsid kasutamata võimaluse korralikult kaardistada kliendi vajadusi ja eelistusi. Klient oli huvitatud rohkem teadmast TV pakettidest, kanalitest, teenustest, kvaliteedist, kasutajatugist ja võimalikest kasudest oma suure pere jaoks. Müügimees oleks pidanud osalema kaardistamise faasis, et paremini mõista kliendi nõudeid. Lisaks oleks müügimees võinud pakkuda põhjalikumat toote esitlust, vastata kliendi küsimustele paketi sisu, täiendavate teenuste ja allahindluste kohta ning tõhusalt käsitleda kliendi palvet rohkem teavet. Oluline on aktiivselt kuulata kliendi vajadusi, küsida uurivaid küsimusi ja kohandada esitlust nende vajadustega. Vestlus ei lõppenud varakult, kuid müügimees jätsid kasutamata võimalusi täielikult kaasata klienti ja käsitleda nende muret.',
    
    'The salesperson did well in the introduction phase': 'Müügimees tegi hästi sissejuhatuse faasis',
    'by greeting the client and introducing themselves': 'tervitades klienti ja tutvustades ennast',
    'However, they missed the opportunity': 'Kuid nad jätsid kasutamata võimaluse',
    'to properly map the client\'s needs': 'korralikult kaardistada kliendi vajadusi',
    'and preferences': 'ja eelistusi',
    'The client was interested in learning more': 'Klient oli huvitatud rohkem õppimast',
    'about the TV packages, channels, services': 'TV pakettidest, kanalitest, teenustest',
    'quality, user support': 'kvaliteedist, kasutajatugist',
    'and potential benefits': 'ja võimalikest kasudest',
    'for their large family': 'oma suure pere jaoks',
    'The salesperson should have engaged': 'Müügimees oleks pidanud osalema',
    'in a mapping phase': 'kaardistamise faasis',
    'to understand the client\'s requirements better': 'et paremini mõista kliendi nõudeid',
    'Additionally, the salesperson could have provided': 'Lisaks oleks müügimees võinud pakkuda',
    'a more detailed product presentation': 'põhjalikumat toote esitlust',
    'addressed the client\'s questions about': 'vastata kliendi küsimustele',
    'package contents, additional services, and discounts': 'paketi sisu, täiendavate teenuste ja allahindluste kohta',
    'and handled the client\'s request': 'ning tõhusalt käsitleda kliendi palvet',
    'for more information effectively': 'rohkem teavet',
    'It\'s important to actively listen': 'Oluline on aktiivselt kuulata',
    'to the client\'s needs': 'kliendi vajadusi',
    'ask probing questions': 'küsida uurivaid küsimusi',
    'and tailor the presentation': 'ja kohandada esitlust',
    'to match those needs': 'nende vajadustega',
    'The conversation did not end early': 'Vestlus ei lõppenud varakult',
    'but the salesperson missed opportunities': 'kuid müügimees jätsid kasutamata võimalusi',
    'to fully engage the client': 'täielikult kaasata klienti',
    'and address their concerns': 'ja käsitleda nende muret',
    
    // Additional common phrases
    'Estonian business communication': 'eesti ärisuhtlus',
    'Estonian business communication norms': 'eesti ärisuhtluse normid',
    'in Estonian business communication': 'eesti ärisuhtluses',
    'Estonian speakers': 'eesti keele kõnelejad',
    'for Estonian speakers': 'eesti keele kõnelejate jaoks',
    'Estonian language': 'eesti keel',
    'in Estonian': 'eesti keeles',
    
    // Missing connecting words and phrases
    'is clear and to the point': 'on selge ja asjakohane',
    'but lacks a personalized touch': 'kuid puudub isiklik puudutus',
    'but lacks': 'kuid puudub',
    'a personalized touch': 'isiklik puudutus',
    'personalized touch': 'isiklik puudutus',
    'clear and to the point': 'selge ja asjakohane',
    'and to the point': 'ja asjakohane',
    'to the point': 'asjakohane',
    'However': 'Kuid',
    'however': 'kuid',
    'but': 'kuid',
    'and': 'ja',
    'or': 'või',
    'is': 'on',
    'are': 'on',
    'was': 'oli',
    'were': 'olid',
    'has': 'on',
    'have': 'on',
    'had': 'oli',
    'will': 'saab',
    'would': 'oleks',
    'should': 'peaks',
    'could': 'võiks',
    'must': 'peab',
    'may': 'võib',
    'might': 'võiks',
    'can': 'saab',
    'cannot': 'ei saa',
    'can\'t': 'ei saa',
    'do not': 'ei tee',
    'don\'t': 'ei tee',
    'does not': 'ei tee',
    'doesn\'t': 'ei tee',
    'did not': 'ei teinud',
    'didn\'t': 'ei teinud',
    'will not': 'ei tee',
    'won\'t': 'ei tee',
    'would not': 'ei teeks',
    'wouldn\'t': 'ei teeks',
    'should not': 'ei peaks',
    'shouldn\'t': 'ei peaks',
    'could not': 'ei saaks',
    'couldn\'t': 'ei saaks',
    'must not': 'ei tohi',
    'mustn\'t': 'ei tohi',
    'may not': 'ei tohi',
    'might not': 'ei võiks',
    'mightn\'t': 'ei võiks',
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
    
    // Sales-context Spanish translations
    'Your': 'Tu',
    'your': 'tu',
    'were': 'fueron',
    'was': 'fue',
    'is': 'es',
    'are': 'son',
    'clear': 'claro',
    'but': 'pero',
    'lacked': 'faltó',
    'enthusiasm': 'entusiasmo',
    'or': 'o',
    'an': 'un',
    'engaging': 'atractivo',
    'hook': 'gancho',
    'Try': 'Intenta',
    'try': 'intenta',
    'to': 'a',
    'make': 'hacer',
    'statement': 'declaración',
    'more': 'más',
    'interesting': 'interesante',
    'grab': 'capturar',
    'attention': 'atención',
    'about': 'sobre',
    'understanding': 'entender',
    'customer': 'cliente',
    'needs': 'necesidades',
    'and': 'y',
    'situation': 'situación',
    'There': 'Hay',
    'room': 'espacio',
    'for': 'para',
    'improvement': 'mejora',
    'here': 'aquí',
    'as': 'como',
    'you': 'tú',
    'did': 'hiciste',
    'not': 'no',
    'ask': 'preguntar',
    'enough': 'suficientes',
    'questions': 'preguntas',
    'many': 'muchas',
    'Always': 'Siempre',
    'remember': 'recuerda',
    'open': 'abiertas',
    'gather': 'recopilar',
    'information': 'información',
    'When': 'Cuando',
    'presenting': 'presentando',
    'products': 'productos',
    'it\'s': 'es',
    'important': 'importante',
    'provide': 'proporcionar',
    'concise': 'conciso',
    'relevant': 'relevante',
    'Instead': 'En lugar',
    'of': 'de',
    'saying': 'decir',
    'everything': 'todo',
    'mention': 'mencionar',
    'specific': 'específicas',
    'features': 'características',
    'that': 'que',
    'could': 'podría',
    'benefit': 'beneficiar',
    'the': 'el',
    'client': 'cliente',
    'You': 'Tú',
    'seemed': 'pareciste',
    'struggle': 'luchar',
    'with': 'con',
    'handling': 'manejo',
    'requests': 'solicitudes',
    'anticipate': 'anticipar',
    'common': 'comunes',
    'prepare': 'preparar',
    'answer': 'responder',
    'them': 'ellos',
    'If': 'Si',
    'provide': 'proporcionar',
    'it': 'lo',
    'in': 'en',
    'a': 'una',
    'detailed': 'detallada',
    'manner': 'manera',
    'techniques': 'técnicas',
    'use': 'usar',
    'some': 'algunas',
    'Instead': 'En lugar',
    'waiting': 'esperando',
    'for': 'para',
    'make': 'hacer',
    'a': 'una',
    'decision': 'decisión',
    'guide': 'guiar',
    'them': 'ellos',
    'towards': 'hacia',
    'by': 'por',
    'summarizing': 'resumiendo',
    'benefits': 'beneficios',
    'product': 'producto',
    'sales': 'ventas',
    'question': 'pregunta',
    'generally': 'generalmente',
    
    // Common Spanish sales phrases
    'Your opening were clear': 'Tu apertura fue clara',
    'but lacked enthusiasm': 'pero faltó entusiasmo',
    'or an engaging hook': 'o un gancho atractivo',
    'Try to make': 'Intenta hacer',
    'your opening statement': 'tu declaración de apertura',
    'more interesting': 'más interesante',
    'to grab': 'para capturar',
    'the client\'s attention': 'la atención del cliente',
    'Discovery is about': 'El descubrimiento se trata',
    'understanding customer needs': 'de entender las necesidades del cliente',
    'and situation': 'y situación',
    'There is room': 'Hay espacio',
    'for improvement here': 'para mejora aquí',
    'as you did not': 'como no hiciste',
    'ask enough questions': 'suficientes preguntas',
    'about customer needs': 'sobre las necesidades del cliente',
    'or situation': 'o situación',
    'Always remember': 'Siempre recuerda',
    'to ask open questions': 'hacer preguntas abiertas',
    'to gather more information': 'para recopilar más información',
    'When presenting': 'Cuando presentes',
    'your products': 'tus productos',
    'it\'s important': 'es importante',
    'to provide clear': 'proporcionar claro',
    'concise and relevant': 'conciso y relevante',
    'information': 'información',
    'Instead of saying': 'En lugar de decir',
    'everything': 'todo',
    'try to mention': 'intenta mencionar',
    'specific features': 'características específicas',
    'of the TV packages': 'de los paquetes de TV',
    'that could benefit': 'que podrían beneficiar',
    'the client': 'al cliente',
    'You seemed to struggle': 'Pareciste luchar',
    'with handling objections': 'con el manejo de objeciones',
    'or requests': 'o solicitudes',
    'for more information': 'para más información',
    'Try to anticipate': 'Intenta anticipar',
    'common objections': 'objeciones comunes',
    'and prepare': 'y preparar',
    'to answer them': 'para responderlas',
    'If a customer needs': 'Si un cliente necesita',
    'more information': 'más información',
    'provide it': 'proporciónala',
    'in a clear': 'de manera clara',
    'and detailed manner': 'y detallada',
    'Your closing techniques': 'Tus técnicas de cierre',
    'could use': 'podrían usar',
    'some improvement': 'algunas mejoras',
    'Instead of waiting': 'En lugar de esperar',
    'for the customer': 'al cliente',
    'to make a decision': 'para tomar una decisión',
    'try to guide them': 'intenta guiarlos',
    'towards it': 'hacia ella',
    'by summarizing': 'resumiendo',
    'the benefits': 'los beneficios',
    'of your product': 'de tu producto',
    'and asking': 'y preguntando',
    'for the sale': 'por la venta',
    
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
    
    // Additional common AI feedback patterns
    'Clear introductions': 'Introducciones claras',
    'Consistency in approach': 'Consistencia en el enfoque',
    'Quick responses': 'Respuestas rápidas',
    'Need to ask more open-ended questions': 'Necesitas hacer más preguntas abiertas',
    'Provide more detailed product information': 'Proporciona información más detallada del producto',
    'Improve objection handling and closing techniques': 'Mejora el manejo de objeciones y las técnicas de cierre',
    'Good listening skills': 'Buenas habilidades de escucha',
    'Professional communication style': 'Estilo de comunicación profesional',
    'Effective questioning techniques': 'Técnicas efectivas de cuestionamiento',
    'Strong rapport building': 'Fuerte construcción de relación',
    'Confident presentation': 'Presentación confiada',
    'Adaptive communication': 'Comunicación adaptativa',
    'Customer-focused approach': 'Enfoque centrado en el cliente',
    'Solution-oriented mindset': 'Mentalidad orientada a soluciones',
    'Persuasive techniques': 'Técnicas persuasivas',
    'Active listening': 'Escucha activa',
    'Empathetic responses': 'Respuestas empáticas',
    'Clear value proposition': 'Propuesta de valor clara',
    'Strong closing attempts': 'Fuertes intentos de cierre',
    'Effective follow-up': 'Seguimiento efectivo',
    
    // Stage names
    'opening': 'apertura',
    'discovery': 'descubrimiento', 
    'presentation': 'presentación',
    'objectionHandling': 'manejo de objeciones',
    'closing': 'cierre',
    
    // Mixed language patterns that need translation
    'Reio\'s opening in all conversations': 'La apertura de Reio en todas las conversaciones',
    'Reio\'s discovery stage': 'La etapa de descubrimiento de Reio',
    'Reio\'s product presentation': 'La presentación del producto de Reio',
    'Reio\'s product presentación': 'La presentación del producto de Reio',
    'Reio\'s apertura in all conversations': 'La apertura de Reio en todas las conversaciones',
    'Reio\'s descubrimiento stage': 'La etapa de descubrimiento de Reio',
    'Reio doesn\'t effectively handle objections': 'Reio no maneja efectivamente las objeciones',
    'Reio doesn\'t effectively move towards closing': 'Reio no se mueve efectivamente hacia el cierre',
    'Reio doesn\'t effectively move towards cierre': 'Reio no se mueve efectivamente hacia el cierre',
    'He introduces himself and mentions the product': 'Se presenta y menciona el producto',
    'he is selling': 'que está vendiendo',
    'which is good': 'lo cual es bueno',
    'However, in': 'Sin embargo, en',
    'business communication': 'comunicación empresarial',
    'it\'s often appreciated': 'a menudo se aprecia',
    'if the salesperson': 'si el vendedor',
    'shows interest': 'muestra interés',
    'in the client': 'en el cliente',
    'or their business': 'o su negocio',
    'before jumping into': 'antes de saltar a',
    'the sales pitch': 'el discurso de ventas',
    'stage needs improvement': 'etapa necesita mejora',
    'He fails to ask': 'No logra hacer',
    'open-ended questions': 'preguntas abiertas',
    'to understand': 'para entender',
    'the customer\'s needs': 'las necesidades del cliente',
    'or situation better': 'o situación mejor',
    'Rather than making assumptions': 'En lugar de hacer suposiciones',
    'Reio should inquire about': 'Reio debería preguntar sobre',
    'the customer\'s current': 'la situación actual del cliente',
    'TV package': 'paquete de TV',
    'or what they are looking for': 'o qué están buscando',
    'in a product': 'en un producto',
    'is too vague': 'es demasiado vaga',
    'Customers asked for more details': 'Los clientes pidieron más detalles',
    'about the TV packages': 'sobre los paquetes de TV',
    'and products offered': 'y productos ofrecidos',
    'but Reio did not provide': 'pero Reio no proporcionó',
    'sufficient information': 'información suficiente',
    'His responses like': 'Sus respuestas como',
    'are not helpful': 'no son útiles',
    'for a customer': 'para un cliente',
    'seeking to make': 'que busca hacer',
    'an informed decision': 'una decisión informada',
    'He should elaborate on': 'Debería elaborar sobre',
    'the features': 'las características',
    'benefits': 'beneficios',
    'and value': 'y valor',
    'of his product': 'de su producto',
    'or concerns from customers': 'o preocupaciones de los clientes',
    'When customers show': 'Cuando los clientes muestran',
    'hesitance or require': 'vacilación o requieren',
    'more information': 'más información',
    'Reio should provide': 'Reio debería proporcionar',
    'more specific details': 'detalles más específicos',
    'and reassurances': 'y tranquilidades',
    'to address their concerns': 'para abordar sus preocupaciones',
    'towards closing a sale': 'hacia cerrar una venta',
    'He does not summarize': 'No resume',
    'the benefits': 'los beneficios',
    'or ask for the sale': 'o pedir la venta',
    'He should practice': 'Debería practicar',
    'summarizing the main': 'resumiendo los principales',
    'selling points': 'puntos de venta',
    'and asking for the sale': 'y pidiendo la venta',
    'in a direct yet polite manner': 'de manera directa pero educada',
    'considering': 'considerando',
    'business communication norms': 'normas de comunicación empresarial',
    
    // Full paragraph translations for common AI feedback
    'Reio\'s opening in all conversations is clear and to the point, but lacks a personalized touch. He introduces himself and mentions the product he is selling, which is good. However, in Estonian business communication, it\'s often appreciated if the salesperson shows interest in the client or their business before jumping into the sales pitch.': 'La apertura de Reio en todas las conversaciones es clara y directa, pero carece de un toque personalizado. Se presenta y menciona el producto que está vendiendo, lo cual es bueno. Sin embargo, en la comunicación empresarial estonia, a menudo se aprecia si el vendedor muestra interés en el cliente o su negocio antes de pasar al discurso de ventas.',
    
    'Reio\'s discovery stage needs improvement. He fails to ask open-ended questions to understand the customer\'s needs or situation better. Rather than making assumptions, Reio should inquire about the customer\'s current TV package or what they are looking for in a product.': 'La etapa de descubrimiento de Reio necesita mejoras. No logra hacer preguntas abiertas para entender mejor las necesidades o situación del cliente. En lugar de hacer suposiciones, Reio debería preguntar sobre el paquete de TV actual del cliente o qué están buscando en un producto.',
    
    'Reio\'s product presentation is too vague. Customers asked for more details about the TV packages and products offered, but Reio did not provide sufficient information. His responses like \'kõike\' (everything) are not helpful for a customer seeking to make an informed decision. He should elaborate on the features, benefits, and value of his product.': 'La presentación del producto de Reio es demasiado vaga. Los clientes pidieron más detalles sobre los paquetes de TV y productos ofrecidos, pero Reio no proporcionó información suficiente. Sus respuestas como "kõike" (todo) no son útiles para un cliente que busca tomar una decisión informada. Debería elaborar sobre las características, beneficios y valor de su producto.',
    
    'Reio doesn\'t effectively handle objections or concerns from customers. When customers show hesitance or require more information, Reio should provide more specific details and reassurances to address their concerns.': 'Reio no maneja efectivamente las objeciones o preocupaciones de los clientes. Cuando los clientes muestran vacilación o requieren más información, Reio debería proporcionar detalles más específicos y tranquilidades para abordar sus preocupaciones.',
    
    'Reio doesn\'t effectively move towards closing a sale. He does not summarize the benefits of his product or ask for the sale. He should practice summarizing the main selling points and asking for the sale in a direct yet polite manner, considering Estonian business communication norms.': 'Reio no se mueve efectivamente hacia el cierre de una venta. No resume los beneficios de su producto ni pide la venta. Debería practicar resumiendo los principales puntos de venta y pidiendo la venta de manera directa pero educada, considerando las normas de comunicación empresarial estonia.',
    
    // Example-related translations
    'In this excerpt': 'En este extracto',
    'the customer is asking': 'el cliente está pidiendo',
    'for more specifics': 'más detalles específicos',
    'about TV packages': 'sobre paquetes de TV',
    'but Reio responds with': 'pero Reio responde con',
    'which is not helpful': 'lo cual no es útil',
    'for the customer': 'para el cliente',
    'asking for more specifics': 'pidiendo más detalles específicos',
    'TV packages': 'paquetes de TV',
    'responds with': 'responde con',
    'not helpful': 'no es útil',
    'customer': 'cliente',
    'excerpt': 'extracto',
    'this excerpt': 'este extracto',
    'the excerpt': 'el extracto',
    
    // AI Insights related translations
    'Reio seems to have': 'Reio parece tener',
    'a direct and straightforward approach': 'un enfoque directo y claro',
    'which can be seen as confident': 'que puede verse como confiado',
    'he needs to balance': 'necesita equilibrar',
    'with more empathy': 'con más empatía',
    'and attention to': 'y atención a',
    'customer needs': 'las necesidades del cliente',
    'communication style': 'estilo de comunicación',
    'is brief and to the point': 'es breve y directo',
    'but lacks detail': 'pero carece de detalle',
    'and depth': 'y profundidad',
    'He should work on': 'Debería trabajar en',
    'providing more comprehensive': 'proporcionar respuestas más completas',
    'responses': 'respuestas',
    'and demonstrating': 'y demostrar',
    'product knowledge': 'conocimiento del producto',
    'Improving product knowledge': 'Mejorar el conocimiento del producto',
    'Practice objection handling': 'Practicar el manejo de objeciones',
    'techniques': 'técnicas',
    'Developing closing': 'Desarrollar técnicas de cierre',
    'techniques': 'técnicas',
    'Role-play sales conversations': 'Simulación de conversaciones de ventas',
    'with a focus on': 'con un enfoque en',
    'the discovery': 'el descubrimiento',
    'and presentation stages': 'y las etapas de presentación',
    'Study product details': 'Estudiar los detalles del producto',
    'to provide in-depth': 'para proporcionar información profunda',
    'information': 'información',
    'Learn and practice': 'Aprender y practicar',
    'effective closing': 'cierre efectivo',
    'techniques appropriate': 'técnicas apropiadas',
    'for Estonian business culture': 'para la cultura empresarial estonia',
    'Next Steps': 'Próximos pasos',
    'Recommended Focus Areas': 'Áreas de enfoque recomendadas',
    'Personality Insights': 'Insights de personalidad',
    'Communication Style': 'Estilo de comunicación',
    
    // Conversation summary translations
    'Vestluse Kokkuvõte': 'Resumen de conversación',
    'Practice with Mariana Villegas': 'Práctica con Mariana Villegas',
    'general': 'general',
    'Raskusaste': 'Nivel de dificultad',
    'Keskmine': 'Medio',
    'Kestus': 'Duración',
    'sõnumid': 'mensajes',
    'Kogutulemus': 'Puntuación total',
    'introduction': 'introducción',
    'mapping': 'mapeo',
    'product Presentation': 'presentación del producto',
    'objection Handling': 'manejo de objeciones',
    'close': 'cierre',
    'AI Tagasiside': 'Retroalimentación de IA',
    
    // AI Feedback content translations
    'The salesperson did well in the introduction phase by greeting the client and introducing themselves. However, they missed the opportunity to properly map the client\'s needs and preferences. The client was interested in learning more about the TV packages, channels, services, quality, user support, and potential benefits for their large family. The salesperson should have engaged in a mapping phase to understand the client\'s requirements better. Additionally, the salesperson could have provided a more detailed product presentation, addressed the client\'s questions about package contents, additional services, and discounts, and handled the client\'s request for more information effectively. It\'s important to actively listen to the client\'s needs, ask probing questions, and tailor the presentation to match those needs. The conversation did not end early, but the salesperson missed opportunities to fully engage the client and address their concerns.': 'El vendedor lo hizo bien en la fase de introducción saludando al cliente y presentándose. Sin embargo, perdieron la oportunidad de mapear adecuadamente las necesidades y preferencias del cliente. El cliente estaba interesado en aprender más sobre los paquetes de TV, canales, servicios, calidad, soporte al usuario y beneficios potenciales para su familia numerosa. El vendedor debería haber participado en una fase de mapeo para entender mejor los requerimientos del cliente. Además, el vendedor podría haber proporcionado una presentación del producto más detallada, abordado las preguntas del cliente sobre el contenido del paquete, servicios adicionales y descuentos, y manejado efectivamente la solicitud del cliente de más información. Es importante escuchar activamente las necesidades del cliente, hacer preguntas exploratorias y adaptar la presentación para que coincida con esas necesidades. La conversación no terminó temprano, pero el vendedor perdió oportunidades de involucrar completamente al cliente y abordar sus preocupaciones.',
    
    'The salesperson did well in the introduction phase': 'El vendedor lo hizo bien en la fase de introducción',
    'by greeting the client and introducing themselves': 'saludando al cliente y presentándose',
    'However, they missed the opportunity': 'Sin embargo, perdieron la oportunidad',
    'to properly map the client\'s needs': 'de mapear adecuadamente las necesidades del cliente',
    'and preferences': 'y preferencias',
    'The client was interested in learning more': 'El cliente estaba interesado en aprender más',
    'about the TV packages, channels, services': 'sobre los paquetes de TV, canales, servicios',
    'quality, user support': 'calidad, soporte al usuario',
    'and potential benefits': 'y beneficios potenciales',
    'for their large family': 'para su familia numerosa',
    'The salesperson should have engaged': 'El vendedor debería haber participado',
    'in a mapping phase': 'en una fase de mapeo',
    'to understand the client\'s requirements better': 'para entender mejor los requerimientos del cliente',
    'Additionally, the salesperson could have provided': 'Además, el vendedor podría haber proporcionado',
    'a more detailed product presentation': 'una presentación del producto más detallada',
    'addressed the client\'s questions about': 'abordado las preguntas del cliente sobre',
    'package contents, additional services, and discounts': 'contenido del paquete, servicios adicionales y descuentos',
    'and handled the client\'s request': 'y manejado la solicitud del cliente',
    'for more information effectively': 'de más información efectivamente',
    'It\'s important to actively listen': 'Es importante escuchar activamente',
    'to the client\'s needs': 'las necesidades del cliente',
    'ask probing questions': 'hacer preguntas exploratorias',
    'and tailor the presentation': 'y adaptar la presentación',
    'to match those needs': 'para que coincida con esas necesidades',
    'The conversation did not end early': 'La conversación no terminó temprano',
    'but the salesperson missed opportunities': 'pero el vendedor perdió oportunidades',
    'to fully engage the client': 'de involucrar completamente al cliente',
    'and address their concerns': 'y abordar sus preocupaciones',
    
    // Additional common phrases
    'Estonian business communication': 'comunicación empresarial estonia',
    'Estonian business communication norms': 'normas de comunicación empresarial estonia',
    'in Estonian business communication': 'en la comunicación empresarial estonia',
    'Estonian speakers': 'hablantes de estonio',
    'for Estonian speakers': 'para hablantes de estonio',
    'Estonian language': 'idioma estonio',
    'in Estonian': 'en estonio',
    
    // Missing connecting words and phrases
    'is clear and to the point': 'es claro y directo',
    'but lacks a personalized touch': 'pero carece de un toque personalizado',
    'but lacks': 'pero carece de',
    'a personalized touch': 'un toque personalizado',
    'personalized touch': 'toque personalizado',
    'clear and to the point': 'claro y directo',
    'and to the point': 'y directo',
    'to the point': 'directo',
    'However': 'Sin embargo',
    'however': 'sin embargo',
    'but': 'pero',
    'and': 'y',
    'or': 'o',
    'is': 'es',
    'are': 'son',
    'was': 'era',
    'were': 'eran',
    'has': 'ha',
    'have': 'tiene',
    'had': 'había',
    'will': 'será',
    'would': 'sería',
    'should': 'debería',
    'could': 'podría',
    'must': 'debe',
    'may': 'puede',
    'might': 'podría',
    'can': 'puede',
    'cannot': 'no puede',
    'can\'t': 'no puede',
    'do not': 'no hace',
    'don\'t': 'no hace',
    'does not': 'no hace',
    'doesn\'t': 'no hace',
    'did not': 'no hizo',
    'didn\'t': 'no hizo',
    'will not': 'no hará',
    'won\'t': 'no hará',
    'would not': 'no haría',
    'wouldn\'t': 'no haría',
    'should not': 'no debería',
    'shouldn\'t': 'no debería',
    'could not': 'no podría',
    'couldn\'t': 'no podría',
    'must not': 'no debe',
    'mustn\'t': 'no debe',
    'may not': 'no puede',
    'might not': 'no podría',
    'mightn\'t': 'no podría',
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
    
    // Sales-context Russian translations
    'Your': 'Ваше',
    'your': 'ваше',
    'were': 'были',
    'was': 'было',
    'is': 'есть',
    'are': 'есть',
    'clear': 'ясное',
    'but': 'но',
    'lacked': 'не хватало',
    'enthusiasm': 'энтузиазма',
    'or': 'или',
    'an': 'один',
    'engaging': 'увлекательный',
    'hook': 'крючок',
    'Try': 'Попробуйте',
    'try': 'попробуйте',
    'to': 'чтобы',
    'make': 'сделать',
    'statement': 'заявление',
    'more': 'более',
    'interesting': 'интересное',
    'grab': 'захватить',
    'attention': 'внимание',
    'about': 'о',
    'understanding': 'понимание',
    'customer': 'клиента',
    'needs': 'потребности',
    'and': 'и',
    'situation': 'ситуация',
    'There': 'Там',
    'room': 'место',
    'for': 'для',
    'improvement': 'улучшения',
    'here': 'здесь',
    'as': 'как',
    'you': 'вы',
    'did': 'делали',
    'not': 'не',
    'ask': 'задавать',
    'enough': 'достаточно',
    'questions': 'вопросов',
    'many': 'много',
    'Always': 'Всегда',
    'remember': 'помните',
    'open': 'открытые',
    'gather': 'собирать',
    'information': 'информацию',
    'When': 'Когда',
    'presenting': 'представляя',
    'products': 'продукты',
    'it\'s': 'это',
    'important': 'важно',
    'provide': 'предоставлять',
    'concise': 'краткое',
    'relevant': 'релевантная',
    'Instead': 'Вместо',
    'of': 'того',
    'saying': 'говорить',
    'everything': 'все',
    'mention': 'упомянуть',
    'specific': 'конкретные',
    'features': 'функции',
    'that': 'что',
    'could': 'могли',
    'benefit': 'принести пользу',
    'the': 'клиенту',
    'client': 'клиенту',
    'You': 'Вы',
    'seemed': 'казались',
    'struggle': 'бороться',
    'with': 'с',
    'handling': 'обработкой',
    'requests': 'запросов',
    'anticipate': 'предвидеть',
    'common': 'общие',
    'prepare': 'подготовить',
    'answer': 'отвечать',
    'them': 'им',
    'If': 'Если',
    'provide': 'предоставить',
    'it': 'это',
    'in': 'в',
    'a': 'одну',
    'detailed': 'подробную',
    'manner': 'манеру',
    'techniques': 'техники',
    'use': 'использовать',
    'some': 'некоторые',
    'Instead': 'Вместо',
    'waiting': 'ожидания',
    'for': 'от',
    'make': 'принять',
    'a': 'одно',
    'decision': 'решение',
    'guide': 'направить',
    'them': 'их',
    'towards': 'к',
    'by': 'путем',
    'summarizing': 'подведения итогов',
    'benefits': 'преимущества',
    'product': 'продукта',
    'sales': 'продаж',
    'question': 'вопрос',
    'generally': 'в целом',
    
    // Common Russian sales phrases
    'Your opening were clear': 'Ваше вступление было ясным',
    'but lacked enthusiasm': 'но не хватало энтузиазма',
    'or an engaging hook': 'или увлекательного крючка',
    'Try to make': 'Попробуйте сделать',
    'your opening statement': 'ваше вступительное заявление',
    'more interesting': 'более интересным',
    'to grab': 'чтобы захватить',
    'the client\'s attention': 'внимание клиента',
    'Discovery is about': 'Выяснение заключается в',
    'understanding customer needs': 'понимании потребностей клиента',
    'and situation': 'и ситуации',
    'There is room': 'Есть место',
    'for improvement here': 'для улучшения здесь',
    'as you did not': 'как вы не',
    'ask enough questions': 'задавали достаточно вопросов',
    'about customer needs': 'о потребностях клиента',
    'or situation': 'или ситуации',
    'Always remember': 'Всегда помните',
    'to ask open questions': 'задавать открытые вопросы',
    'to gather more information': 'чтобы собрать больше информации',
    'When presenting': 'При представлении',
    'your products': 'ваших продуктов',
    'it\'s important': 'важно',
    'to provide clear': 'предоставлять ясную',
    'concise and relevant': 'краткую и релевантную',
    'information': 'информацию',
    'Instead of saying': 'Вместо того чтобы говорить',
    'everything': 'все',
    'try to mention': 'попробуйте упомянуть',
    'specific features': 'конкретные функции',
    'of the TV packages': 'пакетов ТВ',
    'that could benefit': 'которые могли бы принести пользу',
    'the client': 'клиенту',
    'You seemed to struggle': 'Вы казались борющимися',
    'with handling objections': 'с обработкой возражений',
    'or requests': 'или запросов',
    'for more information': 'для получения дополнительной информации',
    'Try to anticipate': 'Попробуйте предвидеть',
    'common objections': 'общие возражения',
    'and prepare': 'и подготовить',
    'to answer them': 'ответы на них',
    'If a customer needs': 'Если клиент нуждается',
    'more information': 'в дополнительной информации',
    'provide it': 'предоставьте ее',
    'in a clear': 'в ясной',
    'and detailed manner': 'и подробной манере',
    'Your closing techniques': 'Ваши техники закрытия',
    'could use': 'могли бы использовать',
    'some improvement': 'некоторые улучшения',
    'Instead of waiting': 'Вместо ожидания',
    'for the customer': 'от клиента',
    'to make a decision': 'принятия решения',
    'try to guide them': 'попробуйте направить их',
    'towards it': 'к нему',
    'by summarizing': 'путем подведения итогов',
    'the benefits': 'преимущества',
    'of your product': 'вашего продукта',
    'and asking': 'и спрашивая',
    'for the sale': 'о продаже',
    
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
    
    // Additional common AI feedback patterns
    'Clear introductions': 'Четкие введения',
    'Consistency in approach': 'Последовательность в подходе',
    'Quick responses': 'Быстрые ответы',
    'Need to ask more open-ended questions': 'Нужно задавать больше открытых вопросов',
    'Provide more detailed product information': 'Предоставляйте более подробную информацию о продукте',
    'Improve objection handling and closing techniques': 'Улучшите работу с возражениями и техники закрытия',
    'Good listening skills': 'Хорошие навыки слушания',
    'Professional communication style': 'Профессиональный стиль общения',
    'Effective questioning techniques': 'Эффективные техники задавания вопросов',
    'Strong rapport building': 'Сильное построение отношений',
    'Confident presentation': 'Уверенная презентация',
    'Adaptive communication': 'Адаптивное общение',
    'Customer-focused approach': 'Подход, ориентированный на клиента',
    'Solution-oriented mindset': 'Мышление, ориентированное на решения',
    'Persuasive techniques': 'Убедительные техники',
    'Active listening': 'Активное слушание',
    'Empathetic responses': 'Эмпатичные ответы',
    'Clear value proposition': 'Четкое ценностное предложение',
    'Strong closing attempts': 'Сильные попытки закрытия',
    'Effective follow-up': 'Эффективный последующий контроль',
    
    // Stage names
    'opening': 'начало',
    'discovery': 'исследование', 
    'presentation': 'презентация',
    'objectionHandling': 'работа с возражениями',
    'closing': 'закрытие',
    
    // Mixed language patterns that need translation
    'Reio\'s opening in all conversations': 'Начало Реио во всех разговорах',
    'Reio\'s discovery stage': 'Этап исследования Реио',
    'Reio\'s product presentation': 'Презентация продукта Реио',
    'Reio\'s product presentación': 'Презентация продукта Реио',
    'Reio\'s apertura in all conversations': 'Начало Реио во всех разговорах',
    'Reio\'s descubrimiento stage': 'Этап исследования Реио',
    'Reio doesn\'t effectively handle objections': 'Реио не эффективно работает с возражениями',
    'Reio doesn\'t effectively move towards closing': 'Реио не эффективно движется к закрытию',
    'Reио doesn\'t effectively move towards cierre': 'Реио не эффективно движется к закрытию',
    'He introduces himself and mentions the product': 'Он представляется и упоминает продукт',
    'he is selling': 'который продает',
    'which is good': 'что хорошо',
    'However, in': 'Однако, в',
    'business communication': 'деловом общении',
    'it\'s often appreciated': 'часто ценится',
    'if the salesperson': 'если продавец',
    'shows interest': 'показывает интерес',
    'in the client': 'к клиенту',
    'or their business': 'или их бизнесу',
    'before jumping into': 'прежде чем переходить к',
    'the sales pitch': 'продажному выступлению',
    'stage needs improvement': 'этап нуждается в улучшении',
    'He fails to ask': 'Он не может задавать',
    'open-ended questions': 'открытые вопросы',
    'to understand': 'чтобы понять',
    'the customer\'s needs': 'потребности клиента',
    'or situation better': 'или ситуацию лучше',
    'Rather than making assumptions': 'Вместо того, чтобы делать предположения',
    'Reio should inquire about': 'Реио должен интересоваться',
    'the customer\'s current': 'текущим',
    'TV package': 'телевизионным пакетом',
    'or what they are looking for': 'или что они ищут',
    'in a product': 'в продукте',
    'is too vague': 'слишком расплывчато',
    'Customers asked for more details': 'Клиенты просили больше деталей',
    'about the TV packages': 'о телевизионных пакетах',
    'and products offered': 'и предлагаемых продуктах',
    'but Reio did not provide': 'но Реио не предоставил',
    'sufficient information': 'достаточной информации',
    'His responses like': 'Его ответы, такие как',
    'are not helpful': 'не полезны',
    'for a customer': 'для клиента',
    'seeking to make': 'пытающегося принять',
    'an informed decision': 'обоснованное решение',
    'He should elaborate on': 'Он должен подробно рассказать о',
    'the features': 'функциях',
    'benefits': 'преимуществах',
    'and value': 'и ценности',
    'of his product': 'своего продукта',
    'or concerns from customers': 'или опасения клиентов',
    'When customers show': 'Когда клиенты показывают',
    'hesitance or require': 'нерешительность или требуют',
    'more information': 'больше информации',
    'Reio should provide': 'Реио должен предоставить',
    'more specific details': 'более конкретные детали',
    'and reassurances': 'и заверения',
    'to address their concerns': 'чтобы решить их опасения',
    'towards closing a sale': 'к закрытию продажи',
    'He does not summarize': 'Он не резюмирует',
    'the benefits': 'преимущества',
    'or ask for the sale': 'или просит о продаже',
    'He should practice': 'Он должен практиковаться в',
    'summarizing the main': 'резюмировании основных',
    'selling points': 'продажных моментов',
    'and asking for the sale': 'и просьбе о продаже',
    'in a direct yet polite manner': 'прямым, но вежливым образом',
    'considering': 'учитывая',
    'business communication norms': 'нормы делового общения',
    
    // Full paragraph translations for common AI feedback
    'Reio\'s opening in all conversations is clear and to the point, but lacks a personalized touch. He introduces himself and mentions the product he is selling, which is good. However, in Estonian business communication, it\'s often appreciated if the salesperson shows interest in the client or their business before jumping into the sales pitch.': 'Начало Реио во всех разговорах четкое и по делу, но не хватает личного подхода. Он представляется и упоминает продукт, который продает, что хорошо. Однако в эстонском деловом общении часто ценится, если продавец проявляет интерес к клиенту или его бизнесу перед переходом к продажному выступлению.',
    
    'Reio\'s discovery stage needs improvement. He fails to ask open-ended questions to understand the customer\'s needs or situation better. Rather than making assumptions, Reio should inquire about the customer\'s current TV package or what they are looking for in a product.': 'Этап исследования Реио нуждается в улучшении. Он не может задавать открытые вопросы, чтобы лучше понять потребности или ситуацию клиента. Вместо того, чтобы делать предположения, Реио должен интересоваться текущим телевизионным пакетом клиента или тем, что они ищут в продукте.',
    
    'Reio\'s product presentation is too vague. Customers asked for more details about the TV packages and products offered, but Reio did not provide sufficient information. His responses like \'kõike\' (everything) are not helpful for a customer seeking to make an informed decision. He should elaborate on the features, benefits, and value of his product.': 'Презентация продукта Реио слишком расплывчата. Клиенты просили больше деталей о телевизионных пакетах и предлагаемых продуктах, но Реио не предоставил достаточной информации. Его ответы, такие как "kõike" (все), не полезны для клиента, пытающегося принять обоснованное решение. Он должен подробно рассказать о функциях, преимуществах и ценности своего продукта.',
    
    'Reio doesn\'t effectively handle objections or concerns from customers. When customers show hesitance or require more information, Reio should provide more specific details and reassurances to address their concerns.': 'Реио не эффективно работает с возражениями или опасениями клиентов. Когда клиенты показывают нерешительность или требуют больше информации, Реио должен предоставить более конкретные детали и заверения, чтобы решить их опасения.',
    
    'Reio doesn\'t effectively move towards closing a sale. He does not summarize the benefits of his product or ask for the sale. He should practice summarizing the main selling points and asking for the sale in a direct yet polite manner, considering Estonian business communication norms.': 'Реио не эффективно движется к закрытию продажи. Он не резюмирует преимущества своего продукта и не просит о продаже. Он должен практиковаться в резюмировании основных продажных моментов и просьбе о продаже прямым, но вежливым образом, учитывая нормы эстонского делового общения.',
    
    // Example-related translations
    'In this excerpt': 'В этом отрывке',
    'the customer is asking': 'клиент просит',
    'for more specifics': 'более конкретные детали',
    'about TV packages': 'о телевизионных пакетах',
    'but Reio responds with': 'но Реио отвечает',
    'which is not helpful': 'что не полезно',
    'for the customer': 'для клиента',
    'asking for more specifics': 'прося более конкретные детали',
    'TV packages': 'телевизионные пакеты',
    'responds with': 'отвечает',
    'not helpful': 'не полезно',
    'customer': 'клиент',
    'excerpt': 'отрывок',
    'this excerpt': 'этот отрывок',
    'the excerpt': 'отрывок',
    
    // AI Insights related translations
    'Reio seems to have': 'Реио, кажется, имеет',
    'a direct and straightforward approach': 'прямой и четкий подход',
    'which can be seen as confident': 'что можно считать уверенным',
    'he needs to balance': 'ему нужно сбалансировать',
    'with more empathy': 'с большей эмпатией',
    'and attention to': 'и вниманием к',
    'customer needs': 'потребностям клиента',
    'communication style': 'стиль общения',
    'is brief and to the point': 'краткий и по делу',
    'but lacks detail': 'но не хватает деталей',
    'and depth': 'и глубины',
    'He should work on': 'Он должен работать над',
    'providing more comprehensive': 'предоставлением более полных',
    'responses': 'ответов',
    'and demonstrating': 'и демонстрацией',
    'product knowledge': 'знания продукта',
    'Improving product knowledge': 'Улучшение знаний о продукте',
    'Practice objection handling': 'Практика работы с возражениями',
    'techniques': 'техник',
    'Developing closing': 'Разработка техник закрытия',
    'techniques': 'техник',
    'Role-play sales conversations': 'Ролевые игры продаж',
    'with a focus on': 'с фокусом на',
    'the discovery': 'исследование',
    'and presentation stages': 'и этапы презентации',
    'Study product details': 'Изучите детали продукта',
    'to provide in-depth': 'чтобы предоставить глубокую',
    'information': 'информацию',
    'Learn and practice': 'Изучите и практикуйте',
    'effective closing': 'эффективное закрытие',
    'techniques appropriate': 'техники подходящие',
    'for Estonian business culture': 'для эстонской деловой культуры',
    'Next Steps': 'Следующие шаги',
    'Recommended Focus Areas': 'Рекомендуемые области фокуса',
    'Personality Insights': 'Инсайты личности',
    'Communication Style': 'Стиль общения',
    
    // Conversation summary translations
    'Vestluse Kokkuvõte': 'Резюме разговора',
    'Practice with Mariana Villegas': 'Практика с Марианой Виллегас',
    'general': 'общий',
    'Raskusaste': 'Уровень сложности',
    'Keskmine': 'Средний',
    'Kestus': 'Продолжительность',
    'sõnumid': 'сообщения',
    'Kogutulemus': 'Общий результат',
    'introduction': 'введение',
    'mapping': 'картирование',
    'product Presentation': 'презентация продукта',
    'objection Handling': 'работа с возражениями',
    'close': 'закрытие',
    'AI Tagasiside': 'Обратная связь ИИ',
    
    // AI Feedback content translations
    'The salesperson did well in the introduction phase by greeting the client and introducing themselves. However, they missed the opportunity to properly map the client\'s needs and preferences. The client was interested in learning more about the TV packages, channels, services, quality, user support, and potential benefits for their large family. The salesperson should have engaged in a mapping phase to understand the client\'s requirements better. Additionally, the salesperson could have provided a more detailed product presentation, addressed the client\'s questions about package contents, additional services, and discounts, and handled the client\'s request for more information effectively. It\'s important to actively listen to the client\'s needs, ask probing questions, and tailor the presentation to match those needs. The conversation did not end early, but the salesperson missed opportunities to fully engage the client and address their concerns.': 'Продавец хорошо справился в фазе введения, приветствуя клиента и представляясь. Однако они упустили возможность правильно картировать потребности и предпочтения клиента. Клиент был заинтересован в изучении большего о телевизионных пакетах, каналах, услугах, качестве, поддержке пользователей и потенциальных преимуществах для их большой семьи. Продавец должен был участвовать в фазе картирования, чтобы лучше понять требования клиента. Кроме того, продавец мог бы предоставить более подробную презентацию продукта, ответить на вопросы клиента о содержании пакета, дополнительных услугах и скидках, и эффективно обработать запрос клиента на дополнительную информацию. Важно активно слушать потребности клиента, задавать зондирующие вопросы и адаптировать презентацию в соответствии с этими потребностями. Разговор не закончился рано, но продавец упустил возможности полностью вовлечь клиента и решить их проблемы.',
    
    'The salesperson did well in the introduction phase': 'Продавец хорошо справился в фазе введения',
    'by greeting the client and introducing themselves': 'приветствуя клиента и представляясь',
    'However, they missed the opportunity': 'Однако они упустили возможность',
    'to properly map the client\'s needs': 'правильно картировать потребности клиента',
    'and preferences': 'и предпочтения',
    'The client was interested in learning more': 'Клиент был заинтересован в изучении большего',
    'about the TV packages, channels, services': 'о телевизионных пакетах, каналах, услугах',
    'quality, user support': 'качестве, поддержке пользователей',
    'and potential benefits': 'и потенциальных преимуществах',
    'for their large family': 'для их большой семьи',
    'The salesperson should have engaged': 'Продавец должен был участвовать',
    'in a mapping phase': 'в фазе картирования',
    'to understand the client\'s requirements better': 'чтобы лучше понять требования клиента',
    'Additionally, the salesperson could have provided': 'Кроме того, продавец мог бы предоставить',
    'a more detailed product presentation': 'более подробную презентацию продукта',
    'addressed the client\'s questions about': 'ответить на вопросы клиента о',
    'package contents, additional services, and discounts': 'содержании пакета, дополнительных услугах и скидках',
    'and handled the client\'s request': 'и обработать запрос клиента',
    'for more information effectively': 'на дополнительную информацию эффективно',
    'It\'s important to actively listen': 'Важно активно слушать',
    'to the client\'s needs': 'потребности клиента',
    'ask probing questions': 'задавать зондирующие вопросы',
    'and tailor the presentation': 'и адаптировать презентацию',
    'to match those needs': 'в соответствии с этими потребностями',
    'The conversation did not end early': 'Разговор не закончился рано',
    'but the salesperson missed opportunities': 'но продавец упустил возможности',
    'to fully engage the client': 'полностью вовлечь клиента',
    'and address their concerns': 'и решить их проблемы',
    
    // Additional common phrases
    'Estonian business communication': 'эстонское деловое общение',
    'Estonian business communication norms': 'нормы эстонского делового общения',
    'in Estonian business communication': 'в эстонском деловом общении',
    'Estonian speakers': 'говорящие на эстонском',
    'for Estonian speakers': 'для говорящих на эстонском',
    'Estonian language': 'эстонский язык',
    'in Estonian': 'на эстонском',
    
    // Missing connecting words and phrases
    'is clear and to the point': 'четкий и по делу',
    'but lacks a personalized touch': 'но не хватает личного подхода',
    'but lacks': 'но не хватает',
    'a personalized touch': 'личного подхода',
    'personalized touch': 'личный подход',
    'clear and to the point': 'четкий и по делу',
    'and to the point': 'и по делу',
    'to the point': 'по делу',
    'However': 'Однако',
    'however': 'однако',
    'but': 'но',
    'and': 'и',
    'or': 'или',
    'is': 'есть',
    'are': 'есть',
    'was': 'был',
    'were': 'были',
    'has': 'имеет',
    'have': 'имеет',
    'had': 'имел',
    'will': 'будет',
    'would': 'был бы',
    'should': 'должен',
    'could': 'мог бы',
    'must': 'должен',
    'may': 'может',
    'might': 'мог бы',
    'can': 'может',
    'cannot': 'не может',
    'can\'t': 'не может',
    'do not': 'не делает',
    'don\'t': 'не делает',
    'does not': 'не делает',
    'doesn\'t': 'не делает',
    'did not': 'не делал',
    'didn\'t': 'не делал',
    'will not': 'не будет',
    'won\'t': 'не будет',
    'would not': 'не был бы',
    'wouldn\'t': 'не был бы',
    'should not': 'не должен',
    'shouldn\'t': 'не должен',
    'could not': 'не мог бы',
    'couldn\'t': 'не мог бы',
    'must not': 'не должен',
    'mustn\'t': 'не должен',
    'may not': 'не может',
    'might not': 'не мог бы',
    'mightn\'t': 'не мог бы',
  },
};

// Function to detect content language state
const analyzeContentLanguage = (content: string, language: Language): 'english' | 'mixed' | 'target' | 'broken' => {
  if (language === 'en') return 'english';
  
  // Handle undefined, null, or empty content
  if (!content || typeof content !== 'string') {
    return 'english';
  }
  
  const words = content.toLowerCase().split(/\s+/);
  
  // Estonian indicators
  const estonianWords = ['on', 'ja', 'kuid', 'või', 'ta', 'see', 'mis', 'kui', 'et', 'ei', 'ole', 'peaks', 'saab', 'võiks', 'peab', 'tutvustab', 'mainib', 'toodet', 'müüb', 'hea', 'eesti', 'ärisuhtluses', 'hinnatakse', 'sageli', 'müügimees', 'näitab', 'huvi', 'klienti', 'nende', 'äri', 'enne', 'hüppab', 'müügikõnele', 'selge', 'asjakohane', 'puudub', 'isiklik', 'puudutus'];
  
  // Spanish indicators  
  const spanishWords = ['es', 'son', 'pero', 'y', 'o', 'el', 'la', 'que', 'si', 'no', 'ser', 'debería', 'puede', 'podría', 'debe', 'comunicación', 'empresarial', 'estonia', 'vendedor', 'cliente', 'negocio', 'ventas'];
  
  // Russian indicators
  const russianWords = ['есть', 'и', 'но', 'или', 'он', 'она', 'что', 'если', 'не', 'быть', 'должен', 'может', 'мог бы', 'должен', 'деловое', 'общение', 'эстонское', 'продавец', 'клиент', 'бизнес', 'продажи'];
  
  // English indicators
  const englishWords = ['the', 'and', 'but', 'is', 'are', 'was', 'were', 'has', 'have', 'will', 'would', 'should', 'could', 'must', 'can', 'do', 'does', 'did', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  
    // Broken Estonian indicators (common mistakes from translation)
    const brokenEstonianWords = ['oniklik', 'mon', 'äronuhtluses', 'kõigon', 'vestlustes', 'fvõi', 'mvõie', 'thon', 'infvõimation', 'käsitlemont', 'straightfvõiward', 'suhtlemone', 'understja', 'doncovery', 'pone', 'prepon', 'infvõimatsiooni', 'vastuseid', 'fvõi', 'tehnikaid', 'sonsejuhatuss', 'üldinely', 'impvõitant', 'concone', 'hjaling', 'valmontuge', 'deconion', 'eeloneid', 'küsimont', 'mõonta', 'võiks', 'jaoks'];
  
  // const targetWords = language === 'et' ? estonianWords : 
  //                    language === 'es' ? spanishWords : 
  //                    language === 'ru' ? russianWords : [];
  
  const estonianCount = words.filter(word => estonianWords.includes(word)).length;
  const spanishCount = words.filter(word => spanishWords.includes(word)).length;
  const russianCount = words.filter(word => russianWords.includes(word)).length;
  const englishCount = words.filter(word => englishWords.includes(word)).length;
  const brokenCount = words.filter(word => brokenEstonianWords.includes(word)).length;
  
  // If has broken words, it's broken
  if (brokenCount > 0) return 'broken';
  
  // If has target language words and no English, it's target
  const targetCount = language === 'et' ? estonianCount : 
                     language === 'es' ? spanishCount : 
                     language === 'ru' ? russianCount : 0;
  
  if (targetCount > 0 && englishCount === 0) return 'target';
  
  // If has both English and target language, it's mixed
  if (englishCount > 0 && targetCount > 0) return 'mixed';
  
  // If only English, it's English
  if (englishCount > 0 && targetCount === 0) return 'english';
  
  // If no clear language indicators but has some words, treat as mixed for safety
  if (words.length > 3 && (englishCount === 0 && targetCount === 0)) {
    return 'mixed';
  }
  
  return 'english';
};

// Function to translate AI-generated content
export const translateAIContent = (content: string, language: Language): string => {
  // Handle undefined, null, or empty content
  if (!content || typeof content !== 'string') {
    return content || '';
  }
  
  if (language === 'en') {
    return content; // No translation needed for English
  }
  
  // For Estonian, always try to fix broken words first, then translate
  if (language === 'et') {
    // First fix any broken words
    let fixed = fixBrokenTranslation(content, language);
    
    // Then translate English parts more carefully
    const translations = aiContentTranslations[language];
    if (translations) {
      // Translate phrases first (longer matches), then individual words
      const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
      
      for (const key of sortedKeys) {
        // Translate all words and phrases, including short words for better coverage
        if (key.split(' ').length >= 2 || key.length >= 2) {
          const regex = new RegExp('\\b' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
          fixed = fixed.replace(regex, translations[key]);
        }
      }
    }
    
    return fixed;
  }
  
  // For other languages, use the original logic
  const contentState = analyzeContentLanguage(content, language);
  
  // Handle different content states
  switch (contentState) {
    case 'target':
      // Content is already properly in target language
      return content;
      
    case 'broken':
      // Content has broken translations, try to fix them
      return fixBrokenTranslation(content, language);
      
    case 'mixed':
      // Content has both English and target language, needs careful translation
      return translateMixedContent(content, language);
      
    case 'english':
    default:
      // Content is in English, needs full translation
      return translateEnglishContent(content, language);
  }
};

// Function to fix broken translations
const fixBrokenTranslation = (content: string, language: Language): string => {
  if (language === 'et') {
    // Fix common Estonian translation mistakes
    let fixed = content
      .replace(/\boniklik\b/g, 'isiklik')
      .replace(/\bmon\b/g, 'mis')
      .replace(/\bäronuhtluses\b/g, 'ärisuhtluses')
      .replace(/\bkõigon\b/g, 'kõigis')
      .replace(/\bfvõi\b/g, 'või')
      .replace(/\bmvõie\b/g, 'rohkem')
      .replace(/\bthon\b/g, 'see')
      .replace(/\binfvõimation\b/g, 'informatsiooni')
      .replace(/\bkäsitlemont\b/g, 'käsitlemise')
      .replace(/\bvestlustes\b/g, 'vestlustes')
      // Additional broken patterns from the user's example
      .replace(/\bstraightfvõiward\b/g, 'otsekohene')
      .replace(/\bsuhtlemone\b/g, 'suhtlemise')
      .replace(/\bmvõie\b/g, 'rohkem')
      .replace(/\bunderstja\b/g, 'mõista')
      .replace(/\bklienti\b/g, 'klientide')
      .replace(/\bvajadusi\b/g, 'vajadusi')
      .replace(/\bclear\b/g, 'selge')
      .replace(/\bengaging\b/g, 'huvitav')
      .replace(/\bvaried\b/g, 'mitmekesine')
      .replace(/\bvocabulary\b/g, 'sõnavara')
      .replace(/\bsentence\b/g, 'lausete')
      .replace(/\bstructure\b/g, 'struktuur')
      .replace(/\bconversations\b/g, 'vestlused')
      .replace(/\binteresting\b/g, 'huvitavamad')
      .replace(/\bDoncovery\b/g, 'Avastamine')
      .replace(/\bpone\b/g, 'oskused')
      .replace(/\bPresentation\b/g, 'Esitlus')
      .replace(/\bproducts\b/g, 'toodete')
      .replace(/\bVastuväidete\b/g, 'Vastuväidete')
      .replace(/\bkäsitlemine\b/g, 'käsitlemine')
      .replace(/\bClosing\b/g, 'Sulgemine')
      .replace(/\btechnique\b/g, 'tehnikad')
      .replace(/\bPractice\b/g, 'Harjuta')
      .replace(/\basking\b/g, 'küsimuste')
      .replace(/\bavatud\b/g, 'avatud')
      .replace(/\bküsimusi\b/g, 'küsimusi')
      .replace(/\bPrepon\b/g, 'Valmista')
      .replace(/\bdetailed\b/g, 'üksikasjalik')
      .replace(/\bproduct\b/g, 'toodete')
      .replace(/\binfvõimatsiooni\b/g, 'informatsiooni')
      .replace(/\bDevelop\b/g, 'Arenda')
      .replace(/\bvastuseid\b/g, 'vastuseid')
      .replace(/\bfvõi\b/g, 'tavalistele')
      .replace(/\bcommon\b/g, 'tavalistele')
      .replace(/\bobjections\b/g, 'vastuväidetele')
      .replace(/\bÕpi\b/g, 'Õpi')
      .replace(/\bja\b/g, 'ja')
      .replace(/\bharjuta\b/g, 'harjuta')
      .replace(/\bsulgemine\b/g, 'sulgemise')
      .replace(/\btehnikaid\b/g, 'tehnikaid')
      // Additional broken patterns from the user's latest example
      .replace(/\bsonsejuhatuss\b/g, 'sissejuhatus')
      .replace(/\büldinely\b/g, 'üldiselt')
      .replace(/\bimpvõitant\b/g, 'oluline')
      .replace(/\bconcone\b/g, 'konkreetne')
      .replace(/\bhjaling\b/g, 'käsitlemine')
      .replace(/\bvalmontuge\b/g, 'valmistuge')
      .replace(/\bdeconion\b/g, 'otsuse')
      .replace(/\beeloneid\b/g, 'eeliseid')
      .replace(/\bküsimont\b/g, 'küsimust')
      .replace(/\bmõonta\b/g, 'mitu')
      .replace(/\bvõiks\b/g, 'võiks')
      .replace(/\bjaoks\b/g, 'jaoks');
    return fixed;
  }
  return content;
};

// Function to translate mixed content
const translateMixedContent = (content: string, language: Language): string => {
  // For mixed content, try to translate only the English parts
  const translations = aiContentTranslations[language];
  if (!translations) return content;
  
  let translatedContent = content;
  
  // First, try to fix any broken words that might be present
  translatedContent = fixBrokenTranslation(translatedContent, language);
  
  // Translate sentence by sentence, being more aggressive for mixed content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // Try exact sentence match first
    if (translations[trimmedSentence]) {
      translatedContent = translatedContent.replace(sentence, translations[trimmedSentence]);
      continue;
    }
    
    // For mixed content, translate both phrases and individual words
    let translatedSentence = trimmedSentence;
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      // Translate phrases (2+ words) and important single words
      if (key.split(' ').length >= 2 || ['clear', 'engaging', 'interesting', 'detailed', 'specific', 'common', 'effective', 'professional', 'strong', 'good', 'better', 'improve', 'practice', 'develop', 'focus', 'work', 'ask', 'provide', 'mention', 'try', 'remember', 'anticipate', 'guide', 'summarize'].includes(key.toLowerCase())) {
        translatedSentence = translatedSentence.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), translations[key]);
      }
    }
    
    // Only replace if we made meaningful changes
    if (translatedSentence !== trimmedSentence) {
      translatedContent = translatedContent.replace(sentence, translatedSentence);
    }
  }
  
  return translatedContent;
};

// Function to translate English content
const translateEnglishContent = (content: string, language: Language): string => {
  const translations = aiContentTranslations[language];
  if (!translations) {
    return content; // Fallback to original content
  }

  // Try to find exact matches first
  if (translations[content]) {
    return translations[content];
  }

  // Try to translate sentence by sentence first
  let translatedContent = content;
  
  // Split into sentences and translate each one
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // First, try exact sentence match
    if (translations[trimmedSentence]) {
      translatedContent = translatedContent.replace(sentence, translations[trimmedSentence]);
      continue;
    }
    
    // If no exact match, try to translate the sentence by finding the longest matching phrases
    let translatedSentence = trimmedSentence;
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      if (translatedSentence.includes(key)) {
        translatedSentence = translatedSentence.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), translations[key]);
      }
    }
    
    // Only replace if we actually made changes
    if (translatedSentence !== trimmedSentence) {
      translatedContent = translatedContent.replace(sentence, translatedSentence);
    }
  }

  // Handle common patterns that might not be caught by exact matches
  // This includes things like "You did well in..." -> translated equivalent
  const patternTranslations = getPatternTranslations(language);
  for (const [pattern, replacement] of Object.entries(patternTranslations)) {
    const regex = new RegExp(pattern, 'gi');
    translatedContent = translatedContent.replace(regex, replacement);
  }

  return translatedContent;
};

// Function to get pattern-based translations for common AI response structures
const getPatternTranslations = (language: Language): Record<string, string> => {
  const patterns = {
    es: {
      'You did well in (.+)': 'Lo hiciste bien en $1',
      'You need to improve (.+)': 'Necesitas mejorar $1',
      'Your (.+) is good': 'Tu $1 es bueno',
      'Consider working on (.+)': 'Considera trabajar en $1',
      'Great job with (.+)': 'Excelente trabajo con $1',
      'You should focus on (.+)': 'Deberías enfocarte en $1',
      'Your approach to (.+) was': 'Tu enfoque hacia $1 fue',
      'You handled (.+) well': 'Manejaste $1 bien',
      'You struggled with (.+)': 'Tuviste dificultades con $1',
      'You showed good (.+)': 'Mostraste buen $1',
    },
    et: {
      'You did well in (.+)': 'Sa tegid hästi $1',
      'You need to improve (.+)': 'Sa pead parandama $1',
      'Your (.+) is good': 'Sinu $1 on hea',
      'Consider working on (.+)': 'Kaalu $1 kallal töötamist',
      'Great job with (.+)': 'Suurepärane töö $1-ga',
      'You should focus on (.+)': 'Sa peaksid keskenduma $1-le',
      'Your approach to (.+) was': 'Sinu lähenemine $1-le oli',
      'You handled (.+) well': 'Sa käsitlesid $1 hästi',
      'You struggled with (.+)': 'Sa võitlesid $1-ga',
      'You showed good (.+)': 'Sa näitasid head $1',
    },
    ru: {
      'You did well in (.+)': 'Вы хорошо справились с $1',
      'You need to improve (.+)': 'Вам нужно улучшить $1',
      'Your (.+) is good': 'Ваш $1 хорош',
      'Consider working on (.+)': 'Рассмотрите работу над $1',
      'Great job with (.+)': 'Отличная работа с $1',
      'You should focus on (.+)': 'Вам следует сосредоточиться на $1',
      'Your approach to (.+) was': 'Ваш подход к $1 был',
      'You handled (.+) well': 'Вы хорошо справились с $1',
      'You struggled with (.+)': 'Вы испытывали трудности с $1',
      'You showed good (.+)': 'Вы показали хороший $1',
    }
  };

  return patterns[language] || {};
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
