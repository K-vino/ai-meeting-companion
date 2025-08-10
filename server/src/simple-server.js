// Simple JavaScript server for demonstration
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const OpenAI = require('openai');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow Chrome extensions and common development/production origins
    if (!origin ||
        origin.startsWith('chrome-extension://') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:') ||
        origin.includes('meet.google.com') ||
        origin.includes('zoom.us') ||
        origin.includes('teams.microsoft.com') ||
        origin.includes('teams.live.com') ||
        origin.includes('herokuapp.com') ||
        origin.includes('vercel.app') ||
        origin.includes('netlify.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'AI Meeting Companion Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock transcription endpoint
app.post('/api/transcription/upload', upload.single('audio'), (req, res) => {
  console.log('Transcription request received');

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No audio file provided' },
      timestamp: new Date().toISOString()
    });
  }

  // Mock response
  const mockTranscript = {
    id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId: req.body.sessionId || 'demo-session',
    text: 'This is a mock transcription. In a real implementation, this would be processed by OpenAI Whisper.',
    timestamp: new Date().toISOString(),
    confidence: 0.95,
    language: req.body.language || 'en',
    duration: 3.2
  };

  res.json({
    success: true,
    data: {
      transcript: mockTranscript,
      processingTime: 1250
    },
    timestamp: new Date().toISOString()
  });
});

// Mock analysis endpoint
app.post('/api/analysis/analyze', (req, res) => {
  console.log('Analysis request received');

  const { sessionId, text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: { message: 'No text provided' },
      timestamp: new Date().toISOString()
    });
  }

  // Mock analysis response
  const mockAnalysis = {
    sessionId: sessionId || 'demo-session',
    summary: 'This is a mock summary of the meeting discussion. Key points were covered and decisions were made.',
    actionItems: [
      {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: 'Follow up on project timeline',
        assignee: 'Team Lead',
        priority: 'medium',
        status: 'pending',
        extractedAt: new Date().toISOString()
      }
    ],
    sentiment: {
      overall: {
        positive: 0.7,
        neutral: 0.25,
        negative: 0.05,
        compound: 0.6
      },
      timeline: [],
      participants: []
    },
    jargonTerms: [
      {
        term: 'API',
        definition: 'Application Programming Interface - a set of protocols for building software applications',
        category: 'technology',
        confidence: 0.9,
        occurrences: 1,
        context: ['We need to update the API documentation']
      }
    ],
    generatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: {
      analysis: mockAnalysis,
      processingTime: 2100
    },
    timestamp: new Date().toISOString()
  });
});

// ChatGPT-powered summary endpoint
app.post('/api/analysis/summary', async (req, res) => {
  try {
    const { transcript } = req.body || {};
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ success: false, error: 'transcript is required' });
    }

    if (!openai) {
      // Fallback mock when no key configured
      return res.json({
        success: true,
        data: {
          summary: 'This is a mock summary. Add OPENAI_API_KEY to get AI-generated summaries.',
          bullets: [
            'Key point one from the discussion',
            'Key point two with decision context',
            'Next steps and owners'
          ]
        }
      });
    }

    const prompt = `Summarize the following meeting transcript in 5 concise bullet points and one paragraph (<=120 words). Keep it neutral and actionable.\n\nTranscript:\n${transcript}`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert meeting summarizer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const output = chat.choices?.[0]?.message?.content || '';
    res.json({ success: true, data: { summary: output } });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate summary' });
  }
});

// ChatGPT-powered meeting tips endpoint
app.post('/api/analysis/tips', async (req, res) => {
  try {
    const { transcript, context } = req.body || {};
    const base = transcript && transcript.trim() ? transcript : 'No transcript available; provide general meeting best practices for Google Meet.';

    if (!openai) {
      return res.json({
        success: true,
        data: {
          tips: [
            'Mute when not speaking and unmute with keyboard shortcuts for quick handoffs.',
            'Use the chat for links and action items so they are captured clearly.',
            'Call out owners and due dates as you assign tasks.',
            'Record decisions explicitly and confirm agreement before moving on.',
            'Timebox each topic; park out-of-scope items to a follow-up list.'
          ]
        }
      });
    }

    const prompt = `You are an AI meeting coach. Given the transcript, generate 5 specific, actionable tips to improve the rest of this meeting (facilitation, clarity, engagement, decisions). If transcript is sparse, give high-value general tips for Google Meet.\n\nTranscript (may be partial):\n${base}`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You coach meeting participants with concise, actionable guidance.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    const tipsText = chat.choices?.[0]?.message?.content || '';
    res.json({ success: true, data: { tips: tipsText.split('\n').filter(Boolean) } });
  } catch (err) {
    console.error('Tips error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate tips' });
  }
});



// Get supported languages
app.get('/api/transcription/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
    },
    timestamp: new Date().toISOString()
  });
});

// Get analysis types
app.get('/api/analysis/types', (req, res) => {
  res.json({
    success: true,
    data: {
      analysisTypes: [
        {
          type: 'summary',
          name: 'Meeting Summary',
          description: 'Generate a concise summary of the meeting'
        },
        {
          type: 'action_items',
          name: 'Action Items',
          description: 'Extract action items and tasks from the discussion'
        },
        {
          type: 'sentiment',
          name: 'Sentiment Analysis',
          description: 'Analyze the emotional tone of the meeting'
        },
        {
          type: 'jargon',
          name: 'Jargon Detection',
          description: 'Identify and explain technical terms and jargon'
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error'
    },
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server
const wss = new WebSocketServer({
  server: server,
  path: '/ws'
});

const clients = new Map();

wss.on('connection', (ws, request) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  clients.set(clientId, ws);

  console.log(`WebSocket client connected: ${clientId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'session_joined',
    payload: { clientId },
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('WebSocket message received:', message.type);

      // Echo back for demo
      if (message.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          payload: { timestamp: new Date() },
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${clientId}`);
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 AI Meeting Companion Server running on http://localhost:${port}`);
  console.log(`📡 WebSocket server running on ws://localhost:${port}/ws`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Note: This is a demo server with mock responses. Add your OpenAI API key for real functionality.`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
