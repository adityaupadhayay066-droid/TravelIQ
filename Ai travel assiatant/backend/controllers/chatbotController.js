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

        // 1. Try Google Gemini API if configured
        const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (rawApiKey) {
            const geminiApiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');
            if (geminiApiKey && !['your_google_gemini_api_key_here', 'your_actual_google_gemini_api_key_here'].includes(geminiApiKey)) {
                const models = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'];
                for (const model of models) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
                        const gRes = await axios.post(url, {
                            contents: [{
                                parts: [{ text: `You are TravelIQ AI, a helpful futuristic travel assistant. Answer concisely in 2-3 sentences: ${message}` }]
                            }]
                        }, { timeout: 15000 });

                        if (gRes.data && gRes.data.candidates && gRes.data.candidates.length > 0) {
                            const parts = gRes.data.candidates[0].content?.parts || [];
                            if (parts.length > 0) {
                                botReply = parts[0].text.trim();
                                break;
                            }
                        }
                    } catch (gErr) {
                        const errDetails = gErr.response?.data?.error?.message || gErr.message;
                        console.error(`[Gemini API Call Failed - Model ${model}]:`, errDetails);
                    }
                }
            }
        }

        // 2. Try Python AI Service (/chat endpoint)
        if (!botReply) {
            try {
                const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
                const aiRes = await axios.post(`${aiUrl}/chat`, { message }, { timeout: 5000 });
                if (aiRes.data && aiRes.data.response) {
                    botReply = aiRes.data.response;
                }
            } catch (aiErr) {
                // Ignore AI service offline
            }
        }

        // 3. Fallback to Database Knowledge Base
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
                if (/\b(fare|price|cost|ticket|cheap|flight|train|igi|rnc|del|bom)\b/i.test(lowerMsg)) {
                    botReply = "To check ticket fares and price trends for flights or trains (e.g. IGI Delhi to RNC Ranchi), visit the 'Route Optimizer' or 'Smart Fare Predictor' tab on your TravelIQ dashboard! Direct flight fares typically range between ₹3,500 and ₹6,500.";
                } else if (/\b(delay|late|time|status|cancel|reschedule)\b/i.test(lowerMsg)) {
                    botReply = "Train delays are monitored using historical weather and route statistics. Enter your train number in our 'Delay Predictor' tab for real-time risk predictions!";
                } else if (/\b(food|eat|meal|thali|restaurant|snacks)\b/i.test(lowerMsg)) {
                    botReply = "Looking for delicious meals on your trip? Explore regional specialties on the 'Food Recommendations' tab for top station treats!";
                } else if (/\b(safety|sos|emergency|help|rpf|security)\b/i.test(lowerMsg)) {
                    botReply = "Your safety is our top priority! Use our 'SOS Alerts' feature to share your live PNR itinerary or call Railway Helpline 139.";
                } else if (/\b(book|booking|irctc|tatkal|seat|reservation)\b/i.test(lowerMsg)) {
                    botReply = "Train reservations open at 8 AM for General quota and 10 AM/11 AM for Tatkal on IRCTC. Check seat availability predictions on TravelIQ before booking!";
                } else {
                    botReply = "Hello! I am your TravelIQ AI assistant. Ask me about train or flight fares, delay predictions, route optimization, local food, or travel safety!";
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
