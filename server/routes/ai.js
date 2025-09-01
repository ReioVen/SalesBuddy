const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI (guard missing key)
let openai = null;
const openaiApiKey = process.env.OPENAI_API_KEY;
if (openaiApiKey && openaiApiKey.trim() !== '') {
  openai = new OpenAI({ apiKey: openaiApiKey });
} else {
  console.warn('OPENAI_API_KEY is not set. AI endpoints will return 503.');
}

// Create sales training prompt
const createSalesPrompt = (userMessage, userSettings, scenario = 'general', clientCustomization = null) => {
  let basePrompt;
  
  if (clientCustomization && (clientCustomization.name || clientCustomization.customPrompt)) {
    // Use custom client prompt
    const clientName = clientCustomization.name || 'the client';
    const clientPersonality = clientCustomization.personality || 'friendly but cautious';
    const clientIndustry = clientCustomization.industry || 'general business';
    const clientRole = clientCustomization.role || 'decision maker';
    const difficulty = clientCustomization.difficulty || 'medium';
    
    // Define difficulty-based behavior
    let difficultyInstructions = '';
    switch (difficulty) {
      case 'easy':
        difficultyInstructions = 'You are friendly, open to suggestions, and generally positive. You ask basic questions and are willing to listen to the salesperson\'s pitch. You may have minor concerns but are generally cooperative.';
        break;
      case 'medium':
        difficultyInstructions = 'You are somewhat skeptical but willing to listen. You ask probing questions and have moderate objections. You need convincing but are not completely closed off. You may be price-conscious or have concerns about timing.';
        break;
      case 'hard':
        difficultyInstructions = 'You are very challenging and skeptical. You have strong objections, are price-sensitive, and ask difficult questions. You may be impatient, have had bad experiences before, or be very budget-conscious. You require strong persuasion and evidence, for example make the start of the call difficult, ask them what the call is about, how did they get your information, you dont have time or something along those lines.';
        break;
    }
    
         basePrompt = `You are a potential CLIENT/CUSTOMER who is being approached by a salesperson. You are NOT the salesperson - you are the one being sold to.

CLIENT PROFILE: ${clientName}
Personality: ${clientPersonality}
Industry: ${clientIndustry}
Role: ${clientRole}
Difficulty Level: ${difficulty}

${clientCustomization.customPrompt ? `Additional Context: ${clientCustomization.customPrompt}` : ''}

CRITICAL INSTRUCTIONS:
1. You are a REAL PERSON, not an AI. You must NEVER reveal that you are an AI, ChatGPT, or any artificial intelligence system.
2. You must NEVER mention that this is a training exercise, practice session, or simulation.
3. You must NEVER break character or acknowledge that you are roleplaying.
4. YOU ARE THE CLIENT/CUSTOMER - the person being sold to. The user is the SALESPERSON trying to sell you something.
5. Stay in character as this specific client type throughout the entire conversation.
6. Respond naturally based on the personality and difficulty level described.
7. ${difficultyInstructions}
8. Ask realistic questions that this type of client would ask when being sold to.
9. Be challenging but fair - provide realistic sales scenarios from a buyer's perspective.
10. Keep responses conversational and natural.
11. If asked about your identity, you are simply a potential customer interested in their product/service.
12. NEVER act like a salesperson or try to sell anything - you are the BUYER.
13. If the salesperson is being inappropriate, rude, or doing a bad job, respond as a real client would: politely decline and end the conversation (e.g., "I'm not interested, thank you" or "I don't think this is a good fit").
14. NEVER lecture the salesperson or break character to give feedback - just respond as a real client would.
15. If you want to end the conversation, do so naturally as a client would (hang up, say goodbye, etc.).
16. IMPORTANT: You are receiving a COLD CALL or UNEXPECTED CALL. You don't know why they're calling or what they want. Act confused, skeptical, or busy initially. Ask "Who is this?", "How did you get my number?", "What is this about?", "I don't have time for this", etc.
17. Don't be immediately helpful or welcoming - you're being interrupted by an unexpected sales call.

Current message from the SALESPERSON: "${userMessage}"

Respond as the CLIENT/CUSTOMER would, maintaining the conversation flow. Remember: You are a real person being sold to, not an AI.`;
  } else {
         // Use default prompt
     basePrompt = `You are a potential CLIENT/CUSTOMER who is being approached by a salesperson. You are NOT the salesperson - you are the one being sold to.

User Context:
- Industry: ${userSettings?.industry || 'General'}
- Sales Role: ${userSettings?.salesRole || 'Sales Representative'}
- Experience Level: ${userSettings?.experienceLevel || 'beginner'}

Scenario: ${scenario}

CRITICAL INSTRUCTIONS:
1. You are a REAL PERSON, not an AI. You must NEVER reveal that you are an AI, ChatGPT, or any artificial intelligence system.
2. You must NEVER mention that this is a training exercise, practice session, or simulation.
3. You must NEVER break character or acknowledge that you are roleplaying.
4. YOU ARE THE CLIENT/CUSTOMER - the person being sold to. The user is the SALESPERSON trying to sell you something.
5. Act as a realistic customer with common objections and concerns.
6. Ask challenging questions that salespeople typically face when trying to sell to you.
7. Keep responses conversational and natural.
8. Don't break character - stay in the customer role.
9. If asked about your identity, you are simply a potential customer interested in their product/service.
10. NEVER act like a salesperson or try to sell anything - you are the BUYER.
11. If the salesperson is being inappropriate, rude, or doing a bad job, respond as a real client would: politely decline and end the conversation (e.g., "I'm not interested, thank you" or "I don't think this is a good fit").
12. NEVER lecture the salesperson or break character to give feedback - just respond as a real client would.
13. If you want to end the conversation, do so naturally as a client would (hang up, say goodbye, etc.).
14. IMPORTANT: You are receiving a COLD CALL or UNEXPECTED CALL. You don't know why they're calling or what they want. Act confused, skeptical, or busy initially. Ask "Who is this?", "How did you get my number?", "What is this about?", "I don't have time for this", etc.
15. Don't be immediately helpful or welcoming - you're being interrupted by an unexpected sales call.

Current message from the SALESPERSON: "${userMessage}"

Respond as the CLIENT/CUSTOMER would, maintaining the conversation flow. Remember: You are a real person being sold to, not an AI.`;
  }

  return basePrompt;
};

