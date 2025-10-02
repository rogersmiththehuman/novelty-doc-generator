# Development Guide

## Quick Start

1. **Prerequisites**
   - Node.js 18+
   - MongoDB running locally
   - Git

2. **Setup**
   ```bash
   git clone <repo-url>
   cd novelty-doc-generator
   npm run install:all
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   npm run dev
   ```

3. **Access**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/health

## Database Setup

### MongoDB
```bash
# Start MongoDB
mongod

# Create database (automatic on first connection)
# Database: novelty-docs
```

### Sample Data
```javascript
// Create a sample template
db.documenttemplates.insertOne({
  name: "Sample Driver License",
  category: "license",
  templateImage: "/templates/sample-license.png",
  fields: [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      required: true,
      position: { x: 150, y: 200, width: 200, height: 25 }
    },
    {
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date", 
      required: true,
      position: { x: 150, y: 250, width: 150, height: 25 }
    }
  ],
  pricing: { btc: 50000, xmr: 1000000000000 },
  isActive: true,
  popularity: 0
});
```

## API Testing

### Authentication Flow
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "TestPass123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Use returned token for authenticated requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```

### Payment Testing
```bash
# Fund wallet (testing only)
curl -X POST http://localhost:5000/api/payments/fund \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cryptocurrency": "bitcoin",
    "amount": 100000
  }'

# Create payment
curl -X POST http://localhost:5000/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "TEMPLATE_ID",
    "cryptocurrency": "bitcoin"
  }'
```

## Frontend Development

### Component Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Route components  
├── contexts/      # React Context providers
├── services/      # API calls
└── utils/         # Helper functions
```

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.js`
3. Add navigation in `Navbar.js` if needed

### State Management
- Authentication: `AuthContext`
- API calls: `services/api.js`
- Local state: React hooks

## Backend Development

### Adding New Routes
1. Create route file in `routes/`
2. Add controller logic
3. Import and use in `server.js`
4. Add validation middleware

### Database Models
- User: Authentication and wallet info
- DocumentTemplate: Template definitions
- Transaction: Payment records  
- GeneratedDocument: Document metadata

### Services
- `cryptoService`: Cryptocurrency operations
- `documentGenerator`: PDF/image generation

## Security Considerations

### Rate Limiting
- General: 100 requests/15min
- Auth: 5 requests/15min  
- Payments: 3 requests/min
- Documents: 2 requests/min

### Input Validation
All endpoints use express-validator for input sanitization and validation.

### Encryption
Sensitive data like private keys are encrypted using AES-256-CBC.

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests  
```bash
cd frontend
npm test
```

### Manual Testing
1. Register new user
2. Fund wallet with test crypto
3. Browse templates
4. Create payment transaction
5. Generate document
6. Download document

## Deployment

### Environment Variables
Set all production values in backend/.env:
- Database URLs
- JWT secrets
- Crypto wallet configurations
- File storage paths

### Build Process
```bash
# Build frontend
cd frontend && npm run build

# Start production server
cd backend && npm start
```

### Docker (Future)
Docker configuration not included but recommended for production deployment.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env

2. **Puppeteer Issues**  
   - Install required dependencies: `apt-get install -y gconf-service libasound2`
   - For headless environments, ensure proper configuration

3. **Crypto Wallet Errors**
   - Verify network configuration (testnet vs mainnet)
   - Check wallet addresses and keys

4. **CORS Errors**
   - Verify FRONTEND_URL in backend .env
   - Check proxy configuration in frontend

### Logging
- Backend: Console logs and Winston logger
- Frontend: Browser console and React DevTools

### Performance
- Use MongoDB indexes for queries
- Implement pagination for large datasets
- Cache document templates
- Optimize image generation settings

## Code Style

### Backend
- Use async/await for async operations
- Implement proper error handling
- Follow RESTful API conventions
- Use middleware for common functionality

### Frontend  
- Use functional components with hooks
- Implement proper error boundaries
- Follow Material-UI patterns
- Use semantic HTML elements

## Contributing

1. Fork repository
2. Create feature branch
3. Follow existing code patterns
4. Add tests for new features
5. Update documentation
6. Submit pull request