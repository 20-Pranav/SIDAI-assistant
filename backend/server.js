import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

// System prompts for different modes
const SYSTEM_PROMPTS = {
  personal: `You are SID (Smart Intelligent Director), a helpful personal AI assistant. 
  Be concise, friendly, and helpful. You can discuss any topic the user wants to talk about.`,
  
  study: `You are SID, an expert tutor. Explain concepts clearly with examples. 
  Help the user learn and understand complex topics. Be patient and encouraging.`,
  
  coding: `You are SID, a programming assistant. Help with code, debugging, and best practices. 
  Provide clean code with explanations. Be practical and helpful.`
};

// Groq API endpoint with memory support
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, history, userName, memorySummary } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log(`📨 [${mode}] ${userName ? `User: ${userName}` : 'New user'} said: ${message}`);

    // Build system prompt with memory context
    let systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.personal;
    
    if (userName) {
      systemPrompt += `\n\nThe user's name is ${userName}. Address them by name occasionally.`;
    }
    
    if (memorySummary) {
      systemPrompt += `\n\nContext from previous conversations: ${memorySummary}`;
    }

    // Build messages with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const aiResponse = data.choices[0].message.content;
      console.log(`🤖 Response sent (${data.usage?.total_tokens || 0} tokens)`);
      
      res.json({
        success: true,
        data: { response: aiResponse }
      });
    } else {
      console.error('❌ Groq API error:', data);
      throw new Error(data.error?.message || 'Groq API error');
    }

  } catch (error) {
    console.error('❌ API error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get AI response'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'SID AI Backend (Groq)',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 SID AI Assistant API is running!',
    provider: 'Groq (Llama 3)',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /health'
    }
  });
});

// Listen on all network interfaces (0.0.0.0) to allow phone connections
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 SID AI Backend running on http://0.0.0.0:${port}`);
  console.log(`📱 Access from phone: http://10.164.111.74:${port}`);
  console.log(`💻 Access from local: http://localhost:${port}`);
  console.log(`🤖 Using Groq (Llama 3) - Free & Fast!`);
  console.log(`📝 API ready at http://localhost:${port}/api/chat`);
  console.log(`❤️  Health check at http://localhost:${port}/health`);
});
