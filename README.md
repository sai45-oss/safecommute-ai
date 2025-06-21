# SafeCommute AI - Real-time Transportation Safety Dashboard

A comprehensive AI-powered transit management system that provides real-time vehicle tracking, crowd monitoring, safety alerts, and intelligent route optimization.

## 🚀 Features

- **Real-time Vehicle Tracking**: Live monitoring of buses, trains, and other transit vehicles
- **Crowd Monitoring**: AI-powered passenger density analysis and predictions
- **Safety Alerts**: Automated incident detection and emergency response coordination
- **Route Optimization**: Smart route planning with crowd-aware suggestions
- **Voice Commands**: Hands-free interaction with natural language processing
- **Multi-language Support**: Available in English, Spanish, French, and German

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **MongoDB** with Mongoose (production) / Mock data (development)
- **JWT** authentication
- **Winston** logging

### Key Libraries
- **Joi** for validation
- **Helmet** for security
- **Compression** for performance
- **Rate limiting** for API protection

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (for production)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd safecommute-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development servers**
```bash
npm run dev
```

This starts both the frontend (port 5173) and backend (port 3001) concurrently.

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (optional for development)
MONGODB_URI=mongodb://localhost:27017/safecommute

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# External APIs (optional)
TRANSIT_API_KEY=your-transit-api-key
WEATHER_API_KEY=your-weather-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📱 Usage

### Dashboard Navigation
- **Overview**: Live transit map with vehicle tracking
- **Crowd Monitor**: Real-time passenger density analysis
- **Safety Alerts**: Active incidents and emergency management
- **Route Optimizer**: AI-powered route planning
- **Voice Commands**: Hands-free system interaction

### API Endpoints

#### Vehicles
- `GET /api/v1/vehicles` - List all vehicles
- `GET /api/v1/vehicles/nearby` - Find vehicles near location
- `POST /api/v1/vehicles` - Create/update vehicle data

#### Crowd Monitoring
- `GET /api/v1/crowd` - Get crowd data
- `GET /api/v1/crowd/nearby` - Find crowd data near location
- `POST /api/v1/crowd` - Submit crowd measurements

#### Safety Alerts
- `GET /api/v1/alerts` - List safety alerts
- `POST /api/v1/alerts` - Create new alert
- `PATCH /api/v1/alerts/:id/status` - Update alert status

#### Analytics
- `GET /api/v1/analytics/overview` - System overview
- `GET /api/v1/analytics/routes` - Route performance
- `GET /api/v1/analytics/predictions` - AI predictions

## 🏗️ Architecture

### Mock Data System
The application includes a sophisticated mock data system for development and demonstration:

- **Automatic Detection**: Switches between mock and real database based on environment
- **Real-time Simulation**: Continuously updates vehicle positions and crowd levels
- **Realistic Patterns**: Simulates rush hour traffic, crowd patterns, and incidents
- **No External Dependencies**: Works completely offline

### Real-time Features
- **WebSocket Communication**: Live updates via Socket.IO
- **Background Services**: Automated data updates and cleanup
- **Event Broadcasting**: Real-time alerts and notifications

### Security
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive request validation with Joi
- **Security Headers**: Helmet.js for security best practices
- **Authentication**: JWT-based user authentication

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Setup for Production
- Set `NODE_ENV=production`
- Configure real MongoDB connection
- Set up proper JWT secrets
- Configure external API keys
- Set up logging and monitoring

## 🧪 Development

### Project Structure
```
safecommute-ai/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   └── main.tsx           # Application entry point
├── server/                # Backend Node.js application
│   ├── config/            # Database and configuration
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── utils/             # Utility functions
├── docs/                  # Documentation
└── logs/                  # Application logs
```

### Adding New Features
1. **Frontend Components**: Add to `src/components/`
2. **API Routes**: Add to `server/routes/`
3. **Data Models**: Add to `server/models/`
4. **Background Services**: Add to `server/services/`

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive error management

## 🔧 API Documentation

### Authentication
Most endpoints require JWT authentication:
```bash
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "pagination": {...}  // For paginated responses
}
```

### Error Handling
Error responses include:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Detailed validation errors
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the mock data explanation in `docs/MOCK_DATA_EXPLANATION.md`

## 🔮 Future Enhancements

- **Machine Learning**: Advanced crowd prediction models
- **IoT Integration**: Real sensor data integration
- **Mobile Apps**: Native iOS and Android applications
- **Advanced Analytics**: Predictive maintenance and optimization
- **Multi-city Support**: Scalable multi-region deployment