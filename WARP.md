# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview

- Monorepo layout with a Node/Express backend (MongoDB/Mongoose) and a React (CRA) frontend.
- Cryptocurrency-themed flows are mocked for local development; production integrations must replace stubs in backend/services/cryptoService.js.

Prerequisites

- Node.js >= 18
- MongoDB running locally (or set MONGODB_URI)

Environment configuration

- Backend: copy backend/.env.example to backend/.env and set values as needed (JWT_SECRET, MONGODB_URI, crypto settings, etc.).
- Frontend: optionally set REACT_APP_API_URL to point to the backend (defaults to http://localhost:5000/api).

Common commands

- Install all dependencies
  - npm install
  - npm run backend:install
  - npm run frontend:install
  - Or one-shot: npm run install:all

- Development
  - Run both servers (concurrently): npm run dev
  - Backend only (http://localhost:5000): npm run backend:dev
  - Frontend only (http://localhost:3000): npm run frontend:dev

- Build
  - Frontend production build: npm run build (runs in frontend/)

- Tests
  - Backend tests (Jest):
    - cd backend && npm test
    - Single test by name pattern: cd backend && npm test -- -t "pattern"
  - Frontend tests (CRA/Jest):
    - cd frontend && npm test
    - Single test by name pattern: cd frontend && npm test -- -t "App"
    - Non-interactive one-off (useful in CI): cd frontend && CI=true npm test -- -t "App"

- Start (production-ish)
  - Backend only: npm start (runs node backend/server.js)
  - Note: serving the built frontend is not wired into the backend; deploy frontend build/ separately or add static hosting in backend if needed.

Ports and URLs

- Backend default port: 5000 (configurable via PORT in backend/.env)
- Frontend default port: 3000
- CORS is restricted to FRONTEND_URL (default http://localhost:3000)

High-level architecture

Backend (Node/Express + MongoDB)

- Entry point: backend/server.js
  - Security: helmet, CORS configured via FRONTEND_URL, global rate limiting (100 req/15 min)
  - Body parsing: JSON (10mb) and URL-encoded
  - MongoDB connection via mongoose (MONGODB_URI)
  - Routes mounted under /api:
    - /auth (backend/routes/auth.js): register/login/me; registration generates per-user Bitcoin/Monero wallets
    - /users (backend/routes/users.js): profile CRUD, wallet balances, transaction and document listings
    - /templates (backend/routes/templates.js): list/get categories; create (auth) and popularity updates
    - /payments (backend/routes/payments.js): create/process transactions, query status, price lookup, test funding
    - /documents (backend/routes/documents.js): generate, preview, download, detail
  - Health: GET /health
  - Central error handler and 404 fallback

- Auth middleware: backend/middleware/auth.js
  - Expects Authorization: Bearer <JWT>
  - Verifies JWT against JWT_SECRET; attaches req.user (excluding password and sensitive wallet keys)
  - Token generation via generateToken(userId), honors JWT_EXPIRE

- Data models (Mongoose):
  - User (backend/models/User.js)
    - Credentials, profile, wallets: bitcoin {address, encrypted privateKey, balance}, monero {address, encrypted viewKey, balance}
    - Derived methods: comparePassword, toJSON removes sensitive fields
  - DocumentTemplate (backend/models/DocumentTemplate.js)
    - Template metadata (name, category, description), templateImage path, positional field specs, pricing {btc, xmr}, popularity, isActive
  - Transaction (backend/models/Transaction.js)
    - Links user + template; cryptocurrency (bitcoin|monero), amount, status, txHash, confirmations, expiry (30 min), indices for common queries
    - isExpired() returns true when pending and past expiresAt
  - GeneratedDocument (backend/models/GeneratedDocument.js)
    - Links user + template + transaction; formData (Map), generatedFiles {pdf, image}, status, expiry (30 days), download stats; isExpired()

- Services:
  - cryptoService (backend/services/cryptoService.js)
    - Wallet generation: Bitcoin via bitcoinjs-lib; Monero stub (mock address/viewKey)
    - Transaction verification: mocked responses for BTC/XMR checks
    - Master wallet transfers: mocked send for BTC/XMR
    - Symmetric encryption helpers for storing secrets (uses JWT_SECRET-derived key)
  - documentGenerator (backend/services/documentGenerator.js)
    - Generates HTML overlays onto templateImage based on field positions
    - Produces both PDF (page.pdf) and PNG (page.screenshot) via Puppeteer
    - Ensures outputs under uploads/generated
    - validateFormData(template, Map) for field-level validation; cleanupExpiredDocuments() for timed cleanup

- Request flow summary:
  1) Auth: POST /api/auth/register creates user + wallets; POST /api/auth/login returns JWT
  2) Templates: client fetches /api/templates and selects a template
  3) Payment: POST /api/payments/create to reserve payment; POST /api/payments/:id/process to confirm (mock verification + balances)
  4) Document: POST /api/documents/generate with transactionId + formData to produce files; GET download/preview endpoints for retrieval

Frontend (React + CRA + MUI)

- Entry: frontend/src/index.js
- App shell: frontend/src/App.js
  - Router routes (BrowserRouter):
    - /, /login, /register (public)
    - /dashboard, /templates, /templates/:templateId/form, /payment/:transactionId, /downloads (protected)
  - AuthContext (frontend/src/contexts/AuthContext.js) manages JWT token, current user, login/register/logout
  - Theme via @mui/material ThemeProvider

- API client: frontend/src/services/api.js
  - axios instance to REACT_APP_API_URL (default http://localhost:5000/api)
  - setAuthToken(token) applies Authorization header
  - 401 handler clears token and redirects to /login

- Tests: CRA/Jest/RTL (e.g., frontend/src/App.test.js)

Templates and assets

- Template backgrounds live under templates/ and are referenced by template.templateImage
- Template field positioning controls rendered overlay in documentGenerator; changes affect both PDF and PNG generation

Notable operational notes

- Puppeteer launches with --no-sandbox flags (useful in CI/containers). Chromium is downloaded/managed by puppeteer.
- uploads/ and uploads/generated directories are created at runtime if missing (ensure write access in your environment).
- CORS must allow the frontend origin; adjust FRONTEND_URL in backend/.env when running from non-default hosts/ports.
