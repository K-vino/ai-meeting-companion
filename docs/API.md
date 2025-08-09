# API Documentation

This document describes the REST API endpoints and WebSocket interface for the AI Meeting Companion server.

## 🌐 Base URL

```
Development: http://localhost:3000
Production: https://yourdomain.com
```

## 🔐 Authentication

Currently, the API uses IP-based rate limiting. Future versions may implement:
- JWT tokens for user authentication
- API keys for programmatic access
- OAuth integration for enterprise SSO

## 📝 REST API Endpoints

### Health Check

#### GET /health
Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### GET /health/detailed
Detailed health check with service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "openai": { "status": "healthy" },
    "memory": {
      "rss": "150 MB",
      "heapTotal": "120 MB",
      "heapUsed": "80 MB",
      "external": "10 MB"
    },
    "uptime": 3600
  }
}
```

### Transcription

#### POST /api/transcription/upload
Upload audio file for transcription.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `audio` (file): Audio file (WebM, MP3, WAV, OGG)
  - `sessionId` (string): Session identifier
  - `language` (string, optional): Language code (default: "en-US")
  - `format` (string, optional): Audio format hint

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": {
      "id": "segment_1234567890_abc123",
      "sessionId": "session_1234567890_def456",
      "text": "Hello, welcome to our meeting today.",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "confidence": 0.95,
      "language": "en",
      "duration": 3.2
    },
    "processingTime": 1250
  },
  "timestamp": "2024-01-15T10:30:01.250Z"
}
```

#### GET /api/transcription/languages
Get supported languages for transcription.

**Response:**
```json
{
  "success": true,
  "data": {
    "languages": ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Analysis

#### POST /api/analysis/analyze
Analyze transcript text for insights.

**Request:**
```json
{
  "sessionId": "session_1234567890_def456",
  "text": "We discussed the quarterly results and decided to increase marketing budget by 20%. John will prepare the proposal by Friday.",
  "analysisTypes": ["summary", "action_items", "sentiment", "jargon"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "sessionId": "session_1234567890_def456",
      "summary": "Team discussed Q4 results and approved 20% marketing budget increase. John assigned to prepare proposal.",
      "actionItems": [
        {
          "id": "action_1234567890_ghi789",
          "text": "Prepare marketing budget proposal",
          "assignee": "John",
          "dueDate": "2024-01-19T23:59:59.000Z",
          "priority": "medium",
          "status": "pending",
          "extractedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "sentiment": {
        "overall": {
          "positive": 0.7,
          "neutral": 0.25,
          "negative": 0.05,
          "compound": 0.6
        },
        "timeline": [],
        "participants": []
      },
      "jargonTerms": [
        {
          "term": "quarterly results",
          "definition": "Financial performance summary for a three-month period",
          "category": "business",
          "confidence": 0.9,
          "occurrences": 1,
          "context": ["We discussed the quarterly results and decided..."]
        }
      ],
      "generatedAt": "2024-01-15T10:30:00.000Z"
    },
    "processingTime": 2100
  },
  "timestamp": "2024-01-15T10:30:02.100Z"
}
```

#### GET /api/analysis/types
Get available analysis types.

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisTypes": [
      {
        "type": "summary",
        "name": "Meeting Summary",
        "description": "Generate a concise summary of the meeting"
      },
      {
        "type": "action_items",
        "name": "Action Items",
        "description": "Extract action items and tasks from the discussion"
      },
      {
        "type": "sentiment",
        "name": "Sentiment Analysis",
        "description": "Analyze the emotional tone of the meeting"
      },
      {
        "type": "jargon",
        "name": "Jargon Detection",
        "description": "Identify and explain technical terms and jargon"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔌 WebSocket Interface

### Connection
Connect to WebSocket endpoint:
```
ws://localhost:3000/ws
wss://yourdomain.com/ws
```

### Message Format
All WebSocket messages follow this structure:
```json
{
  "type": "message_type",
  "payload": { /* message-specific data */ },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "session_id" // optional
}
```

### Client to Server Messages

#### JOIN_SESSION
Join a meeting session.
```json
{
  "type": "join_session",
  "payload": {
    "sessionId": "session_1234567890_def456"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### LEAVE_SESSION
Leave a meeting session.
```json
{
  "type": "leave_session",
  "payload": {
    "sessionId": "session_1234567890_def456"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### AUDIO_CHUNK
Send audio data for real-time transcription.
```json
{
  "type": "audio_chunk",
  "payload": {
    "sessionId": "session_1234567890_def456",
    "audioData": "base64_encoded_audio_data",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "session_1234567890_def456"
}
```

#### REQUEST_ANALYSIS
Request analysis of current session.
```json
{
  "type": "request_analysis",
  "payload": {
    "sessionId": "session_1234567890_def456",
    "analysisTypes": ["summary", "action_items"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "session_1234567890_def456"
}
```

### Server to Client Messages

#### SESSION_JOINED
Confirmation of session join.
```json
{
  "type": "session_joined",
  "payload": {
    "sessionId": "session_1234567890_def456",
    "clientId": "client_1234567890_jkl012"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "session_1234567890_def456"
}
```

#### TRANSCRIPT_UPDATE
Real-time transcript update.
```json
{
  "type": "transcript_update",
  "payload": {
    "id": "segment_1234567890_abc123",
    "sessionId": "session_1234567890_def456",
    "text": "Hello, welcome to our meeting today.",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "confidence": 0.95,
    "language": "en"
  },
  "timestamp": "2024-01-15T10:30:01.000Z",
  "sessionId": "session_1234567890_def456"
}
```

#### ANALYSIS_UPDATE
Real-time analysis update.
```json
{
  "type": "analysis_update",
  "payload": {
    "sessionId": "session_1234567890_def456",
    "summary": "Updated meeting summary...",
    "actionItems": [...],
    "sentiment": {...},
    "generatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:02.000Z",
  "sessionId": "session_1234567890_def456"
}
```

#### ERROR
Error message.
```json
{
  "type": "error",
  "payload": {
    "error": "Session not found",
    "code": "SESSION_NOT_FOUND"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📊 Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **File Upload**: 10 uploads per minute per IP
- **WebSocket**: 1000 concurrent connections max

## ❌ Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE", // optional
    "details": {...} // optional
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `413` - Payload Too Large
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## 🔧 SDK Examples

### JavaScript/TypeScript
```typescript
// REST API example
const response = await fetch('/api/transcription/upload', {
  method: 'POST',
  body: formData
});
const result = await response.json();

// WebSocket example
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Python
```python
import requests
import websocket

# REST API example
with open('audio.wav', 'rb') as f:
    files = {'audio': f}
    data = {'sessionId': 'session_123'}
    response = requests.post('/api/transcription/upload', files=files, data=data)

# WebSocket example
def on_message(ws, message):
    print(f"Received: {message}")

ws = websocket.WebSocketApp("ws://localhost:3000/ws", on_message=on_message)
```
