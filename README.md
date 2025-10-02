# Novelty Document Generator

A web application that allows users to generate customizable novelty documents with cryptocurrency payments. Users can choose from various document templates (licenses, utility bills, certificates, etc.), fill in their information, and pay using Bitcoin or Monero to generate personalized documents in PDF and image formats.

## ⚠️ Disclaimer

This application is designed for novelty and entertainment purposes only. Generated documents should not be used for fraudulent purposes, identity theft, or any illegal activities. Users are responsible for ensuring their use complies with applicable laws and regulations.

## Features

- **Document Templates**: Multiple template categories including licenses, bills, certificates, and identification documents
- **Customizable Forms**: Dynamic form generation based on template fields
- **Cryptocurrency Payments**: Secure payments using Bitcoin and Monero
- **Document Generation**: High-quality PDF and PNG output using Puppeteer
- **User Accounts**: Wallet management and transaction history
- **Security**: Rate limiting, input validation, and encrypted sensitive data
- **Auto-cleanup**: Documents automatically expire and are removed after 30 days

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Puppeteer** for PDF/image generation
- **BitcoinJS** and **Monero-JavaScript** for cryptocurrency integration
- **Helmet** and **Express-Rate-Limit** for security

### Frontend
- **React** with React Router
- **Material-UI** for components
- **Axios** for API calls
- **Context API** for state management

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd novelty-doc-generator
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   npm run backend:install
   ```

4. **Install frontend dependencies**
   ```bash
   npm run frontend:install
   ```

5. **Environment Setup**
   
   Copy the backend environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/novelty-docs
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key
   
   # Bitcoin Configuration (testnet recommended for development)
   BITCOIN_NETWORK=testnet
   BITCOIN_MASTER_PRIVATE_KEY=your-bitcoin-master-private-key
   BITCOIN_MASTER_ADDRESS=your-bitcoin-master-address
   
   # Monero Configuration
   MONERO_DAEMON_URI=http://localhost:18081
   MONERO_WALLET_URI=http://localhost:18083
   MONERO_MASTER_ADDRESS=your-monero-master-address
   
   # Pricing (in smallest units: satoshis for BTC, atomic units for XMR)
   DOCUMENT_PRICE_BTC=50000
   DOCUMENT_PRICE_XMR=1000000000000
   ```

6. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

7. **Run the application**
   
   For development (runs both backend and frontend):
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Backend (http://localhost:5000)
   npm run backend:dev
   
   # Frontend (http://localhost:3000)
   npm run frontend:dev
   ```

## Project Structure

```
novelty-doc-generator/
├── backend/                 # Express.js API
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication & validation
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── server.js          # Entry point
├── frontend/               # React application
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # Reusable components
│       ├── contexts/      # React contexts
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── utils/         # Utility functions
├── templates/             # Document templates
├── docs/                  # Documentation
└── package.json          # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Templates
- `GET /api/templates` - List document templates
- `GET /api/templates/:id` - Get template details
- `GET /api/templates/meta/categories` - Get categories

### Payments
- `POST /api/payments/create` - Create payment transaction
- `POST /api/payments/:id/process` - Process payment
- `GET /api/payments/:id` - Get transaction status
- `POST /api/payments/fund` - Fund wallet (testing only)

### Documents
- `POST /api/documents/generate` - Generate document
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download/:format` - Download document
- `GET /api/documents/:id/preview` - Preview document

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/transactions` - Transaction history
- `GET /api/users/documents` - Generated documents
- `GET /api/users/wallet/balances` - Wallet balances

## Security Features

- **Rate Limiting**: Different limits for auth, payments, and document generation
- **Input Validation**: Comprehensive validation using express-validator
- **Security Headers**: Helmet.js with custom security policies
- **Encrypted Storage**: Sensitive data like private keys are encrypted
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured for specific origins

## Development

### Adding New Document Templates

1. Create template image in `templates/` directory
2. Add template document to MongoDB:
   ```javascript
   {
     name: "Template Name",
     category: "license|bill|certificate|identification|other",
     templateImage: "/path/to/template.png",
     fields: [
       {
         name: "fullName",
         label: "Full Name",
         type: "text",
         required: true,
         position: { x: 100, y: 200, width: 200, height: 25 }
       }
     ],
     pricing: { btc: 50000, xmr: 1000000000000 }
   }
   ```

### Testing Payments

The application includes mock payment functionality for development. In production, you'll need to integrate with actual Bitcoin and Monero nodes.

### Environment Variables

See `backend/.env.example` for all available configuration options.

## Deployment

### Production Considerations

1. **Use HTTPS** - Required for secure cryptocurrency operations
2. **Environment Variables** - Set all production values
3. **Database Security** - Use MongoDB Atlas or secured instance
4. **Cryptocurrency Integration** - Set up actual nodes and wallets
5. **File Storage** - Consider using cloud storage for generated documents
6. **Monitoring** - Implement logging and error tracking

### Docker Support

(Docker configuration not included in this initial version but recommended for production)

## Legal Compliance

- Ensure compliance with local laws regarding document generation
- Implement proper KYC/AML procedures if required
- Consider geographic restrictions based on local regulations
- Maintain proper records for tax and regulatory purposes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support or questions, please create an issue in the repository.

---

**Remember**: This application generates novelty documents for entertainment purposes only. Always comply with applicable laws and regulations.