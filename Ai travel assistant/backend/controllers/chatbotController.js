const { ChatbotKnowledge, ChatHistory, User } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// ══════════════════════════════════════════════════════
// PUBLIC CHATBOT ENDPOINTS
// ══════════════════════════════════════════════════════

/**
 * Handle incoming user messages, find the best match, and return the response.
 */
const sendMessage = async (req, res) => {
    const { message } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const cleanMessage = message.toLowerCase().trim().replace(/[^\w\s]/g, '');

    try {
        let botReply = null;

        // 1. Try Python AI Service (/chat endpoint) first (Domain Expert + Neural Engine + RAG)
        try {
            const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            const aiRes = await axios.post(`${aiUrl}/chat`, { message }, { timeout: 6000 });
            if (aiRes.data && aiRes.data.response) {
                botReply = aiRes.data.response;
            }
        } catch (aiErr) {
            // Fallback if AI service is offline
        }

        // 2. Try Google Gemini API if configured with a valid key (starts with AIzaSy)
        if (!botReply) {
            const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (rawApiKey && rawApiKey.startsWith('AIzaSy')) {
                const geminiApiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');
                const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
                for (const model of models) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
                        const gRes = await axios.post(url, {
                            contents: [{
                                parts: [{ text: `You are TravelIQ AI, a helpful senior travel assistant. Answer concisely in 2-3 friendly sentences: ${message}` }]
                            }]
                        }, { timeout: 8000 });

                        if (gRes.data && gRes.data.candidates && gRes.data.candidates.length > 0) {
                            const parts = gRes.data.candidates[0].content?.parts || [];
                            if (parts.length > 0) {
                                botReply = parts[0].text.trim();
                                break;
                            }
                        }
                    } catch (gErr) {
                        break; // Stop on auth or rate failure
                    }
                }
            }
        }

        // 3. Fallback to Database Knowledge Base & Context Matcher
        if (!botReply) {
            const knowledgeBase = await ChatbotKnowledge.findAll();
            let bestMatch = null;
            let maxScore = 0;

            knowledgeBase.forEach(entry => {
                const keywords = entry.keywords.toLowerCase().split(',').map(k => k.trim());
                let score = 0;
                keywords.forEach(keyword => {
                    if (!keyword) return;
                    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                    if (regex.test(cleanMessage)) {
                        score += keyword.length; 
                    }
                });
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = entry;
                }
            });

            if (bestMatch && maxScore > 0) {
                botReply = bestMatch.answer;
            } else {
                const lowerMsg = cleanMessage.toLowerCase();
                if (/\b(api key|developer|b2b|x-api-key|telemetry|token|endpoint|sdk)\b/i.test(lowerMsg)) {
                    botReply = "🔑 To get a Developer API Key: 1) Go to 'B2B Developer Hub' from the Explore menu. 2) Click 'Generate API Key' and name your app. 3) Pass the generated key in the 'X-API-Key' header when calling TravelIQ AI endpoints (/api/v1/predict/delay, /api/v1/predict/fare, /api/v1/optimize-route).";
                } else if (/\b(book in train|book train|book ticket|how to book|rail booking|seat reservation)\b/i.test(lowerMsg)) {
                    botReply = "🚆 To book a train: 1) Click 'Plan Trip' on top. 2) Enter Origin & Destination (e.g. NDLS to CSTM). 3) Choose your class (1A, 2A, 3A, SL, CC). 4) Enter passenger details & berth preference. 5) Pay via UPI QR sandbox to instantly get your official IRCTC Co-Branded Electronic Reservation Slip (ERS)!";
                } else if (/\b(hotel|hostel|dorm|homestay|stay in|room)\b/i.test(lowerMsg)) {
                    botReply = "🏨 TravelIQ Stays: Reserve 0% prepay verified hotel rooms, homestays, and futuristic capsule dorms with free cancellation. View your vouchers anytime under 'My Trips'!";
                } else if (/\b(fare|price|cost|ticket|cheap|flight|train|igi|rnc|del|bom)\b/i.test(lowerMsg)) {
                    botReply = "To check ticket fares and price trends for flights or trains (e.g. IGI Delhi to RNC Ranchi), visit the 'Route Optimizer' or 'Smart Fare Predictor' tab on your TravelIQ dashboard! Direct flight fares typically range between ₹3,500 and ₹6,500.";
                } else if (/\b(delay|late|time|status|cancel|reschedule)\b/i.test(lowerMsg)) {
                    botReply = "Train delays are monitored using historical weather and route statistics. Enter your train number in our 'Delay Predictor' tab for real-time risk predictions!";
                } else if (/\b(food|eat|meal|thali|restaurant|snacks)\b/i.test(lowerMsg)) {
                    botReply = "Looking for delicious meals on your trip? Explore regional specialties on the 'Food Recommendations' tab for top station treats!";
                } else if (/\b(safety|sos|emergency|help|rpf|security)\b/i.test(lowerMsg)) {
                    botReply = "Your safety is our top priority! Use our 'SOS Alerts' feature to share your live PNR itinerary or call Railway Helpline 139.";
                } else {
                    botReply = "Hello! I am your TravelIQ AI assistant. Ask me about developer API keys, train booking steps, verified hotel stays, delay forecasts, local food, or custom trip itineraries!";
                }
            }
        }

        // Store chat history
        const userName = req.user ? req.user.name : 'Anonymous';
        await ChatHistory.create({
            user_id: userId,
            user_name: userName,
            message: message.trim(),
            bot_reply: botReply
        });

        res.json({
            response: botReply,
            confidence: 0.95
        });

    } catch (error) {
        console.error('[Chatbot Error]:', error);
        res.status(500).json({ message: 'Internal server error while processing message.' });
    }
};

