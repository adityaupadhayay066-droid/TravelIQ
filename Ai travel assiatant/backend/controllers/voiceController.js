const { VoiceLog } = require('../models');
const aiService = require('../services/aiService');

// Handles voice audio uploading/listening (STT mock or file transcript processing)
const listenVoice = async (req, res) => {
    try {
        // If an audio file is uploaded, we can mock transcription or parse it.
        // The primary Speech-To-Text happens on client-side using Web Speech API,
        // but this endpoint provides a clean server-side receiver.
        return res.status(200).json({
            success: true,
            message: "Voice listener active.",
            transcript: req.body.transcript || "Show trains from Delhi to Patna"
        });
    } catch (error) {
        console.error('Listen Voice Error:', error);
        return res.status(500).json({ message: 'Error processing audio listening.' });
    }
};

// Process voice text commands to extract intent & routing actions
const respondVoice = async (req, res) => {
    try {
        const { text, language } = req.body;
        const userId = req.user ? req.user.id : null;
        const lang = language || 'en';

        if (!text) {
            return res.status(400).json({ message: 'Transcribed speech text is required.' });
        }

        // 1. Delegate intent & parameter extraction to the Python AI service
        let aiResult = { intent: 'unknown', entities: {} };
        try {
            aiResult = await aiService.parseVoiceCommand(text, lang, userId);
        } catch (aiErr) {
            console.error('Python voice parse failure, falling back to local regex regex parser:', aiErr.message);
            // Fallback local regex parser if python endpoint is down
            aiResult = localVoiceParser(text);
        }

        const { intent, entities } = aiResult;
        let action = {};
        let spokenReply = '';

        // 2. Map classified intent to actionable redirects & spoken replies
        if (lang === 'hi') {
            switch (intent) {
                case 'search_trains':
                    const srcHi = entities.source || '';
                    const dstHi = entities.destination || '';
                    action = { route: '/dashboard', search: { source: srcHi, destination: dstHi } };
                    spokenReply = `${srcHi} से ${dstHi} के लिए ट्रेनें खोज रहा हूँ।`;
                    break;
                case 'track_train':
                    const trNumHi = entities.train_number || '';
                    action = { route: '/dashboard/track', search: { trainNumber: trNumHi } };
                    spokenReply = `ट्रेन नंबर ${trNumHi} को ट्रैक कर रहा हूँ।`;
                    break;
                case 'cheapest_route':
                    const destHi = entities.destination || '';
                    action = { route: '/dashboard', optimize: { destination: destHi, criteria: 'cheapest' } };
                    spokenReply = `${destHi} के लिए सबसे सस्ता मार्ग खोज रहा हूँ।`;
                    break;
                case 'food_explorer':
                    const stnHi = entities.station || '';
                    action = { route: '/dashboard/food', search: { station: stnHi } };
                    spokenReply = `${stnHi} स्टेशन के पास भोजन के विकल्प खोज रहा हूँ।`;
                    break;
                case 'navigate_station':
                    const stnCodeHi = entities.station_code || '';
                    action = { route: '/dashboard/station-3d', search: { stationCode: stnCodeHi } };
                    spokenReply = `${stnCodeHi} स्टेशन का थ्री-डी मैप खोल रहा हूँ।`;
                    break;
                default:
                    action = { route: '/dashboard' };
                    spokenReply = `माफ़ कीजिये, मुझे समझ नहीं आया। क्या आप फिर से कह सकते हैं?`;
                    break;
            }
        } else {
            // Default English response mapping
            switch (intent) {
                case 'search_trains':
                    const src = entities.source || '';
                    const dst = entities.destination || '';
                    action = { route: '/dashboard', search: { source: src, destination: dst } };
                    spokenReply = `Sure, finding trains from ${src} to ${dst}.`;
                    break;
                case 'track_train':
                    const trNum = entities.train_number || '';
                    action = { route: '/dashboard/track', search: { trainNumber: trNum } };
                    spokenReply = `Tracking train number ${trNum} now.`;
                    break;
                case 'cheapest_route':
                    const dest = entities.destination || '';
                    action = { route: '/dashboard', optimize: { destination: dest, criteria: 'cheapest' } };
                    spokenReply = `Calculating the cheapest route to ${dest}.`;
                    break;
                case 'food_explorer':
                    const stn = entities.station || '';
                    action = { route: '/dashboard/food', search: { station: stn } };
                    spokenReply = `Showing food options near ${stn} station.`;
                    break;
                case 'navigate_station':
                    const stnCode = entities.station_code || '';
                    action = { route: '/dashboard/station-3d', search: { stationCode: stnCode } };
                    spokenReply = `Opening the 3D map for ${stnCode} station.`;
                    break;
                default:
                    action = { route: '/dashboard' };
                    spokenReply = `I didn't quite get that. Could you please repeat?`;
                    break;
            }
        }

        // 3. Log the voice interaction in database table
        await VoiceLog.create({
            user_id: userId,
            query_text: text,
            response_text: spokenReply,
            language: lang,
            detected_intent: intent
        });

        return res.status(200).json({
            success: true,
            intent,
            entities,
            action,
            spoken_reply: spokenReply
        });
    } catch (error) {
        console.error('Respond Voice Error:', error);
        return res.status(500).json({ message: 'Internal server error processing speech command.' });
    }
};