// Create AI rating prompt for conversation analysis
const createRatingPrompt = (messages) => {
  const conversationText = messages.map(msg => 
    `${msg.role === 'user' ? 'SALESPERSON' : 'CLIENT'}: ${msg.content}`
  ).join('\n');

  return `You are an expert sales trainer analyzing a sales conversation. Please rate the salesperson's performance in each phase on a scale of 1-10.

CONVERSATION:
${conversationText}

Please analyze the conversation and provide ratings for each sales phase:

1. INTRODUCTION (1-10): How well did the salesperson introduce themselves, establish rapport, and set the stage for the conversation?

2. MAPPING (1-10): How effectively did the salesperson understand the client's needs, pain points, and situation?

3. PRODUCT PRESENTATION (1-10): How well did the salesperson present their solution and demonstrate value?

4. OBJECTION HANDLING (1-10): How effectively did the salesperson address concerns and overcome objections?

5. CLOSE (1-10): How well did the salesperson attempt to close the deal or move to next steps?

Respond in this exact JSON format:
{
  "introduction": [number 1-10],
  "mapping": [number 1-10],
  "productPresentation": [number 1-10],
  "objectionHandling": [number 1-10],
  "close": [number 1-10],
  "feedback": "[brief overall feedback and suggestions for improvement]"
}

Be fair but critical. Consider industry best practices for sales conversations.`;
};