/**
 * Fetch common questions to suggest to the user.
 */
const getCommonQuestions = async (req, res) => {
    try {
        const questions = await ChatbotKnowledge.findAll({
            attributes: ['id', 'question', 'category'],
            limit: 5,
            order: [['updated_at', 'DESC']]
        });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch common questions.' });
    }
};

// ══════════════════════════════════════════════════════
// ADMIN KNOWLEDGE BASE ENDPOINTS
// ══════════════════════════════════════════════════════

const getKnowledgeBase = async (req, res) => {
    try {
        const knowledge = await ChatbotKnowledge.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(knowledge);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch knowledge base.' });
    }
};

const addKnowledge = async (req, res) => {
    const { question, keywords, answer, category } = req.body;

    if (!question || !keywords || !answer) {
        return res.status(400).json({ message: 'Question, keywords, and answer are required.' });
    }

    try {
        const entry = await ChatbotKnowledge.create({
            question,
            keywords,
            answer,
            category: category || 'General'
        });
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add knowledge entry.' });
    }
};

const updateKnowledge = async (req, res) => {
    const { id } = req.params;
    const { question, keywords, answer, category } = req.body;

    try {
        const entry = await ChatbotKnowledge.findByPk(id);
        if (!entry) return res.status(404).json({ message: 'Entry not found.' });

        if (question) entry.question = question;
        if (keywords) entry.keywords = keywords;
        if (answer) entry.answer = answer;
        if (category) entry.category = category;

        await entry.save();
        res.json(entry);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update knowledge entry.' });
    }
};

const deleteKnowledge = async (req, res) => {
    const { id } = req.params;

    try {
        const entry = await ChatbotKnowledge.findByPk(id);
        if (!entry) return res.status(404).json({ message: 'Entry not found.' });

        await entry.destroy();
        res.json({ message: 'Knowledge entry deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete knowledge entry.' });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const history = await ChatHistory.findAll({
            order: [['created_at', 'DESC']],
            limit: 100,
            include: [{ model: User, attributes: ['name', 'email'] }]
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch chat history.' });
    }
};

module.exports = {
    sendMessage,
    getCommonQuestions,
    getKnowledgeBase,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
    getChatHistory
};