// Fallback local regex parsing helper in case Python service is down
const localVoiceParser = (text) => {
    const query = text.toLowerCase();
    
    // 1. Search Trains (e.g. "show trains from Delhi to Patna")
    if (query.includes('train') && (query.includes('from') || query.includes('to'))) {
        const fromMatch = query.match(/from\s+([a-zA-Z\s]+?)\s+to/);
        const toMatch = query.match(/to\s+([a-zA-Z\s]+)/);
        
        let source = '';
        let destination = '';
        
        if (fromMatch && fromMatch[1]) source = fromMatch[1].trim();
        if (toMatch && toMatch[1]) destination = toMatch[1].trim();
        
        // Clean trailing spaces
        if(source) source = source.charAt(0).toUpperCase() + source.slice(1);
        if(destination) destination = destination.charAt(0).toUpperCase() + destination.slice(1);

        return {
            intent: 'search_trains',
            entities: { source, destination }
        };
    }

    // 2. Track Train (e.g. "track train 12301")
    if (query.includes('track') || query.includes('live')) {
        const trainNumMatch = query.match(/\b\d{5}\b/) || query.match(/\b\d{4}\b/);
        const train_number = trainNumMatch ? trainNumMatch[0] : '';
        return {
            intent: 'track_train',
            entities: { train_number }
        };
    }

    // 3. Cheapest Route (e.g. "cheapest route to Mumbai")
    if (query.includes('cheap') || query.includes('route')) {
        const destMatch = query.match(/to\s+([a-zA-Z\s]+)/) || query.match(/route\s+([a-zA-Z\s]+)/);
        let destination = '';
        if (destMatch && destMatch[1]) {
            destination = destMatch[1].replace('to', '').trim();
            destination = destination.charAt(0).toUpperCase() + destination.slice(1);
        }
        return {
            intent: 'cheapest_route',
            entities: { destination }
        };
    }

    // 4. Food Explorer (e.g. "food near Bhubaneswar")
    if (query.includes('food') || query.includes('eat') || query.includes('restaurant')) {
        const stationMatch = query.match(/near\s+([a-zA-Z\s]+?)\s+station/) || query.match(/near\s+([a-zA-Z\s]+)/);
        let station = '';
        if (stationMatch && stationMatch[1]) {
            station = stationMatch[1].trim();
            station = station.charAt(0).toUpperCase() + station.slice(1);
        }
        return {
            intent: 'food_explorer',
            entities: { station }
        };
    }

    // 5. 3D Station Navigation (e.g. "3D map for Delhi")
    if (query.includes('3d') || query.includes('map') || query.includes('station map')) {
        let stationCode = '';
        const match = query.match(/for\s+([a-zA-Z\s]+)/);
        if(match && match[1]) {
             stationCode = match[1].trim().toUpperCase();
        }
        return {
            intent: 'navigate_station',
            entities: { station_code: stationCode }
        };
    }

    return {
        intent: 'unknown',
        entities: {}
    };
};

module.exports = {
    listenVoice,
    respondVoice
};
