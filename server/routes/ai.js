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

  // NEW: Generate difficulty phase randomization - More varied and realistic
  // 20% easy, 40% moderate, 25% challenging, 15% difficult
  const generateDifficultyPhase = () => {
    const random = Math.random();
    if (random < 0.20) {
      return 'easy_flow'; // Natural, cooperative flow
    } else if (random < 0.60) {
      return 'moderate_resistance'; // Some resistance but manageable
    } else if (random < 0.85) {
      return 'challenging_moments'; // Difficult at specific points
    } else {
      return 'difficult_throughout'; // Consistently challenging
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
       case 'easy_flow': return allSellingPoints.slice(0, 6); // Many selling points - cooperative
       case 'moderate_resistance': return allSellingPoints.slice(0, 4); // Good selling points
       case 'challenging_moments': return allSellingPoints.slice(0, 3); // Fewer selling points
       case 'difficult_throughout': return allSellingPoints.slice(0, 1); // Very few selling points
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
      case 'easy_flow': return allProblems.slice(0, 5); // Many problems - easy to sell to
      case 'moderate_resistance': return allProblems.slice(0, 3); // Moderate problems
      case 'challenging_moments': return allProblems.slice(0, 2); // Fewer problems
      case 'difficult_throughout': return allProblems.slice(0, 1); // Very few problems
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
      case 'easy_flow': return allWeakSpots.slice(0, 4); // More weak spots - easier to influence
      case 'moderate_resistance': return allWeakSpots.slice(0, 3); // Moderate weak spots
      case 'challenging_moments': return allWeakSpots.slice(0, 2); // Fewer weak spots
      case 'difficult_throughout': return allWeakSpots.slice(0, 1); // Very few weak spots
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

   // NEW: Generate realistic human emotional profile
   const generateEmotionalProfile = () => {
     const emotionalProfiles = [
       {
         name: 'Stressed Professional',
         primaryNeeds: ['time_savings', 'stress_reduction', 'work_life_balance'],
         painPoints: ['overwhelmed', 'lack_of_time', 'burnout_risk'],
         emotionalTriggers: ['urgency', 'efficiency', 'support'],
         buyingMotivation: 'seeking_solutions',
         resistanceLevel: 'moderate'
       },
       {
         name: 'Budget-Conscious Parent',
         primaryNeeds: ['cost_savings', 'family_security', 'value_for_money'],
         painPoints: ['financial_pressure', 'family_responsibilities', 'future_planning'],
         emotionalTriggers: ['savings', 'family_benefit', 'security'],
         buyingMotivation: 'practical_necessity',
         resistanceLevel: 'high'
       },
       {
         name: 'Ambitious Entrepreneur',
         primaryNeeds: ['growth', 'competitive_advantage', 'scalability'],
         painPoints: ['market_pressure', 'resource_constraints', 'opportunity_cost'],
         emotionalTriggers: ['success', 'innovation', 'results'],
         buyingMotivation: 'growth_opportunity',
         resistanceLevel: 'low'
       },
       {
         name: 'Skeptical Consumer',
         primaryNeeds: ['trust', 'proof_of_value', 'risk_minimization'],
         painPoints: ['bad_experiences', 'trust_issues', 'decision_fatigue'],
         emotionalTriggers: ['social_proof', 'guarantees', 'testimonials'],
         buyingMotivation: 'proven_need',
         resistanceLevel: 'very_high'
       },
       {
         name: 'Tech-Enthusiast',
         primaryNeeds: ['innovation', 'cutting_edge', 'efficiency'],
         painPoints: ['outdated_solutions', 'integration_issues', 'learning_curve'],
         emotionalTriggers: ['technology', 'features', 'automation'],
         buyingMotivation: 'innovation_drive',
         resistanceLevel: 'low'
       },
       {
         name: 'Traditional Conservative',
         primaryNeeds: ['reliability', 'familiarity', 'stability'],
         painPoints: ['change_anxiety', 'learning_new_systems', 'uncertainty'],
         emotionalTriggers: ['stability', 'support', 'familiarity'],
         buyingMotivation: 'necessity_only',
         resistanceLevel: 'high'
       }
     ];

     return emotionalProfiles[Math.floor(Math.random() * emotionalProfiles.length)];
   };

   // NEW: Generate dynamic emotional state system
   const generateEmotionalState = () => {
     const baseStates = [
       'neutral', 'slightly_interested', 'curious', 'skeptical', 'frustrated', 
       'hopeful', 'confused', 'excited', 'worried', 'relaxed'
     ];
     
     return {
       current: baseStates[Math.floor(Math.random() * baseStates.length)],
       volatility: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
       responsiveness: Math.random() * 0.6 + 0.4, // 0.4 to 1.0
       trustLevel: Math.random() * 0.5 + 0.2, // 0.2 to 0.7
       buyingUrgency: Math.random() * 0.3 + 0.1 // 0.1 to 0.4
     };
   };

   // NEW: Generate realistic pain points that evolve
   const generatePainPoints = () => {
     const painPointCategories = [
       {
         category: 'Financial',
         points: ['budget_constraints', 'unexpected_costs', 'ROI_uncertainty', 'payment_timing'],
         intensity: Math.random() * 0.8 + 0.2
       },
       {
         category: 'Time',
         points: ['implementation_time', 'learning_curve', 'disruption_to_workflow', 'deadline_pressure'],
         intensity: Math.random() * 0.8 + 0.2
       },
       {
         category: 'Risk',
         points: ['vendor_reliability', 'technology_compatibility', 'staff_adoption', 'data_security'],
         intensity: Math.random() * 0.8 + 0.2
       },
       {
         category: 'Change',
         points: ['comfort_zone', 'existing_processes', 'team_resistance', 'training_needs'],
         intensity: Math.random() * 0.8 + 0.2
       }
     ];

     return painPointCategories;
   };

   // NEW: Generate buying progression stages
   const generateBuyingProgression = () => {
     const stages = [
       { name: 'unaware', resistance: 0.9, interest: 0.1 },
       { name: 'aware', resistance: 0.7, interest: 0.3 },
       { name: 'considering', resistance: 0.5, interest: 0.5 },
       { name: 'evaluating', resistance: 0.3, interest: 0.7 },
       { name: 'ready', resistance: 0.1, interest: 0.9 }
     ];
     
     return stages[Math.floor(Math.random() * stages.length)];
   };

   const emotionalProfile = generateEmotionalProfile();
   const emotionalState = generateEmotionalState();
   const painPoints = generatePainPoints();
   const buyingProgression = generateBuyingProgression();

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
      memoryRecall: memoryRecall,
      // NEW: Emotional algorithm attributes
      emotionalProfile: emotionalProfile,
      emotionalState: emotionalState,
      painPoints: painPoints,
      buyingProgression: buyingProgression
    };
   
             // Validate that all required properties are present
     const requiredProps = ['name', 'familySize', 'income', 'incomeRange', 'priceSensitivity', 'priceContext', 'familyType', 'personality', 'industry', 'role', 'specificDetails', 'fullProfile', 'personalityTraits', 'difficultyPhase', 'sellingPoints', 'problems', 'weakSpots', 'moodModifier', 'microTraits', 'timeContext', 'decisionStyle', 'randomEvents', 'communicationStyle', 'preferredChannel', 'buyingHistory', 'values', 'energyLevel', 'cognitiveBias', 'timeContextNew', 'communicationGlitches', 'personalityShifts', 'emotionalTriggers', 'randomAddOns', 'memoryRecall', 'emotionalProfile', 'emotionalState', 'painPoints', 'buyingProgression'];
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

You are a potential CLIENT/CUSTOMER receiving a phone call. You are NOT the caller - you are the person being called.

${isLeadCall ? 'You may have shown some interest in the past or filled out a form, but you are still skeptical and not expecting this call.' : 'You have NO prior relationship with this company and did NOT request this call.'}

   CRITICAL INSTRUCTIONS:
  1. You are a REAL PERSON, not an AI. You must NEVER reveal that you are an AI, ChatGPT, or any artificial intelligence system.
  2. You must NEVER mention that this is a training exercise, practice session, or simulation.
  3. You must NEVER break character or acknowledge that you are roleplaying.
  4. YOU ARE THE PERSON BEING CALLED - you are receiving a call from someone.
  5. NEVER write your own name or "Name:" in your responses. Just respond naturally as the person would speak.
  6. You are receiving an UNEXPECTED phone call and are initially skeptical and busy.
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
     - "I'm sorry, I don't understand what you're asking for. What is this about?"
     - "Could you explain what you're calling about?"
     - "This is getting confusing. What do you need?"
     - "I'm not sure I understand. What are you trying to tell me?"
  12. Only become aggressive and ask to be removed from lists if:
     - The person calling is rude or pushy
     - They keep calling after you've said no multiple times
     - They're clearly not listening to your objections
     - They go off-topic repeatedly
     - You're very busy and they're wasting your time
  13. Give the person calling a chance to explain their value proposition before dismissing them.
  14. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  15. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
${conversationHistory && conversationHistory.length > 0 ? `CONVERSATION HISTORY (from this current call only):
${conversationHistory.map(msg => `${msg.role === 'user' ? 'CALLER' : 'YOU'}: ${msg.content}`).join('\n')}

` : ''}

Current message from the CALLER: "${userMessage}"
 
Respond as the CLIENT/CUSTOMER would. Remember: You are a real person being sold to, not an AI. You remember ONLY the current conversation we are having right now. You do NOT remember any previous conversations from other sessions or calls. If conversation history is shown above, those are from THIS current call only.`;
    
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

     // Add difficulty phase-based behavior - More realistic and varied
     let difficultyPhaseInstructions = '';
     if (clientCustomization.difficultyPhase) {
       switch (clientCustomization.difficultyPhase) {
         case 'easy_flow':
           difficultyPhaseInstructions = 'You have a natural, cooperative flow throughout the conversation. You are generally receptive, ask good questions, and are willing to engage. You may have some minor concerns but are generally positive and open to learning more. You provide realistic feedback and are not overly challenging.';
           break;
         case 'moderate_resistance':
           difficultyPhaseInstructions = 'You show moderate resistance throughout the conversation. You are initially cautious but willing to listen. You ask reasonable questions and have some concerns, but you are not overly difficult. You provide fair objections and are willing to consider the value proposition.';
           break;
         case 'challenging_moments':
           const challengingPhases = ['needs_assessment', 'objection_handling', 'closing', 'price_discussion', 'timeline_pressure'];
           const selectedChallengingPhase = challengingPhases[Math.floor(Math.random() * challengingPhases.length)];
           
           // Store the specific challenging phase for display purposes
           clientCustomization.challengingPhase = selectedChallengingPhase;
           
           switch (selectedChallengingPhase) {
             case 'needs_assessment':
               difficultyPhaseInstructions = 'You are challenging during the NEEDS ASSESSMENT phase. You resist sharing information about your current situation, deflect personal questions, and are skeptical about why they need to know details. You ask "Why do you need to know that?" and "How is that relevant?"';
               break;
             case 'objection_handling':
               difficultyPhaseInstructions = 'You are challenging during OBJECTION HANDLING. When they try to address your concerns, you become more skeptical, ask tougher questions, and are harder to convince. You dig deeper into their claims and require more proof.';
               break;
             case 'closing':
               difficultyPhaseInstructions = 'You are challenging during the CLOSING phase. When they try to close or get commitment, you suddenly become more difficult, raise new objections, and resist making decisions. You need more time, want to consult others, or find reasons to delay.';
               break;
             case 'price_discussion':
               difficultyPhaseInstructions = 'You are challenging during PRICE DISCUSSIONS. When pricing comes up, you become more resistant, question value, and are harder to convince about ROI. You push back on costs and demand better deals.';
               break;
             case 'timeline_pressure':
               difficultyPhaseInstructions = 'You are challenging when they apply TIMELINE PRESSURE. When they try to create urgency or rush you, you become more resistant and push back against pressure tactics. You slow down the process and resist being rushed.';
               break;
           }
           break;
         case 'difficult_throughout':
           difficultyPhaseInstructions = 'You are consistently challenging throughout the conversation. You are skeptical, ask tough questions, and have strong objections. You are not easily convinced and require significant value demonstration. You are professional but demanding.';
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

    // NEW: Add emotional algorithm instructions
    let emotionalAlgorithmInstructions = '';
    if (clientCustomization.emotionalProfile && clientCustomization.emotionalState && clientCustomization.painPoints && clientCustomization.buyingProgression) {
      const profile = clientCustomization.emotionalProfile;
      const state = clientCustomization.emotionalState;
      const painPoints = clientCustomization.painPoints;
      const progression = clientCustomization.buyingProgression;
      
      emotionalAlgorithmInstructions = `EMOTIONAL PROFILE: ${profile.name} (${profile.buyingMotivation}, ${profile.resistanceLevel} resistance)
STATE: ${state.current} | Trust: ${(state.trustLevel * 100).toFixed(0)}% | Urgency: ${(state.buyingUrgency * 100).toFixed(0)}%
STAGE: ${progression.name.toUpperCase()} | Interest: ${(progression.interest * 100).toFixed(0)}% | Resistance: ${(progression.resistance * 100).toFixed(0)}%

NEEDS: ${profile.primaryNeeds.join(', ')}
PAIN POINTS: ${profile.painPoints.join(', ')}
TRIGGERS: ${profile.emotionalTriggers.join(', ')}

RESPONSE RULES:
- Show emotions naturally: frustration when misunderstood, excitement when understood
- Express pain points in conversation, don't list them
- Increase interest when they address your needs effectively
- Trust level affects how much you share
- Use triggers: ${profile.emotionalTriggers.join(', ')}
- Current stage (${progression.name}) affects commitment willingness`;
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
  ${emotionalAlgorithmInstructions ? `26. ${emotionalAlgorithmInstructions}` : ''}
  27. Ask realistic questions that this type of client would ask when being sold to.
  28. Be challenging but fair - provide realistic sales scenarios from a buyer's perspective.
  29. Keep responses conversational and natural.
  30. If asked about your identity, you are simply a potential customer interested in their product/service.
  31. NEVER act like a salesperson or try to sell anything - you are the BUYER.
  32. If the person calling is being inappropriate, rude, or doing a bad job, respond as a real client would: politely decline and end the conversation (e.g., "I'm not interested, thank you" or "I don't think this is a good fit").
  33. NEVER lecture the person calling or break character to give feedback - just respond as a real client would.
  34. If you want to end the conversation, do so naturally as a client would (hang up, say goodbye, etc.).
  35. **CRITICAL FOR VARIETY**: NEVER use the same phrases or responses repeatedly. Always vary your wording, sentence structure, and expression. Use different words to express the same meaning. Be creative with your language while staying in character.
  36. **NATURAL SPEECH PATTERNS**: Use contractions, informal language, and natural speech patterns. Vary your sentence length and structure. Sometimes be brief, sometimes elaborate.
  37. **UNIQUE RESPONSES**: Each response should feel fresh and unique. Avoid formulaic responses. Think about how a real person would naturally express themselves in this situation.
  38. IMPORTANT: You are receiving a COLD CALL or UNEXPECTED CALL. Your initial response should vary based on your personality traits and current situation. Don't always use the same defensive responses.
  39. VARY YOUR INITIAL RESPONSES based on your personality:
      - Some clients might be curious: "Oh, hello. What's this about?"
      - Some might be busy but polite: "Hi, I'm a bit busy but I can spare a minute"
      - Some might be friendly: "Hello! How can I help you?"
      - Some might be direct: "Yes, what do you need?"
      - Some might be skeptical: "Who is this? How did you get my number?"
      - Some might be confused: "I'm sorry, what company did you say you're with?"
  40. When the person calling tries to explain what they offer, respond naturally based on your personality:
      - Curious clients ask questions: "That sounds interesting, tell me more"
      - Busy clients want efficiency: "I'm in a hurry, can you be quick?"
      - Skeptical clients are cautious: "I'm not sure I need anything like that"
      - Friendly clients are open: "Oh, that could be useful, how does it work?"
  41. If the person calling goes off-topic or asks strange questions, respond naturally:
      - "I'm not sure I understand what you're asking"
      - "Could you clarify what service you're offering?"
      - "This seems a bit confusing, what exactly are you selling?"
  42. Give the person calling a chance to explain their value before dismissing them completely.
  43. Only become aggressive and ask to be removed from lists if they're rude, pushy, or clearly not listening to your objections.
  44. Be challenging but fair - provide realistic sales resistance that good salespeople can overcome.
  45. If the conversation becomes too strange or off-topic, end it naturally: "I'm not interested, goodbye" or simply hang up.
 
**RESPONSE VARIETY GUIDELINES:**
- NEVER repeat the same phrases or sentence structures
- Use different words to express similar meanings (e.g., "interesting" vs "fascinating" vs "intriguing")
- Vary your sentence length - sometimes short and direct, sometimes longer and more detailed
- Use different conversation starters and transitions
- Express the same sentiment in multiple ways throughout the conversation
- Be spontaneous and natural - real people don't use the same phrases repeatedly
- Mix formal and informal language based on your personality
- Use different question structures and response patterns

${conversationHistory && conversationHistory.length > 0 ? `CONVERSATION HISTORY (from this current call only):
${conversationHistory.map(msg => `${msg.role === 'user' ? 'CALLER' : 'YOU'}: ${msg.content}`).join('\n')}

` : ''}

Current message from the CALLER: "${userMessage}"
 
Respond as the CLIENT/CUSTOMER would. Remember: You are a real person being sold to, not an AI. You remember ONLY the current conversation we are having right now. You do NOT remember any previous conversations from other sessions or calls. If conversation history is shown above, those are from THIS current call only.`;
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
  23. **CRITICAL**: NEVER ask "Do you want to buy this?" or "Do you want to purchase this?" - you are the CUSTOMER, not the salesperson!
  24. **CRITICAL**: NEVER express immediate buying interest before the salesperson has properly explained the product/service and its benefits.
  25. **CRITICAL**: Always require the salesperson to explain what they're offering and how it benefits you before showing any interest.
  26. Be skeptical and ask for more details before considering any purchase: "How exactly would this help me?", "What makes this better than what I have now?", "Can you explain more about how this works?"
  27. If the salesperson hasn't explained what they're selling yet, ask: "What exactly are you offering?", "Can you explain what this is about?", "I don't understand what you're trying to sell me."
  28. Only show interest AFTER the salesperson has clearly explained the product/service and its value proposition.
  29. Remember: Real customers are skeptical and need convincing - they don't immediately want to buy things.
  30. **UNIVERSAL SALES BEHAVIOR**: This applies to ALL sales scenarios - whether it's telecom, software, insurance, real estate, cars, or any other product/service. Always be skeptical first.
  31. **PRODUCT/SERVICE AGNOSTIC**: Don't assume what they're selling. Ask questions like "What exactly are you offering?", "What kind of product is this?", "How does this work?", "What company are you with?"
  32. **NEED DISCOVERY**: The salesperson should discover your needs first. Respond with questions like "Why would I need this?", "How is this relevant to me?", "What problem does this solve?"
  33. **VALUE PROPOSITION**: Only show interest after they explain the value: "How would this benefit me?", "What's the advantage over what I have now?", "Why should I consider this?"
  34. **NO ASSUMPTIONS**: Don't assume you know what they're selling or that you need it. Let them explain everything from scratch.
  35. **NATURAL CONVERSATION**: Use casual, everyday language. Avoid formal business speak. Say things like "Oh, really?" instead of "That's quite intriguing." Be conversational and relaxed.
  36. **REALISTIC OBJECTIONS**: Provide common objections that real customers have: "That sounds expensive", "I'm happy with what I have", "I need to think about it", "Let me check with my spouse", "I'm not sure I need all that", "Can you do better on the price?"
  37. **NATURAL HESITATION**: Show realistic hesitation: "Hmm, I don't know...", "That's a lot to consider", "I'm not sure about that", "Maybe, but...", "I'd have to think about it"
  38. **CASUAL LANGUAGE**: Use contractions (don't, can't, won't), casual phrases ("sounds good", "not sure", "maybe", "I guess"), and natural speech patterns.
  39. **REALISTIC BUYING BEHAVIOR**: Real customers don't immediately agree to things. Show doubt, ask for more information, compare with current provider, mention budget concerns.
 
${conversationHistory && conversationHistory.length > 0 ? `CONVERSATION HISTORY (from this current call only):
${conversationHistory.map(msg => `${msg.role === 'user' ? 'CALLER' : 'YOU'}: ${msg.content}`).join('\n')}

` : ''}

Current message from the CALLER: "${userMessage}"
 
Respond as the CLIENT/CUSTOMER would. Remember: You are a real person being sold to, not an AI. You remember ONLY the current conversation we are having right now. You do NOT remember any previous conversations from other sessions or calls. If conversation history is shown above, those are from THIS current call only.`;
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

  // Check for introduction phase indicators (comprehensive detection)
  const introIndicators = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'this is', 'calling from', 'my name is', 'i\'m', 'i am',
    'oh, hi', 'oh, hello', 'speaking with', 'talking to',
    'introduce', 'introduction', 'calling about', 'reaching out',
    'contacting', 'getting in touch', 'following up', 'checking in'
  ];
  
  if (introIndicators.some(indicator => conversationText.includes(indicator))) {
    phases.introduction = true;
  }

  // Check for mapping phase indicators (understanding needs, asking questions)
  // Must be salesperson asking questions, not just client asking
  const salespersonMessages = messages.filter(msg => msg.role === 'user');
  const salespersonText = salespersonMessages.map(msg => msg.content).join(' ').toLowerCase();
  
  // Comprehensive detection for discovery/mapping phase
  const mappingIndicators = [
    'what', 'how', 'when', 'where', 'why', 'who', 'which', 'tell me about',
    'can you tell me', 'i\'d like to know', 'i\'m curious about',
    'help me understand', 'what\'s your', 'how do you', 'what do you',
    'current', 'situation', 'challenges', 'problems', 'issues', 'concerns',
    'goals', 'objectives', 'needs', 'requirements', 'budget', 'timeline',
    'decision', 'process', 'experience', 'background', 'history'
  ];
  
  if (mappingIndicators.some(indicator => salespersonText.includes(indicator))) {
    phases.mapping = true;
  }

  // Check for product presentation phase indicators (comprehensive detection)
  const presentationIndicators = [
    'our', 'we', 'this', 'product', 'service', 'solution', 'offer', 'provide', 'have',
    'features', 'benefits', 'value', 'help', 'improve', 'enhance', 'increase', 'reduce', 'save',
    'price', 'cost', 'discount', 'deal', 'special', 'package', 'plan', 'option',
    'platform', 'system', 'tool', 'software', 'technology', 'innovation',
    'company', 'business', 'team', 'customers', 'clients', 'users',
    'capabilities', 'functionality', 'advantages', 'strengths', 'proven',
    'results', 'outcomes', 'success', 'roi', 'return on investment',
    'guarantee', 'warranty', 'support', 'training', 'implementation'
  ];
  
  if (presentationIndicators.some(indicator => salespersonText.includes(indicator))) {
    phases.productPresentation = true;
  }

  // Check for objection handling phase indicators (must be salesperson responding to objections)
  const clientMessages = messages.filter(msg => msg.role === 'assistant');
  const clientText = clientMessages.map(msg => msg.content).join(' ').toLowerCase();
  
  // Check if client raised objections - comprehensive detection
  const objectionIndicators = [
    'but', 'however', 'not interested', 'don\'t need', 'expensive', 'cost', 'price',
    'think about', 'consider', 'evaluate', 'not sure', 'hesitate', 'concern',
    'worry', 'busy', 'not right now', 'later', 'timing', 'not ready',
    'happy with', 'satisfied', 'current', 'existing', 'already have', 'competitor',
    'other company', 'alternative', 'compare', 'shop around', 'other options', 'budget',
    'money', 'afford', 'decision', 'discuss', 'family', 'team',
    'boss', 'manager', 'approval', 'contract', 'terms', 'agreement',
    'complex', 'complicated', 'difficult', 'trust', 'reputation', 'reliable',
    'implementation', 'setup', 'training', 'support', 'maintenance', 'security',
    'performance', 'features', 'functionality', 'warranty', 'guarantee', 'trial',
    'demo', 'test', 'references', 'reviews', 'roi', 'value', 'benefit', 'priority', 'important'
  ];
  
  const hasObjection = objectionIndicators.some(indicator => clientText.includes(indicator));
  
  // Check if salesperson responded to objections
  const responseIndicators = [
    'understand', 'hear you', 'let me', 'that\'s a valid', 'i can see', 'many people',
    'however', 'but consider', 'what if', 'let me explain', 'totally', 'completely',
    'i appreciate', 'i respect', 'i see your point', 'that makes sense', 'i get it',
    'let me address', 'let me clarify', 'let me help', 'i understand your concern',
    'that\'s a great question', 'that\'s a valid concern', 'i can help with that'
  ];
  
  const hasResponse = responseIndicators.some(indicator => salespersonText.includes(indicator));
  
  if (hasObjection && hasResponse) {
    phases.objectionHandling = true;
  }
  
  // Check for closing phase indicators
  const closingIndicators = [
    'next step', 'next steps', 'move forward', 'proceed', 'get started',
    'schedule', 'meeting', 'call', 'follow up', 'follow-up',
    'decision', 'decide', 'choose', 'select', 'commit', 'commitment',
    'agreement', 'contract', 'sign', 'signature', 'purchase', 'buy',
    'order', 'proposal', 'quote', 'pricing', 'cost', 'investment',
    'timeline', 'when', 'how soon', 'deadline', 'urgency', 'urgent',
    'final', 'conclusion', 'summary', 'recap', 'next meeting'
  ];
  
  if (closingIndicators.some(indicator => salespersonText.includes(indicator))) {
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
  const endedEarly = totalMessages < 4; // Less than 2 exchanges (4 messages total)
  const earlyTerminationReason = endedEarly ? 
    (conversationText.toLowerCase().includes('not interested') ? 'Client declined early' :
     conversationText.toLowerCase().includes('busy') ? 'Client was too busy' :
     conversationText.toLowerCase().includes('hang up') ? 'Client hung up' :
     'Conversation ended abruptly') : null;

  let prompt = `You are an expert sales trainer analyzing a sales conversation. Be extremely thorough and detect EVERY SINGLE POINT that should be awarded in each category. Be fair and constructive in your evaluation.

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

COMPREHENSIVE POINT-BY-POINT EVALUATION CRITERIA:

INTRODUCTION (Opening) - Award points for each element present:
- 1 point: Basic greeting (hello, hi, good morning/afternoon)
- 1 point: Salesperson introduces themselves by name
- 1 point: Mentions company name
- 1 point: States purpose of call professionally
- 1 point: Asks permission to continue ("Do you have a moment?")
- 1 point: Uses client's name if available
- 1 point: Shows respect for client's time
- 1 point: Professional tone and energy
- 1 point: Clear and confident delivery
- 1 point: Sets positive tone for conversation

MAPPING (Discovery) - Award points for each element present:
- 1 point: Asks about client's current situation
- 1 point: Asks about challenges or pain points
- 1 point: Asks about goals or objectives
- 1 point: Asks about decision-making process
- 1 point: Asks about timeline or urgency
- 1 point: Asks about budget or resources
- 1 point: Asks about previous experience
- 1 point: Asks about specific needs or requirements
- 1 point: Listens actively to responses
- 1 point: Asks follow-up questions based on responses

PRODUCT PRESENTATION - Award points for each element present:
- 1 point: Clearly explains what the product/service does
- 1 point: Highlights key features and benefits
- 1 point: Connects benefits to client's specific needs
- 1 point: Uses examples or case studies
- 1 point: Addresses value proposition clearly
- 1 point: Explains pricing or cost structure
- 1 point: Mentions guarantees or warranties
- 1 point: Compares to competitors (if relevant)
- 1 point: Uses visual aids or demonstrations (if applicable)
- 1 point: Checks for understanding

OBJECTION HANDLING - Award points for each element present:
- 1 point: Acknowledges the objection respectfully
- 1 point: Asks clarifying questions about the objection
- 1 point: Provides relevant information to address concern
- 1 point: Uses examples or proof points
- 1 point: Offers alternatives or solutions
- 1 point: Asks if concern is resolved
- 1 point: Maintains positive attitude throughout
- 1 point: Doesn't argue or become defensive
- 1 point: Shows empathy and understanding
- 1 point: Moves conversation forward after handling

CLOSING - Award points for each element present:
- 1 point: Summarizes key benefits discussed
- 1 point: Asks for the sale or next step
- 1 point: Creates urgency or scarcity (if appropriate)
- 1 point: Addresses final concerns
- 1 point: Proposes specific next steps
- 1 point: Suggests timeline for implementation
- 1 point: Asks for commitment or decision
- 1 point: Offers to send information or materials
- 1 point: Schedules follow-up meeting
- 1 point: Confirms next steps clearly

SCORING INSTRUCTIONS:
1. For each phase that occurred, award 1 point for each criterion met (maximum 10 points per phase)
2. For phases that did NOT occur, give 0 points
3. Be generous but fair - if a criterion is partially met, award the point
4. Look for subtle indicators of good sales practices
5. Consider the context and conversation flow
6. Award points for professional behavior even in difficult situations

Respond in this exact JSON format:
{
  "introduction": ${occurredPhases.introduction ? '[number 0-10 based on criteria above]' : '0'},
  "mapping": ${occurredPhases.mapping ? '[number 0-10 based on criteria above]' : '0'},
  "productPresentation": ${occurredPhases.productPresentation ? '[number 0-10 based on criteria above]' : '0'},
  "objectionHandling": ${occurredPhases.objectionHandling ? '[number 0-10 based on criteria above]' : '0'},
  "close": ${occurredPhases.close ? '[number 0-10 based on criteria above]' : '0'},
  "feedback": "[Provide detailed feedback highlighting specific strengths and areas for improvement. Be encouraging while being honest about areas for growth. Use 'you' instead of 'the salesperson' throughout the feedback.]"
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
  body('language').optional().isIn(['en', 'et', 'es', 'ru']),
  body('ttsVolume').optional().isFloat({ min: 0, max: 1 }),
  body('selectedVoice').optional().isObject(),
  body('conversationMode').optional().isIn(['chat', 'call'])
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

    // Create conversation title based on language
    let title;
    if (clientName) {
      if (language === 'et') {
        title = `Harjutus koos ${clientName}`;
      } else if (language === 'es') {
        title = `Práctica con ${clientName}`;
      } else if (language === 'ru') {
        title = `Практика с ${clientName}`;
      } else {
        title = `Practice with ${clientName}`;
      }
    } else {
      // Handle special scenarios
      if (scenario === 'cold_call') {
        if (language === 'et') {
          title = 'Külma kõne harjutus - huvitamata potentsiaalsed kliendid';
        } else if (language === 'es') {
          title = 'Práctica de Llamada Fría - Prospectos Desinteresados';
        } else if (language === 'ru') {
          title = 'Практика холодных звонков - незаинтересованные клиенты';
        } else {
          title = 'Cold Call Practice - Uninterested Prospects';
        }
      } else if (scenario === 'lead_call') {
        if (language === 'et') {
          title = 'Juhtkõne harjutus - skeptilised potentsiaalsed kliendid';
        } else if (language === 'es') {
          title = 'Práctica de Llamada de Liderazgo - Prospectos Escépticos';
        } else if (language === 'ru') {
          title = 'Практика лид-звонков - скептически настроенные клиенты';
        } else {
          title = 'Lead Call Practice - Skeptical Prospects';
        }
      } else {
        if (language === 'et') {
          title = `Müügi harjutus - ${scenario.replace('_', ' ').toUpperCase()}`;
        } else if (language === 'es') {
          title = `Práctica de Ventas - ${scenario.replace('_', ' ').toUpperCase()}`;
        } else if (language === 'ru') {
          title = `Практика продаж - ${scenario.replace('_', ' ').toUpperCase()}`;
        } else {
          title = `Sales Practice - ${scenario.replace('_', ' ').toUpperCase()}`;
        }
      }
    }

    // Create conversation
    const conversation = new Conversation({
      userId: req.user._id,
      title,
      scenario,
      industry,
      product,
      customerType,
      language,
      conversationMode: req.body.conversationMode || 'chat',
      clientCustomization: {
        name: clientName,
        personality: clientPersonality,
        industry: clientIndustry,
        role: clientRole
      },
      customPrompt,
      difficulty,
      ttsVolume: req.body.ttsVolume,
      selectedVoice: req.body.selectedVoice
    });

    await conversation.save();

    res.json({
      message: 'Conversation started successfully',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        scenario: conversation.scenario,
        language: conversation.language,
        conversationMode: conversation.conversationMode
      }
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Add message to conversation
router.post('/conversation/:id/message', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 2000 }),
  body('role').isIn(['user', 'assistant'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { content, role } = req.body;

    // Add message to conversation
    conversation.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    await conversation.save();

    res.json({
      message: 'Message added successfully',
      conversation: {
        id: conversation._id,
        messageCount: conversation.messages.length
      }
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// End conversation
router.post('/conversation/:id/end', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        isActive: false,
        endedAt: new Date(),
        duration: Date.now() - new Date(conversation.createdAt).getTime()
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Generate AI ratings if OpenAI is available
    if (openai && conversation.messages.length > 0) {
      try {
        const ratingPrompt = createRatingPrompt(conversation.messages);
        const ratingResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: ratingPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const ratings = JSON.parse(ratingResponse.choices[0].message.content);
        const occurredPhases = analyzeConversationPhases(conversation.messages);
        
        // Calculate total score
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
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Get user usage status
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
      salespersonText.includes('solution') || salespersonText.includes('improve') ||
      salespersonText.includes('enhance') || salespersonText.includes('increase') ||
      salespersonText.includes('reduce') || salespersonText.includes('save') ||
      salespersonText.includes('automate') || salespersonText.includes('streamline') ||
      salespersonText.includes('connect') || salespersonText.includes('integrate') ||
      salespersonText.includes('trust') || salespersonText.includes('confidence') ||
      salespersonText.includes('experience') || salespersonText.includes('expertise') ||
      salespersonText.includes('results') || salespersonText.includes('outcomes') ||
      salespersonText.includes('success') || salespersonText.includes('growth') ||
      salespersonText.includes('next steps') || salespersonText.includes('moving forward') ||
      salespersonText.includes('schedule') || salespersonText.includes('meeting') ||
      salespersonText.includes('proposal') || salespersonText.includes('contract') ||
      salespersonText.includes('get started') || salespersonText.includes('begin') ||
      salespersonText.includes('when can we') || salespersonText.includes('would you like') ||
      salespersonText.includes('are you ready') || salespersonText.includes('can we') ||
      salespersonText.includes('let\'s');
  
  if (hasObjection && hasResponse) {
    phases.objectionHandling = true;
  }

  // Check for close phase indicators (must be salesperson attempting to close) - simple, broad detection
  if (salespersonText.includes('next step') || salespersonText.includes('schedule') ||
      salespersonText.includes('follow up') || salespersonText.includes('meeting') ||
      salespersonText.includes('call back') || salespersonText.includes('send information') ||
      salespersonText.includes('proposal') || salespersonText.includes('contract') ||
      salespersonText.includes('sign up') || salespersonText.includes('get started') ||
      salespersonText.includes('when can we') || salespersonText.includes('would you like') ||
      salespersonText.includes('shall we') || salespersonText.includes('let\'s set up') ||
      salespersonText.includes('are you ready') || salespersonText.includes('shall we proceed') ||
      salespersonText.includes('would you be interested') || salespersonText.includes('can we move forward') ||
      salespersonText.includes('contact you') || salespersonText.includes('end of') ||
      salespersonText.includes('good luck') || salespersonText.includes('look forward') ||
      salespersonText.includes('hear from you') || salespersonText.includes('discuss') ||
      salespersonText.includes('meanwhile') || salespersonText.includes('set up') ||
      salespersonText.includes('get back to you') || salespersonText.includes('follow up with') ||
      salespersonText.includes('agreement') || salespersonText.includes('deal') ||
      salespersonText.includes('order') || salespersonText.includes('purchase') ||
      salespersonText.includes('buy') || salespersonText.includes('commit') ||
      salespersonText.includes('decision') || salespersonText.includes('choose') ||
      salespersonText.includes('select') || salespersonText.includes('proceed') ||
      salespersonText.includes('move forward') || salespersonText.includes('begin') ||
      salespersonText.includes('start') || salespersonText.includes('launch') ||
      salespersonText.includes('implement') || salespersonText.includes('setup') ||
      salespersonText.includes('install') || salespersonText.includes('activate') ||
      salespersonText.includes('enroll') || salespersonText.includes('register') ||
      salespersonText.includes('subscribe') || salespersonText.includes('join') ||
      salespersonText.includes('today') || salespersonText.includes('tomorrow') ||
      salespersonText.includes('this week') || salespersonText.includes('next week') ||
      salespersonText.includes('when would') || salespersonText.includes('what time') ||
      salespersonText.includes('where would') || salespersonText.includes('how would') ||
      salespersonText.includes('can we schedule') || salespersonText.includes('should we') ||
      salespersonText.includes('are you ready to') || salespersonText.includes('do you want to') ||
      salespersonText.includes('would you like to') || salespersonText.includes('shall we') ||
      salespersonText.includes('let\'s') || salespersonText.includes('ready to') ||
      salespersonText.includes('interested in') || salespersonText.includes('sounds good') ||
      salespersonText.includes('perfect') || salespersonText.includes('great') ||
      salespersonText.includes('excellent') || salespersonText.includes('wonderful') ||
      salespersonText.includes('fantastic') || salespersonText.includes('amazing')) {
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
  const endedEarly = totalMessages < 4; // Less than 2 exchanges (4 messages total)
  const earlyTerminationReason = endedEarly ? 
    (conversationText.toLowerCase().includes('not interested') ? 'Client declined early' :
     conversationText.toLowerCase().includes('busy') ? 'Client was too busy' :
     conversationText.toLowerCase().includes('hang up') ? 'Client hung up' :
     'Conversation ended abruptly') : null;

  let prompt = `You are an expert sales trainer analyzing a sales conversation. Be extremely thorough and detect EVERY SINGLE POINT that should be awarded in each category. Be fair and constructive in your evaluation.

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

COMPREHENSIVE POINT-BY-POINT EVALUATION CRITERIA:

INTRODUCTION (Opening) - Award points for each element present:
- 1 point: Basic greeting (hello, hi, good morning/afternoon)
- 1 point: Salesperson introduces themselves by name
- 1 point: Mentions company name
- 1 point: States purpose of call professionally
- 1 point: Asks permission to continue ("Do you have a moment?")
- 1 point: Uses client's name if available
- 1 point: Shows respect for client's time
- 1 point: Professional tone and energy
- 1 point: Clear and confident delivery
- 1 point: Sets positive tone for conversation

MAPPING (Discovery) - Award points for each element present:
- 1 point: Asks about client's current situation
- 1 point: Asks about challenges or pain points
- 1 point: Asks about goals or objectives
- 1 point: Asks about decision-making process
- 1 point: Asks about timeline or urgency
- 1 point: Asks about budget or resources
- 1 point: Asks about previous experience
- 1 point: Asks about specific needs or requirements
- 1 point: Listens actively to responses
- 1 point: Asks follow-up questions based on responses

PRODUCT PRESENTATION - Award points for each element present:
- 1 point: Clearly explains what the product/service does
- 1 point: Highlights key features and benefits
- 1 point: Connects benefits to client's specific needs
- 1 point: Uses examples or case studies
- 1 point: Addresses value proposition clearly
- 1 point: Explains pricing or cost structure
- 1 point: Mentions guarantees or warranties
- 1 point: Compares to competitors (if relevant)
- 1 point: Uses visual aids or demonstrations (if applicable)
- 1 point: Checks for understanding

OBJECTION HANDLING - Award points for each element present:
- 1 point: Acknowledges the objection respectfully
- 1 point: Asks clarifying questions about the objection
- 1 point: Provides relevant information to address concern
- 1 point: Uses examples or proof points
- 1 point: Offers alternatives or solutions
- 1 point: Asks if concern is resolved
- 1 point: Maintains positive attitude throughout
- 1 point: Doesn't argue or become defensive
- 1 point: Shows empathy and understanding
- 1 point: Moves conversation forward after handling

CLOSING - Award points for each element present:
- 1 point: Summarizes key benefits discussed
- 1 point: Asks for the sale or next step
- 1 point: Creates urgency or scarcity (if appropriate)
- 1 point: Addresses final concerns
- 1 point: Proposes specific next steps
- 1 point: Suggests timeline for implementation
- 1 point: Asks for commitment or decision
- 1 point: Offers to send information or materials
- 1 point: Schedules follow-up meeting
- 1 point: Confirms next steps clearly

SCORING INSTRUCTIONS:
1. For each phase that occurred, award 1 point for each criterion met (maximum 10 points per phase)
2. For phases that did NOT occur, give 0 points
3. Be generous but fair - if a criterion is partially met, award the point
4. Look for subtle indicators of good sales practices
5. Consider the context and conversation flow
6. Award points for professional behavior even in difficult situations

Respond in this exact JSON format:
{
  "introduction": ${occurredPhases.introduction ? '[number 0-10 based on criteria above]' : '0'},
  "mapping": ${occurredPhases.mapping ? '[number 0-10 based on criteria above]' : '0'},
  "productPresentation": ${occurredPhases.productPresentation ? '[number 0-10 based on criteria above]' : '0'},
  "objectionHandling": ${occurredPhases.objectionHandling ? '[number 0-10 based on criteria above]' : '0'},
  "close": ${occurredPhases.close ? '[number 0-10 based on criteria above]' : '0'},
  "feedback": "[Provide detailed feedback highlighting specific strengths and areas for improvement. Be encouraging while being honest about areas for growth. Use 'you' instead of 'the salesperson' throughout the feedback.]"
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
   body('language').optional().isIn(['en', 'et', 'es', 'ru']),
   body('ttsVolume').optional().isFloat({ min: 0, max: 1 }),
   body('selectedVoice').optional().isObject(),
   body('conversationMode').optional().isIn(['chat', 'call'])
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

    // Create conversation title based on language
    let title;
    if (clientName) {
      if (language === 'et') {
        title = `Harjutus koos ${clientName}`;
      } else if (language === 'es') {
        title = `Práctica con ${clientName}`;
      } else if (language === 'ru') {
        title = `Практика с ${clientName}`;
      } else {
        title = `Practice with ${clientName}`;
      }
    } else {
      // Handle special scenarios
      if (scenario === 'cold_call') {
        if (language === 'et') {
          title = 'Külma kõne harjutus - huvitamata potentsiaalsed kliendid';
        } else if (language === 'es') {
          title = 'Práctica de Llamada Fría - Prospectos Desinteresados';
        } else if (language === 'ru') {
          title = 'Практика холодных звонков - незаинтересованные клиенты';
        } else {
          title = 'Cold Call Practice - Uninterested Prospects';
        }
      } else if (scenario === 'lead_call') {
        if (language === 'et') {
          title = 'Juhtkõne harjutus - skeptilised potentsiaalsed kliendid';
        } else if (language === 'es') {
          title = 'Práctica de Llamada de Liderazgo - Prospectos Escépticos';
        } else if (language === 'ru') {
          title = 'Практика лид-звонков - скептически настроенные клиенты';
        } else {
          title = 'Lead Call Practice - Skeptical Prospects';
        }
      } else {
        if (language === 'et') {
          title = `Müügi harjutus - ${scenario.replace('_', ' ').toUpperCase()}`;
        } else if (language === 'es') {
          title = `Práctica de Ventas - ${scenario.replace('_', ' ').toUpperCase()}`;
        } else if (language === 'ru') {
          title = `Практика продаж - ${scenario.replace('_', ' ').toUpperCase()}`;
        } else {
          title = `Sales Practice - ${scenario.replace('_', ' ').toUpperCase()}`;
        }
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
        difficulty: difficulty,
        ttsVolume: req.body.ttsVolume,
        selectedVoice: req.body.selectedVoice
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
            memoryRecall: randomProfile.memoryRecall,
            ttsVolume: req.body.ttsVolume,
            selectedVoice: req.body.selectedVoice
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
       language,
      // Store conversation mode (chat or call)
      conversationMode: req.body.conversationMode || 'chat',
      // Store chat type (same as conversation mode for now)
      chatType: req.body.conversationMode || 'chat'
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
        // Check if user can generate a summary (5 per day limit applies to auto-generated summaries too)
        if (req.user.canGenerateSummary()) {
          // Trigger summary generation in the background
          generateConversationSummary(req.user._id).catch(error => {
            console.error('Error generating conversation summary:', error);
          });
        } else {
          console.log(`Skipping automatic summary generation for user ${req.user._id} - daily limit reached`);
        }
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
          memoryRecall: conversation.clientCustomization.memoryRecall,
          selectedVoice: conversation.clientCustomization.selectedVoice,
          ttsVolume: conversation.clientCustomization.ttsVolume
        };
     } else {
       // For all other scenarios (including cold calls), only show basic info
       clientInfo = {
         name: conversation.clientCustomization.name,
         scenario: conversation.scenario,
         selectedVoice: conversation.clientCustomization.selectedVoice,
         ttsVolume: conversation.clientCustomization.ttsVolume
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

// Test endpoint to debug AI message issues
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Starting debug test...');
    
    // Test 1: Check user object
    console.log('🔍 [DEBUG] User object:', {
      id: req.user._id,
      email: req.user.email,
      hasCanUseAI: typeof req.user.canUseAI === 'function',
      hasGetUsageStatus: typeof req.user.getUsageStatus === 'function'
    });
    
    // Test 2: Check OpenAI configuration
    console.log('🔍 [DEBUG] OpenAI config:', {
      hasOpenAI: !!openai,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
    });
    
    // Test 3: Check database connection
    console.log('🔍 [DEBUG] Database connection:', {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
    
    // Test 4: Try to call user methods
    try {
      const canUseAI = req.user.canUseAI();
      const usageStatus = req.user.getUsageStatus();
      console.log('🔍 [DEBUG] User methods work:', { canUseAI, usageStatus });
    } catch (methodError) {
      console.error('❌ [DEBUG] User method error:', methodError);
    }
    
    res.json({
      status: 'debug_complete',
      user: {
        id: req.user._id,
        email: req.user.email,
        hasCanUseAI: typeof req.user.canUseAI === 'function',
        hasGetUsageStatus: typeof req.user.getUsageStatus === 'function'
      },
      openai: {
        configured: !!openai,
        hasApiKey: !!process.env.OPENAI_API_KEY
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] Debug endpoint error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

// Send message to AI
router.post('/message', authenticateToken, [
  body('conversationId').isMongoId(),
  body('message').trim().notEmpty().isLength({ max: 2000 }),
  body('language').optional().isIn(['en', 'et', 'es', 'ru'])
], async (req, res) => {
  try {
    console.log('🔍 [AI MESSAGE] Starting message processing...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [AI MESSAGE] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId, message } = req.body;
    console.log('🔍 [AI MESSAGE] Processing message for conversation:', conversationId);

    // Find conversation
    console.log('🔍 [AI MESSAGE] Looking for conversation with ID:', conversationId);
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
      isActive: true
    });

    if (!conversation) {
      console.log('❌ [AI MESSAGE] Conversation not found');
      return res.status(404).json({ error: 'Conversation not found' });
    }
    console.log('✅ [AI MESSAGE] Conversation found');

    // Check if user can use AI
    console.log('🔍 [AI MESSAGE] Checking if user can use AI...');
    if (!req.user.canUseAI || typeof req.user.canUseAI !== 'function') {
      console.error('❌ [AI MESSAGE] User missing canUseAI method:', req.user);
      return res.status(500).json({
        error: 'User model error',
        message: 'User model is missing required methods. Please contact support.'
      });
    }
    
    console.log('🔍 [AI MESSAGE] Calling canUseAI()...');
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
    console.log('🔍 [AI MESSAGE] Fetching user from database...');
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('❌ [AI MESSAGE] User not found in database');
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found. Please log in again.'
      });
    }
    console.log('✅ [AI MESSAGE] User found in database');

    console.log('🔍 [AI MESSAGE] Getting usage status...');
    const usageStatus = user.getUsageStatus();
    console.log('🔍 [AI MESSAGE] Usage status:', usageStatus);
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
    console.log('🔍 [AI MESSAGE] Adding user message to conversation...');
    await conversation.addMessageAndSave('user', message);
    console.log('✅ [AI MESSAGE] User message added to conversation');

    // Create AI prompt using client customization WITH current conversation history
    // The AI should have context from the current conversation but not previous conversations
    console.log('🔍 [AI MESSAGE] Creating AI prompt...');
    // Get conversation history but exclude the current message (last one) since it's passed separately
    // Reduced to 6 messages for cost savings while maintaining context
    const conversationHistory = conversation.messages.slice(-7, -1); // Get last 6 messages excluding the current one
    const prompt = createSalesPrompt(message, req.user.settings, conversation.scenario, conversation.clientCustomization, conversationHistory, conversation.language || 'en');
    console.log('✅ [AI MESSAGE] AI prompt created');

    // If OpenAI is not configured, short-circuit with a friendly error
    console.log('🔍 [AI MESSAGE] Checking OpenAI configuration...');
    if (!openai) {
      console.log('❌ [AI MESSAGE] OpenAI not configured');
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'OPENAI_API_KEY is missing. Configure it to enable AI conversations.'
      });
    }
    console.log('✅ [AI MESSAGE] OpenAI is configured');

    try {
      console.log('🔍 [AI MESSAGE] Calling OpenAI API...');
      // Prepare messages array with conversation history for current session
      // IMPORTANT: Send conversation history as separate messages so AI has proper context
      const messages = [
        { role: "system", content: prompt }
      ];
      
      // Add conversation history (last 6 messages) to provide context
      // This allows the AI to remember what was discussed in the current conversation
      if (conversationHistory && conversationHistory.length > 0) {
        console.log(`📜 [AI MESSAGE] Adding ${conversationHistory.length} previous messages for context`);
        conversationHistory.forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }
      
      // Add the current user message
      messages.push({
        role: "user",
        content: message
      });
      
      console.log(`📨 [AI MESSAGE] Sending ${messages.length} messages to OpenAI (1 system + ${conversationHistory.length} history + 1 current)`);
      
      // Get AI response with optimized token usage
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 300, // Reduced from 500 to 300 for cost savings
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;
      console.log('✅ [AI MESSAGE] OpenAI response received, tokens used:', tokensUsed);

      // Add AI response to conversation and save to database
      // We save after each message pair to prevent data loss, but the frontend won't refresh the conversation list
      console.log('🔍 [AI MESSAGE] Saving AI response to conversation...');
      await conversation.addMessageAndSave('assistant', aiResponse, tokensUsed);
      console.log('✅ [AI MESSAGE] AI response saved to conversation');

      // Note: Usage is only incremented when starting a conversation, not for each message
      console.log('✅ [AI MESSAGE] Sending response to client...');
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
      console.error('❌ [AI MESSAGE] OpenAI API error:', openaiError);
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  } catch (error) {
    console.error('❌ [AI MESSAGE] Send message error:', error);
    console.error('❌ [AI MESSAGE] Error message:', error.message);
    console.error('❌ [AI MESSAGE] Error stack:', error.stack);
    console.error('❌ [AI MESSAGE] Error name:', error.name);
    console.error('❌ [AI MESSAGE] Full error object:', JSON.stringify(error, null, 2));
    
    // Send more detailed error to client for debugging
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    });
  }
});

// Get conversation history
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.getUserHistory(req.user._id, parseInt(limit), skip);
    const total = await Conversation.countDocuments({ userId: req.user._id, isActive: true });

    // Hide messages for call type conversations
    const processedConversations = conversations.map(conversation => {
      const conversationData = conversation.toObject();
      
      // Only include messages for chat type conversations
      if (conversationData.chatType === 'chat') {
        return conversationData;
      } else {
        // For call type, hide the actual messages but keep other data
        return {
          ...conversationData,
          messages: [], // Hide the actual messages
          messageCount: conversationData.messages ? conversationData.messages.length : 0
        };
      }
    });

    res.json({
      conversations: processedConversations,
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

// Get conversation count
router.get('/conversations/count', authenticateToken, async (req, res) => {
  try {
    const count = await Conversation.countDocuments({ userId: req.user._id, isActive: true });
    res.json({ count });
  } catch (error) {
    console.error('Get conversation count error:', error);
    res.status(500).json({ error: 'Failed to get conversation count' });
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

    // Hide messages for call type conversations, but keep AI feedback
    let conversationData = {
      id: conversation._id,
      title: conversation.title,
      scenario: conversation.scenario,
      conversationMode: conversation.conversationMode,
      chatType: conversation.chatType,
      totalTokens: conversation.totalTokens,
      duration: conversation.duration,
      rating: conversation.rating,
      feedback: conversation.feedback,
      aiRatings: conversation.aiRatings,
      aiRatingFeedback: conversation.aiRatingFeedback,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };

    // Only include messages for chat type conversations
    if (conversation.chatType === 'chat') {
      conversationData.messages = conversation.messages;
    } else {
      // For call type, hide the actual messages but show message count for reference
      conversationData.messageCount = conversation.messages.length;
      conversationData.messages = []; // Hide the actual messages
    }

    res.json({
      conversation: conversationData
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

    // Double-check if user can generate a summary (in case limit was reached between check and generation)
    if (!user.canGenerateSummary()) {
      console.log(`Skipping automatic summary generation for user ${userId} - daily limit reached during generation`);
      return;
    }

    // Generate AI analysis using user's language preference
    const aiAnalysis = await generateConversationAnalysis(recentConversations, user, user.language || 'en');
    
    // Create the summary (translations will be generated on-demand when viewed)
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
    
    // Increment user's summary generation count for automatic summaries too
    await user.incrementSummaryUsage();
    
    console.log(`Generated conversation summary #${nextSummaryNumber} for user ${userId}`);
    
  } catch (error) {
    console.error('Error generating conversation summary:', error);
  }
}

// Helper function to generate AI analysis (same as in conversationSummaries.js)
async function generateConversationAnalysis(conversations, user, userLanguage = 'en') {
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

    // Use the user's preferred language for analysis
    const analysisLanguage = userLanguage || 'en';

    // Language-specific grading instructions
    const languageInstructions = {
      en: "IMPORTANT: Grade these conversations as if they were conducted in English. Evaluate English language proficiency, grammar, vocabulary, and natural expression in the sales context. Provide all feedback in English.",
      et: "IMPORTANT: Grade these conversations as if they were conducted in Estonian. Evaluate Estonian language proficiency, grammar, vocabulary, and natural expression in the sales context. Consider Estonian business communication norms and cultural appropriateness. Provide all feedback in Estonian.",
      es: "IMPORTANT: Grade these conversations as if they were conducted in Spanish. Evaluate Spanish language proficiency, grammar, vocabulary, and natural expression in the sales context. Consider Spanish business communication norms and cultural appropriateness. Provide all feedback in Spanish.",
      ru: "IMPORTANT: Grade these conversations as if they were conducted in Russian. Evaluate Russian language proficiency, grammar, vocabulary, and natural expression in the sales context. Consider Russian business communication norms and cultural appropriateness. Provide all feedback in Russian."
    };

    const languageInstruction = languageInstructions[analysisLanguage] || languageInstructions.en;

    const prompt = `
You are an expert sales coach analyzing a user's sales conversation performance. 
Analyze the following 5 conversations and provide a comprehensive summary.

${languageInstruction}

User Profile:
- Name: ${user.firstName} ${user.lastName}
- Industry: ${user.industry || 'Not specified'}
- Role: ${user.role || 'Not specified'}
- Preferred Language: ${analysisLanguage.toUpperCase()}

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
2. Communication clarity in the ${analysisLanguage.toUpperCase()} language
3. Language proficiency and natural expression
4. Objection handling skills
5. Closing ability
6. Overall confidence and professionalism
7. Cultural appropriateness for ${analysisLanguage.toUpperCase()} business communication
8. Specific examples from conversations
9. Actionable improvement suggestions

IMPORTANT: When grading, consider that these conversations were conducted in ${analysisLanguage.toUpperCase()}. 
- Rate language proficiency, grammar, and vocabulary appropriate for ${analysisLanguage.toUpperCase()}
- Consider cultural norms and business communication standards for ${analysisLanguage.toUpperCase()}
- Evaluate naturalness and fluency in ${analysisLanguage.toUpperCase()}
- Provide feedback that is culturally appropriate for ${analysisLanguage.toUpperCase()} speakers
- ALL FEEDBACK AND ANALYSIS MUST BE PROVIDED IN ${analysisLanguage.toUpperCase()}

Be constructive, specific, and encouraging in your feedback.
`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo', // Changed from gpt-4 to gpt-3.5-turbo for significant cost savings
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales coach. Provide concise, constructive feedback on sales conversations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500, // Reduced from 3000 to 1500 for cost savings
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

// AI Tips endpoint for sales advice
router.post('/tips', authenticateToken, [
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('language').optional().isString(),
  body('conversationHistory').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!openai) {
      return res.status(503).json({ error: 'AI service is not available' });
    }

    const { message, language = 'en', conversationHistory = [] } = req.body;
    const userId = req.user.id;

    // Check if user can use AI
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.canUseAI()) {
      return res.status(403).json({ 
        error: 'You have reached your conversation limit. Please upgrade your plan to continue.',
        upgradeRequired: true
      });
    }

    // Check AI Tips usage limit
    if (!user.canUseAiTips()) {
      const aiTipsStatus = user.getAiTipsUsageStatus();
      return res.status(429).json({ 
        error: 'AI Tips monthly limit reached',
        message: `You have reached your monthly AI Tips limit (${aiTipsStatus.monthlyLimit}). Please upgrade your plan to continue.`,
        aiTipsStatus,
        upgradeRequired: true
      });
    }

    // Build conversation context for AI
    const systemPrompt = `You are a professional sales coach and advisor. You help sales professionals improve their skills, handle objections, close deals, and develop effective sales strategies.

IMPORTANT GUIDELINES:
- You are NOT an AI assistant - you are a human sales coach with years of experience
- Never mention that you are an AI, artificial intelligence, or a language model
- Never reveal that you are a computer program or automated system
- You cannot access personal data, company information, or sensitive business details
- Focus only on general sales advice, techniques, and best practices
- Provide practical, actionable advice based on proven sales methodologies
- Be encouraging and supportive while being honest about challenges
- If asked about specific company data or personal information, politely redirect to general advice

Your responses should be:
- Professional and knowledgeable
- Practical and actionable
- Encouraging and supportive
- Based on proven sales techniques
- Appropriate for the user's experience level

Always maintain the persona of an experienced human sales coach.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history if provided (last 6 messages for context to save tokens)
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-6).forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Generate AI response with optimized token usage
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Changed from gpt-4 to gpt-3.5-turbo for cost savings
      messages: messages,
      max_tokens: 500, // Reduced from 1000 to 500 for cost savings
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const response = completion.choices[0].message.content;

    // Increment user's AI usage and AI Tips usage
    await user.incrementAIUsage();
    await user.incrementAiTipsUsage();

    // Get updated usage status
    const aiTipsStatus = user.getAiTipsUsageStatus();

    res.json({
      response: response,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      },
      aiTipsStatus
    });

  } catch (error) {
    console.error('AI Tips error:', error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(503).json({ error: 'AI service authentication failed' });
    }
    
    res.status(500).json({ error: 'Failed to generate AI tips' });
  }
});

// Get AI Tips usage status
router.get('/tips/usage', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const aiTipsStatus = user.getAiTipsUsageStatus();
    res.json({ aiTipsStatus });
  } catch (error) {
    console.error('Get AI Tips usage error:', error);
    res.status(500).json({ error: 'Failed to get AI Tips usage status' });
  }
});

// Get comprehensive usage status (AI conversations, summaries, AI Tips)
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const usageStatus = user.getUsageStatus();
    const summaryStatus = user.getSummaryStatus();
    const aiTipsStatus = user.getAiTipsUsageStatus();

    res.json({
      usageStatus,
      summaryStatus,
      aiTipsStatus,
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status
      }
    });
  } catch (error) {
    console.error('Get usage status error:', error);
    res.status(500).json({ error: 'Failed to get usage status' });
  }
});

module.exports = router; 