const { ChatbotKnowledge } = require('../models');

const seedChatbotKnowledge = async () => {
  try {
    const knowledgeEntries = [
      {
        question: "How to check ticket fare or flight prices?",
        keywords: "fare, price, ticket, cost, cheap, flight, flight ticket, igi, rnc, del, bom, fare inquiry, budget",
        answer: "To check prices and fare trends (for flights and trains), use the 'Route Optimizer' and 'Smart Fare Predictor' on your TravelIQ dashboard. For flights (such as IGI Delhi to RNC Ranchi), typical direct fares range from ₹3,500 to ₹6,500 when booked in advance.",
        category: "Fares"
      },
      {
        question: "How to predict train delays?",
        keywords: "delay, late, delay prediction, expected time, status, train status, cancel, reschedule",
        answer: "Train delays are common during monsoon and winter fog. Enter your train number in our 'Delay Predictor' tab to view delay probability calculated using historical statistics and live weather.",
        category: "Delays"
      },
      {
        question: "How to book tickets on IRCTC or Tatkal?",
        keywords: "book, booking, irctc, tatkal, seat, reserve, reservation, quota",
        answer: "Train reservations open at 8 AM for general quota and 10 AM (AC) / 11 AM (Non-AC) for Tatkal on the official IRCTC portal. Check seat availability predictions on TravelIQ before booking!",
        category: "Booking"
      },
      {
        question: "Local food recommendations on routes",
        keywords: "food, eat, meal, thali, restaurant, regional delicacies, snacks",
        answer: "Try regional delicacies! Use our 'Food Recommendation' tab on your TravelIQ dashboard to see top-rated local treats at stations along your journey.",
        category: "Food"
      },
      {
        question: "Travel safety tips and emergency numbers",
        keywords: "safety, safe, sos, emergency, rpf, helpline, protection, security",
        answer: "Stay safe by: 1) Sharing your live PNR itinerary with family via TravelIQ. 2) Saving emergency helpline RPF: 139. 3) Requesting security escorts for late night travel.",
        category: "Safety"
      },
      {
        question: "How to generate and use Developer API Keys?",
        keywords: "api key, developer key, b2b, x-api-key, developer hub, developer portal, telemetry, rate limit, sdk, endpoint",
        answer: "To generate a Developer API Key: 1) Go to 'B2B Developer Hub' from the Explore menu. 2) Click 'Generate API Key' and name your application. 3) Pass the key in the 'X-API-Key: tiq_live_...' header when calling TravelIQ AI endpoints (/api/v1/predict/delay, /api/v1/predict/fare, /api/v1/optimize-route). Monitor usage in the Telemetry tab!",
        category: "Developer"
      },
      {
        question: "How to book a train ticket on TravelIQ?",
        keywords: "book in train, book train, book ticket, how to book, rail booking, seat reservation, train ticket",
        answer: "To book a train on TravelIQ: 1) Click 'Plan Trip' on the top navbar. 2) Enter Origin & Destination stations and travel date. 3) Choose your preferred train & class (1A, 2A, 3A, SL, CC). 4) Enter passenger details & berth preferences. 5) Pay via UPI sandbox to instantly receive your official IRCTC Co-Branded Electronic Reservation Slip (ERS) with PNR and QR Code!",
        category: "Booking"
      },
      {
        question: "How to book hotels, hostels, and backpacker dorms?",
        keywords: "hotel, hostel, dorm, capsule pod, homestay, stay in, book hotel, e-voucher, check in",
        answer: "TravelIQ Stays allows you to reserve verified hotels, homestays, and budget pod hostels with 0% upfront prepayment and free cancellation. You can download your official MakeMyTrip/OYO-style e-Voucher directly under 'My Trips'!",
        category: "Hotels"
      },
      {
        question: "What features does TravelIQ support?",
        keywords: "traveliq, features, support, profile, dark mode, dashboard, options, general",
        answer: "TravelIQ is an AI-powered multimodal travel platform providing train & flight bookings, delay predictions, fare trend forecasts, station food delivery, 3D station navigation, B2B Developer APIs, and emergency SOS alerts.",
        category: "General"
      }
    ];

    for (const entry of knowledgeEntries) {
      await ChatbotKnowledge.findOrCreate({
        where: { question: entry.question },
        defaults: entry
      });
    }
    console.log('Chatbot Knowledge seeder executed successfully.');
  } catch (error) {
    console.error('Error seeding Chatbot Knowledge:', error);
  }
};

module.exports = { seedChatbotKnowledge };
