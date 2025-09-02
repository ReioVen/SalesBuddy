const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const mongoose = require('mongoose');
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
   try {
     const familySizes = [1, 2, 3, 4, 5, 6];
    const incomeLevels = [
      { level: 'low', range: '$25,000 - $50,000', priceSensitivity: 'very_high', description: 'budget-conscious, price-sensitive' },
      { level: 'lower_middle', range: '$50,000 - $75,000', priceSensitivity: 'high', description: 'cost-conscious, looks for value' },
      { level: 'middle', range: '$75,000 - $100,000', priceSensitivity: 'medium', description: 'moderate budget, quality-conscious' },
      { level: 'upper_middle', range: '$100,000 - $150,000', priceSensitivity: 'low', description: 'quality-focused, less price-sensitive' },
      { level: 'high', range: '$150,000 - $250,000', priceSensitivity: 'very_low', description: 'premium-focused, service-oriented' },
      { level: 'luxury', range: '$250,000+', priceSensitivity: 'none', description: 'luxury-focused, experience-driven' }
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
   let specificDetails = `Has ${familySize} family members. Focuses on practical solutions and value for money.`;
  
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
  
     // Generate client personality traits with randomizers
   const generatePersonalityTraits = () => {
     const traits = [];
     
     // 10% chance - client doesn't want services at all
     if (Math.random() < 0.10) {
       traits.push('completely_uninterested');
     }
     
     // 20% chance - client is interested and actually listens
     if (Math.random() < 0.20) {
       traits.push('interested_listener');
     }
     
     // 20% chance - client is talkative
     if (Math.random() < 0.20) {
       traits.push('talkative');
     }
     
     // 15% chance - client is goofy and makes jokes
     if (Math.random() < 0.15) {
       traits.push('goofy_jokester');
     }
     
     // 5% chance - client is really confused
     if (Math.random() < 0.05) {
       traits.push('confused');
     }
     
     // 10% chance - client is enthusiastic about the topic but still possible to not lead to a sale
     if (Math.random() < 0.10) {
       traits.push('enthusiastic_but_undecided');
     }
     
     // If no traits were selected, add a default trait
     if (traits.length === 0) {
       traits.push('standard_skeptical');
     }
     
     return traits;
   };
   
   // Generate selling points, problems, and weak spots based on difficulty
   const generateSellingPoints = (difficulty) => {
     const allSellingPoints = [
       "Loves getting the best deal possible",
       "Values quality over price",
       "Appreciates personalized service",
       "Wants to feel important and valued",
       "Hates being rushed into decisions",
       "Needs to understand the full value proposition",
       "Wants to see ROI before committing",
       "Appreciates ongoing support",
       "Values long-term relationships",
       "Hates hidden fees or surprises"
     ];
     
     switch (difficulty) {
       case 'easy': return allSellingPoints.slice(0, 5);
       case 'medium': return allSellingPoints.slice(0, 3);
       case 'hard': return allSellingPoints.slice(0, 1);
       default: return allSellingPoints.slice(0, 3);
     }
   };

  const generateProblems = (difficulty) => {
    const allProblems = [
      "Struggling with current solution inefficiency",
      "Missing out on cost savings opportunities",
      "Not getting the support they need",
      "Dealing with outdated technology",
      "Losing customers due to poor service",
      "Spending too much time on manual processes",
      "Not meeting growth targets",
      "Competition is getting ahead",
      "Team productivity is suffering",
      "Customer satisfaction is declining"
    ];
    
    switch (difficulty) {
      case 'easy': return allProblems.slice(0, 5);
      case 'medium': return allProblems.slice(0, 3);
      case 'hard': return allProblems.slice(0, 1);
      default: return allProblems.slice(0, 3);
    }
  };

  const generateWeakSpots = (difficulty) => {
    const allWeakSpots = [
      "Emotional decision making",
      "Fear of missing out",
      "Desire for status and recognition",
      "Need for security and stability",
      "Wanting to be seen as smart",
      "Pride in making good decisions",
      "Concern about what others think",
      "Desire to provide for family",
      "Wanting to leave a legacy",
      "Fear of regret"
    ];
    
    switch (difficulty) {
      case 'easy': return allWeakSpots.slice(0, 5);
      case 'medium': return allWeakSpots.slice(0, 3);
      case 'hard': return allWeakSpots.slice(0, 1);
      default: return allWeakSpots.slice(0, 3);
    }
  };

           const profile = {
      name: `${firstName} ${lastName}`,
      familySize,
      income: income.level,
      incomeRange: income.range,
      priceSensitivity: income.priceSensitivity,
      priceContext,
      familyType,
      personality,
      industry,
      role,
      specificDetails,
      fullProfile: `${firstName} ${lastName} is a ${personality} ${role} in the ${industry} industry. ${specificDetails} ${priceContext} Family income: ${income.range}.`,
      // Add personality traits
      personalityTraits: generatePersonalityTraits(),
      // Add selling points, problems, and weak spots
      sellingPoints: generateSellingPoints('medium'), // Default to medium, will be overridden
      problems: generateProblems('medium'),
      weakSpots: generateWeakSpots('medium')
    };
   
             // Validate that all required properties are present
     const requiredProps = ['name', 'familySize', 'income', 'incomeRange', 'priceSensitivity', 'priceContext', 'familyType', 'personality', 'industry', 'role', 'specificDetails', 'fullProfile', 'personalityTraits', 'sellingPoints', 'problems', 'weakSpots'];
   for (const prop of requiredProps) {
     if (profile[prop] === undefined || profile[prop] === null) {
       console.error(`Missing required property: ${prop}`);
       throw new Error(`Generated profile missing required property: ${prop}`);
     }
   }
  
  return profile;
  } catch (error) {
    console.error('Error generating client profile:', error);
    throw error;
  }
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
  4. YOU ARE THE CLIENT/CUSTOMER - the person being sold to. You are receiving a call from someone trying to sell you something.
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
  9. If the person calling goes off-topic or asks strange questions:
     - "What are you talking about? This is a sales call, right?"
     - "I don't understand what you're asking for. What service are you selling?"
     - "This is getting weird. Are you actually trying to sell me something?"
     - "I'm hanging up if you don't get to the point."
  10. Only become aggressive and ask to be removed from lists if:
     - The person calling is rude or pushy
     - They keep calling after you've said no multiple times
     - They're clearly not listening to your objections
     - They go off-topic repeatedly
     - You're very busy and they're wasting your time
  11. Give the person calling a chance to explain their value proposition before dismissing them.
  12. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  13. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
 ${conversationHistory.length > 0 ? `\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
   `${msg.role === 'user' ? 'CALLER' : 'CLIENT'}: ${msg.content}`
 ).join('\n')}\n` : ''}
 
 Current message from the CALLER: "${userMessage}"
 
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
     
     // Add personality trait-based behavior
     let personalityInstructions = '';
     if (clientCustomization.personalityTraits && clientCustomization.personalityTraits.length > 0) {
       clientCustomization.personalityTraits.forEach(trait => {
         switch (trait) {
           case 'completely_uninterested':
             personalityInstructions += 'You are completely uninterested in any services and will firmly decline all offers. You may be polite but very direct about not wanting to continue the conversation.';
             break;
           case 'interested_listener':
             personalityInstructions += 'You are genuinely interested in learning more and will listen attentively. You ask thoughtful questions and consider the information provided.';
             break;
           case 'talkative':
             personalityInstructions += 'You are very talkative and enjoy conversation. You may go off on tangents and share personal stories. You need to be gently guided back to the topic.';
             break;
           case 'goofy_jokester':
             personalityInstructions += 'You have a playful sense of humor and make jokes throughout the conversation. You may use sarcasm or witty remarks. Keep the mood light but stay on topic.';
             break;
           case 'confused':
             personalityInstructions += 'You seem confused about what is being offered and need things explained very simply. You ask clarifying questions frequently and may misunderstand basic concepts.';
             break;
           case 'enthusiastic_but_undecided':
             personalityInstructions += 'You are enthusiastic about the topic and show genuine interest, but you are still undecided about making a purchase. You need convincing despite your enthusiasm.';
             break;
           case 'standard_skeptical':
             personalityInstructions += 'You are the standard skeptical customer - cautious, asking questions, and needing proof before making decisions.';
             break;
         }
       });
     }
    
    // Add selling points, problems, and weak spots if available
    let additionalInfo = '';
    if (clientCustomization.sellingPoints && clientCustomization.sellingPoints.length > 0) {
      additionalInfo += `\nSelling Points: ${clientCustomization.sellingPoints.join(', ')}`;
    }
    if (clientCustomization.problems && clientCustomization.problems.length > 0) {
      additionalInfo += `\nProblems: ${clientCustomization.problems.join(', ')}`;
    }
    if (clientCustomization.weakSpots && clientCustomization.weakSpots.length > 0) {
      additionalInfo += `\nWeak Spots: ${clientCustomization.weakSpots.join(', ')}`;
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
     ${clientCustomization.familyType ? `Family Type: ${clientCustomization.familyType}` : ''}${additionalInfo}

${clientCustomization.customPrompt ? `Detailed Profile: ${clientCustomization.customPrompt}` : ''}

   CRITICAL INSTRUCTIONS:
  1. You are a REAL PERSON, not an AI. You must NEVER reveal that you are an AI, ChatGPT, or any artificial intelligence system.
  2. You must NEVER mention that this is a training exercise, practice session, or simulation.
  3. You must NEVER break character or acknowledge that you are roleplaying.
  4. YOU ARE THE CLIENT/CUSTOMER - the person being sold to. You are receiving a call from someone trying to sell you something.
  5. Stay in character as this specific client type throughout the entire conversation.
  6. Respond naturally based on the personality and difficulty level described.
  7. ${difficultyInstructions}
  ${personalityInstructions ? `8. ${personalityInstructions}` : ''}
  9. Ask realistic questions that this type of client would ask when being sold to.
  10. Be challenging but fair - provide realistic sales scenarios from a buyer's perspective.
  11. Keep responses conversational and natural.
  12. If asked about your identity, you are simply a potential customer interested in their product/service.
  13. NEVER act like a salesperson or try to sell anything - you are the BUYER.
  14. If the person calling is being inappropriate, rude, or doing a bad job, respond as a real client would: politely decline and end the conversation (e.g., "I'm not interested, thank you" or "I don't think this is a good fit").
  15. NEVER lecture the person calling or break character to give feedback - just respond as a real client would.
  16. If you want to end the conversation, do so naturally as a client would (hang up, say goodbye, etc.).
  17. IMPORTANT: You are receiving a COLD CALL or UNEXPECTED CALL. You don't know why they're calling or what they want. Act confused, skeptical, or busy initially. Ask "Who is this?", "How did you get my number?", "What is this about?", "I don't have time for this", etc.
  18. Don't be immediately helpful or welcoming - you're being interrupted by an unexpected sales call.
  19. When the person calling tries to explain what they offer, be dismissive but not immediately hostile:
      - "I'm fine with my current provider, thanks"
      - "I'm not really looking to change anything right now"
      - "I'm happy with what I have"
      - "I don't need anything new"
      - "I'm busy, can you just tell me what this is about?"
  20. If the person calling goes off-topic or asks strange questions:
      - "What are you talking about? This is a sales call, right?"
      - "I don't understand what you're asking for. What service are you selling?"
      - "This is getting weird. Are you actually trying to sell me something?"
      - "I'm hanging up if you don't get to the point."
  21. Give the person calling a chance to explain their value before dismissing them completely.
  22. Only become aggressive and ask to be removed from lists if they're rude, pushy, or clearly not listening to your objections.
  23. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  24. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
 ${conversationHistory.length > 0 ? `\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
   `${msg.role === 'user' ? 'CALLER' : 'CLIENT'}: ${msg.content}`
 ).join('\n')}\n` : ''}
 
 Current message from the CALLER: "${userMessage}"
 
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
  4. YOU ARE THE CLIENT/CUSTOMER - the person being sold to. You are receiving a call from someone trying to sell you something.
  5. Act as a realistic customer with common objections and concerns.
  6. Ask challenging questions that salespeople typically face when trying to sell to you.
  7. Keep responses conversational and natural.
  8. Don't break character - stay in the customer role.
  9. If asked about your identity, you are simply a potential customer interested in their product/service.
  10. NEVER act like a salesperson or try to sell anything - you are the BUYER.
  11. If the person calling is being inappropriate, rude, or doing a bad job, respond as a real client would: politely decline and end the conversation (e.g., "I'm not interested, thank you" or "I don't think this is a good fit").
  12. NEVER lecture the person calling or break character to give feedback - just respond as a real client would.
  13. If you want to end the conversation, do so naturally as a client would (hang up, say goodbye, etc.).
  14. IMPORTANT: You are receiving a COLD CALL or UNEXPECTED CALL. You don't know why they're calling or what they want. Act confused, skeptical, or busy initially. Ask "Who is this?", "How did you get my number?", "What is this about?", "I don't have time for this", etc.
  15. Don't be immediately helpful or welcoming - you're being interrupted by an unexpected sales call.
  16. When the person calling tries to explain what they offer, be dismissive but not immediately hostile:
      - "I'm fine with my current provider, thanks"
      - "I'm not really looking to change anything right now"
      - "I'm happy with what I have"
      - "I don't need anything new"
      - "I'm busy, can you just tell me what this is about?"
  17. If the person calling goes off-topic or asks strange questions:
      - "What are you talking about? This is a sales call, right?"
      - "I don't understand what you're asking for. What service are you selling?"
      - "This is getting weird. Are you actually trying to sell me something?"
      - "I'm hanging up if you don't get to the point."
  18. Give the person calling a chance to explain their value before dismissing them completely.
  19. Only become aggressive and ask to be removed from lists if they're rude, pushy, or clearly not listening to your objections.
  20. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  21. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
 ${conversationHistory.length > 0 ? `\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
   `${msg.role === 'user' ? 'CALLER' : 'CLIENT'}: ${msg.content}`
 ).join('\n')}\n` : ''}
 
 Current message from the CALLER: "${userMessage}"
 
 Respond as the CLIENT/CUSTOMER would, maintaining the conversation flow. Remember: You are a real person being sold to, not an AI.`;
  }

  return basePrompt;
};

// Create AI rating prompt for conversation analysis
const createRatingPrompt = (messages) => {
  const conversationText = messages.map(msg => 
    `${msg.role === 'user' ? 'SALESPERSON' : 'CLIENT'}: ${msg.content}`
  ).join('\n');

   return `You are an expert sales trainer analyzing a sales conversation. Please rate your performance in each phase on a scale of 1-10.
 
 CONVERSATION:
 ${conversationText}
 
 Please analyze the conversation and provide ratings for each sales phase:
 
 1. INTRODUCTION (1-10): How well did you introduce yourself, establish rapport, and set the stage for the conversation?
 
 2. MAPPING (1-10): How effectively did you understand the client's needs, pain points, and situation?
 
 3. PRODUCT PRESENTATION (1-10): How well did you present your solution and demonstrate value?
 
 4. OBJECTION HANDLING (1-10): How effectively did you address concerns and overcome objections?
 
 5. CLOSE (1-10): How well did you attempt to close the deal or move to next steps?
 
 Respond in this exact JSON format:
 {
   "introduction": [number 1-10],
   "mapping": [number 1-10],
   "productPresentation": [number 1-10],
   "objectionHandling": [number 1-10],
   "close": [number 1-10],
   "feedback": "[brief overall feedback and suggestions for improvement. Use 'you' instead of 'the salesperson' throughout the feedback.]"
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
      const usageStatus = req.user.getUsageStatus();
      return res.status(403).json({
        error: 'Usage limit reached',
        message: 'You have reached your monthly AI conversation limit. Please upgrade your plan to continue.',
        usage: req.user.usage,
        usageStatus
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
       // Generate random client profile with difficulty-based selling points
       const randomProfile = generateClientProfile();
       
       // Generate selling points, problems, and weak spots based on difficulty
       const generateSellingPoints = (diff) => {
         const allSellingPoints = [
           "Loves getting the best deal possible",
           "Values quality over price",
           "Appreciates personalized service",
           "Wants to feel important and valued",
           "Hates being rushed into decisions",
           "Needs to understand the full value proposition",
           "Wants to see ROI before committing",
           "Appreciates ongoing support",
           "Values long-term relationships",
           "Hates hidden fees or surprises"
         ];
         
         switch (diff) {
           case 'easy': return allSellingPoints.slice(0, 5);
           case 'medium': return allSellingPoints.slice(0, 3);
           case 'hard': return allSellingPoints.slice(0, 1);
           default: return allSellingPoints.slice(0, 3);
         }
       };

       const generateProblems = (diff) => {
         const allProblems = [
           "Struggling with current solution inefficiency",
           "Missing out on cost savings opportunities",
           "Not getting the support they need",
           "Dealing with outdated technology",
           "Losing customers due to poor service",
           "Spending too much time on manual processes",
           "Not meeting growth targets",
           "Competition is getting ahead",
           "Team productivity is suffering",
           "Customer satisfaction is declining"
         ];
         
         switch (diff) {
           case 'easy': return allProblems.slice(0, 5);
           case 'medium': return allProblems.slice(0, 3);
           case 'hard': return allProblems.slice(0, 1);
           default: return allProblems.slice(0, 3);
         }
       };

       const generateWeakSpots = (diff) => {
         const allWeakSpots = [
           "Emotional decision making",
           "Fear of missing out",
           "Desire for status and recognition",
           "Need for security and stability",
           "Wanting to be seen as smart",
           "Pride in making good decisions",
           "Concern about what others think",
           "Desire to provide for family",
           "Wanting to leave a legacy",
           "Fear of regret"
         ];
         
         switch (diff) {
           case 'easy': return allWeakSpots.slice(0, 5);
           case 'medium': return allWeakSpots.slice(0, 3);
           case 'hard': return allWeakSpots.slice(0, 1);
           default: return allWeakSpots.slice(0, 3);
         }
       };

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
            familyType: randomProfile.familyType,
            // Add personality traits
            personalityTraits: randomProfile.personalityTraits,
            // Add selling points, problems, and weak spots based on difficulty
            sellingPoints: generateSellingPoints(difficulty),
            problems: generateProblems(difficulty),
            weakSpots: generateWeakSpots(difficulty)
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

     // Validate conversation object
     const validationError = conversation.validateSync();
     if (validationError) {
       console.error('Conversation validation error:', validationError);
       throw new Error(`Conversation validation failed: ${validationError.message}`);
     }

     try {
       await conversation.save();
     } catch (conversationError) {
       console.error('Error creating/saving conversation:', conversationError);
       console.error('Conversation validation errors:', conversationError.errors);
       throw new Error(`Failed to create conversation: ${conversationError.message}`);
     }

     // Increment user usage
     try {
       await req.user.incrementAIUsage();
     } catch (usageError) {
       console.error('Error incrementing AI usage:', usageError);
       throw new Error(`Failed to increment usage: ${usageError.message}`);
     }

         // For lead calls only, show the specific details you want
     let clientInfo = conversation.clientCustomization;
           if (scenario === 'lead_call') {
        clientInfo = {
          name: conversation.clientCustomization.name,
          // Only show the specific details you want for lead calls
          familySize: conversation.clientCustomization.familySize,
          incomeRange: conversation.clientCustomization.incomeRange,
          priceSensitivity: conversation.clientCustomization.priceSensitivity,
          familyType: conversation.clientCustomization.familyType,
          // Add personality traits for better understanding
          personalityTraits: conversation.clientCustomization.personalityTraits,
          // Add selling points, problems, and weak spots
          sellingPoints: conversation.clientCustomization.sellingPoints,
          problems: conversation.clientCustomization.problems,
          weakSpots: conversation.clientCustomization.weakSpots
        };
     } else {
       // For all other scenarios (including cold calls), only show basic info
       clientInfo = {
         name: conversation.clientCustomization.name,
         scenario: conversation.scenario
       };
     }

    res.json({
      message: 'Conversation started',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        scenario: conversation.scenario,
        clientCustomization: clientInfo,
        messages: conversation.messages
      },
      usage: req.user.usage
    });
     } catch (error) {
     console.error('Start conversation error:', error);
     
     // Send error information for debugging
     res.status(500).json({ 
       error: 'Failed to start conversation',
       details: error.message
     });
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
      const usageStatus = req.user.getUsageStatus();
      return res.status(403).json({
        error: 'Usage limit reached',
        message: 'You have reached your monthly AI conversation limit. Please upgrade your plan to continue.',
        usage: req.user.usage,
        usageStatus
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

// Get current usage status
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const usageStatus = user.getUsageStatus();
    
    res.json({
      usage: user.usage,
      usageStatus,
      canUseAI: user.canUseAI()
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get usage status' });
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