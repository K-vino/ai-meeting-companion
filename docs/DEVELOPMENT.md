# Development Guide

This guide covers setting up the development environment and contributing to the AI Meeting Companion project.

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ and npm 9+
- **Chrome** browser for extension development
- **OpenAI API key** for AI features
- **Git** for version control

### Quick Start

1. **Clone and install**:
   ```bash
   git clone https://github.com/yourusername/ai-meeting-companion.git
   cd ai-meeting-companion
   npm run install:all
   ```

2. **Configure environment**:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your OpenAI API key
   ```

3. **Start development**:
   ```bash
   # Terminal 1: Start server
   cd server && npm run dev
   
   # Terminal 2: Build extension
   cd extension && npm run dev
   ```

4. **Load extension**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select `extension/dist`

## 🏗️ Project Architecture

### Monorepo Structure
The project uses npm workspaces for managing multiple packages:

- **`shared/`**: Common TypeScript types and utilities
- **`extension/`**: Chrome extension (React + TypeScript)
- **`server/`**: Backend API server (Express + TypeScript)

### Technology Stack

#### Frontend (Extension)
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Styled Components**: CSS-in-JS styling
- **Webpack**: Module bundling
- **Chrome Extension APIs**: Browser integration

#### Backend (Server)
- **Express**: Web framework
- **TypeScript**: Type safety
- **WebSocket**: Real-time communication
- **OpenAI API**: AI transcription and analysis
- **FFmpeg**: Audio processing
- **Winston**: Logging

### Development Workflow

1. **Feature Development**:
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes
   npm run lint
   npm run test
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

2. **Testing**:
   ```bash
   # Run all tests
   npm test
   
   # Test specific package
   cd server && npm test
   cd extension && npm test
   ```

3. **Building**:
   ```bash
   # Build all packages
   npm run build
   
   # Build for production
   NODE_ENV=production npm run build
   ```

## 🧪 Testing Strategy

### Unit Tests
- **Server**: Jest with supertest for API testing
- **Extension**: Jest with React Testing Library
- **Shared**: Jest for utility functions

### Integration Tests
- WebSocket communication
- Audio processing pipeline
- OpenAI API integration

### E2E Tests
- Extension functionality in real meetings
- Complete transcription workflow
- UI interactions

### Test Commands
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- --testNamePattern="transcription"
```

## 🔧 Development Tools

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for quality gates

### Debugging

#### Extension Debugging
1. Open Chrome DevTools on extension popup
2. Use `chrome://extensions/` → "Inspect views"
3. Check background script console
4. Monitor network requests in DevTools

#### Server Debugging
1. Use VS Code debugger with launch configuration
2. Add breakpoints in TypeScript source
3. Use `console.log` for quick debugging
4. Monitor logs with `tail -f logs/app.log`

#### WebSocket Debugging
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onmessage = (event) => console.log('Received:', JSON.parse(event.data));
ws.send(JSON.stringify({ type: 'join_session', payload: { sessionId: 'test' } }));
```

### Performance Profiling

#### Server Performance
```bash
# CPU profiling
node --prof server/dist/index.js

# Memory profiling
node --inspect server/dist/index.js
# Open chrome://inspect in Chrome
```

#### Extension Performance
- Use Chrome DevTools Performance tab
- Monitor memory usage in Task Manager
- Profile React components with React DevTools

## 📝 Code Style Guide

### TypeScript Guidelines
```typescript
// Use explicit types for function parameters and returns
function processAudio(buffer: Buffer, format: AudioFormat): Promise<TranscriptSegment> {
  // Implementation
}

// Use interfaces for object shapes
interface MeetingSession {
  id: string;
  title?: string;
  startTime: Date;
}

// Use enums for constants
enum SessionStatus {
  ACTIVE = 'active',
  ENDED = 'ended'
}
```

### React Guidelines
```tsx
// Use functional components with hooks
const MyComponent: React.FC<Props> = ({ title, onAction }) => {
  const [state, setState] = useState<State>(initialState);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return <div>{title}</div>;
};

// Use styled-components for styling
const StyledButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  background: ${({ theme, variant }) => theme.colors[variant]};
  padding: ${({ theme }) => theme.spacing.md};
`;
```

### API Guidelines
```typescript
// Use async/await for asynchronous operations
router.post('/api/endpoint', asyncHandler(async (req, res) => {
  const result = await service.processData(req.body);
  res.json({ success: true, data: result });
}));

// Validate inputs
router.post('/api/endpoint',
  validateRequest({ body: schemas.requestSchema }),
  asyncHandler(async (req, res) => {
    // Handler implementation
  })
);
```

## 🐛 Common Issues & Solutions

### Extension Issues

**Issue**: Extension not loading
```bash
# Solution: Check manifest.json syntax
npm run lint
# Rebuild extension
npm run build
```

**Issue**: Content script not injecting
```javascript
// Check if URL matches manifest patterns
console.log('Current URL:', window.location.href);
// Verify in chrome://extensions/ → Details → Site access
```

**Issue**: Audio capture failing
```javascript
// Check permissions in manifest.json
"permissions": ["tabCapture", "activeTab"]

// Verify user gesture requirement
// Tab capture must be initiated from user action
```

### Server Issues

**Issue**: OpenAI API errors
```bash
# Check API key configuration
echo $OPENAI_API_KEY

# Verify API quota and billing
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/usage
```

**Issue**: WebSocket connection failing
```bash
# Check server logs
tail -f logs/app.log

# Test WebSocket endpoint
wscat -c ws://localhost:3000/ws
```

**Issue**: Audio processing errors
```bash
# Verify FFmpeg installation
ffmpeg -version

# Check audio file format
file audio.webm
```

## 🚀 Performance Optimization

### Extension Optimization
- Minimize background script memory usage
- Use efficient DOM manipulation
- Implement proper cleanup in content scripts
- Optimize bundle size with code splitting

### Server Optimization
- Use streaming for large audio files
- Implement request caching
- Optimize database queries
- Use connection pooling

### Audio Processing
- Process audio in chunks
- Use appropriate sample rates
- Implement audio compression
- Cache processed audio

## 📚 Learning Resources

### Chrome Extension Development
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

### React & TypeScript
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Node.js & Express
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [WebSocket Documentation](https://github.com/websockets/ws)

### OpenAI API
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Whisper API Guide](https://platform.openai.com/docs/guides/speech-to-text)
- [GPT API Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)

## 🤝 Contributing

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

### Code Review Guidelines
- Follow the established code style
- Include comprehensive tests
- Update relevant documentation
- Ensure backward compatibility
- Consider performance implications

### Issue Reporting
When reporting issues, include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Chrome version, etc.)
- Console logs and error messages
- Screenshots if applicable
