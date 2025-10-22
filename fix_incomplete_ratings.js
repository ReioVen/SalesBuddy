#!/usr/bin/env node
/**
 * Script to fix conversations with incomplete AI ratings
 * This will regenerate ratings for conversations that are missing fields
 */

const mongoose = require('mongoose');
const Conversation = require('./server/models/Conversation');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create rating prompt (same as in the main code)
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

async function fixIncompleteRatings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find conversations with incomplete AI ratings
    const conversations = await Conversation.find({
      'aiRatings': { $exists: true },
      $or: [
        { 'aiRatings.introduction': { $exists: false } },
        { 'aiRatings.mapping': { $exists: false } },
        { 'aiRatings.productPresentation': { $exists: false } },
        { 'aiRatings.close': { $exists: false } }
      ]
    }).limit(10); // Process 10 at a time

    console.log(`🔍 Found ${conversations.length} conversations with incomplete AI ratings`);

    for (const conversation of conversations) {
      try {
        console.log(`\n📝 Processing conversation ${conversation._id}`);
        console.log(`Current aiRatings:`, conversation.aiRatings);
        
        if (!conversation.messages || conversation.messages.length === 0) {
          console.log('⚠️  Skipping - no messages');
          continue;
        }

        // Generate new AI ratings
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
        console.log('🤖 AI Response:', ratingResponse);
        
        try {
          const ratings = JSON.parse(ratingResponse);
          console.log('✅ Parsed ratings:', ratings);
          
          // Update with complete ratings
          conversation.aiRatings = {
            introduction: ratings.opening || 0,
            mapping: ratings.discovery || 0,
            productPresentation: ratings.presentation || 0,
            objectionHandling: ratings.objectionHandling || 0,
            close: ratings.closing || 0,
            totalScore: ratings.totalScore || 0,
            maxPossibleScore: ratings.maxPossibleScore || 50
          };
          conversation.aiRatingFeedback = ratings.feedback || '';
          
          await conversation.save();
          console.log('✅ Updated conversation with complete ratings');
          
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          console.log('Raw response:', ratingResponse);
        }
        
      } catch (error) {
        console.error(`❌ Error processing conversation ${conversation._id}:`, error);
      }
    }

    console.log('\n✅ Fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixIncompleteRatings();
