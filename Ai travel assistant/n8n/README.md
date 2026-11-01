# ⚡ TravelIQ n8n Workflow Automations

> Production-ready **n8n automation workflows** for autonomous customer support resolutions, post-booking travel advisory generation, and live delay compensation alerts.

---

## 🤖 Active AI Workflows (`n8n/workflows/`)

1. **AI Support Ticket Auto-Reply** (`workflows/traveliq-support-ai-automation.json`):
   - Triggers immediately when a traveler submits a support ticket (`POST /api/support`).
   - Analyzes customer sentiment, issue severity, and transit context.
   - Generates an empathetic resolution with relevant transit advice.
   - Posts the reply securely back into the ticket conversation (`POST /api/n8n/support-reply`).

2. **AI Booking Confirmation & Journey Briefing** (`workflows/traveliq-booking-ai-automation.json`):
   - Triggers when a user confirms a ticket booking (`POST /api/profile/bookings`).
   - Formats train number, source, destination, departure date, and passenger roster.
   - Generates an AI-curated travel advisory (weather forecast, delay risk insights, smart packing checklist, and station food tips).
   - Ingests the briefing back into the traveler's notifications (`POST /api/n8n/booking-notification`).

3. **Smart AI Delay & Refund Recovery Alert** (`workflows/traveliq-delay-refund-ai-automation.json`):
   - Triggers on live transit delay detection or schedule changes (`POST /api/n8n/delay-alert`).
   - Calculates updated arrival ETA, passenger compensation rights, and 100% TDR refund eligibility under IRCTC rules.
   - Delivers an actionable advisory with alternative transit options directly to the traveler.

---

## 🚀 How to Launch n8n

### Option 1: Quick Launch via npx (No Installation Required)
```bash
npx n8n
```
n8n will start locally at **`http://localhost:5678`**.

### Option 2: Docker Compose (Recommended for Production)
From the `n8n/` directory, run:
```bash
docker compose up -d
```

---

## 📥 How to Import Workflows into n8n

1. Open **`http://localhost:5678`** in your browser.
2. In n8n, click **Workflows** in the left sidebar ➔ Click **Add Workflow** (or **+**).
3. In the top right menu (`...`), click **Import from File**.
4. Select the JSON files from `n8n/workflows/`:
   - `traveliq-support-ai-automation.json`
   - `traveliq-booking-ai-automation.json`
   - `traveliq-delay-refund-ai-automation.json`
5. Click **Publish** / **Activate** (toggle in the top right to **Active**).

---

## 🔒 Security & Webhook Authentication

All inbound callbacks from n8n to TravelIQ (`/api/n8n/*`) are secured with a dedicated shared secret using constant-time comparison:

- **HTTP Header:** `x-traveliq-secret: <N8N_WEBHOOK_SECRET>`
- **Verification:** Verified via `crypto.timingSafeEqual` in `backend/controllers/n8nController.js`.
- **Diagnostic Protection:** `/api/n8n/status` and `/api/n8n/test` are restricted strictly to authenticated administrators via `adminProtect`.
- **Prompt Injection Containment:** All user inputs are sanitized and isolated inside `<untrusted_ticket_content>` tags to prevent jailbreak attacks.

### Configuration (`backend/.env`):
```env
# Base webhook URL
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook

# Webhook URLs
N8N_SUPPORT_WEBHOOK_URL=http://localhost:5678/webhook/traveliq-support
N8N_BOOKING_WEBHOOK_URL=http://localhost:5678/webhook/traveliq-booking
N8N_DELAY_WEBHOOK_URL=http://localhost:5678/webhook/traveliq-delay-alert

# Webhook secret token for authenticating callbacks (min 16 characters)
N8N_WEBHOOK_SECRET=your_n8n_webhook_secret_here
```

---

## 🛡️ Built-in Zero-Downtime AI Fallback

If n8n is offline or unreachable, TravelIQ's built-in **Node.js Fallback Engine & Google Gemini** will automatically synthesize the response, ensuring zero downtime for travelers.
