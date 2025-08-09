# AI Meeting Companion 🤖📝

> **The Ultimate AI-Powered Meeting Assistant** - Transform your online meetings with real-time transcription, intelligent note-taking, and smart insights.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

## 🌟 Features

### Core Functionality
- **🎤 Real-time Audio Capture** - Seamlessly capture meeting audio with multiple fallback strategies
- **📝 Live Transcription** - Powered by OpenAI Whisper for accurate speech-to-text
- **🧠 AI-Powered Analysis** - Intelligent summarization and insight extraction
- **⚡ Real-time Updates** - Live sidebar with instant updates via WebSocket

### Smart Meeting Insights
- **📋 Automatic Note-Taking** - AI-generated meeting summaries and key points
- **✅ Action Items Detection** - Automatically identify and track action items
- **😊 Sentiment Analysis** - Monitor meeting mood and participant engagement
- **🔍 Jargon Detection** - Real-time explanations for technical terms and acronyms
- **🏷️ Topic Categorization** - Organize discussions by themes and subjects

### Platform Support
- **Zoom** - Full integration with Zoom meetings
- **Google Meet** - Complete Google Meet support
- **Microsoft Teams** - Comprehensive Teams compatibility
- **Generic Web Meetings** - Works with most web-based meeting platforms

### Privacy & Security
- **🔒 Privacy-First Design** - Local processing with optional cloud features
- **👥 Consent Management** - Built-in participant consent tracking
- **🛡️ Data Protection** - End-to-end encryption for sensitive data
- **⚙️ Configurable Privacy** - Granular control over data sharing and storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Chrome browser (for extension development)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-meeting-companion.git
   cd ai-meeting-companion
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install extension dependencies
   cd ../extension
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp server/.env.example server/.env

   # Edit .env with your API keys
   nano server/.env
   ```

4. **Build and run**
   ```bash
   # Start the backend server
   cd server
   npm run dev

   # Build the extension (in another terminal)
   cd extension
   npm run build
   ```

5. **Load the extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/dist` folder

## 🚀 Usage Guide

### Getting Started
1. **Start the backend server** (must be running for AI features)
2. **Open a meeting** in Zoom, Google Meet, or Microsoft Teams
3. **Click the extension icon** in Chrome toolbar
4. **Configure server URL** if different from localhost:3000
5. **Click "Start Recording"** to begin capturing audio
6. **View live insights** in the floating sidebar

### Extension Features
- **🎯 Smart Detection**: Automatically detects meeting platforms
- **⚙️ Flexible Settings**: Configurable transcription and analysis options
- **🔄 Real-time Updates**: Live transcription and AI analysis
- **📱 Responsive UI**: Modern, accessible interface design
- **🔒 Privacy Controls**: Granular privacy and consent management

### Server Features
- **🚀 High Performance**: Optimized for real-time processing
- **📈 Scalable**: WebSocket support for multiple concurrent sessions
- **🛡️ Secure**: Rate limiting, input validation, and error handling
- **📊 Observable**: Comprehensive logging and health monitoring
- **🔧 Configurable**: Environment-based configuration management

## 🔧 Configuration

### Environment Variables

The server uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (with defaults)
NODE_ENV=development
PORT=3000
OPENAI_MODEL=gpt-4
RATE_LIMIT_MAX_REQUESTS=100
```

### Extension Settings

Configure the extension through the popup interface:
- **Server URL**: Backend server endpoint
- **Language**: Transcription language preference
- **Analysis Types**: Enable/disable specific AI analysis features
- **Privacy Mode**: Control data sharing and storage

## 🛡️ Privacy & Security

### Data Protection
- **Local Processing**: Audio processing happens locally when possible
- **Encrypted Transmission**: All data sent over HTTPS/WSS
- **Configurable Retention**: Control how long data is stored
- **Consent Management**: Built-in participant consent tracking

### Security Features
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Restricts cross-origin requests
- **Error Handling**: Secure error messages without data leakage

## 📊 Performance

### Optimization Features
- **Chunked Processing**: Audio processed in manageable chunks
- **Real-time Streaming**: WebSocket-based live updates
- **Efficient Caching**: Reduces redundant API calls
- **Resource Management**: Automatic cleanup and memory management

### Scalability
- **Horizontal Scaling**: Supports multiple server instances
- **Load Balancing**: Compatible with standard load balancers
- **Database Ready**: Prepared for database integration
- **Monitoring**: Built-in health checks and metrics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit: `git commit -m 'feat: add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📚 Documentation

- **[API Documentation](docs/API.md)**: REST API and WebSocket interface
- **[Development Guide](docs/DEVELOPMENT.md)**: Setup and development workflow
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment instructions
- **[Contributing Guide](CONTRIBUTING.md)**: How to contribute to the project

## 🐛 Troubleshooting

### Common Issues

**Extension not loading**
- Check Chrome version compatibility (88+)
- Verify manifest.json syntax
- Ensure all required permissions are granted

**Audio capture failing**
- Verify microphone/tab permissions
- Check if meeting platform blocks audio capture
- Try different capture methods in settings

**Server connection issues**
- Verify server is running on correct port
- Check firewall and network settings
- Ensure OpenAI API key is valid

