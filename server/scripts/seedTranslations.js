const mongoose = require('mongoose');
const TranslationKey = require('../models/TranslationKey');
const Translation = require('../models/Translation');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Translation data organized by category
const translationData = {
  // UI Elements
  ui: {
    'conversationSummaries': {
      en: 'Conversation Summaries',
      et: 'Vestluste kokkuvõtted'
    },
    'generateSummary': {
      en: 'Generate Summary',
      et: 'Genereeri kokkuvõte'
    },
    'overallRating': {
      en: 'Overall Rating',
      et: 'Üldine hinnang'
    },
    'strengths': {
      en: 'Strengths',
      et: 'Tugevused'
    },
    'improvements': {
      en: 'Areas for Improvement',
      et: 'Parandamise alad'
    },
    'opening': {
      en: 'Opening',
      et: 'Avamine'
    },
    'discovery': {
      en: 'Discovery',
      et: 'Avastamine'
    },
    'presentation': {
      en: 'Presentation',
      et: 'Esitlus'
    },
    'objectionHandling': {
      en: 'Objection Handling',
      et: 'Vastuväidete käsitlemine'
    },
    'closing': {
      en: 'Closing',
      et: 'Sulgemine'
    }
  },

  // Summary Content
  summary: {
    'goodUseOfLanguage': {
      en: 'Good use of language',
      et: 'Hea sõnade kasutus'
    },
    'clearIntroductions': {
      en: 'Clear introductions',
      et: 'Selged sissejuhatused'
    },
    'discoveryQuestioning': {
      en: 'Discovery questioning',
      et: 'Avastamise küsimused'
    },
    'productPresentation': {
      en: 'Product presentation',
      et: 'Toote esitlus'
    },
    'objectionHandling': {
      en: 'Objection handling',
      et: 'Vastuväidete käsitlemine'
    },
    'closingTechnique': {
      en: 'Closing technique',
      et: 'Sulgemise tehnika'
    },
    'selfIntroduction': {
      en: 'Self-introduction',
      et: 'Sissejuhatus'
    },
    'productOffering': {
      en: 'Product offering',
      et: 'Toote pakkumine'
    },
    'willingnessToEngage': {
      en: 'Willingness to engage',
      et: 'Valmidus suhtlemiseks'
    }
  },

  // Feedback Messages
  feedback: {
    'openingFeedback1': {
      en: 'You were able to open the conversation by introducing yourself and stating your purpose. However, there is room for improvement. Try to communicate with the client more by asking questions about their current needs or situation.',
      et: 'Sa olid võimeline avama vestluse, tutvustades ennast ja öeldes oma eesmärki. Kuid on ruumi parandamiseks. Proovi suhelda kliendiga rohkem, küsides küsimusi nende praeguste vajaduste või olukorra kohta.'
    },
    'openingFeedback2': {
      en: 'For instance, you could say "I understand that choosing the right TV package can be overwhelming, so I\'m here to help." This would make the client feel more valued and heard.',
      et: 'Näiteks võiksite öelda "Ma saan aru, et õige TV paketi valimine võib olla ülekoormav, seega olen siin aitama." See teeks kliendi end tundma rohkem väärtustatud ja kuuldud.'
    },
    'discoveryFeedback1': {
      en: 'The discovery stage was not effectively utilized. It is important to ask open questions to understand the client\'s needs.',
      et: 'Avastamise etapp ei olnud tõhusalt kasutatud. On oluline küsida avatud küsimusi, et mõista kliendi vajadusi.'
    },
    'discoveryFeedback2': {
      en: 'For example, you could have asked "What channels or types of programs does your family enjoy?" or "What has been your experience with your current TV package?"',
      et: 'Näiteks oleksite võinud küsida "Millised kanalid või programmitüübid meeldivad teie perele?" või "Milline on olnud teie kogemus praeguse TV paketiga?"'
    },
    'presentationFeedback1': {
      en: 'Your responses during the presentation stage lacked detail and did not effectively showcase the value of your products.',
      et: 'Teie vastused esitluse etapis puudusid detailidest ja ei näidanud tõhusalt teie toodete väärtust.'
    },
    'presentationFeedback2': {
      en: 'Instead of saying "everything", it would be more effective to highlight specific features of TV packages that would benefit the client.',
      et: 'Selle asemel, et öelda "kõike", oleks tõhusam esile tõsta TV pakettide spetsiifilisi funktsioone, mis oleksid kliendile kasulikud.'
    },
    'objectionHandlingFeedback1': {
      en: 'There wasn\'t much objection handling displayed in these conversations. Remember, when a client raises an objection, it is important not to dismiss it.',
      et: 'Nendes vestlustes ei näidatud palju vastuväidete käsitlemist. Pidage meeles, et kui klient esitab vastuväidet, on oluline seda mitte maha jätta.'
    },
    'objectionHandlingFeedback2': {
      en: 'Instead, acknowledge their concern, provide more information, and re-emphasize the benefits of your products.',
      et: 'Selle asemel tunnustage nende muret, pakkuge rohkem teavet ja rõhutage uuesti teie toodete eeliseid.'
    },
    'closingFeedback1': {
      en: 'The closing stage wasn\'t clearly reached in the provided conversations. Once you\'ve addressed the client\'s needs and concerns, don\'t hesitate to ask for the sale.',
      et: 'Sulgemise etapp ei jõudnud selgelt lõpuni esitatud vestlustes. Kui olete käsitlenud kliendi vajadusi ja muresid, ärge kõhelge müügi küsimist.'
    },
    'closingFeedback2': {
      en: 'However, do so in a clear way that\'s comfortable for both parties. You could say something like "Based on what you\'ve told me, I believe this package would be a great fit for your family. Would you like to proceed with this package?"',
      et: 'Kuid tehke seda selgelt viisil, mis on mõlemale poolele mugav. Võiksite öelda midagi sellist: "Selle põhjal, mida te mulle rääkisite, usun, et see pakett sobiks teie perele suurepäraselt. Kas sooviksite selle paketiga jätkata?"'
    }
  },

  // Analysis Content
  analysis: {
    'personalityInsights': {
      en: 'Personality Insights',
      et: 'Isikuomaduste ülevaated'
    },
    'communicationStyle': {
      en: 'Communication Style',
      et: 'Suhtlusstiil'
    },
    'recommendedFocus': {
      en: 'Recommended Focus Areas',
      et: 'Soovitatavad fookuse alad'
    },
    'nextSteps': {
      en: 'Next Steps',
      et: 'Järgmised sammud'
    }
  },

  // Common Terms
  common: {
    'rating': {
      en: 'Rating',
      et: 'Hinnang'
    },
    'feedback': {
      en: 'Feedback',
      et: 'Tagasiside'
    },
    'example': {
      en: 'Example',
      et: 'Näide'
    },
    'conversation': {
      en: 'Conversation',
      et: 'Vestlus'
    },
    'stage': {
      en: 'Stage',
      et: 'Etapp'
    },
    'excerpt': {
      en: 'Excerpt',
      et: 'Väljavõte'
    },
    'context': {
      en: 'Context',
      et: 'Kontekst'
    }
  }
};

async function seedTranslations() {
  try {
    console.log('Starting translation seeding...');

    // Clear existing translations
    await Translation.deleteMany({});
    await TranslationKey.deleteMany({});
    console.log('Cleared existing translations');

    let totalKeys = 0;
    let totalTranslations = 0;

    // Process each category
    for (const [category, keys] of Object.entries(translationData)) {
      console.log(`Processing category: ${category}`);

      for (const [key, translations] of Object.entries(keys)) {
        // Create translation key
        const translationKey = new TranslationKey({
          key: key,
          category: category,
          description: `Translation for ${key}`,
          context: `Used in ${category} context`
        });

        await translationKey.save();
        totalKeys++;

        // Create translations for each language
        for (const [language, text] of Object.entries(translations)) {
          const translation = new Translation({
            translationKey: translationKey._id,
            language: language,
            text: text
          });

          await translation.save();
          totalTranslations++;
        }
      }
    }

    console.log(`Translation seeding completed!`);
    console.log(`Created ${totalKeys} translation keys`);
    console.log(`Created ${totalTranslations} translations`);

  } catch (error) {
    console.error('Error seeding translations:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeder
seedTranslations();
