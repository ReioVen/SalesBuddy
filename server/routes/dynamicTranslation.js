const express = require('express');
const router = express.Router();
const multiLanguageTranslationService = require('../services/multiLanguageTranslationService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/dynamic-translation/translate
 * Translate dynamic AI-generated content using Google Translate
 */
router.post('/translate', authenticateToken, async (req, res) => {
  try {
    const { text, targetLanguage, context } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Text and targetLanguage are required'
      });
    }

    if (targetLanguage === 'en') {
      return res.json({
        success: true,
        originalText: text,
        translatedText: text,
        method: 'no_translation_needed'
      });
    }

    const translatedText = await multiLanguageTranslationService.translateDynamicContent(
      text, 
      targetLanguage, 
      context || 'general'
    );

    res.json({
      success: true,
      originalText: text,
      translatedText,
      targetLanguage,
      context: context || 'general',
      method: 'google_translate'
    });

  } catch (error) {
    console.error('Dynamic translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error.message
    });
  }
});

/**
 * POST /api/dynamic-translation/translate-batch
 * Translate multiple texts in batch
 */
router.post('/translate-batch', authenticateToken, async (req, res) => {
  try {
    const { texts } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Texts array is required'
      });
    }

    const results = [];
    
    for (const item of texts) {
      try {
        const { text, targetLanguage, context } = item;
        
        if (!text || !targetLanguage) {
          results.push({
            success: false,
            error: 'Text and targetLanguage are required',
            originalText: text
          });
          continue;
        }

        if (targetLanguage === 'en') {
          results.push({
            success: true,
            originalText: text,
            translatedText: text,
            targetLanguage,
            method: 'no_translation_needed'
          });
          continue;
        }

        const translatedText = await multiLanguageTranslationService.translateDynamicContent(
          text, 
          targetLanguage, 
          context || 'general'
        );

        results.push({
          success: true,
          originalText: text,
          translatedText,
          targetLanguage,
          context: context || 'general',
          method: 'google_translate'
        });

      } catch (error) {
        console.error(`Error translating "${item.text}":`, error);
        results.push({
          success: false,
          error: error.message,
          originalText: item.text
        });
      }
    }

    res.json({
      success: true,
      results,
      totalProcessed: texts.length,
      successfulTranslations: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch translation failed',
      error: error.message
    });
  }
});

/**
 * POST /api/dynamic-translation/translate-stage-feedback
 * Translate stage feedback with sales context
 */
router.post('/translate-stage-feedback', authenticateToken, async (req, res) => {
  try {
    const { feedback, targetLanguage } = req.body;

    if (!feedback || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Feedback and targetLanguage are required'
      });
    }

    if (targetLanguage === 'en') {
      return res.json({
        success: true,
        originalFeedback: feedback,
        translatedFeedback: feedback,
        method: 'no_translation_needed'
      });
    }

    const translatedFeedback = await multiLanguageTranslationService.translateStageFeedback(
      feedback, 
      targetLanguage
    );

    res.json({
      success: true,
      originalFeedback: feedback,
      translatedFeedback,
      targetLanguage,
      method: 'google_translate_with_context'
    });

  } catch (error) {
    console.error('Stage feedback translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Stage feedback translation failed',
      error: error.message
    });
  }
});

// Test endpoint to check Google Translate API
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const googleTranslateService = require('../services/googleTranslateService');
    
    // Test translation
    const testText = 'Good opening approach. Consider personalizing your introductions more.';
    const result = await googleTranslateService.translateWithContext(testText, 'et', 'stage_rating');
    
    res.json({
      success: true,
      original: testText,
      translated: result,
      message: 'Google Translate API test successful'
    });
  } catch (error) {
    console.error('Google Translate test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Google Translate API test failed'
    });
  }
});

/**
 * POST /api/dynamic-translation/batch-translate
 * Simple batch translation endpoint
 */
router.post('/batch-translate', authenticateToken, async (req, res) => {
  try {
    const { texts, targetLanguage, context } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Texts array is required'
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'targetLanguage is required'
      });
    }

    if (targetLanguage === 'en') {
      return res.json({
        success: true,
        translations: texts,
        method: 'no_translation_needed'
      });
    }

    console.log(`Batch translation requested for ${texts.length} texts in ${targetLanguage}`);

    // Use Google Translate service for batch translation
    const googleTranslateService = require('../services/googleTranslateService');
    
    // Prepare texts for batch translation
    const textsToTranslate = texts.map(text => ({
      text: text,
      targetLanguage: targetLanguage,
      context: context || 'sales_feedback'
    }));

    // Translate in smaller batches to avoid rate limits
    const batchSize = 5; // Process 5 texts at a time
    const translations = [];
    
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(textsToTranslate.length/batchSize)}`);
      
      try {
        const batchResults = await googleTranslateService.translateBatch(batch);
        const batchTranslations = batchResults.map(result => result.translatedText);
        translations.push(...batchTranslations);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < textsToTranslate.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (error) {
        console.error(`Error in batch ${Math.floor(i/batchSize) + 1}:`, error);
        // Add original texts for this batch if translation fails
        const fallbackTexts = batch.map(item => item.text);
        translations.push(...fallbackTexts);
      }
    }
    
    res.json({
      success: true,
      translations: translations,
      targetLanguage,
      context: context || 'general',
      method: 'google_translate_batch'
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch translation failed',
      error: error.message
    });
  }
});

module.exports = router;
