# TravelIQ n8n Workflow Automations

This directory contains pre-configured, production-ready **n8n automation workflows** for TravelIQ.

---

## ⚡ Active AI Workflows (`n8n/workflows/`)

1. **AI Support Ticket Auto-Reply** ([traveliq-support-ai-automation.json](file:///d:/Ai%20travel%20assiatant/n8n/workflows/traveliq-support-ai-automation.json)):
   - Triggers immediately whenever a traveler submits a support ticket (`POST /api/support`).
   - Analyzes customer sentiment, context, and category.
   - Generates an intelligent, empathetic solution with live transit tips.
   - Automatically posts the reply back into the ticket conversation and updates ticket status.

2. **AI Booking Confirmation & Journey Briefing** ([traveliq-booking-ai-automation.json](file:///d:/Ai%20travel%20assiatant/n8n/workflows/traveliq-booking-ai-automation.json)):
   - Triggers whenever a user confirms a ticket booking (`POST /api/profile/bookings`).
   - Formats train number, source, destination, departure date, and passengers.
   - Generates an AI-curated travel advisory (weather forecast, delay risk insights, smart packing checklist, and station food tips).
   - Delivers the briefing back to the traveler's dashboard and notification bell.

3. **Smart AI Delay & Refund Recovery Alert** ([traveliq-delay-refund-ai-automation.json](file:///d:/Ai%20travel%20assiatant/n8n/workflows/traveliq-delay-refund-ai-automation.json)):
   - Triggers on live transit delay detection or schedule changes (`POST /api/n8n/delay-alert`).
   - Calculates updated arrival ETA, passenger compensation rights, and 100% TDR refund eligibility.
   - Pushes an actionable advisory with alternative metro/connecting train options to the traveler.

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

1. Open **http://localhost:5678** in your browser.
2. In n8n, click **Workflows** in the left sidebar ➔ Click **Add Workflow** (or **+**).
3. In the top right menu (`...`), click **Import from File**.
4. Select the JSON files from `n8n/workflows/`:
   - `traveliq-support-ai-automation.json`
   - `traveliq-booking-ai-automation.json`
   - `traveliq-delay-refund-ai-automation.json`
5. Click **Publish** / **Activate** (toggle in the top right to **Active**).

---

## ⚙️ Configuration & Webhook Endpoints

In `backend/.env`, verify your n8n configuration:
```env
# Base webhook URL
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook

# Webhook URLs
N8N_SUPPORT_WEBHOOK_URL=http://localhost:5678/webhook/traveliq-support
N8N_BOOKING_WEBHOOK_URL=http://localhost:5678/webhook/traveliq-booking
N8N_DELAY_WEBHOOK_URL=http://localhost:5678/webhook/traveliq-delay-alert

# Webhook secret token for authenticating callbacks
N8N_WEBHOOK_SECRET=traveliq_n8n_secret_token_2026
```

---

## 🛡️ Built-in Zero-Downtime AI Fallback
If n8n is offline or unreachable, TravelIQ's built-in **AI Engine & Google Gemini** fallback will automatically generate the response, ensuring zero disruption for travelers!
