# SafeCommute AI - Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: SafeCommute AI transit management system"

# Add your remote repository
git remote add origin https://github.com/yourusername/safecommute-ai.git

# Push to GitHub
git push -u origin main
```

### 2. Environment Setup

Create a `.env` file for production:

```env
NODE_ENV=production
PORT=3001

# Database (use real MongoDB in production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safecommute

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=7d

# External APIs (optional)
TRANSIT_API_KEY=your-transit-api-key
WEATHER_API_KEY=your-weather-api-key
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 🌐 Deployment Options

### Option 1: Netlify (Frontend + Serverless Functions)

1. **Build the frontend:**
```bash
npm run build
```

2. **Deploy to Netlify:**
- Connect your GitHub repository to Netlify
- Set build command: `npm run build`
- Set publish directory: `dist`

### Option 2: Vercel (Full-Stack)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

### Option 3: Railway (Full-Stack with Database)

1. **Connect to Railway:**
- Go to railway.app
- Connect your GitHub repository
- Railway will auto-detect and deploy

### Option 4: Heroku (Full-Stack)

1. **Create Heroku app:**
```bash
heroku create safecommute-ai
```

2. **Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
# Add other environment variables
```

3. **Deploy:**
```bash
git push heroku main
```

### Option 5: Docker Deployment

1. **Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "server/index.js"]
```

2. **Build and run:**
```bash
docker build -t safecommute-ai .
docker run -p 3001:3001 safecommute-ai
```

## 🔧 Production Configuration

### Database Setup

For production, set up a real MongoDB instance:

1. **MongoDB Atlas (Recommended):**
   - Create account at mongodb.com
   - Create cluster
   - Get connection string
   - Update `MONGODB_URI` in environment

2. **Self-hosted MongoDB:**
   - Install MongoDB on your server
   - Configure security and backups
   - Update connection string

### Security Checklist

- [ ] Set strong JWT secret
- [ ] Configure CORS for your domain
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### Performance Optimization

1. **Enable compression:**
   - Already configured in the app
   
2. **Set up CDN:**
   - Use Cloudflare or similar for static assets
   
3. **Database optimization:**
   - Set up proper indexes
   - Configure connection pooling
   
4. **Monitoring:**
   - Set up application monitoring (New Relic, DataDog)
   - Configure log aggregation

## 📊 Monitoring and Maintenance

### Health Checks

The app includes a health check endpoint:
```
GET /health
```

### Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

### Backup Strategy

1. **Database backups:**
   - Set up automated MongoDB backups
   
2. **Code backups:**
   - Regular Git commits and pushes
   
3. **Environment backups:**
   - Secure storage of environment variables

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change PORT in environment variables
   
2. **Database connection:**
   - Check MongoDB connection string
   - Verify network access
   
3. **Build failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load balancer setup**
2. **Multiple server instances**
3. **Database clustering**
4. **Redis for session management**

### Vertical Scaling

1. **Increase server resources**
2. **Optimize database queries**
3. **Implement caching strategies**

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy SafeCommute AI

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to production
      run: |
        # Add your deployment commands here
```

This deployment guide provides multiple options for getting SafeCommute AI into production. Choose the option that best fits your infrastructure and requirements.