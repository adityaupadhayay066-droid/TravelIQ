# ⚙️ TravelIQ Backend API Server

> Enterprise-grade Node.js / Express backend with MySQL & Sequelize ORM powering real-time transit routing, Razorpay payments, FIDO2/WebAuthn authentication, B2B developer API governance, and grounded AI concierges.

---

## 🛠️ Technology Stack

- **Runtime:** [Node.js](https://nodejs.org/) (v20+)
- **Framework:** [Express.js](https://expressjs.com/) (v5)
- **Database & ORM:** [MySQL](https://www.mysql.com/) with [Sequelize](https://sequelize.org/)
- **Authentication:** JWT (Access & Refresh rotation), [SimpleWebAuthn](https://simplewebauthn.dev/) for Passkeys, bcryptjs
- **Payment Processing:** [Razorpay](https://razorpay.com/) (HMAC-SHA256 signature verification)
- **Security & Headers:** [Helmet](https://helmetjs.github.io/), CORS, express-rate-limit, nosniff, CSP
- **AI Integration:** Google Gemini API (`gemini-3.5-flash-lite`, `gemini-3.8-flash`) & Python FastAPI microservice
- **Automation:** n8n Webhook Integration with prompt injection containment

---

## 📁 Backend Directory Architecture

```
backend/
├── config/                     # Database credentials & security policy settings
├── controllers/                # Business logic controllers
│   ├── authController.js       # Login, register, 2FA, Passkeys, session refresh
│   ├── paymentController.js    # Order creation, transactions, raw webhook verification, receipts
│   ├── profileController.js    # User profiles, avatar uploads, bookings, cancellations
│   ├── travelController.js     # Direct & connecting route searches, live train status
│   ├── chatbotController.js    # Gemini grounded responses, knowledge base management
│   ├── hotelController.js      # Accommodations, KYC verification, reservations
│   ├── adminController.js      # User management, audit logs, dataset imports, CSV export
│   └── apiKeyController.js     # B2B developer platform, key creation, usage meters
├── middleware/                 # Request interceptors & guards
│   ├── authMiddleware.js       # protect, adminProtect, requireAdminRole, algorithm pinning
│   ├── antiScrapingMiddleware.js # Client Shield entropy token verification & crawler traps
│   ├── rateLimiter.js          # Tiered rate limits (login, api, payment, ai, profile)
│   ├── uploadMiddleware.js     # Safe avatar uploads with extension & MIME whitelisting
│   └── apiKeyMiddleware.js     # B2B API key authentication & monthly quota enforcement
├── models/                     # Sequelize database schemas
│   ├── User.js, Booking.js, Train.js, Station.js, TrainSchedule.js, TrainFare.js,
│   ├── Transaction.js, Session.js, RefreshToken.js, ApiKey.js, Organization.js, etc.
├── routes/                     # REST endpoint route mappers
├── seeders/                    # Automatic seeders (Admin, Stations, Trains, Fares, Stays)
├── services/                   # Core computational services
│   ├── deterministicRoutingService.js # Grounded routing & Gemini prompt synthesis
│   ├── multiModalRoutingEngine.js    # Universal Hub Index & 2-leg transfer discovery
│   ├── stationResolver.js            # Fuzzy Levenshtein & City Cluster matching
│   └── n8nService.js                 # Outbound webhook delivery & prompt isolation
├── tests/                      # 22 automated test suites (100% Passing)
└── server.js                   # Application bootstrap, sync, and graceful shutdown
```

---

## 🛡️ Security Architecture & Protections

1. **Cross-Request Auth Isolation:** Explicitly resets `req.user`, `req.sessionId`, and auth parameters on every request.
2. **Payment Amount & Replay Defense:**
   - Authoritative booking fare verification (client cannot alter transaction amount).
   - Raw-body HMAC-SHA256 signature verification preventing webhook replays or spoofing.
   - Idempotent event processing and single-refund locking.
3. **Session Reuse Detection:**
   - Refresh tokens are rotated upon use.
   - If an already-revoked refresh token is replayed, all active sessions for that user are immediately terminated.
4. **Client Shield Anti-Scraping:**
   - Validates client-side high-entropy tokens on `/api/*` endpoints.
   - Includes honeypot crawler traps (`/api/scrapers/crawler-trap`) to auto-blacklist aggressive bots.
5. **SQL Injection Defense (CWE-89):**
   - All dynamic `ORDER BY` clauses across user, booking, and report queries are strictly whitelisted.
6. **CSV Formula Injection Defense (CWE-1236):**
   - Exported CSV cells starting with `=, +, -, @, \t, \r` are neutralized with prepended `'`.
7. **Safe File Uploads:**
   - Mimetypes and extensions (`.jpg`, `.jpeg`, `.png`, `.webp`) are dual-verified.
   - Avatar cleanup uses path boundary checks to prevent arbitrary file deletion.

---

## 🧪 Comprehensive Automated Test Suites

Run all 22 test suites with:
```bash
npm test
```

### Verified Test Suites:
1. `authIsolationRegression.test.js` — Cross-request auth leakage & session isolation (6 tests)
2. `paymentVerification.test.js` — Forged payments, amount manipulation, signature checks (8 tests)
3. `bookingCreationRegression.test.js` — Fare binding, atomic rollbacks, travel class mapping (12 tests)
4. `paymentIntegrityRegression.test.js` — Replay attacks, raw-body HMAC, concurrency locks (13 tests)
5. `shieldRegression.test.js` — Anti-scraping token entropy, replay rejection, loopback handling (14 tests)
6. `sessionRevocationRegression.test.js` — Token rotation, reuse detection, instant session revocation (4 tests)
7. `checkoutContractRegression.test.js` — Contract adherence, PII isolation, order creation (5 tests)
8. `roleHierarchy.test.js` — Super Admin vs Admin vs Data Manager privilege boundaries
9. `mfaPasskeyHardening.test.js` — WebAuthn challenge verification & 2FA limits (8 tests)
10. `privateAttachments.test.js` — IDOR protection on support attachments & nosniff headers
11. `massAssignmentAndErrors.test.js` — Input sanitization & generic error disclosure
12. `hotelReservationIntegrity.test.js` — Stay pricing calculations & KYC protections (10 tests)
13. `n8nPromptInjection.test.js` — System instruction isolation & prompt injection containment
14. `securityHardening.test.js` — Password breach checks, lockout policies, CSP (15 tests)
15. `securityAndFareRegression.test.js` — Authoritative train fares & route validation
16. `routeValidation.test.js` — Sequence ordering & transit date constraints
17. `antiHallucinationRegression.test.js` — Zero generative hallucination verification
18. `zeroGenerativeRouting.test.js` — XML grounding and deterministic chatbot formatting (17 tests)
19. `multiModalRoutingEngine.test.js` — Universal Hub corridor queries & connection windows (13 tests)
20. `integration.test.js` — Full stack component integration (14 tests)
21. `cybersecurityExpertHardening.test.js` — JWT algorithm pinning, CSV escaping, upload bounds (10 tests)
22. `e2eVerification.test.js` — End-to-end journey verification

---

## 🏃 Getting Started

### 1. Database Setup
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE traveliq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Environment Variables
Create a `.env` file in `backend/`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=traveliq
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_32_chars
INTERNAL_SERVICE_KEY=your_internal_service_key_for_ai_microservice

GEMINI_API_KEY=your_google_ai_studio_gemini_api_key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
N8N_WEBHOOK_SECRET=your_n8n_webhook_secret_min_16_chars
```

### 3. Launch Server
```bash
npm install
npm run dev
```
The server will synchronize MySQL tables, automatically run seeders, and begin listening on **`http://localhost:5000`**.

