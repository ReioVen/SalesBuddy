#!/usr/bin/env node
/**
 * Test script to debug AI rating generation
 * This will help us see what the AI is actually returning
 */

const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test conversation messages
const testMessages = [
  {
    role: 'user',
    content: 'Hello, I\'m calling about our new software solution.'
  },
  {
    role: 'assistant', 
    content: 'Hello! Thank you for calling. I\'m interested in learning more about your software solution. Can you tell me what specific problems it solves for businesses?'
  }
];

// Create rating prompt
const createRatingPrompt = (messages) => {
  const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  
  let prompt = `You are an expert sales trainer and performance evaluator with 20+ years of experience in sales training and coaching. You are analyzing a sales conversation to provide a comprehensive evaluation based on modern sales methodologies and best practices.

CONVERSATION TO ANALYZE:

${conversationText}

EVALUATION CRITERIA - Rate each category from 0-10 based on sales effectiveness:

1. OPENING (0-10 points):
Evaluate the salesperson's opening based on:
- Professional greeting and introduction
- Clear purpose statement
- Permission-based approach (asking for time)
- Rapport building
- Energy and confidence
- Value proposition teaser
- Setting expectations

2. DISCOVERY (0-10 points):
Evaluate the salesperson's discovery skills based on:
- Quality of questions asked (open-ended vs closed)
- Depth of needs assessment
- Understanding client's pain points
- Identifying decision-making process
- Budget and timeline discovery
- Competitive landscape awareness
- Active listening and follow-up questions
- Building trust and credibility

3. PRESENTATION (0-10 points):
Evaluate the salesperson's presentation skills based on:
- Relevance to client's specific needs
- Clear value proposition
- Benefit-focused messaging
- Use of examples and stories
- Handling of features vs benefits
- Addressing client concerns
- Professional delivery
- Engagement techniques

4. OBJECTION HANDLING (0-10 points):
Evaluate the salesperson's objection handling based on:
- Acknowledgment of concerns
- Probing for root causes
- Providing relevant solutions
- Using proof points and testimonials
- Maintaining positive attitude
- Not being defensive
- Turning objections into opportunities
- Building consensus

5. CLOSING (0-10 points):
Evaluate the salesperson's closing skills based on:
- Identifying buying signals
- Asking for the business
- Creating appropriate urgency
- Summarizing value
- Handling final concerns
- Securing next steps
- Professional persistence
- Clear call-to-action

SCORING GUIDELINES:
- 9-10: Exceptional performance, exceeds expectations
- 7-8: Good performance, meets most expectations
- 5-6: Average performance, room for improvement
- 3-4: Below average, significant improvement needed
- 0-2: Poor performance, major issues to address

Consider the conversation flow, client engagement, and overall sales effectiveness. Be fair but honest in your evaluation.

Return your evaluation as a JSON object with this exact format:
{
  "opening": [number 0-10],
  "discovery": [number 0-10],
  "presentation": [number 0-10],
  "objectionHandling": [number 0-10],
  "closing": [number 0-10],
  "totalScore": [sum of all scores],
  "maxPossibleScore": 50,
  "feedback": "[Provide detailed, constructive feedback highlighting specific strengths and areas for improvement. Be encouraging while being honest about areas for growth. Use 'you' instead of 'the salesperson' throughout the feedback. Focus on actionable advice.]"
}`;

  return prompt;
};

async function testAIRating() {
  try {
    console.log('🧪 Testing AI Rating Generation...');
    console.log('Test messages:', testMessages);
    
    const ratingPrompt = createRatingPrompt(testMessages);
    console.log('\n📝 Rating prompt length:', ratingPrompt.length);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: ratingPrompt }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const ratingResponse = completion.choices[0].message.content;
    console.log('\n🤖 Raw AI Response:');
    console.log(ratingResponse);
    
    try {
      const ratings = JSON.parse(ratingResponse);
      console.log('\n✅ Parsed JSON:');
      console.log(JSON.stringify(ratings, null, 2));
      
      console.log('\n🔍 Field Analysis:');
      const requiredFields = ['opening', 'discovery', 'presentation', 'objectionHandling', 'closing'];
      requiredFields.forEach(field => {
        console.log(`${field}: ${ratings[field]} (${typeof ratings[field]})`);
      });
      
      console.log(`totalScore: ${ratings.totalScore} (${typeof ratings.totalScore})`);
      console.log(`maxPossibleScore: ${ratings.maxPossibleScore} (${typeof ratings.maxPossibleScore})`);
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      console.log('Raw response:', ratingResponse);
    }
    
  } catch (error) {
    console.error('❌ Error testing AI rating:', error);
  }
}

// Run the test
testAIRating();
