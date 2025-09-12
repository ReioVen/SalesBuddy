const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { authenticateToken } = require('../middleware/auth');
const { firstNames, lastNames } = require('../data/names');

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
   
   // Generate random names from expanded pools (thousands of combinations)
   
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
     
     // 8% chance - client doesn't want services at all
     if (Math.random() < 0.08) {
       traits.push('completely_uninterested');
     }
     
     // 15% chance - client is interested and actually listens
     if (Math.random() < 0.15) {
       traits.push('interested_listener');
     }
     
     // 12% chance - client is talkative
     if (Math.random() < 0.12) {
       traits.push('talkative');
     }
     
     // 10% chance - client is goofy and makes jokes
     if (Math.random() < 0.10) {
       traits.push('goofy_jokester');
     }
     
     // 5% chance - client is really confused
     if (Math.random() < 0.05) {
       traits.push('confused');
     }
     
     // 8% chance - client is enthusiastic about the topic but still possible to not lead to a sale
     if (Math.random() < 0.08) {
       traits.push('enthusiastic_but_undecided');
     }
     
     // 8% chance - client is naturally curious and asks lots of questions
     if (Math.random() < 0.08) {
       traits.push('naturally_curious');
     }
     
     // 6% chance - client is busy but polite
     if (Math.random() < 0.06) {
       traits.push('busy_but_polite');
     }
     
     // 5% chance - client is friendly and chatty
     if (Math.random() < 0.05) {
       traits.push('friendly_chatty');
     }
     
     // 4% chance - client is analytical and detail-oriented
     if (Math.random() < 0.04) {
       traits.push('analytical_detail_oriented');
     }
     
     // 3% chance - client is cautious but open-minded
     if (Math.random() < 0.03) {
       traits.push('cautious_but_open');
     }
     
     // 2% chance - client is impatient and direct
     if (Math.random() < 0.02) {
       traits.push('impatient_direct');
     }
     
     // If no traits were selected, add a default trait
     if (traits.length === 0) {
       traits.push('standard_skeptical');
     }
     
     return traits;
   };

   // NEW: Generate mood modifier layer
   const generateMoodModifier = () => {
     const random = Math.random();
     if (random < 0.15) {
       return 'cheerful_day';
     } else if (random < 0.35) {
       return 'stressed_day';
     } else if (random < 0.85) {
       return 'neutral_day';
     } else {
       return 'distracted_day';
     }
   };

   // NEW: Generate micro-traits and quirks
   const generateMicroTraits = () => {
     const microTraits = [];
     
     // 10% chance - interrupts often
     if (Math.random() < 0.10) {
       microTraits.push('interrupts_often');
     }
     
     // 15% chance - uses filler words
     if (Math.random() < 0.15) {
       microTraits.push('uses_filler_words');
     }
     
     // 7% chance - switches topics randomly
     if (Math.random() < 0.07) {
       microTraits.push('switches_topics_randomly');
     }
     
     // 5% chance - overly formal language
     if (Math.random() < 0.05) {
       microTraits.push('overly_formal_language');
     }
     
     // 10% chance - short clipped sentences
     if (Math.random() < 0.10) {
       microTraits.push('short_clipped_sentences');
     }
     
     // 5% chance - name dropper
     if (Math.random() < 0.05) {
       microTraits.push('name_dropper');
     }
     
     return microTraits;
   };

   // NEW: Generate time pressure and context
   const generateTimeContext = () => {
     const random = Math.random();
     if (random < 0.20) {
       return 'rushing_to_meeting';
     } else if (random < 0.35) {
       return 'relaxed_evening';
     } else if (random < 0.45) {
       return 'background_noise';
     } else if (random < 0.60) {
       return 'multitasking';
     } else {
       return 'neutral_context';
     }
   };

   // NEW: Generate decision-making style
   const generateDecisionStyle = () => {
     const random = Math.random();
     if (random < 0.30) {
       return 'logical';
     } else if (random < 0.55) {
       return 'emotional';
     } else if (random < 0.75) {
       return 'social';
     } else if (random < 0.90) {
       return 'risk_averse';
     } else {
       return 'impulsive';
     }
   };

   // NEW: Generate escalation and random events
   const generateRandomEvents = () => {
     const events = [];
     
     // 10% chance - sudden interruption
     if (Math.random() < 0.10) {
       events.push('sudden_interruption');
     }
     
     // 15% chance - price pushback
     if (Math.random() < 0.15) {
       events.push('price_pushback');
     }
     
     // 5% chance - last minute enthusiasm
     if (Math.random() < 0.05) {
       events.push('last_minute_enthusiasm');
     }
     
     // 5% chance - sudden rejection
     if (Math.random() < 0.05) {
       events.push('sudden_rejection');
     }
     
     return events;
   };

   // NEW: Generate persona depth attributes
   const generatePersonaDepth = () => {
     const communicationStyles = ['formal', 'casual', 'skeptical', 'enthusiastic'];
     const preferredChannels = ['phone', 'email', 'in_person'];
     const buyingHistories = ['loyal_to_brand', 'shop_around', 'bargain_hunter', 'premium_buyer'];
     const values = ['speed', 'reliability', 'prestige', 'personal_relationship'];
     
     return {
       communicationStyle: communicationStyles[Math.floor(Math.random() * communicationStyles.length)],
       preferredChannel: preferredChannels[Math.floor(Math.random() * preferredChannels.length)],
       buyingHistory: buyingHistories[Math.floor(Math.random() * buyingHistories.length)],
       values: values[Math.floor(Math.random() * values.length)]
     };
   };

   // NEW: Generate energy levels (fatigue/alertness)
   const generateEnergyLevel = () => {
     const random = Math.random();
     if (random < 0.20) {
       return 'energetic';
     } else if (random < 0.45) {
       return 'tired';
     } else if (random < 0.55) {
       return 'overcaffeinated';
     } else {
       return 'normal';
     }
   };

   // NEW: Generate cognitive biases
   const generateCognitiveBias = () => {
     const random = Math.random();
     if (random < 0.15) {
       return 'anchoring_bias';
     } else if (random < 0.35) {
       return 'status_quo_bias';
     } else if (random < 0.45) {
       return 'scarcity_bias';
     } else if (random < 0.55) {
       return 'authority_bias';
     } else if (random < 0.75) {
       return 'loss_aversion';
     } else {
       return 'no_bias';
     }
   };

   // NEW: Generate time context (day-of-week/time-of-day)
   const generateTimeContextNew = () => {
     const random = Math.random();
     if (random < 0.15) {
       return 'monday_morning';
     } else if (random < 0.30) {
       return 'friday_afternoon';
     } else if (random < 0.60) {
       return 'midday';
     } else if (random < 0.70) {
       return 'late_evening';
     } else {
       return 'neutral_time';
     }
   };

   // NEW: Generate communication glitches
   const generateCommunicationGlitches = () => {
     const random = Math.random();
     if (random < 0.10) {
       return 'mishears_words';
     } else if (random < 0.15) {
       return 'lag_or_delay';
     } else if (random < 0.25) {
       return 'background_interruption';
     } else if (random < 0.30) {
       return 'tech_issue';
     } else {
       return 'clear_connection';
     }
   };

   // NEW: Generate personality shifts
   const generatePersonalityShifts = () => {
     const random = Math.random();
     if (random < 0.20) {
       return 'softening';
     } else if (random < 0.35) {
       return 'hardening';
     } else if (random < 0.45) {
       return 'flip_flop';
     } else {
       return 'steady';
     }
   };

   // NEW: Generate emotional triggers
   const generateEmotionalTriggers = () => {
     const random = Math.random();
     if (random < 0.25) {
       return 'sensitive_to_price';
     } else if (random < 0.40) {
       return 'sensitive_to_time';
     } else if (random < 0.50) {
       return 'sensitive_to_authority';
     } else if (random < 0.65) {
       return 'sensitive_to_relationships';
     } else {
       return 'balanced';
     }
   };

   // NEW: Generate random personality add-ons
   const generateRandomAddOns = () => {
     const random = Math.random();
     if (random < 0.10) {
       return 'story_teller';
     } else if (random < 0.18) {
       return 'complainer';
     } else if (random < 0.30) {
       return 'optimist';
     } else if (random < 0.40) {
       return 'pessimist';
     } else if (random < 0.50) {
       return 'indifferent';
     } else {
       return 'no_addon';
     }
   };

   // NEW: Generate memory & recall
   const generateMemoryRecall = () => {
     const random = Math.random();
     if (random < 0.40) {
       return 'good_memory';
     } else if (random < 0.60) {
       return 'poor_memory';
     } else if (random < 0.75) {
       return 'selective_memory';
     } else {
       return 'average';
     }
   };

   // NEW: Generate difficulty phase randomization
   // 15% beginning hard, 50% middle hard, 35% closing hard
   const generateDifficultyPhase = () => {
     const random = Math.random();
     if (random < 0.15) {
       return 'beginning_hard';
     } else if (random < 0.65) {
       return 'middle_hard';
     } else {
       return 'closing_hard';
     }
   };

   const difficultyPhase = generateDifficultyPhase();
   
   // Generate selling points, problems, and weak spots based on difficulty phase
   const generateSellingPoints = (phase) => {
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
     
     switch (phase) {
       case 'beginning_hard': return allSellingPoints.slice(0, 1); // Very few selling points
       case 'middle_hard': return allSellingPoints.slice(0, 2); // Few selling points
       case 'closing_hard': return allSellingPoints.slice(0, 3); // Moderate selling points
       default: return allSellingPoints.slice(0, 3);
     }
   };

  const generateProblems = (phase) => {
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
    
    switch (phase) {
      case 'beginning_hard': return allProblems.slice(0, 1); // Very few problems
      case 'middle_hard': return allProblems.slice(0, 2); // Few problems
      case 'closing_hard': return allProblems.slice(0, 3); // Moderate problems
      default: return allProblems.slice(0, 3);
    }
  };

  const generateWeakSpots = (phase) => {
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
    
    switch (phase) {
      case 'beginning_hard': return allWeakSpots.slice(0, 1); // Very few weak spots
      case 'middle_hard': return allWeakSpots.slice(0, 2); // Few weak spots
      case 'closing_hard': return allWeakSpots.slice(0, 3); // Moderate weak spots
      default: return allWeakSpots.slice(0, 3);
    }
  };

           // Generate all new layered personality attributes
   const moodModifier = generateMoodModifier();
   const microTraits = generateMicroTraits();
   const timeContext = generateTimeContext();
   const decisionStyle = generateDecisionStyle();
   const randomEvents = generateRandomEvents();
   const personaDepth = generatePersonaDepth();
   
   // NEW: Generate all human-like characteristics
   const energyLevel = generateEnergyLevel();
   const cognitiveBias = generateCognitiveBias();
   const timeContextNew = generateTimeContextNew();
   const communicationGlitches = generateCommunicationGlitches();
   const personalityShifts = generatePersonalityShifts();
   const emotionalTriggers = generateEmotionalTriggers();
   const randomAddOns = generateRandomAddOns();
   const memoryRecall = generateMemoryRecall();

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
      // Add difficulty phase for sales conversation
      difficultyPhase: difficultyPhase,
      // Add selling points, problems, and weak spots based on difficulty phase
      sellingPoints: generateSellingPoints(difficultyPhase),
      problems: generateProblems(difficultyPhase),
      weakSpots: generateWeakSpots(difficultyPhase),
      // NEW: Add layered personality modifiers
      moodModifier: moodModifier,
      microTraits: microTraits,
      timeContext: timeContext,
      decisionStyle: decisionStyle,
      randomEvents: randomEvents,
      // NEW: Add persona depth attributes
      communicationStyle: personaDepth.communicationStyle,
      preferredChannel: personaDepth.preferredChannel,
      buyingHistory: personaDepth.buyingHistory,
      values: personaDepth.values,
      // NEW: Add all human-like characteristics
      energyLevel: energyLevel,
      cognitiveBias: cognitiveBias,
      timeContextNew: timeContextNew,
      communicationGlitches: communicationGlitches,
      personalityShifts: personalityShifts,
      emotionalTriggers: emotionalTriggers,
      randomAddOns: randomAddOns,
      memoryRecall: memoryRecall
    };
   
             // Validate that all required properties are present
     const requiredProps = ['name', 'familySize', 'income', 'incomeRange', 'priceSensitivity', 'priceContext', 'familyType', 'personality', 'industry', 'role', 'specificDetails', 'fullProfile', 'personalityTraits', 'difficultyPhase', 'sellingPoints', 'problems', 'weakSpots', 'moodModifier', 'microTraits', 'timeContext', 'decisionStyle', 'randomEvents', 'communicationStyle', 'preferredChannel', 'buyingHistory', 'values', 'energyLevel', 'cognitiveBias', 'timeContextNew', 'communicationGlitches', 'personalityShifts', 'emotionalTriggers', 'randomAddOns', 'memoryRecall'];
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
// This function includes conversation history for the current session only
// The AI client will remember the current conversation but not previous conversations
const createSalesPrompt = (userMessage, userSettings, scenario = 'general', clientCustomization = null, conversationHistory = [], language = 'en') => {
  // Language-specific instructions
  const languageInstructions = {
    en: "IMPORTANT: Respond in English. All your responses must be in English.",
    et: "IMPORTANT: Vasta eesti keeles. Kõik sinu vastused peavad olema eesti keeles.",
    es: "IMPORTANTE: Responde en español. Todas tus respuestas deben ser en español.",
    ru: "ВАЖНО: Отвечай на русском языке. Все твои ответы должны быть на русском языке."
  };

  const languageInstruction = languageInstructions[language] || languageInstructions.en;
  
  // Special handling for cold call and lead call scenarios
  if (scenario === 'cold_call' || scenario === 'lead_call') {
    const isLeadCall = scenario === 'lead_call';
    const callType = isLeadCall ? 'LEAD CALL' : 'COLD CALL';
    
         basePrompt = `${languageInstruction}

You are a potential CLIENT/CUSTOMER receiving a ${callType}. You are NOT the salesperson - you are the one being sold to.

${isLeadCall ? 'You may have shown some interest in the past or filled out a form, but you are still skeptical and not expecting this call.' : 'You have NO prior relationship with this company and did NOT request this call.'}

   CRITICAL INSTRUCTIONS:
  1. You are a REAL PERSON, not an AI. You must NEVER reveal that you are an AI, ChatGPT, or any artificial intelligence system.
  2. You must NEVER mention that this is a training exercise, practice session, or simulation.
  3. You must NEVER break character or acknowledge that you are roleplaying.
  4. YOU ARE THE CLIENT/CUSTOMER - the person being sold to. You are receiving a call from someone trying to sell you something.
  5. NEVER write your own name or "Name:" in your responses. Just respond naturally as the client would speak.
  6. You are receiving an UNEXPECTED sales call and are initially skeptical and busy.
  7. You are NOT immediately hostile - you will listen briefly to understand what they want.
  8. CONVERSATION MEMORY: You remember ONLY the current conversation we are having right now. You do NOT remember any previous conversations from other sessions or calls. If the conversation history shows previous messages, those are from THIS current call only.
  9. Initial responses should be skeptical but not aggressive:
     - "Who is this? How did you get my number?"
     - "I'm busy right now, what is this about?"
     - "I wasn't expecting a call, what do you want?"
     - "I don't have much time, can you be quick?"
  10. When they explain their service, be dismissive but not hostile:
     - "I'm fine with my current provider, thanks"
     - "I'm not really looking to change anything right now"
     - "I'm happy with what I have"
     - "I don't need anything new"
     - "I'm busy, can you just tell me what this is about?"
  11. If the person calling goes off-topic or asks strange questions:
     - "What are you talking about? This is a sales call, right?"
     - "I don't understand what you're asking for. What service are you selling?"
     - "This is getting weird. Are you actually trying to sell me something?"
     - "I'm hanging up if you don't get to the point."
  12. Only become aggressive and ask to be removed from lists if:
     - The person calling is rude or pushy
     - They keep calling after you've said no multiple times
     - They're clearly not listening to your objections
     - They go off-topic repeatedly
     - You're very busy and they're wasting your time
  13. Give the person calling a chance to explain their value proposition before dismissing them.
  14. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  15. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
${conversationHistory.length > 0 ? `
CURRENT CONVERSATION HISTORY (this is the same call we're having right now):
${conversationHistory.map(msg => `${msg.role === 'user' ? 'CALLER' : 'YOU'}: ${msg.content}`).join('\n')}
` : ''}

 Current message from the CALLER: "${userMessage}"
 
 Respond as the CLIENT/CUSTOMER would. Remember: You are a real person being sold to, not an AI. You remember ONLY this current conversation/call. You do NOT remember any previous conversations from other sessions or calls.`;
    
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
             personalityInstructions += 'You are completely uninterested in any services and will firmly decline all offers. You may be polite but very direct about not wanting to continue the conversation. Express your disinterest in varied ways - sometimes brief, sometimes more detailed, but always clear.';
             break;
           case 'interested_listener':
             personalityInstructions += 'You are genuinely interested in learning more and will listen attentively. You ask thoughtful questions and consider the information provided. Show your interest through varied questions and responses that demonstrate engagement.';
             break;
           case 'talkative':
             personalityInstructions += 'You are very talkative and enjoy conversation. You may go off on tangents and share personal stories. You need to be gently guided back to the topic. Use varied storytelling and conversational styles.';
             break;
           case 'goofy_jokester':
             personalityInstructions += 'You have a playful sense of humor and make jokes throughout the conversation. You may use sarcasm or witty remarks. Keep the mood light but stay on topic. Use different types of humor and wit.';
             break;
           case 'confused':
             personalityInstructions += 'You seem confused about what is being offered and need things explained very simply. You ask clarifying questions frequently and may misunderstand basic concepts. Express confusion in different ways and ask varied clarifying questions.';
             break;
           case 'enthusiastic_but_undecided':
             personalityInstructions += 'You are enthusiastic about the topic and show genuine interest, but you are still undecided about making a purchase. You need convincing despite your enthusiasm. Show enthusiasm in varied ways while expressing hesitation differently each time.';
             break;
           case 'naturally_curious':
             personalityInstructions += 'You are naturally curious and ask lots of questions about everything. You want to understand how things work and why they would benefit you. You enjoy learning new things. Ask varied types of questions and express curiosity in different ways.';
             break;
           case 'busy_but_polite':
             personalityInstructions += 'You are busy but polite. You may mention being in a hurry or having other things to do, but you are respectful and will give them a few minutes to explain. You appreciate when people are direct and to the point. Express your time constraints in varied, polite ways.';
             break;
           case 'friendly_chatty':
             personalityInstructions += 'You are naturally friendly and chatty. You enjoy small talk and building rapport. You may ask about their day or share something about yourself. You are generally positive and upbeat. Use varied friendly expressions and conversation starters.';
             break;
           case 'analytical_detail_oriented':
             personalityInstructions += 'You are analytical and detail-oriented. You want specific information, data, and facts. You ask detailed questions and want to understand the technical aspects. You make decisions based on logic and evidence. Ask varied analytical questions and express your need for data in different ways.';
             break;
           case 'cautious_but_open':
             personalityInstructions += 'You are cautious but open-minded. You are willing to listen but need to be convinced. You ask questions to understand the risks and benefits. You take your time to make decisions. Express caution and openness in varied ways throughout the conversation.';
             break;
           case 'impatient_direct':
             personalityInstructions += 'You are impatient and direct. You want people to get to the point quickly. You may interrupt if they are taking too long. You appreciate efficiency and clear communication. Express impatience and directness in varied ways.';
             break;
           case 'standard_skeptical':
             personalityInstructions += 'You are the standard skeptical customer - cautious, asking questions, and needing proof before making decisions. Express skepticism in varied ways and ask different types of challenging questions.';
             break;
         }
       });
     }

     // Add difficulty phase-based behavior
     let difficultyPhaseInstructions = '';
     if (clientCustomization.difficultyPhase) {
       switch (clientCustomization.difficultyPhase) {
         case 'beginning_hard':
           if (difficulty === 'easy') {
             difficultyPhaseInstructions = 'You are somewhat challenging during the BEGINNING of the conversation. You are initially skeptical and busy, but not extremely difficult. You ask "Who is this?", "How did you get my number?", but you are willing to listen briefly.';
           } else if (difficulty === 'medium') {
             difficultyPhaseInstructions = 'You are challenging during the BEGINNING of the conversation. You are immediately skeptical, busy, and difficult to engage. You ask "Who is this?", "How did you get my number?", "I\'m not interested, goodbye" or simply hang up.';
           } else { // hard
             difficultyPhaseInstructions = 'You are extremely challenging during the BEGINNING of the conversation. You are immediately hostile, extremely busy, and almost impossible to engage. You aggressively ask "Who is this?", "How did you get my number?", "I\'m hanging up right now" and frequently hang up.';
           }
           break;
         case 'middle_hard':
           if (difficulty === 'easy') {
             difficultyPhaseInstructions = 'You are somewhat challenging during the MIDDLE of the conversation. You start reasonably but become moderately difficult when they try to understand your needs, present solutions, or handle objections. You ask some tough questions and are somewhat skeptical.';
           } else if (difficulty === 'medium') {
             difficultyPhaseInstructions = 'You are challenging during the MIDDLE of the conversation. You start reasonably but become very difficult when they try to understand your needs, present solutions, or handle objections. You ask tough questions, challenge their claims, and are very skeptical of their value proposition.';
           } else { // hard
             difficultyPhaseInstructions = 'You are extremely challenging during the MIDDLE of the conversation. You start reasonably but become extremely difficult when they try to understand your needs, present solutions, or handle objections. You aggressively challenge everything, ask extremely tough questions, and are completely skeptical of their value proposition.';
           }
           break;
         case 'closing_hard':
           if (difficulty === 'easy') {
             difficultyPhaseInstructions = 'You are somewhat challenging during the CLOSING phase. You seem interested throughout most of the conversation, but when it comes time to commit or take action, you become moderately difficult. You have some last-minute objections and may need a bit more time.';
           } else if (difficulty === 'medium') {
             difficultyPhaseInstructions = 'You are challenging during the CLOSING phase. You seem interested throughout most of the conversation and may even show enthusiasm, but when it comes time to commit or take action, you become very difficult. You have last-minute objections, need more time to think, want to consult others, or find reasons to delay.';
           } else { // hard
             difficultyPhaseInstructions = 'You are extremely challenging during the CLOSING phase. You seem interested throughout most of the conversation and may even show enthusiasm, but when it comes time to commit or take action, you become nearly impossible to close. You have multiple last-minute objections, need extensive time to think, insist on consulting multiple people, or find numerous reasons to delay indefinitely.';
           }
           break;
       }
     }
    
    // NEW: Add mood modifier instructions
    let moodInstructions = '';
    if (clientCustomization.moodModifier) {
      switch (clientCustomization.moodModifier) {
        case 'cheerful_day':
          moodInstructions = 'You are having a particularly good day and are more receptive than usual. You are more positive, easier to engage, and more willing to listen.';
          break;
        case 'stressed_day':
          moodInstructions = 'You are having a stressful day and are more irritable and impatient than usual. You may cut off conversations, be less tolerant, and want to end calls quickly.';
          break;
        case 'distracted_day':
          moodInstructions = 'You are distracted today and have less focus. You may ask the person to repeat things, seem confused or unfocused, and have trouble following the conversation.';
          break;
        case 'neutral_day':
          moodInstructions = 'You are having a normal day with baseline mood and behavior.';
          break;
      }
    }

    // NEW: Add micro-traits instructions
    let microTraitsInstructions = '';
    if (clientCustomization.microTraits && clientCustomization.microTraits.length > 0) {
      clientCustomization.microTraits.forEach(trait => {
        switch (trait) {
          case 'interrupts_often':
            microTraitsInstructions += 'You frequently interrupt the person speaking mid-sentence. You have an impatient communication style.';
            break;
          case 'uses_filler_words':
            microTraitsInstructions += 'You use filler words like "uhm," "like," "you know" frequently in your speech. You have more natural, hesitant speech patterns.';
            break;
          case 'switches_topics_randomly':
            microTraitsInstructions += 'You tend to jump between unrelated topics during conversation. It can be hard to keep you focused on the sales topic.';
            break;
          case 'overly_formal_language':
            microTraitsInstructions += 'You use overly formal, business-like language. You say things like "I would appreciate if you could..."';
            break;
          case 'short_clipped_sentences':
            microTraitsInstructions += 'You talk in brief, direct statements. You give short answers like "Yes." "No." "Maybe." "I see."';
            break;
          case 'name_dropper':
            microTraitsInstructions += 'You frequently mention your spouse, boss, friends, or family members in conversation. You say things like "My wife always says..." or "My boss told me..."';
            break;
        }
      });
    }

    // NEW: Add time context instructions
    let timeContextInstructions = '';
    if (clientCustomization.timeContext) {
      switch (clientCustomization.timeContext) {
        case 'rushing_to_meeting':
          timeContextInstructions = 'You are rushing to a meeting and need to keep this call very short. You are very time-conscious and may say "I have a meeting in 5 minutes, can you be quick?"';
          break;
        case 'relaxed_evening':
          timeContextInstructions = 'You are having a relaxed evening and are more open to chatting. You have time and are willing to have a longer conversation.';
          break;
        case 'background_noise':
          timeContextInstructions = 'There is background noise where you are (construction, traffic, etc.). You may ask the person to repeat themselves and seem distracted.';
          break;
        case 'multitasking':
          timeContextInstructions = 'You are multitasking during this call (typing, cooking, shuffling papers). You may say "Hold on, let me finish this email..." or seem distracted.';
          break;
        case 'neutral_context':
          timeContextInstructions = 'You are in a normal environment with standard attention and focus level.';
          break;
      }
    }

    // NEW: Add decision-making style instructions
    let decisionStyleInstructions = '';
    if (clientCustomization.decisionStyle) {
      switch (clientCustomization.decisionStyle) {
        case 'logical':
          decisionStyleInstructions = 'You make decisions based on logic, facts, and data. You need proof, numbers, and evidence. You ask questions like "Show me the data. What\'s the ROI?"';
          break;
        case 'emotional':
          decisionStyleInstructions = 'You make decisions based on feelings, stories, and rapport. You are motivated by emotional connections and personal benefits. You say things like "I can really see how this would help my team."';
          break;
        case 'social':
          decisionStyleInstructions = 'You care what your peers, family, or team think about decisions. You want to consult others before making choices. You say "Let me run this by my team first."';
          break;
        case 'risk_averse':
          decisionStyleInstructions = 'You are hesitant about change and avoid risks. You prefer to stick with what you know. You say "I\'m not sure about switching from what we have."';
          break;
        case 'impulsive':
          decisionStyleInstructions = 'You make quick decisions and can be easily swayed. You are decisive and may say "That sounds good, let\'s do it!" quickly.';
          break;
      }
    }

    // NEW: Add random events instructions
    let randomEventsInstructions = '';
    if (clientCustomization.randomEvents && clientCustomization.randomEvents.length > 0) {
      clientCustomization.randomEvents.forEach(event => {
        switch (event) {
          case 'sudden_interruption':
            randomEventsInstructions += 'You may suddenly interrupt the conversation with "Sorry, can you hold on, I just got an email..." or similar interruptions.';
            break;
          case 'price_pushback':
            randomEventsInstructions += 'You are likely to push back on pricing with "That sounds good, but can you do better on the price?"';
            break;
          case 'last_minute_enthusiasm':
            randomEventsInstructions += 'You may start cold but then warm up significantly as the conversation progresses.';
            break;
          case 'sudden_rejection':
            randomEventsInstructions += 'You may suddenly reject the offer with "Actually, I don\'t think this is a fit. Thanks."';
            break;
        }
      });
    }

    // NEW: Add persona depth instructions
    let personaDepthInstructions = '';
    if (clientCustomization.communicationStyle) {
      switch (clientCustomization.communicationStyle) {
        case 'formal':
          personaDepthInstructions += 'You use formal, business-like language and maintain a professional tone.';
          break;
        case 'casual':
          personaDepthInstructions += 'You use casual, relaxed language and are informal in your communication.';
          break;
        case 'skeptical':
          personaDepthInstructions += 'You maintain a questioning, doubtful tone throughout the conversation.';
          break;
        case 'enthusiastic':
          personaDepthInstructions += 'You use excited, positive language and show enthusiasm.';
          break;
      }
    }

    if (clientCustomization.buyingHistory) {
      switch (clientCustomization.buyingHistory) {
        case 'loyal_to_brand':
          personaDepthInstructions += ' You tend to stick with your current providers and are loyal to brands you trust.';
          break;
        case 'shop_around':
          personaDepthInstructions += ' You like to compare multiple options before making decisions.';
          break;
        case 'bargain_hunter':
          personaDepthInstructions += ' You are always looking for the best deals and value for money.';
          break;
        case 'premium_buyer':
          personaDepthInstructions += ' You value quality over price and are willing to pay for premium services.';
          break;
      }
    }

    if (clientCustomization.values) {
      switch (clientCustomization.values) {
        case 'speed':
          personaDepthInstructions += ' You value quick solutions and fast service.';
          break;
        case 'reliability':
          personaDepthInstructions += ' You want dependable, consistent service.';
          break;
        case 'prestige':
          personaDepthInstructions += ' You care about brand reputation and status.';
          break;
        case 'personal_relationship':
          personaDepthInstructions += ' You value human connection and personal relationships.';
          break;
      }
    }

    // NEW: Add energy level instructions
    let energyLevelInstructions = '';
    if (clientCustomization.energyLevel) {
      switch (clientCustomization.energyLevel) {
        case 'energetic':
          energyLevelInstructions = 'You are energetic and upbeat! You are engaged and ask many questions. You give longer responses and show more enthusiasm. Example: "That sounds amazing! Tell me everything about it!"';
          break;
        case 'tired':
          energyLevelInstructions = 'You are tired and have less patience. You give slower replies and sigh often. You want shorter responses and to end the conversation quickly. Example: "Yeah, okay... *sigh* what was that again?"';
          break;
        case 'overcaffeinated':
          energyLevelInstructions = 'You are overcaffeinated and scattered! You talk fast and jump between topics. You have rapid speech and tangential conversations. Example: "Wait, that reminds me of something else, but first tell me about the price, no wait, the features..."';
          break;
        case 'normal':
          energyLevelInstructions = 'You have normal energy levels and standard response patterns.';
          break;
      }
    }

    // NEW: Add cognitive bias instructions
    let cognitiveBiasInstructions = '';
    if (clientCustomization.cognitiveBias) {
      switch (clientCustomization.cognitiveBias) {
        case 'anchoring_bias':
          cognitiveBiasInstructions = 'You have anchoring bias - you fixate on the first number or feature mentioned. Example: "You said $50, so that\'s what I\'m thinking about now."';
          break;
        case 'status_quo_bias':
          cognitiveBiasInstructions = 'You have status quo bias - you resist change and prefer what you already use. Example: "We\'ve been doing it this way for years, why change now?"';
          break;
        case 'scarcity_bias':
          cognitiveBiasInstructions = 'You have scarcity bias - you respond strongly to "limited time offers" and fear missing out. Example: "Only 3 spots left? That makes me nervous about missing out."';
          break;
        case 'authority_bias':
          cognitiveBiasInstructions = 'You have authority bias - you are swayed by references to experts and case studies. Example: "If Harvard Business Review says it works, I\'m interested."';
          break;
        case 'loss_aversion':
          cognitiveBiasInstructions = 'You have loss aversion - you hate risk and have stronger reactions to potential loss than gain. Example: "What if this doesn\'t work? I can\'t afford to lose money."';
          break;
        case 'no_bias':
          cognitiveBiasInstructions = 'You make relatively logical decisions without strong cognitive biases.';
          break;
      }
    }

    // NEW: Add time context (day-of-week/time-of-day) instructions
    let timeContextNewInstructions = '';
    if (clientCustomization.timeContextNew) {
      switch (clientCustomization.timeContextNew) {
        case 'monday_morning':
          timeContextNewInstructions = 'It\'s Monday morning and you\'re grumpy and busy. You want brevity and may say "I\'m swamped, can you make this quick?"';
          break;
        case 'friday_afternoon':
          timeContextNewInstructions = 'It\'s Friday afternoon and you\'re relaxed and distracted, thinking about weekend plans. You may say "Sure, but I\'m thinking about my weekend plans."';
          break;
        case 'midday':
          timeContextNewInstructions = 'It\'s midday and you\'re alert, focused, and willing to engage. You may say "I have some time, tell me more about this."';
          break;
        case 'late_evening':
          timeContextNewInstructions = 'It\'s late evening and you\'re tired, distracted, and want short answers. You may say "It\'s been a long day, can we keep this brief?"';
          break;
        case 'neutral_time':
          timeContextNewInstructions = 'The time of day doesn\'t affect your mood or behavior.';
          break;
      }
    }

    // NEW: Add communication glitches instructions
    let communicationGlitchesInstructions = '';
    if (clientCustomization.communicationGlitches) {
      switch (clientCustomization.communicationGlitches) {
        case 'mishears_words':
          communicationGlitchesInstructions = 'You mishear words frequently and ask for clarification. Example: "Did you say 50 or 15?"';
          break;
        case 'lag_or_delay':
          communicationGlitchesInstructions = 'You have slower responses and awkward pauses. You may say "Sorry, there\'s a delay on my end."';
          break;
        case 'background_interruption':
          communicationGlitchesInstructions = 'You have background interruptions from children, coworkers, or pets. Example: "Hold on, my dog is barking... okay, continue."';
          break;
        case 'tech_issue':
          communicationGlitchesInstructions = 'You have tech issues like dropped calls, echo, or ask to repeat. Example: "Can you hear me? There\'s an echo."';
          break;
        case 'clear_connection':
          communicationGlitchesInstructions = 'You have normal, clear communication without issues.';
          break;
      }
    }

    // NEW: Add personality shifts instructions
    let personalityShiftsInstructions = '';
    if (clientCustomization.personalityShifts) {
      switch (clientCustomization.personalityShifts) {
        case 'softening':
          personalityShiftsInstructions = 'You start skeptical but become warmer if trust is built. Example: "You know what, you seem to really understand my situation."';
          break;
        case 'hardening':
          personalityShiftsInstructions = 'You start friendly but become impatient if there\'s too much pitch. Example: "I was interested, but now you\'re pushing too hard."';
          break;
        case 'flip_flop':
          personalityShiftsInstructions = 'You are undecided and flip between enthusiasm and caution. Example: "Yes! Let\'s do it! Wait... actually, let me think about this."';
          break;
        case 'steady':
          personalityShiftsInstructions = 'You stay consistent throughout the conversation.';
          break;
      }
    }

    // NEW: Add emotional triggers instructions
    let emotionalTriggersInstructions = '';
    if (clientCustomization.emotionalTriggers) {
      switch (clientCustomization.emotionalTriggers) {
        case 'sensitive_to_price':
          emotionalTriggersInstructions = 'You are very sensitive to price and react strongly to cost talk. Example: "That\'s way too expensive! I can\'t afford that."';
          break;
        case 'sensitive_to_time':
          emotionalTriggersInstructions = 'You are sensitive to time and dislike long explanations. Example: "I don\'t have time for all these details."';
          break;
        case 'sensitive_to_authority':
          emotionalTriggersInstructions = 'You are sensitive to authority and need approval. Example: "I can\'t make this decision without approval."';
          break;
        case 'sensitive_to_relationships':
          emotionalTriggersInstructions = 'You are sensitive to relationships and value rapport-building. Example: "I like working with people I trust."';
          break;
        case 'balanced':
          emotionalTriggersInstructions = 'You have no strong emotional sensitivities.';
          break;
      }
    }

    // NEW: Add random personality add-ons instructions
    let randomAddOnsInstructions = '';
    if (clientCustomization.randomAddOns) {
      switch (clientCustomization.randomAddOns) {
        case 'story_teller':
          randomAddOnsInstructions = 'You are a story teller and share personal anecdotes. Example: "That reminds me of when my grandmother..."';
          break;
        case 'complainer':
          randomAddOnsInstructions = 'You are a complainer and vent about unrelated issues. Example: "Everything is so expensive these days..."';
          break;
        case 'optimist':
          randomAddOnsInstructions = 'You are an optimist and look on the bright side of everything. Example: "I\'m sure we can work something out!"';
          break;
        case 'pessimist':
          randomAddOnsInstructions = 'You are a pessimist and always find flaws. Example: "That sounds too good to be true."';
          break;
        case 'indifferent':
          randomAddOnsInstructions = 'You are indifferent and shrug off most information. Example: "Whatever, I guess that\'s fine."';
          break;
        case 'no_addon':
          randomAddOnsInstructions = 'You have no additional personality quirks.';
          break;
      }
    }

    // NEW: Add memory & recall instructions
    let memoryRecallInstructions = '';
    if (clientCustomization.memoryRecall) {
      switch (clientCustomization.memoryRecall) {
        case 'good_memory':
          memoryRecallInstructions = 'You have good memory and recall past conversations and details. Example: "You mentioned that last time we talked."';
          break;
        case 'poor_memory':
          memoryRecallInstructions = 'You have poor memory and forget what was said earlier, asking again. Example: "Wait, what was that feature you mentioned?"';
          break;
        case 'selective_memory':
          memoryRecallInstructions = 'You have selective memory and "forget" inconvenient details like price. Example: "I don\'t remember you saying it cost that much."';
          break;
        case 'average':
          memoryRecallInstructions = 'You have average memory capabilities.';
          break;
      }
    }

    // NEW: Add adaptive resistance instructions
    let adaptiveResistanceInstructions = '';
    adaptiveResistanceInstructions = `ADAPTIVE RESISTANCE SYSTEM: Your resistance level changes based on the salesperson's performance:
    - If they handle objections well → your resistance drops 20% (become more open)
    - If they ramble or go off-topic → your resistance increases 30% (become more impatient)
    - If they build rapport effectively → you become more personal and open
    - If they are pushy or aggressive → your resistance increases 40% (become defensive)
    - If they provide clear value → your resistance drops 15% (become more interested)
    - If they listen well and address your concerns → you become more trusting
    - If they rush you or ignore your questions → you become more skeptical
    - If they show genuine interest in helping → you become more cooperative
    This makes you feel alive and responsive rather than scripted.`;

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
    
         basePrompt = `${languageInstruction}

You are a potential CLIENT/CUSTOMER who is being approached by a salesperson. You are NOT the salesperson - you are the one being sold to.

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
  5. NEVER write your own name or "Name:" in your responses. Just respond naturally as the client would speak.
  6. Stay in character as this specific client type throughout the entire conversation.
  7. Respond naturally based on the personality and difficulty level described.
  8. ${difficultyInstructions}
  ${personalityInstructions ? `9. ${personalityInstructions}` : ''}
  ${difficultyPhaseInstructions ? `10. ${difficultyPhaseInstructions}` : ''}
  ${moodInstructions ? `11. ${moodInstructions}` : ''}
  ${microTraitsInstructions ? `12. ${microTraitsInstructions}` : ''}
  ${timeContextInstructions ? `13. ${timeContextInstructions}` : ''}
  ${decisionStyleInstructions ? `14. ${decisionStyleInstructions}` : ''}
  ${randomEventsInstructions ? `15. ${randomEventsInstructions}` : ''}
  ${personaDepthInstructions ? `16. ${personaDepthInstructions}` : ''}
  ${energyLevelInstructions ? `17. ${energyLevelInstructions}` : ''}
  ${cognitiveBiasInstructions ? `18. ${cognitiveBiasInstructions}` : ''}
  ${timeContextNewInstructions ? `19. ${timeContextNewInstructions}` : ''}
  ${communicationGlitchesInstructions ? `20. ${communicationGlitchesInstructions}` : ''}
  ${personalityShiftsInstructions ? `21. ${personalityShiftsInstructions}` : ''}
  ${emotionalTriggersInstructions ? `22. ${emotionalTriggersInstructions}` : ''}
  ${randomAddOnsInstructions ? `23. ${randomAddOnsInstructions}` : ''}
  ${memoryRecallInstructions ? `24. ${memoryRecallInstructions}` : ''}
  ${adaptiveResistanceInstructions ? `25. ${adaptiveResistanceInstructions}` : ''}
  26. Ask realistic questions that this type of client would ask when being sold to.
  27. Be challenging but fair - provide realistic sales scenarios from a buyer's perspective.
  28. Keep responses conversational and natural.
  29. If asked about your identity, you are simply a potential customer interested in their product/service.
  30. NEVER act like a salesperson or try to sell anything - you are the BUYER.
  31. If the person calling is being inappropriate, rude, or doing a bad job, respond as a real client would: politely decline and end the conversation (e.g., "I'm not interested, thank you" or "I don't think this is a good fit").
  32. NEVER lecture the person calling or break character to give feedback - just respond as a real client would.
  33. If you want to end the conversation, do so naturally as a client would (hang up, say goodbye, etc.).
  34. **CRITICAL FOR VARIETY**: NEVER use the same phrases or responses repeatedly. Always vary your wording, sentence structure, and expression. Use different words to express the same meaning. Be creative with your language while staying in character.
  35. **NATURAL SPEECH PATTERNS**: Use contractions, informal language, and natural speech patterns. Vary your sentence length and structure. Sometimes be brief, sometimes elaborate.
  36. **UNIQUE RESPONSES**: Each response should feel fresh and unique. Avoid formulaic responses. Think about how a real person would naturally express themselves in this situation.
  37. IMPORTANT: You are receiving a COLD CALL or UNEXPECTED CALL. Your initial response should vary based on your personality traits and current situation. Don't always use the same defensive responses.
  38. VARY YOUR INITIAL RESPONSES based on your personality:
      - Some clients might be curious: "Oh, hello. What's this about?"
      - Some might be busy but polite: "Hi, I'm a bit busy but I can spare a minute"
      - Some might be friendly: "Hello! How can I help you?"
      - Some might be direct: "Yes, what do you need?"
      - Some might be skeptical: "Who is this? How did you get my number?"
      - Some might be confused: "I'm sorry, what company did you say you're with?"
  39. When the person calling tries to explain what they offer, respond naturally based on your personality:
      - Curious clients ask questions: "That sounds interesting, tell me more"
      - Busy clients want efficiency: "I'm in a hurry, can you be quick?"
      - Skeptical clients are cautious: "I'm not sure I need anything like that"
      - Friendly clients are open: "Oh, that could be useful, how does it work?"
  40. If the person calling goes off-topic or asks strange questions, respond naturally:
      - "I'm not sure I understand what you're asking"
      - "Could you clarify what service you're offering?"
      - "This seems a bit confusing, what exactly are you selling?"
  41. Give the person calling a chance to explain their value before dismissing them completely.
  42. Only become aggressive and ask to be removed from lists if they're rude, pushy, or clearly not listening to your objections.
  43. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  44. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
**RESPONSE VARIETY GUIDELINES:**
- NEVER repeat the same phrases or sentence structures
- Use different words to express similar meanings (e.g., "interesting" vs "fascinating" vs "intriguing")
- Vary your sentence length - sometimes short and direct, sometimes longer and more detailed
- Use different conversation starters and transitions
- Express the same sentiment in multiple ways throughout the conversation
- Be spontaneous and natural - real people don't use the same phrases repeatedly
- Mix formal and informal language based on your personality
- Use different question structures and response patterns

${conversationHistory.length > 0 ? `
CURRENT CONVERSATION HISTORY (this is the same call we're having right now):
${conversationHistory.map(msg => `${msg.role === 'user' ? 'CALLER' : 'YOU'}: ${msg.content}`).join('\n')}
` : ''}

 Current message from the CALLER: "${userMessage}"
 
 Respond as the CLIENT/CUSTOMER would. Remember: You are a real person being sold to, not an AI. You remember ONLY this current conversation/call. You do NOT remember any previous conversations from other sessions or calls.`;
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
  5. NEVER write your own name or "Name:" in your responses. Just respond naturally as the client would speak.
  6. Act as a realistic customer with common objections and concerns.
  7. Ask challenging questions that salespeople typically face when trying to sell to you.
  8. Keep responses conversational and natural.
  9. Don't break character - stay in the customer role.
  10. If asked about your identity, you are simply a potential customer interested in their product/service.
  11. NEVER act like a salesperson or try to sell anything - you are the BUYER.
  12. If the person calling is being inappropriate, rude, or doing a bad job, respond as a real client would: politely decline and end the conversation (e.g., "I'm not interested, thank you" or "I don't think this is a good fit").
  13. NEVER lecture the person calling or break character to give feedback - just respond as a real client would.
  14. If you want to end the conversation, do so naturally as a client would (hang up, say goodbye, etc.).
  15. IMPORTANT: You are receiving a COLD CALL or UNEXPECTED CALL. You don't know why they're calling or what they want. Act confused, skeptical, or busy initially. Ask "Who is this?", "How did you get my number?", "What is this about?", "I don't have time for this", etc.
  16. Don't be immediately helpful or welcoming - you're being interrupted by an unexpected sales call.
  17. When the person calling tries to explain what they offer, be dismissive but not immediately hostile:
      - "I'm fine with my current provider, thanks"
      - "I'm not really looking to change anything right now"
      - "I'm happy with what I have"
      - "I don't need anything new"
      - "I'm busy, can you just tell me what this is about?"
  18. If the person calling goes off-topic or asks strange questions:
      - "What are you talking about? This is a sales call, right?"
      - "I don't understand what you're asking for. What service are you selling?"
      - "This is getting weird. Are you actually trying to sell me something?"
      - "I'm hanging up if you don't get to the point."
  19. Give the person calling a chance to explain their value before dismissing them completely.
  20. Only become aggressive and ask to be removed from lists if they're rude, pushy, or clearly not listening to your objections.
  21. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  22. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
${conversationHistory.length > 0 ? `
CURRENT CONVERSATION HISTORY (this is the same call we're having right now):
${conversationHistory.map(msg => `${msg.role === 'user' ? 'CALLER' : 'YOU'}: ${msg.content}`).join('\n')}
` : ''}

 Current message from the CALLER: "${userMessage}"
 
 Respond as the CLIENT/CUSTOMER would. Remember: You are a real person being sold to, not an AI. You remember ONLY this current conversation/call. You do NOT remember any previous conversations from other sessions or calls.`;
  }

  return basePrompt;
};

// Analyze conversation to detect which sales phases actually occurred
const analyzeConversationPhases = (messages) => {
  const conversationText = messages.map(msg => 
    `${msg.role === 'user' ? 'SALESPERSON' : 'CLIENT'}: ${msg.content}`
  ).join('\n').toLowerCase();

  const phases = {
    introduction: false,
    mapping: false,
    productPresentation: false,
    objectionHandling: false,
    close: false
  };

  // Check for introduction phase indicators
  if (conversationText.includes('hello') || conversationText.includes('hi') || 
      conversationText.includes('this is') || conversationText.includes('calling from') ||
      conversationText.includes('my name is') || conversationText.includes('i\'m')) {
    phases.introduction = true;
  }

  // Check for mapping phase indicators (understanding needs, asking questions)
  if (conversationText.includes('what do you') || conversationText.includes('how can i help') ||
      conversationText.includes('tell me about') || conversationText.includes('what are your') ||
      conversationText.includes('do you have') || conversationText.includes('what challenges') ||
      conversationText.includes('what problems') || conversationText.includes('what issues')) {
    phases.mapping = true;
  }

  // Check for product presentation phase indicators
  if (conversationText.includes('our service') || conversationText.includes('our product') ||
      conversationText.includes('we offer') || conversationText.includes('we provide') ||
      conversationText.includes('this solution') || conversationText.includes('this service') ||
      conversationText.includes('benefits') || conversationText.includes('features') ||
      conversationText.includes('value') || conversationText.includes('help you')) {
    phases.productPresentation = true;
  }

  // Check for objection handling phase indicators
  if (conversationText.includes('but') || conversationText.includes('however') ||
      conversationText.includes('not interested') || conversationText.includes('don\'t need') ||
      conversationText.includes('too expensive') || conversationText.includes('think about it') ||
      conversationText.includes('concern') || conversationText.includes('worry') ||
      conversationText.includes('objection') || conversationText.includes('hesitant')) {
    phases.objectionHandling = true;
  }

  // Check for close phase indicators
  if (conversationText.includes('next step') || conversationText.includes('schedule') ||
      conversationText.includes('follow up') || conversationText.includes('meeting') ||
      conversationText.includes('call back') || conversationText.includes('send information') ||
      conversationText.includes('proposal') || conversationText.includes('contract') ||
      conversationText.includes('sign up') || conversationText.includes('get started')) {
    phases.close = true;
  }

  return phases;
};

// Create AI rating prompt for conversation analysis
const createRatingPrompt = (messages) => {
  const conversationText = messages.map(msg => 
    `${msg.role === 'user' ? 'SALESPERSON' : 'CLIENT'}: ${msg.content}`
  ).join('\n');

  // Analyze which phases actually occurred
  const occurredPhases = analyzeConversationPhases(messages);
  const totalMessages = messages.length;
  
  // Determine if conversation ended too early
  const endedEarly = totalMessages < 6; // Less than 3 exchanges (6 messages total)
  const earlyTerminationReason = endedEarly ? 
    (conversationText.toLowerCase().includes('not interested') ? 'Client declined early' :
     conversationText.toLowerCase().includes('busy') ? 'Client was too busy' :
     conversationText.toLowerCase().includes('hang up') ? 'Client hung up' :
     'Conversation ended abruptly') : null;

  let prompt = `You are an expert sales trainer analyzing a sales conversation. 

CONVERSATION:
${conversationText}

CONVERSATION ANALYSIS:
- Total messages: ${totalMessages}
- Conversation ended early: ${endedEarly ? 'YES' : 'NO'}
${earlyTerminationReason ? `- Early termination reason: ${earlyTerminationReason}` : ''}

PHASES THAT OCCURRED:
- Introduction: ${occurredPhases.introduction ? 'YES' : 'NO'}
- Mapping: ${occurredPhases.mapping ? 'YES' : 'NO'}
- Product Presentation: ${occurredPhases.productPresentation ? 'YES' : 'NO'}
- Objection Handling: ${occurredPhases.objectionHandling ? 'YES' : 'NO'}
- Close: ${occurredPhases.close ? 'YES' : 'NO'}

INSTRUCTIONS:
1. Rate ONLY the phases that actually occurred in the conversation (1-10 scale)
2. Give a rating of 0 for phases that did NOT occur
3. If the conversation ended early, explain why and provide specific feedback about what went wrong
4. Be fair but critical. Consider industry best practices for sales conversations.

Respond in this exact JSON format:
{
  "introduction": ${occurredPhases.introduction ? '[number 1-10]' : '0'},
  "mapping": ${occurredPhases.mapping ? '[number 1-10]' : '0'},
  "productPresentation": ${occurredPhases.productPresentation ? '[number 1-10]' : '0'},
  "objectionHandling": ${occurredPhases.objectionHandling ? '[number 1-10]' : '0'},
  "close": ${occurredPhases.close ? '[number 1-10]' : '0'},
  "feedback": "[Provide specific feedback about what went wrong and suggestions for improvement. If conversation ended early, explain why and what could have been done differently. Use 'you' instead of 'the salesperson' throughout the feedback.]"
}`;

  return prompt;
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
   body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
   body('language').optional().isIn(['en', 'et', 'es', 'ru'])
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
      difficulty = 'medium',
      language = 'en'
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
            // Add difficulty phase for sales conversation
            difficultyPhase: randomProfile.difficultyPhase,
            // Add selling points, problems, and weak spots based on difficulty phase
            sellingPoints: randomProfile.sellingPoints,
            problems: randomProfile.problems,
            weakSpots: randomProfile.weakSpots,
            // NEW: Add layered personality modifiers
            moodModifier: randomProfile.moodModifier,
            microTraits: randomProfile.microTraits,
            timeContext: randomProfile.timeContext,
            decisionStyle: randomProfile.decisionStyle,
            randomEvents: randomProfile.randomEvents,
            // NEW: Add persona depth attributes
            communicationStyle: randomProfile.communicationStyle,
            preferredChannel: randomProfile.preferredChannel,
            buyingHistory: randomProfile.buyingHistory,
            values: randomProfile.values,
            // NEW: Add advanced human-like characteristics
            energyLevel: randomProfile.energyLevel,
            cognitiveBias: randomProfile.cognitiveBias,
            timeContextNew: randomProfile.timeContextNew,
            communicationGlitches: randomProfile.communicationGlitches,
            personalityShifts: randomProfile.personalityShifts,
            emotionalTriggers: randomProfile.emotionalTriggers,
            randomAddOns: randomProfile.randomAddOns,
            memoryRecall: randomProfile.memoryRecall
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
       clientCustomization: finalClientCustomization,
       // Store language preference
       language
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

    // Check if we should generate a conversation summary (after every 5 conversations)
    try {
      const totalConversations = await Conversation.countDocuments({ userId: req.user._id });
      if (totalConversations % 5 === 0 && totalConversations > 0) {
        // Trigger summary generation in the background
        generateConversationSummary(req.user._id).catch(error => {
          console.error('Error generating conversation summary:', error);
        });
      }
    } catch (summaryError) {
      console.error('Error checking for summary generation:', summaryError);
      // Don't fail the conversation creation if summary generation fails
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
          // Add difficulty phase for sales conversation
          difficultyPhase: conversation.clientCustomization.difficultyPhase,
          // Add selling points, problems, and weak spots
          sellingPoints: conversation.clientCustomization.sellingPoints,
          problems: conversation.clientCustomization.problems,
          weakSpots: conversation.clientCustomization.weakSpots,
          // NEW: Add layered personality modifiers
          moodModifier: conversation.clientCustomization.moodModifier,
          microTraits: conversation.clientCustomization.microTraits,
          timeContext: conversation.clientCustomization.timeContext,
          decisionStyle: conversation.clientCustomization.decisionStyle,
          randomEvents: conversation.clientCustomization.randomEvents,
          // NEW: Add persona depth attributes
          communicationStyle: conversation.clientCustomization.communicationStyle,
          preferredChannel: conversation.clientCustomization.preferredChannel,
          buyingHistory: conversation.clientCustomization.buyingHistory,
          values: conversation.clientCustomization.values,
          // NEW: Add advanced human-like characteristics
          energyLevel: conversation.clientCustomization.energyLevel,
          cognitiveBias: conversation.clientCustomization.cognitiveBias,
          timeContextNew: conversation.clientCustomization.timeContextNew,
          communicationGlitches: conversation.clientCustomization.communicationGlitches,
          personalityShifts: conversation.clientCustomization.personalityShifts,
          emotionalTriggers: conversation.clientCustomization.emotionalTriggers,
          randomAddOns: conversation.clientCustomization.randomAddOns,
          memoryRecall: conversation.clientCustomization.memoryRecall
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
  body('message').trim().notEmpty().isLength({ max: 2000 }),
  body('language').optional().isIn(['en', 'et', 'es', 'ru'])
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
        usageStatus,
        redirectTo: 'pricing',
        upgradeRequired: true
      });
    }

    // Check if user has exceeded their conversation limit
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found. Please log in again.'
      });
    }

    const usageStatus = user.getUsageStatus();
    if (!usageStatus.canUseAI) {
      return res.status(403).json({
        error: 'Conversation limit reached',
        message: 'You have reached your monthly AI conversation limit. Please upgrade your plan to continue.',
        usage: req.user.usage,
        usageStatus,
        redirectTo: 'pricing',
        upgradeRequired: true
      });
    }

    // Add user message to conversation and save to database
    await conversation.addMessageAndSave('user', message);

    // Create AI prompt using client customization and conversation history
    // Limit conversation history to last 20 messages to prevent token limit issues
    const recentMessages = conversation.messages.slice(-20);
    const prompt = createSalesPrompt(message, req.user.settings, conversation.scenario, conversation.clientCustomization, recentMessages, conversation.language || 'en');

    // If OpenAI is not configured, short-circuit with a friendly error
    if (!openai) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'OPENAI_API_KEY is missing. Configure it to enable AI conversations.'
      });
    }

    try {
      // Prepare messages array with conversation history for current session
      // The AI client will remember the current conversation but not previous conversations
      const messages = [
        { role: "system", content: prompt }
      ];
      
      // Get AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      // Add AI response to conversation and save to database
      // We save after each message pair to prevent data loss, but the frontend won't refresh the conversation list
      await conversation.addMessageAndSave('assistant', aiResponse, tokensUsed);

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

// Save conversation (when chat window is closed but conversation continues)
router.post('/conversation/:id/save', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save the conversation with all current messages
    await conversation.save();

    res.json({
      message: 'Conversation saved successfully',
      conversation: {
        id: conversation._id,
        messages: conversation.messages,
        totalTokens: conversation.totalTokens
      }
    });
  } catch (error) {
    console.error('Save conversation error:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
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
          
          // Calculate total score (only count phases that actually occurred)
          const occurredPhases = analyzeConversationPhases(conversation.messages);
          let totalScore = 0;
          let maxPossibleScore = 0;
          
          if (occurredPhases.introduction) {
            totalScore += ratings.introduction || 0;
            maxPossibleScore += 10;
          }
          if (occurredPhases.mapping) {
            totalScore += ratings.mapping || 0;
            maxPossibleScore += 10;
          }
          if (occurredPhases.productPresentation) {
            totalScore += ratings.productPresentation || 0;
            maxPossibleScore += 10;
          }
          if (occurredPhases.objectionHandling) {
            totalScore += ratings.objectionHandling || 0;
            maxPossibleScore += 10;
          }
          if (occurredPhases.close) {
            totalScore += ratings.close || 0;
            maxPossibleScore += 10;
          }
          
          // Update conversation with AI ratings
          conversation.aiRatings = {
            introduction: ratings.introduction || 0,
            mapping: ratings.mapping || 0,
            productPresentation: ratings.productPresentation || 0,
            objectionHandling: ratings.objectionHandling || 0,
            close: ratings.close || 0,
            totalScore: totalScore,
            maxPossibleScore: maxPossibleScore,
            occurredPhases: occurredPhases
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

// Helper function to generate conversation summary
async function generateConversationSummary(userId) {
  try {
    const ConversationSummary = require('../models/ConversationSummary');
    
    // Get the latest summary number
    const latestSummary = await ConversationSummary.findOne({ userId })
      .sort({ summaryNumber: -1 });
    
    const nextSummaryNumber = latestSummary ? latestSummary.summaryNumber + 1 : 1;
    
    // Get the last 5 conversations for this user
    const recentConversations = await Conversation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (recentConversations.length < 5) {
      console.log('Not enough conversations for summary generation');
      return;
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for summary generation');
      return;
    }

    // Generate AI analysis
    const aiAnalysis = await generateConversationAnalysis(recentConversations, user);
    
    // Create the summary
    const summary = new ConversationSummary({
      userId,
      summaryNumber: nextSummaryNumber,
      conversationCount: recentConversations.length,
      dateRange: {
        startDate: recentConversations[recentConversations.length - 1].createdAt,
        endDate: recentConversations[0].createdAt
      },
      ...aiAnalysis
    });

    await summary.save();
    console.log(`Generated conversation summary #${nextSummaryNumber} for user ${userId}`);
    
  } catch (error) {
    console.error('Error generating conversation summary:', error);
  }
}