// Start new conversation
router.post('/conversation', authenticateToken, [
  body('scenario').optional().isIn(['general', 'cold_call', 'objection_handling', 'closing', 'follow_up', 'custom']),
  body('industry').optional().trim(),
  body('product').optional().trim(),
  body('customerType').optional().trim(),
  body('clientName').optional().trim().isLength({ max: 100 }),
  body('clientPersonality').optional().trim().isLength({ max: 200 }),
  body('clientIndustry').optional().trim().isLength({ max: 100 }),
  body('clientRole').optional().trim().isLength({ max: 100 }),
  body('customPrompt').optional().trim().isLength({ max: 1000 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user can use AI
    if (!req.user.canUseAI || typeof req.user.canUseAI !== 'function') {
      console.error('User missing canUseAI method:', req.user);
      return res.status(500).json({
        error: 'User model error',
        message: 'User model is missing required methods. Please contact support.'
      });
    }
    
    if (!req.user.canUseAI()) {
      return res.status(403).json({
        error: 'Usage limit reached',
        message: 'You have reached your monthly AI conversation limit. Please upgrade your plan to continue.',
        usage: req.user.usage
      });
    }

    const { 
      scenario = 'general', 
      industry, 
      product, 
      customerType,
      clientName,
      clientPersonality,
      clientIndustry,
      clientRole,
      customPrompt,
      difficulty = 'medium'
    } = req.body;

    // Create conversation title
    let title;
    if (clientName) {
      title = `Practice with ${clientName}`;
    } else {
      title = `Sales Practice - ${scenario.replace('_', ' ').toUpperCase()}`;
    }

    // Create new conversation
    const conversation = new Conversation({
      userId: req.user._id,
      scenario,
      industry,
      product,
      customerType,
      title,
      // Store simple client customization in the conversation
      clientCustomization: {
        name: clientName,
        personality: clientPersonality,
        industry: clientIndustry,
        role: clientRole,
        customPrompt,
        difficulty
      }
    });

    await conversation.save();

    // Increment user usage
    await req.user.incrementAIUsage();

    res.json({
      message: 'Conversation started',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        scenario: conversation.scenario,
        clientCustomization: conversation.clientCustomization,
        messages: conversation.messages
      },
      usage: req.user.usage
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Send message to AI
router.post('/message', authenticateToken, [
  body('conversationId').isMongoId(),
  body('message').trim().notEmpty().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId, message } = req.body;

    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user can use AI
    if (!req.user.canUseAI || typeof req.user.canUseAI !== 'function') {
      console.error('User missing canUseAI method in message route:', req.user);
      return res.status(500).json({
        error: 'User model error',
        message: 'User model is missing required methods. Please contact support.'
      });
    }
    
    if (!req.user.canUseAI()) {
      return res.status(403).json({
        error: 'Usage limit reached',
        message: 'You have reached your monthly AI conversation limit. Please upgrade your plan to continue.',
        usage: req.user.usage
      });
    }

    // Add user message to conversation
    await conversation.addMessage('user', message);

    // Create AI prompt using simple client customization
    const prompt = createSalesPrompt(message, req.user.settings, conversation.scenario, conversation.clientCustomization);

    // If OpenAI is not configured, short-circuit with a friendly error
    if (!openai) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'OPENAI_API_KEY is missing. Configure it to enable AI conversations.'
      });
    }

    try {
      // Get AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      // Add AI response to conversation
      await conversation.addMessage('assistant', aiResponse, tokensUsed);

      // Note: Usage is only incremented when starting a conversation, not for each message

      res.json({
        message: 'Message sent successfully',
        response: aiResponse,
        conversation: {
          id: conversation._id,
          messages: conversation.messages,
          totalTokens: conversation.totalTokens
        },
        usage: req.user.usage
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation history
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.getUserHistory(req.user._id, parseInt(limit), skip);
    const total = await Conversation.countDocuments({ userId: req.user._id, isActive: true });

    res.json({
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get specific conversation
router.get('/conversation/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      conversation: {
        id: conversation._id,
        title: conversation.title,
        scenario: conversation.scenario,
        messages: conversation.messages,
        totalTokens: conversation.totalTokens,
        duration: conversation.duration,
        rating: conversation.rating,
        feedback: conversation.feedback,
        aiRatings: conversation.aiRatings,
        aiRatingFeedback: conversation.aiRatingFeedback,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Rate conversation
router.post('/conversation/:id/rate', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('feedback').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, feedback } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
        isActive: true
      },
      {
        rating,
        feedback,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      message: 'Conversation rated successfully',
      conversation: {
        id: conversation._id,
        rating: conversation.rating,
        feedback: conversation.feedback
      }
    });
  } catch (error) {
    console.error('Rate conversation error:', error);
    res.status(500).json({ error: 'Failed to rate conversation' });
  }
});

// End conversation and get AI ratings
router.post('/conversation/:id/end', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // End conversation and calculate duration
    await conversation.endConversation();

    // Generate AI ratings if OpenAI is configured and conversation has messages
    if (openai && conversation.messages.length > 0) {
      try {
        const ratingPrompt = createRatingPrompt(conversation.messages);
        
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: ratingPrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        });

        const ratingResponse = completion.choices[0].message.content;
        
        try {
          const ratings = JSON.parse(ratingResponse);
          
          // Update conversation with AI ratings
          conversation.aiRatings = {
            introduction: ratings.introduction,
            mapping: ratings.mapping,
            productPresentation: ratings.productPresentation,
            objectionHandling: ratings.objectionHandling,
            close: ratings.close
          };
          conversation.aiRatingFeedback = ratings.feedback;
          
          await conversation.save();
        } catch (parseError) {
          console.error('Failed to parse AI rating response:', parseError);
          console.log('Raw response:', ratingResponse);
        }
      } catch (openaiError) {
        console.error('OpenAI rating error:', openaiError);
        // Continue without ratings if AI fails
      }
    }

    res.json({
      message: 'Conversation ended successfully',
      conversation: {
        id: conversation._id,
        duration: conversation.duration,
        aiRatings: conversation.aiRatings,
        aiRatingFeedback: conversation.aiRatingFeedback,
        messageCount: conversation.messages.length
      }
    });
  } catch (error) {
    console.error('End conversation error:', error);
    res.status(500).json({ error: 'Failed to end conversation' });
  }
});

// Delete conversation
router.delete('/conversation/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Get usage statistics
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const limits = req.user.getSubscriptionLimits();
    const usagePercentage = limits.conversations > 0 
      ? Math.round((req.user.usage.aiConversations / limits.conversations) * 100)
      : 0;

    res.json({
      usage: req.user.usage,
      limits,
      usagePercentage,
      canUseAI: req.user.canUseAI()
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

module.exports = router; 