const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ConversationSummary = require('../models/ConversationSummary');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const axios = require('axios');

const router = express.Router();

// Get all conversation summaries for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const summaries = await ConversationSummary.find({ userId: req.user._id })
      .sort({ summaryNumber: -1 })
      .populate('exampleConversations.conversationId', 'title createdAt')
      .lean();

    res.json({ summaries });
  } catch (error) {
    console.error('Error fetching conversation summaries:', error);
    res.status(500).json({ error: 'Failed to fetch conversation summaries' });
  }
});

// Get a specific conversation summary
router.get('/:summaryId', authenticateToken, async (req, res) => {
  try {
    const summary = await ConversationSummary.findOne({
      _id: req.params.summaryId,
      userId: req.user._id
    }).populate('exampleConversations.conversationId', 'title createdAt messages');

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching conversation summary:', error);
    res.status(500).json({ error: 'Failed to fetch conversation summary' });
  }
});

// Generate a new conversation summary (triggered after 5 conversations)
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
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
      return res.status(400).json({ 
        error: 'Need at least 5 conversations to generate a summary' 
      });
    }

    // Generate AI analysis using user's language preference
    const aiAnalysis = await generateConversationAnalysis(recentConversations, req.user, req.user.language || 'en');
    
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
    
    // Populate the summary with conversation details
    await summary.populate('exampleConversations.conversationId', 'title createdAt');
    
    res.json({ summary });
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    res.status(500).json({ error: 'Failed to generate conversation summary' });
  }
});

// Helper function to generate AI analysis
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
