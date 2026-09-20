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
        question: "What features does TravelIQ support?",
        keywords: "traveliq, features, support, profile, dark mode, dashboard, options, general",
        answer: "TravelIQ is an AI-powered travel intelligence platform providing route optimization, delay predictions, fare trend forecasts, food suggestions, carbon footprint calculators, and emergency SOS alerts.",
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
