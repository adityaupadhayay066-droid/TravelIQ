const { ChatbotKnowledge, ChatHistory, User, Train, TrainSchedule, TrainFare, Station } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const { generateGroundedResponse } = require('../services/deterministicRoutingService');
const { isTransitRoutingQuery, extractTransitEntities } = require('../services/transitIntentService');

// ══════════════════════════════════════════════════════
// PUBLIC CHATBOT ENDPOINTS
// ══════════════════════════════════════════════════════

/**
 * Calls Google Gemini Generative AI with active models and optional web search grounding.
 */
async function callGemini(prompt, systemInstruction = '', tryWebSearch = false) {
    const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : null;
    if (!apiKey || apiKey.length < 8 || apiKey.startsWith('your_')) {
        return null;
    }

    const models = [
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash',
        'gemini-pro-latest'
    ];

    const fullText = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;

    for (const model of models) {
        // Option 1: Try with Web Search Grounding if requested
        if (tryWebSearch) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const body = {
                    contents: [{ parts: [{ text: fullText }] }],
                    tools: [{ googleSearch: {} }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1000
                    }
                };
                const res = await axios.post(url, body, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    timeout: 8000
                });
                const parts = res.data?.candidates?.[0]?.content?.parts || [];
                if (parts.length > 0 && parts[0].text) {
                    return parts[0].text.trim();
                }
            } catch (searchErr) {
                // If 429 quota or unsupported tool on free tier, smoothly fallback to standard generateContent below
            }
        }

        // Option 2: Standard generateContent
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const body = {
                contents: [{ parts: [{ text: fullText }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1000
                }
            };
            const res = await axios.post(url, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                timeout: 8000
            });
            const parts = res.data?.candidates?.[0]?.content?.parts || [];
            if (parts.length > 0 && parts[0].text) {
                return parts[0].text.trim();
            }
        } catch (err) {
            continue; // Try next model on failure / 503
        }
    }

    return null;
}

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

        // 0. Zero Generative Routing: Deterministic Data Pipeline for Transit/Route Inquiries
        if (isTransitRoutingQuery(message)) {
            const transitEntities = extractTransitEntities(message);
            if (transitEntities && transitEntities.origin && transitEntities.destination) {
                try {
                    const grounded = await generateGroundedResponse(
                        message,
                        transitEntities.origin,
                        transitEntities.destination,
                        transitEntities.isDefaultDate ? null : transitEntities.travelDate,
                        transitEntities.travelClass
                    );
                    if (grounded && grounded.response) {
                        botReply = grounded.response;
                    }
                } catch (groundErr) {
                    console.error('[Grounded Routing Error]:', groundErr.message);
                }
            }
        }

        // 0b. Zero Generative Lookup: Direct Train Number Inquiries (e.g., "12801", "train 12802")
        if (!botReply) {
            const trainMatch = message.match(/\b(1\d{4}|2\d{4})\b/);
            if (trainMatch) {
                const trainNo = trainMatch[1];
                const tr = await Train.findOne({ where: { train_number: trainNo } });
                if (tr) {
                    const stops = await TrainSchedule.findAll({ 
                        where: { train_number: trainNo }, 
                        order: [['stop_sequence', 'ASC']] 
                    });
                    const fares = await TrainFare.findAll({ where: { train_number: trainNo } });
                    const fareList = fares.length > 0 
                        ? fares.map(f => `${f.class_code}: ₹${f.fare}`).join(', ') 
                        : 'Standard telescopic fare applies';
                    const runsDays = Array.isArray(tr.runs_on) ? tr.runs_on.join(', ') : (tr.runs_on || 'Daily');
                    const haltSummary = stops.length > 0 
                        ? `${stops[0].station_code} (${stops[0].departure_time || 'Source'}) ➔ ${stops[stops.length - 1].station_code} (${stops[stops.length - 1].arrival_time || 'Destination'}) via ${stops.length} scheduled halts`
                        : 'Verified active timetable record';

                    botReply = `🚆 **Train #${tr.train_number} — ${tr.train_name}**\n\n` +
                        `• **Route**: ${haltSummary}\n` +
                        `• **Operating Days**: ${runsDays} (${tr.frequency || 'Regular Service'})\n` +
                        `• **Verified Fares**: ${fareList}\n\n` +
                        `To book seats on this train, enter ${stops[0]?.station_code || 'origin'} and ${stops[stops.length - 1]?.station_code || 'destination'} in the AEVORA Search tab!`;
                } else {
                    botReply = `Train #${trainNo} was not found in our verified Indian Railways timetable directory. Please check the train number or search on the AEVORA Route Search page.`;
                }
            }
        }

        // 1. Check Fed Knowledge Base in Database
        let matchedKnowledge = null;
        if (!botReply) {
            const knowledgeBase = await ChatbotKnowledge.findAll();
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
                    matchedKnowledge = entry;
                }
            });

            // If matched in fed knowledge, synthesize answer using Gemini grounded on fed data!
            if (matchedKnowledge && maxScore > 0) {
                const fedPrompt = `You are AEVORA AI, India's Smart Travel Concierge.
Use the following verified internal platform knowledge to answer the user's question clearly, helpfully, and professionally:

<verified_platform_knowledge>
Topic: ${matchedKnowledge.question}
Verified Answer: ${matchedKnowledge.answer}
</verified_platform_knowledge>

User Question: ${message}`;
                botReply = await callGemini(fedPrompt, '', false);
                if (!botReply) {
                    botReply = matchedKnowledge.answer; // Fallback if Gemini offline
                }
            }
        }

        // 2. Data Not in Fed Knowledge Base: Search on Web via Gemini with strict anti-hallucination guardrail!
        if (!botReply) {
            const webSearchPrompt = `You are AEVORA AI, India's Smart Travel Concierge.
The user is asking a travel question that is not in our internal database.
CRITICAL APPLICATION SECURITY & ANTI-HALLUCINATION CONSTRAINTS:
1. NEVER invent, guess, or hallucinate train numbers, railway schedules, train names, or ticket fares.
2. If the user asks about specific train schedules, train numbers, or ticket prices that are not explicitly provided, state: "I do not have verified timetable records for this specific train or corridor. Please search on the AEVORA Route Search page for verified IRCTC schedules."
3. Answer informatively regarding general travel tips, tourist places, weather, food, packing, or booking steps.

User Question: ${message}`;
            botReply = await callGemini(webSearchPrompt, '', true);
        }

        // 3. Try Python AI Service (/chat endpoint) if transit query or Gemini was not handled
        if (!botReply) {
            try {
                const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
                const internalKey = process.env.INTERNAL_SERVICE_KEY;
                const aiRes = await axios.post(`${aiUrl}/chat`, { message }, {
                    headers: internalKey ? { 'X-Internal-Service-Key': internalKey } : {},
                    timeout: 6000
                });
                if (aiRes.data && aiRes.data.response) {
                    botReply = aiRes.data.response;
                }
            } catch (aiErr) {
                // Fallback if AI service is offline
            }
        }

        // 4. Fallback to Local Pattern Answers if all external services are offline
        if (!botReply) {
            const lowerMsg = cleanMessage.toLowerCase();
            if (/\b(api key|developer|b2b|x-api-key|telemetry|token|endpoint|sdk)\b/i.test(lowerMsg)) {
                botReply = "🔑 To get a Developer API Key: 1) Go to 'B2B Developer Hub' from the Explore menu. 2) Click 'Generate API Key' and name your app. 3) Pass the generated key in the 'X-API-Key' header when calling AEVORA AI endpoints (/api/v1/predict/delay, /api/v1/predict/fare, /api/v1/optimize-route).";
            } else if (/\b(book in train|book train|book ticket|how to book|rail booking|seat reservation)\b/i.test(lowerMsg)) {
                botReply = "🚆 To book a train: 1) Click 'Plan Trip' on top. 2) Enter Origin & Destination (e.g. NDLS to CSTM). 3) Choose your class (1A, 2A, 3A, SL, CC). 4) Enter passenger details & berth preference. 5) Pay via UPI QR sandbox to instantly get your official IRCTC Co-Branded Electronic Reservation Slip (ERS)!";
            } else if (/\b(hotel|hostel|dorm|homestay|stay in|room)\b/i.test(lowerMsg)) {
                botReply = "🏨 AEVORA Stays: Reserve 0% prepay verified hotel rooms, homestays, and futuristic capsule dorms with free cancellation. View your vouchers anytime under 'My Trips'!";
            } else if (/\b(fare|price|cost|ticket|cheap|flight|train|igi|rnc|del|bom)\b/i.test(lowerMsg)) {
                botReply = "To check verified ticket fares and price trends for flights or trains, search your origin and destination on the AEVORA Route Search tab for verified provider schedules and fares.";
            } else if (/\b(delay|late|time|status|cancel|reschedule)\b/i.test(lowerMsg)) {
                botReply = "Train delays are monitored using historical weather and route statistics. Enter your train number in our 'Delay Predictor' tab for real-time risk predictions!";
            } else if (/\b(food|eat|meal|thali|restaurant|snacks)\b/i.test(lowerMsg)) {
                botReply = "Looking for delicious meals on your trip? Explore regional specialties on the 'Food Recommendations' tab for top station treats!";
            } else if (/\b(safety|sos|emergency|help|rpf|security)\b/i.test(lowerMsg)) {
                botReply = "Your safety is our top priority! Use our 'SOS Alerts' feature to share your live PNR itinerary or call Railway Helpline 139.";
            } else {
                botReply = "Hello! I am your AEVORA AI assistant. Ask me about developer API keys, train booking steps, verified hotel stays, delay forecasts, local food, or custom trip itineraries!";
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
