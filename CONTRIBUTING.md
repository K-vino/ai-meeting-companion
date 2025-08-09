# Contributing to AI Meeting Companion

Thank you for your interest in contributing to the AI Meeting Companion! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check if the issue already exists in our [issue tracker](https://github.com/yourusername/ai-meeting-companion/issues)
2. Use the latest version of the project
3. Provide detailed information about the problem

When creating an issue, include:
- **Clear title** describing the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment details** (OS, Chrome version, Node.js version)
- **Screenshots** or **error logs** if applicable
- **Minimal reproduction** if possible

### Suggesting Features

We welcome feature suggestions! Please:
1. Check existing feature requests first
2. Describe the problem your feature would solve
3. Explain how you envision the feature working
4. Consider the impact on existing functionality
5. Be open to discussion and iteration

### Code Contributions

#### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/ai-meeting-companion.git
   cd ai-meeting-companion
   ```

2. **Set up development environment**
   ```bash
   npm run install:all
   cp server/.env.example server/.env
   # Edit server/.env with your OpenAI API key
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Guidelines

**Code Style**
- Follow the existing code style and conventions
- Use TypeScript for type safety
- Write meaningful variable and function names
- Add comments for complex logic
- Follow the established project structure

**Testing**
- Write tests for new functionality
- Ensure all existing tests pass
- Aim for good test coverage
- Include both unit and integration tests

**Documentation**
- Update relevant documentation
- Add JSDoc comments for public APIs
- Update the README if needed
- Include examples for new features

#### Pull Request Process

1. **Ensure your code follows our guidelines**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

2. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what your PR does and why
   - Include screenshots for UI changes
   - Mark as draft if work is in progress

#### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(extension): add real-time sentiment analysis
fix(server): resolve WebSocket connection issues
docs(api): update transcription endpoint documentation
```

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Chrome browser
- OpenAI API key
- Git

### Local Development
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### Project Structure
```
ai-meeting-companion/
├── extension/          # Chrome extension (React + TypeScript)
├── server/            # Backend API (Express + TypeScript)
├── shared/            # Shared types and utilities
├── docs/              # Documentation
└── package.json       # Root workspace configuration
```

## 🧪 Testing

### Running Tests
```bash
# All tests
npm test

# Specific package
cd server && npm test
cd extension && npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Types
- **Unit tests**: Individual functions and components
- **Integration tests**: API endpoints and services
- **E2E tests**: Complete user workflows

### Writing Tests
```typescript
// Example unit test
describe('TranscriptionService', () => {
  it('should transcribe audio correctly', async () => {
    const service = new TranscriptionService();
    const result = await service.transcribeAudio(mockAudioBuffer, 'session-123');
    
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
```

## 📝 Documentation

### Types of Documentation
- **API Documentation**: REST endpoints and WebSocket messages
- **User Guide**: How to use the extension
- **Development Guide**: Setting up and contributing
- **Deployment Guide**: Production deployment

### Writing Documentation
- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up to date with code changes

## 🔒 Security

### Reporting Security Issues
Please report security vulnerabilities privately to [security@yourdomain.com](mailto:security@yourdomain.com). Do not create public issues for security problems.

### Security Guidelines
- Never commit API keys or secrets
- Validate all user inputs
- Use HTTPS in production
- Follow OWASP security practices
- Keep dependencies updated

## 📋 Code Review

### Review Process
1. All code changes require review
2. At least one maintainer approval needed
3. All tests must pass
4. Documentation must be updated
5. No merge conflicts

### Review Criteria
- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code clean and maintainable?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Testing**: Is the code adequately tested?

## 🎯 Areas for Contribution

### High Priority
- **Platform Support**: Additional meeting platform integrations
- **Audio Processing**: Improved audio quality and format support
- **AI Features**: Enhanced analysis capabilities
- **Performance**: Optimization and scalability improvements
- **Testing**: Increased test coverage

### Medium Priority
- **UI/UX**: Design improvements and accessibility
- **Documentation**: Comprehensive guides and examples
- **Internationalization**: Multi-language support
- **Mobile**: Mobile browser compatibility

### Good First Issues
Look for issues labeled `good first issue` or `help wanted` in our issue tracker. These are typically:
- Bug fixes with clear reproduction steps
- Documentation improvements
- Small feature additions
- Code cleanup tasks

## 🏆 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributors page
- Special thanks in documentation

## 📞 Getting Help

### Community Support
- **GitHub Discussions**: General questions and ideas
- **Issues**: Bug reports and feature requests
- **Discord**: Real-time chat (if available)

### Maintainer Contact
- Create an issue for project-related questions
- Email for security concerns
- Tag maintainers in discussions

## 📜 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Thank You

We appreciate all contributions, whether they're code, documentation, bug reports, or feature suggestions. Every contribution helps make the AI Meeting Companion better for everyone!

---

*This contributing guide is a living document. Please suggest improvements if you notice anything missing or unclear.*
