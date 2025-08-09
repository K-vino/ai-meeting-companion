# Deployment Guide

This guide covers deploying the AI Meeting Companion to production environments.

## 🏗️ Production Architecture

### Recommended Infrastructure
- **Application Server**: Node.js 18+ with PM2 process manager
- **Reverse Proxy**: Nginx for SSL termination and load balancing
- **Database**: PostgreSQL for session storage (optional)
- **Cache**: Redis for session management and rate limiting
- **Monitoring**: Prometheus + Grafana for metrics
- **Logging**: ELK stack or similar centralized logging

## 🚀 Server Deployment

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/yourusername/ai-meeting-companion.git
cd ai-meeting-companion

# Install dependencies
npm run install:all

# Build all packages
npm run build
```

### 2. Environment Configuration

Create production environment file:

```bash
cp server/.env.example server/.env.production
```

Configure production variables:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# OpenAI Configuration
OPENAI_API_KEY=your_production_openai_key
OPENAI_MODEL=gpt-4
OPENAI_WHISPER_MODEL=whisper-1

# Security
JWT_SECRET=your_secure_jwt_secret_here
CORS_ORIGIN=https://yourdomain.com,chrome-extension://*

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/ai_meeting_companion

# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/ai-meeting-companion/app.log

# SSL/TLS
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem
```

### 3. Process Management with PM2

Install PM2:
```bash
npm install -g pm2
```

Create PM2 ecosystem file:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-meeting-companion',
    script: './server/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/ai-meeting-companion/error.log',
    out_file: '/var/log/ai-meeting-companion/out.log',
    log_file: '/var/log/ai-meeting-companion/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/ai-meeting-companion
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/transcription {
        limit_req zone=upload burst=5 nodelay;
        proxy_pass http://localhost:3000;
        # ... same proxy settings as above
        
        # Increase timeouts for file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Increase body size for audio files
        client_max_body_size 50M;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_buffering off;
        proxy_cache off;
    }

    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ai-meeting-companion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Chrome Extension Deployment

### 1. Build for Production

```bash
cd extension
npm run build
```

### 2. Chrome Web Store Submission

1. **Prepare Extension Package**:
   ```bash
   cd extension/dist
   zip -r ai-meeting-companion.zip .
   ```

2. **Update Manifest**:
   - Update `host_permissions` to include your production domain
   - Set appropriate `content_security_policy`
   - Update extension description and version

3. **Submit to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Upload the zip file
   - Fill in store listing details
   - Submit for review

### 3. Enterprise Deployment

For enterprise environments, you can deploy via:

- **Group Policy**: Deploy through Active Directory
- **Chrome Enterprise**: Use Chrome Browser Cloud Management
- **Manual Installation**: Distribute the unpacked extension

## 📊 Monitoring & Observability

### 1. Health Checks

Set up monitoring for:
- `/health` endpoint
- WebSocket connectivity
- OpenAI API availability
- Database connectivity (if used)

### 2. Metrics Collection

Key metrics to monitor:
- Request rate and response times
- WebSocket connection count
- Transcription success rate
- Error rates by endpoint
- Memory and CPU usage

### 3. Logging

Configure structured logging:
```javascript
// Production logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 4. Alerting

Set up alerts for:
- High error rates
- API quota exhaustion
- Server downtime
- Memory/disk usage thresholds

## 🔒 Security Considerations

### 1. API Security
- Use HTTPS everywhere
- Implement proper CORS policies
- Rate limit all endpoints
- Validate all inputs
- Sanitize file uploads

### 2. Data Protection
- Encrypt sensitive data at rest
- Use secure session management
- Implement proper access controls
- Regular security audits

### 3. OpenAI API Security
- Rotate API keys regularly
- Monitor API usage and costs
- Implement usage quotas
- Log API interactions for audit

## 🔄 Backup & Recovery

### 1. Database Backups
```bash
# PostgreSQL backup
pg_dump ai_meeting_companion > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Configuration Backups
- Environment files
- Nginx configuration
- PM2 ecosystem files
- SSL certificates

### 3. Disaster Recovery
- Document recovery procedures
- Test backup restoration
- Maintain infrastructure as code
- Keep offsite backups

## 📈 Scaling Considerations

### 1. Horizontal Scaling
- Use load balancers
- Implement session affinity for WebSockets
- Scale database connections
- Consider microservices architecture

### 2. Performance Optimization
- Enable gzip compression
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

### 3. Cost Management
- Monitor OpenAI API usage
- Implement usage quotas
- Optimize audio processing
- Use efficient data storage