**Transcription not working**
- Verify OpenAI API key and quota
- Check audio format compatibility
- Monitor server logs for errors

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing excellent AI APIs
- **Chrome Extension Community** for development resources
- **Open Source Contributors** who make projects like this possible

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-meeting-companion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-meeting-companion/discussions)
- **Email**: support@yourdomain.com

---

**Made with ❤️ for better meetings everywhere**

## 📁 Project Structure

```
ai-meeting-companion/
├── extension/                 # Chrome Extension
│   ├── src/
│   │   ├── background/       # Service Worker & Audio Capture
│   │   ├── content/          # Content Scripts & Platform Adapters
│   │   ├── popup/            # Extension Popup UI (React)
│   │   ├── sidebar/          # Meeting Sidebar UI (React)
│   │   └── shared/           # Shared utilities
│   ├── public/               # Static assets & manifest
│   ├── webpack.config.js     # Build configuration
│   └── package.json
├── server/                   # Backend Server (Express + TypeScript)
│   ├── src/
│   │   ├── api/              # REST API routes
│   │   ├── services/         # Business logic (AI, Transcription, WebSocket)
│   │   ├── middleware/       # Express middleware
│   │   ├── config/           # Configuration management
│   │   └── utils/            # Utilities & logging
│   ├── .env.example          # Environment variables template
│   └── package.json
├── shared/                   # Shared TypeScript types & utilities
│   ├── src/types/            # Common type definitions
│   ├── src/utils/            # Shared utility functions
│   └── package.json
├── docs/                     # Documentation
├── .gitignore               # Git ignore rules
├── package.json             # Root package.json (workspace)
└── README.md
```

## 🏗️ Architecture Overview

### Extension Architecture
- **Service Worker**: Manages audio capture, WebSocket connections, and extension state
- **Content Scripts**: Inject sidebar UI and handle platform-specific integrations
- **Popup Interface**: React-based control panel for settings and session management
- **Sidebar UI**: Real-time meeting companion with live transcription and analysis

### Backend Architecture
- **Express Server**: RESTful API with TypeScript and comprehensive middleware
- **WebSocket Service**: Real-time bidirectional communication for live features
- **AI Services**: OpenAI integration for transcription (Whisper) and analysis (GPT-4)
- **Audio Processing**: FFmpeg-based audio optimization and format conversion

### Key Features Implementation
- **🎤 Audio Capture**: Multiple fallback strategies (tab capture, display media, microphone)
- **📝 Real-time Transcription**: Chunked audio processing with OpenAI Whisper
- **🧠 AI Analysis**: Intelligent summarization, action items, sentiment, and jargon detection
- **🔄 Live Updates**: WebSocket-based real-time UI updates
- **🛡️ Security**: Rate limiting, CORS protection, input validation, and error handling
- **📊 Monitoring**: Comprehensive logging, health checks, and performance metrics

AI Meeting Companion 🤖📝
by VINO K – INFOTECHVMD

The Ultimate AI-Powered Meeting Assistant – Transform your online meetings with real-time transcription, intelligent note-taking, and actionable insights.






🌟 Features
Core Functionality
🎤 Real-time Audio Capture – Multiple fallback strategies for seamless recording

📝 Live Transcription – OpenAI Whisper for precise speech-to-text conversion

🧠 AI-Powered Analysis – Smart summaries, insights & decision tracking

⚡ Instant Sidebar Updates – Live insights with WebSocket streaming

Smart Meeting Insights
📋 Automatic AI-generated summaries

✅ Action item detection & tracking

😊 Sentiment analysis for meeting mood

🔍 Real-time jargon & acronym explanations

🏷️ Topic categorization for better organization

Platform Support
✅ Zoom
✅ Google Meet
✅ Microsoft Teams
✅ Most browser-based meeting platforms

Privacy & Security
🔒 Local-first design with optional cloud support

👥 Consent tracking for participants

🛡️ End-to-end encryption for sensitive data

⚙️ Granular privacy controls

🚀 Quick Start
Prerequisites
Node.js 18+

Chrome Browser

OpenAI API Key

Setup Instructions
bash
Copy
Edit
# Clone the repository
git clone https://github.com/yourusername/ai-meeting-companion.git
cd ai-meeting-companion

# Install dependencies
cd server && npm install
cd ../extension && npm install

# Configure environment
cp server/.env.example server/.env
nano server/.env

# Start backend
cd server
npm run dev

# Build extension
cd ../extension
npm run build
Load the Extension in Chrome
Go to chrome://extensions/

Enable Developer Mode

Click Load unpacked → Select extension/dist folder

💡 Usage
Start backend server

Open your meeting (Zoom, Meet, or Teams)

Click the extension icon → Start Recording

View Live Insights in sidebar

🔧 Configuration
env
Copy
Edit
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
PORT=3000
OPENAI_MODEL=gpt-4
RATE_LIMIT_MAX_REQUESTS=100
🛡️ Security
Local-first audio processing

Encrypted communication (HTTPS/WSS)

Consent tracking & configurable data retention

Rate-limiting & input sanitization

📊 Performance
Chunked audio processing for speed

Real-time WebSocket streaming

Efficient caching to save API calls

Scalable, load-balancer ready backend

🤝 Contributing
We ❤️ contributions!


Create branch: feature/amazing-feature


Open PR

📞 Contact
📧 Email : infotechvmd@gmail.com
🌐 Youtube : INFOTECHVMD (if applicable)

Made with ❤️ by VINO K – INFOTECHVMD