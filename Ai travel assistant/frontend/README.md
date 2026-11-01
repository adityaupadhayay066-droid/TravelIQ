# 💻 TravelIQ Frontend Client SPA

> Modern, accessible, high-performance single-page application for Indian transit, multi-modal search, and intelligent booking management. Built with **React 19**, **Vite**, and **Tailwind CSS v4**.

---

## 🚀 Technology Stack

- **Framework:** [React 19](https://react.dev/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with CSS custom properties
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Data Visualizations:** [Recharts](https://recharts.org/) & [Leaflet](https://leafletjs.com/)
- **Security:** In-memory + HTTP-only cookie JWT auth, WebAuthn Passkeys (`@simplewebauthn/browser`), and Client Shield entropy generation.

---

## 📁 Frontend Directory Architecture

```
frontend/
├── index.html                  # HTML5 entry with security metadata
├── vite.config.js              # Vite bundling & proxy configuration
├── package.json
└── src/
    ├── main.jsx                # Application root mounting point
    ├── App.jsx                 # Routing configuration & layout wrappers
    ├── index.css               # Global Tailwind CSS styles & design tokens
    ├── components/             # Reusable UI components
    │   ├── Navbar.jsx          # Dynamic navigation bar with active session state
    │   ├── Footer.jsx          # Comprehensive site footer
    │   ├── PassengerSelector.jsx # Accessible passenger class & count dropdown
    │   ├── PaymentModal.jsx    # Razorpay checkout & card simulation
    │   ├── ChatBot.jsx         # Gemini-grounded AI travel assistant drawer
    │   ├── VoiceSearch.jsx     # Web Speech voice navigation widget
    │   ├── AuthModal.jsx       # Login, register, 2FA OTP & Passkey modal
    │   └── TravelBudgetPlanner.jsx # Interactive travel cost calculator
    ├── pages/                  # Top-level view routes
    │   ├── LandingPage.jsx     # Hero search panel, destination discovery, stats
    │   ├── SearchResults.jsx   # Direct & connecting rail/flight/bus schedules
    │   ├── LiveTrackingPage.jsx # Train live status & timetable telemetry
    │   ├── HotelsPage.jsx      # Verified hotel & hostel accommodations
    │   ├── MyTripsPage.jsx     # Active bookings, ticket downloads, cancellations
    │   ├── ProfilePage.jsx     # User settings, security controls, avatar upload
    │   ├── DeveloperPortal.jsx # B2B API Key generation, usage charts, billing
    │   └── admin/              # Administrator operations dashboard
    │       ├── AdminDashboard.jsx
    │       ├── AdminUsers.jsx
    │       ├── AdminTrains.jsx
    │       ├── AdminBookings.jsx
    │       ├── AdminReports.jsx
    │       └── AdminSecurity.jsx
    ├── context/                # Global React contexts
    │   ├── AuthContext.jsx     # User authentication, token lifecycle, Passkeys
    │   └── ThemeContext.jsx    # Dark / Light theme persistence
    └── utils/                  # Utility helpers & API client
        └── api.js              # Axios instance with Client Shield telemetry headers
```

---

## 🛡️ Client Shield Anti-Scraping Integration

All outbound HTTP calls automatically include a cryptographically strong client shield token generated via the browser's native Web Crypto API:

```javascript
import { generateClientShieldToken } from '../utils/api';

// Generates 32 hex chars with 128 bits of cryptographic entropy:
const token = generateClientShieldToken();
// Transmitted in the 'X-Client-Shield' request header
```

This prevents automated bot scraping of real-time train timetables while maintaining a zero-friction experience for genuine travelers.

---

## 🏃 Running the Frontend

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:5173`**.

### 3. Build for Production
```bash
npm run build
```
Generates optimized, minified production assets in the `dist/` folder.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🔗 Environment Configuration

Create a `.env` file in `frontend/` if connecting to a custom backend host:

```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:8000
```
*(By default, requests are routed to the local Express backend at `http://localhost:5000` via Vite's proxy).*
