const express = require('express');
const router = express.Router();
const TranslationKey = require('../models/TranslationKey');
const Translation = require('../models/Translation');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Get all translations for a specific language
router.get('/:language', async (req, res) => {
  try {
    const { language } = req.params;
    
    // Validate language
    const validLanguages = ['en', 'et', 'lv', 'lt', 'fi', 'sv', 'no', 'da'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

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
          category: 1,
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

    res.json({
      language,
      translations: translationObject,
      count: Object.keys(translationObject).length
    });

  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// Get all translation keys (admin only)
router.get('/admin/keys', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const keys = await TranslationKey.find({ isActive: true })
      .sort({ category: 1, key: 1 });

    res.json(keys);
  } catch (error) {
    console.error('Error fetching translation keys:', error);
    res.status(500).json({ error: 'Failed to fetch translation keys' });
  }
});

// Get translations for a specific key across all languages (admin only)
router.get('/admin/key/:keyId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { keyId } = req.params;
    
    const key = await TranslationKey.findById(keyId);
    if (!key) {
      return res.status(404).json({ error: 'Translation key not found' });
    }

    const translations = await Translation.find({ 
      translationKey: keyId,
      isActive: true 
    }).sort({ language: 1 });

    res.json({
      key: key,
      translations: translations
    });
  } catch (error) {
    console.error('Error fetching key translations:', error);
    res.status(500).json({ error: 'Failed to fetch key translations' });
  }
});

// Create or update a translation (admin only)
router.post('/admin/translate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { keyId, language, text } = req.body;

    if (!keyId || !language || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate language
    const validLanguages = ['en', 'et', 'lv', 'lt', 'fi', 'sv', 'no', 'da'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    // Check if translation key exists
    const key = await TranslationKey.findById(keyId);
    if (!key) {
      return res.status(404).json({ error: 'Translation key not found' });
    }

    // Find existing translation or create new one
    let translation = await Translation.findOne({
      translationKey: keyId,
      language: language
    });

    if (translation) {
      // Update existing translation
      translation.text = text;
      translation.lastModified = new Date();
      translation.modifiedBy = req.user.id;
      await translation.save();
    } else {
      // Create new translation
      translation = new Translation({
        translationKey: keyId,
        language: language,
        text: text,
        modifiedBy: req.user.id
      });
      await translation.save();
    }

    res.json({
      message: 'Translation saved successfully',
      translation: translation
    });

  } catch (error) {
    console.error('Error saving translation:', error);
    res.status(500).json({ error: 'Failed to save translation' });
  }
});

// Create a new translation key (admin only)
router.post('/admin/key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key, category, description, context } = req.body;

    if (!key || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if key already exists
    const existingKey = await TranslationKey.findOne({ key: key });
    if (existingKey) {
      return res.status(400).json({ error: 'Translation key already exists' });
    }

    const translationKey = new TranslationKey({
      key: key,
      category: category,
      description: description || '',
      context: context || ''
    });

    await translationKey.save();

    res.json({
      message: 'Translation key created successfully',
      key: translationKey
    });

  } catch (error) {
    console.error('Error creating translation key:', error);
    res.status(500).json({ error: 'Failed to create translation key' });
  }
});

// Delete a translation (admin only)
router.delete('/admin/translation/:translationId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { translationId } = req.params;

    const translation = await Translation.findById(translationId);
    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    // Soft delete by setting isActive to false
    translation.isActive = false;
    await translation.save();

    res.json({ message: 'Translation deleted successfully' });

  } catch (error) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

// Get translation statistics (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await TranslationKey.aggregate([
      {
        $lookup: {
          from: 'translations',
          localField: '_id',
          foreignField: 'translationKey',
          as: 'translations'
        }
      },
      {
        $group: {
          _id: '$category',
          totalKeys: { $sum: 1 },
          totalTranslations: { $sum: { $size: '$translations' } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totalKeys = await TranslationKey.countDocuments({ isActive: true });
    const totalTranslations = await Translation.countDocuments({ isActive: true });

    res.json({
      categories: stats,
      totals: {
        keys: totalKeys,
        translations: totalTranslations
      }
    });

  } catch (error) {
    console.error('Error fetching translation stats:', error);
    res.status(500).json({ error: 'Failed to fetch translation stats' });
  }
});

module.exports = router;