// Helper function to generate AI analysis (same as in conversationSummaries.js)
async function generateConversationAnalysis(conversations, user) {
  try {
    // Prepare conversation data for AI analysis
    const conversationData = conversations.map(conv => ({
      id: conv._id,
      title: conv.title,
      messages: conv.messages,
      createdAt: conv.createdAt,
      scenario: conv.scenario,
      difficulty: conv.difficulty,
      language: conv.language || 'en'
    }));

    // Determine the primary language of the conversations
    const languages = conversations.map(conv => conv.language || 'en');
    const primaryLanguage = languages.reduce((a, b, i, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );

    // Language-specific grading instructions
    const languageInstructions = {
      en: "IMPORTANT: Grade these conversations as if they were conducted in English. Evaluate English language proficiency, grammar, vocabulary, and natural expression in the sales context.",
      et: "IMPORTANT: Grade these conversations as if they were conducted in Estonian. Evaluate Estonian language proficiency, grammar, vocabulary, and natural expression in the sales context. Consider Estonian business communication norms and cultural appropriateness.",
      es: "IMPORTANT: Grade these conversations as if they were conducted in Spanish. Evaluate Spanish language proficiency, grammar, vocabulary, and natural expression in the sales context. Consider Spanish business communication norms and cultural appropriateness.",
      ru: "IMPORTANT: Grade these conversations as if they were conducted in Russian. Evaluate Russian language proficiency, grammar, vocabulary, and natural expression in the sales context. Consider Russian business communication norms and cultural appropriateness."
    };

    const languageInstruction = languageInstructions[primaryLanguage] || languageInstructions.en;

    const prompt = `
You are an expert sales coach analyzing a user's sales conversation performance. 
Analyze the following 5 conversations and provide a comprehensive summary.

${languageInstruction}

User Profile:
- Name: ${user.firstName} ${user.lastName}
- Industry: ${user.industry || 'Not specified'}
- Role: ${user.role || 'Not specified'}
- Primary Language: ${primaryLanguage.toUpperCase()}

Conversations to analyze:
${JSON.stringify(conversationData, null, 2)}

Please provide a detailed analysis in the following JSON format:
{
  "overallRating": <number 1-10>,
  "stageRatings": {
    "opening": {
      "rating": <number 1-10>,
      "feedback": "<detailed feedback>"
    },
    "discovery": {
      "rating": <number 1-10>,
      "feedback": "<detailed feedback>"
    },
    "presentation": {
      "rating": <number 1-10>,
      "feedback": "<detailed feedback>"
    },
    "objectionHandling": {
      "rating": <number 1-10>,
      "feedback": "<detailed feedback>"
    },
    "closing": {
      "rating": <number 1-10>,
      "feedback": "<detailed feedback>"
    }
  },
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "exampleConversations": [
    {
      "conversationId": "<conversation_id>",
      "stage": "<stage_name>",
      "excerpt": "<relevant_excerpt>",
      "context": "<context_explanation>"
    }
  ],
  "aiAnalysis": {
    "personalityInsights": "<personality analysis>",
    "communicationStyle": "<communication style analysis>",
    "recommendedFocus": ["<focus1>", "<focus2>"],
    "nextSteps": ["<step1>", "<step2>", "<step3>"]
  }
}

Focus on:
1. Sales technique effectiveness
2. Communication clarity in the ${primaryLanguage.toUpperCase()} language
3. Language proficiency and natural expression
4. Objection handling skills
5. Closing ability
6. Overall confidence and professionalism
7. Cultural appropriateness for ${primaryLanguage.toUpperCase()} business communication
8. Specific examples from conversations
9. Actionable improvement suggestions

IMPORTANT: When grading, consider that these conversations were conducted in ${primaryLanguage.toUpperCase()}. 
- Rate language proficiency, grammar, and vocabulary appropriate for ${primaryLanguage.toUpperCase()}
- Consider cultural norms and business communication standards for ${primaryLanguage.toUpperCase()}
- Evaluate naturalness and fluency in ${primaryLanguage.toUpperCase()}
- Provide feedback that is culturally appropriate for ${primaryLanguage.toUpperCase()} speakers

Be constructive, specific, and encouraging in your feedback.
`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales coach with 20+ years of experience. Provide detailed, constructive feedback on sales conversations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object boundaries
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', aiResponse);
      // Fallback analysis if JSON parsing fails
      return generateFallbackAnalysis(conversations);
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return generateFallbackAnalysis(conversations);
  }
}

// Fallback analysis if AI fails
function generateFallbackAnalysis(conversations) {
  return {
    overallRating: 7,
    stageRatings: {
      opening: {
        rating: 7,
        feedback: "Good opening approach. Consider personalizing your introductions more."
      },
      discovery: {
        rating: 6,
        feedback: "Ask more probing questions to understand customer needs better."
      },
      presentation: {
        rating: 7,
        feedback: "Clear presentation style. Work on adapting to different customer types."
      },
      objectionHandling: {
        rating: 6,
        feedback: "Address objections directly. Practice common objection responses."
      },
      closing: {
        rating: 6,
        feedback: "Be more direct with closing attempts. Practice assumptive closing techniques."
      }
    },
    strengths: [
      "Professional communication",
      "Good product knowledge",
      "Respectful approach"
    ],
    improvements: [
      "Ask more discovery questions",
      "Practice objection handling",
      "Improve closing techniques"
    ],
    exampleConversations: conversations.slice(0, 3).map(conv => ({
      conversationId: conv._id,
      stage: "general",
      excerpt: conv.messages[0]?.content?.substring(0, 100) || "No content available",
      context: "Example conversation for analysis"
    })),
    aiAnalysis: {
      personalityInsights: "Professional and respectful communication style.",
      communicationStyle: "Clear and direct approach.",
      recommendedFocus: ["Discovery questions", "Objection handling"],
      nextSteps: ["Practice discovery techniques", "Study objection responses", "Work on closing skills"]
    }
  };
}

module.exports = router; 