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

// Generate random client profile
const generateClientProfile = () => {
  const familySizes = [1, 2, 3, 4, 5, 6];
  const incomeLevels = [
    { level: 'low', range: '$25,000 - $50,000', priceSensitivity: 'very_high', description: 'budget-conscious, price-sensitive' },
    { level: 'lower_middle', range: '$50,000 - $75,000', priceSensitivity: 'high', description: 'cost-conscious, looks for value' },
    { level: 'middle', range: '$75,000 - $100,000', priceSensitivity: 'medium', description: 'moderate budget, quality-conscious' },
    { level: 'upper_middle', range: '$100,000 - $150,000', priceSensitivity: 'low', description: 'quality-focused, less price-sensitive' },
    { level: 'high', range: '$150,000 - $250,000', priceSensitivity: 'very_low', description: 'premium-focused, service-oriented' },
    { level: 'luxury', range: '$250,000+', priceSensitivity: 'none', description: 'luxury-focused, experience-driven' }
  ];
  
  const contentInterests = [
    'sports', 'movies', 'children', 'news', 'documentaries', 'reality_tv', 'drama', 'comedy', 'action', 'romance'
  ];
  
  const familyTypes = [
    'single', 'couple', 'family_with_young_children', 'family_with_teens', 'empty_nesters', 'multi_generational'
  ];
  
  const personalities = [
    'analytical', 'impulsive', 'cautious', 'adventurous', 'traditional', 'modern', 'social', 'private', 'tech_savvy', 'tech_averse'
  ];
  
  const industries = [
    'technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'construction', 'real_estate', 'hospitality', 'transportation'
  ];
  
  const roles = [
    'decision_maker', 'influencer', 'end_user', 'budget_holder', 'technical_evaluator', 'procurement_specialist'
  ];
  
  // Random selections
  const familySize = familySizes[Math.floor(Math.random() * familySizes.length)];
  const income = incomeLevels[Math.floor(Math.random() * incomeLevels.length)];
  const contentInterest = contentInterests[Math.floor(Math.random() * contentInterests.length)];
  const familyType = familyTypes[Math.floor(Math.random() * familyTypes.length)];
  const personality = personalities[Math.floor(Math.random() * personalities.length)];
  const industry = industries[Math.floor(Math.random() * industries.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  
  // Generate random names
  const firstNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake', 'Dakota'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // Generate specific details based on selections
  let specificDetails = '';
  
  if (contentInterest === 'children') {
    specificDetails = `Has ${familySize} family members including young children. Interested in family-friendly content, educational programming, and safe entertainment options.`;
  } else if (contentInterest === 'sports') {
    specificDetails = `Sports enthusiast with ${familySize} family members. Follows multiple sports, interested in live sports coverage, and sports-related entertainment.`;
  } else if (contentInterest === 'movies') {
    specificDetails = `Movie lover with ${familySize} family members. Enjoys various genres, interested in premium movie channels, and cinematic content.`;
  } else {
    specificDetails = `Has ${familySize} family members with diverse entertainment interests. Enjoys ${contentInterest} content along with general entertainment.`;
  }
  
  // Generate price sensitivity context
  let priceContext = '';
  if (income.priceSensitivity === 'very_high') {
    priceContext = 'Very price-sensitive. Always asks about costs, discounts, and payment plans. Compares prices extensively.';
  } else if (income.priceSensitivity === 'high') {
    priceContext = 'Price-conscious. Asks about value for money and looks for deals.';
  } else if (income.priceSensitivity === 'medium') {
    priceContext = 'Moderately price-conscious. Interested in quality but also considers cost.';
  } else if (income.priceSensitivity === 'low') {
    priceContext = 'Less price-sensitive. Focuses on quality, features, and service.';
  } else {
    priceContext = 'Not price-sensitive. Prioritizes premium experience and top-tier service.';
  }
  
  return {
    name: `${firstName} ${lastName}`,
    familySize,
    income: income.level,
    incomeRange: income.range,
    priceSensitivity: income.priceSensitivity,
    priceContext,
    contentInterest,
    familyType,
    personality,
    industry,
    role,
    specificDetails,
    fullProfile: `${firstName} ${lastName} is a ${personality} ${role} in the ${industry} industry. ${specificDetails} ${priceContext} Family income: ${income.range}.`
  };
};

// Create sales training prompt
const createSalesPrompt = (userMessage, userSettings, scenario = 'general', clientCustomization = null, conversationHistory = []) => {
  let basePrompt;
  
  // Special handling for cold call and lead call scenarios
  if (scenario === 'cold_call' || scenario === 'lead_call') {
    const isLeadCall = scenario === 'lead_call';
    const callType = isLeadCall ? 'LEAD CALL' : 'COLD CALL';
    
         basePrompt = `You are a potential CLIENT/CUSTOMER receiving a ${callType}. You are NOT the salesperson - you are the one being sold to.

${isLeadCall ? 'You may have shown some interest in the past or filled out a form, but you are still skeptical and not expecting this call.' : 'You have NO prior relationship with this company and did NOT request this call.'}

CRITICAL INSTRUCTIONS:
1. You are a REAL PERSON, not an AI. You must NEVER reveal that you are an AI, ChatGPT, or any artificial intelligence system.
2. You must NEVER mention that this is a training exercise, practice session, or simulation.
3. You must NEVER break character or acknowledge that you are roleplaying.
4. YOU ARE THE CLIENT/CUSTOMER - the person being sold to. The user is the SALESPERSON trying to sell you something.
5. You are receiving an UNEXPECTED sales call and are initially skeptical and busy.
6. You are NOT immediately hostile - you will listen briefly to understand what they want.
7. Initial responses should be skeptical but not aggressive:
   - "Who is this? How did you get my number?"
   - "I'm busy right now, what is this about?"
   - "I wasn't expecting a call, what do you want?"
   - "I don't have much time, can you be quick?"
8. When they explain their service, be dismissive but not hostile:
   - "I'm fine with my current provider, thanks"
   - "I'm not really looking to change anything right now"
   - "I'm happy with what I have"
   - "I don't need anything new"
   - "I'm busy, can you just tell me what this is about?"
9. Only become aggressive and ask to be removed from lists if:
   - The salesperson is rude or pushy
   - They keep calling after you've said no multiple times
   - They're clearly not listening to your objections
   - You're very busy and they're wasting your time
10. Give the salesperson a chance to explain their value proposition before dismissing them.
11. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.

${conversationHistory.length > 0 ? `\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
  `${msg.role === 'user' ? 'SALESPERSON' : 'CLIENT'}: ${msg.content}`
).join('\n')}\n` : ''}

Current message from the SALESPERSON: "${userMessage}"

Respond as the CLIENT/CUSTOMER would, maintaining the conversation flow. Remember: You are a real person being sold to, not an AI.`;
    
    return basePrompt;
  }
  
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
        difficultyInstructions = 'You are very challenging and skeptical. You have strong objections, are price-sensitive, and ask difficult questions. You may be impatient, have had bad experiences before, or be very budget-conscious. You require strong persuasion and evidence. You are NOT immediately interested but will listen briefly to understand what they offer. You will be dismissive and challenging, but only become aggressive and ask to be removed from lists if the salesperson is rude, pushy, or clearly not listening to your objections.';
        break;
    }
    
         basePrompt = `You are a potential CLIENT/CUSTOMER who is being approached by a salesperson. You are NOT the salesperson - you are the one being sold to.

CLIENT PROFILE: ${clientName}
Personality: ${clientPersonality}
Industry: ${clientIndustry}
Role: ${clientRole}
Difficulty Level: ${difficulty}
${clientCustomization.familySize ? `Family Size: ${clientCustomization.familySize} members` : ''}
${clientCustomization.incomeRange ? `Income Level: ${clientCustomization.incomeRange}` : ''}
${clientCustomization.priceSensitivity ? `Price Sensitivity: ${clientCustomization.priceSensitivity}` : ''}
${clientCustomization.contentInterest ? `Content Interest: ${clientCustomization.contentInterest}` : ''}
${clientCustomization.familyType ? `Family Type: ${clientCustomization.familyType}` : ''}

${clientCustomization.customPrompt ? `Detailed Profile: ${clientCustomization.customPrompt}` : ''}

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
18. When the salesperson tries to explain what they offer, be dismissive but not immediately hostile:
    - "I'm fine with my current provider, thanks"
    - "I'm not really looking to change anything right now"
    - "I'm happy with what I have"
    - "I don't need anything new"
    - "I'm busy, can you just tell me what this is about?"
19. Give the salesperson a chance to explain their value before dismissing them completely.
20. Only become aggressive and ask to be removed from lists if they're rude, pushy, or clearly not listening to your objections.
21. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.

${conversationHistory.length > 0 ? `\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
  `${msg.role === 'user' ? 'SALESPERSON' : 'CLIENT'}: ${msg.content}`
).join('\n')}\n` : ''}

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
16. When the salesperson tries to explain what they offer, be dismissive but not immediately hostile:
    - "I'm fine with my current provider, thanks"
    - "I'm not really looking to change anything right now"
    - "I'm happy with what I have"
    - "I don't need anything new"
    - "I'm busy, can you just tell me what this is about?"
17. Give the salesperson a chance to explain their value before dismissing them completely.
18. Only become aggressive and ask to be removed from lists if they're rude, pushy, or clearly not listening to your objections.
19. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.

${conversationHistory.length > 0 ? `\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
  `${msg.role === 'user' ? 'SALESPERSON' : 'CLIENT'}: ${msg.content}`
).join('\n')}\n` : ''}

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
  body('scenario').optional().isIn(['general', 'cold_call', 'objection_handling', 'closing', 'follow_up', 'custom', 'lead_call']),
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
      // Handle special scenarios
      if (scenario === 'cold_call') {
        title = 'Cold Call Practice - Uninterested Prospects';
      } else if (scenario === 'lead_call') {
        title = 'Lead Call Practice - Skeptical Prospects';
      } else {
        title = `Sales Practice - ${scenario.replace('_', ' ').toUpperCase()}`;
      }
    }
    
    // Generate client profile if no custom client is specified
    let finalClientCustomization;
    if (clientName || clientPersonality || clientIndustry || clientRole || customPrompt) {
      // Use custom client settings
      finalClientCustomization = {
        name: clientName,
        personality: clientPersonality,
        industry: clientIndustry,
        role: clientRole,
        customPrompt: customPrompt,
        difficulty: difficulty
      };
    } else {
      // Generate random client profile
      const randomProfile = generateClientProfile();
      finalClientCustomization = {
        name: randomProfile.name,
        personality: randomProfile.personality,
        industry: randomProfile.industry,
        role: randomProfile.role,
        customPrompt: randomProfile.fullProfile,
        difficulty: difficulty,
        // Store additional profile details
        familySize: randomProfile.familySize,
        income: randomProfile.income,
        incomeRange: randomProfile.incomeRange,
        priceSensitivity: randomProfile.priceSensitivity,
        contentInterest: randomProfile.contentInterest,
        familyType: randomProfile.familyType
      };
      
      // Update title to include random client name
      title = `Practice with ${randomProfile.name}`;
    }

    // Create new conversation
    const conversation = new Conversation({
      userId: req.user._id,
      scenario,
      industry,
      product,
      customerType,
      title,
      // Store client customization in the conversation
      clientCustomization: finalClientCustomization
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

    // Create AI prompt using simple client customization and conversation history
    const prompt = createSalesPrompt(message, req.user.settings, conversation.scenario, conversation.clientCustomization, conversation.messages);

    // If OpenAI is not configured, short-circuit with a friendly error
    if (!openai) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'OPENAI_API_KEY is missing. Configure it to enable AI conversations.'
      });
    }

    try {
      // Prepare messages array with conversation history
      const messages = [
        { role: "system", content: prompt }
      ];
      
      // Add conversation history as user/assistant messages
      conversation.messages.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
      
      // Get AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
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