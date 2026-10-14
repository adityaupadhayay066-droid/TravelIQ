const { Train, TrainSchedule, Station, TrainFare, sequelize } = require('../models');
const { Op } = require('sequelize');
const { MultiModalRoutingEngine } = require('./multiModalRoutingEngine');
const { trainRunsOnDate, formatRunningDays, getTrainFrequencyLabel } = require('./routeValidationEngine');
const { resolveStation, parseTravelDate } = require('./stationResolver');
const axios = require('axios');

/**
 * ════════════════════════════════════════════════════════════════════════════
 * DETERMINISTIC ROUTE QUERY: MULTI-STATION CLUSTER QUERYING
 * ════════════════════════════════════════════════════════════════════════════
 * Strictly checks halt sequence ordering: s1.stop_sequence < s2.stop_sequence.
 * Queries all terminal station combinations across origin and destination clusters.
 *
 * Pattern:
 * SELECT t.train_no, t.train_name, s1.station_code AS origin_station, s1.departure_time,
 *        s2.station_code AS dest_station, s2.arrival_time, t.runs_on_days
 * FROM train_stops s1
 * JOIN train_stops s2 ON s1.train_no = s2.train_no
 * JOIN trains t ON t.train_no = s1.train_no
 * WHERE s1.station_code IN (:origin_station_codes)
 *   AND s2.station_code IN (:dest_station_codes)
 *   AND s1.stop_sequence < s2.stop_sequence
 */
async function getVerifiedDirectTrains(originInput, destInput, travelDate = null) {
  let originCodes = [];
  let destCodes = [];

  if (Array.isArray(originInput)) {
    originCodes = originInput;
  } else if (typeof originInput === 'string') {
    const resolved = await resolveStation(originInput);
    originCodes = resolved?.stationCodes || [originInput.trim().toUpperCase()];
  }

  if (Array.isArray(destInput)) {
    destCodes = destInput;
  } else if (typeof destInput === 'string') {
    const resolved = await resolveStation(destInput);
    destCodes = resolved?.stationCodes || [destInput.trim().toUpperCase()];
  }

  if (!originCodes.length || !destCodes.length) {
    return [];
  }

  // Updated SQL query pattern matching specification
  const query = `
    SELECT 
        t.train_no,
        t.train_name,
        s1.station_code AS origin_station,
        s1.departure_time,
        s2.station_code AS dest_station,
        s2.arrival_time,
        t.runs_on_days,
        t.frequency,
        t.service_type,
        s1.day_count AS source_day,
        s2.day_count AS dest_day,
        s1.stop_sequence AS dep_seq,
        s2.stop_sequence AS arr_seq
    FROM train_stops s1
    JOIN train_stops s2 ON s1.train_no = s2.train_no
    JOIN trains t ON t.train_no = s1.train_no
    WHERE s1.station_code IN (:origin_station_codes)
      AND s2.station_code IN (:dest_station_codes)
      AND s1.stop_sequence < s2.stop_sequence
    ORDER BY s1.departure_time ASC;
  `;

  let rawRoutes = [];
  try {
    rawRoutes = await sequelize.query(query, {
      replacements: {
        origin_station_codes: originCodes,
        dest_station_codes: destCodes
      },
      type: sequelize.QueryTypes.SELECT
    });
  } catch (err) {
    console.error('[Deterministic Routing] SQL execution error:', err.message);
    return [];
  }

  // Filter routes by departureDate (day of the week)
  const validRoutes = rawRoutes.filter(route => trainRunsOnDate({
    ...route,
    runs_on: route.runs_on_days || route.runs_on
  }, travelDate));

  if (validRoutes.length === 0) {
    return [];
  }

  // Fetch verified fares from train_fares table
  const trainNumbers = validRoutes.map(r => r.train_no);
  let fareRows = [];
  try {
    fareRows = await TrainFare.findAll({
      where: { train_number: trainNumbers }
    });
  } catch (err) {
    console.warn('[Deterministic Routing] Fares lookup notice:', err.message);
  }

  const fareMap = {};
  for (const f of fareRows) {
    if (!fareMap[f.train_number]) fareMap[f.train_number] = {};
    fareMap[f.train_number][f.class_code] = f.fare;
  }

  // Deduplicate by train_no (keep first valid stop pair in the cluster)
  const uniqueTrains = new Map();
  for (const r of validRoutes) {
    const trainNum = r.train_no;
    if (uniqueTrains.has(trainNum)) continue;

    // Calculate duration in hours and minutes
    let durStr = 'N/A';
    let durationHours = 0;
    if (r.departure_time && r.arrival_time) {
      const parseTime = (t) => {
        if (!t) return 0;
        const p = t.split(':');
        return (parseInt(p[0], 10) || 0) + (parseInt(p[1], 10) || 0) / 60;
      };
      const dept = parseTime(r.departure_time);
      const arr = parseTime(r.arrival_time);
      const days = (r.dest_day || 1) - (r.source_day || 1);
      durationHours = (days * 24) + arr - dept;
      if (durationHours < 0) durationHours += 24;
      const h = Math.floor(durationHours);
      const m = Math.round((durationHours % 1) * 60);
      durStr = `${h}h ${m}m`;
    }

    const fares = fareMap[trainNum] || null;

    uniqueTrains.set(trainNum, {
      train_number: trainNum,
      train_no: trainNum,
      train_name: r.train_name,
      origin: r.origin_station,
      destination: r.dest_station,
      origin_station: r.origin_station,
      dest_station: r.dest_station,
      departure_time: r.departure_time ? r.departure_time.substring(0, 5) : 'N/A',
      arrival_time: r.arrival_time ? r.arrival_time.substring(0, 5) : 'N/A',
      duration: durStr,
      runs_on: formatRunningDays(r.runs_on_days),
      frequency: r.frequency || getTrainFrequencyLabel(r.runs_on_days),
      fares: fares ? Object.entries(fares).map(([cls, amt]) => `${cls}: ₹${amt}`).join(', ') : 'Unavailable at source'
    });

  }

  return Array.from(uniqueTrains.values());
}

/**
 * Deterministically discovers verified connecting routes using MultiModalRoutingEngine.
 */
async function getVerifiedConnectingRoutes(originCode, destCode, travelDate = null) {
  try {
    const routingEngine = new MultiModalRoutingEngine({ sequelize });
    const connectingDiscovery = await routingEngine.findConnectingRoutes(originCode, destCode, travelDate);

    const routes = (connectingDiscovery.routes || []).map(conn => {
      const legs = (conn.legs || []).map(l => ({
        leg_number: l.leg_number,
        train_number: l.service_number,
        train_name: l.service_name,
        from_station: l.from_station,
        to_station: l.to_station,
        departure_time: l.departure_time_clock || 'N/A',
        arrival_time: l.arrival_time_clock || 'N/A'
      }));

      return {
        hub_code: conn.hub,
        hub_name: conn.hub_name || conn.hub,
        layover_wait_time: conn.layover_display || `${conn.layover_minutes || 60}m`,
        total_duration: conn.duration || 'N/A',
        legs: legs
      };
    });

    return routes;
  } catch (err) {
    console.error('[Deterministic Routing] Connecting discovery error:', err.message);
    return [];
  }
}

/**
 * Builds the canonical <verified_transit_data> payload.
 */
async function getGroundedTransitData(originInput, destInput, travelDate = null, messageContext = null) {
  const originStation = await resolveStation(originInput);
  const destStation = await resolveStation(destInput);

  const dateObj = parseTravelDate(travelDate || messageContext);
  const effectiveDate = dateObj.travelDate;

  if (!originStation || !destStation) {
    return {
      query: {
        origin: originInput,
        destination: destInput,
        date: effectiveDate,
        isDefaultDate: dateObj.isDefaultDate,
        dateNotice: dateObj.dateNotice
      },
      direct_routes: [],
      connecting_routes: []
    };
  }

  // Query using multi-station clusters
  const directRoutes = await getVerifiedDirectTrains(originStation.stationCodes, destStation.stationCodes, effectiveDate);
  let connectingRoutes = [];

  // If no direct routes, discover connecting routes using primary station codes
  if (directRoutes.length === 0) {
    connectingRoutes = await getVerifiedConnectingRoutes(
      originStation.primaryStationCode,
      destStation.primaryStationCode,
      effectiveDate
    );
  }

  return {
    query: {
      origin: originStation.displayName,
      originCluster: originStation.stationCodes,
      destination: destStation.displayName,
      destCluster: destStation.stationCodes,
      date: effectiveDate,
      isDefaultDate: dateObj.isDefaultDate,
      dateNotice: dateObj.dateNotice
    },
    direct_routes: directRoutes,
    connecting_routes: connectingRoutes
  };
}

/**
 * Deterministic Grounded Text Formatter.
 * Follows the strict prompt rules:
 * 1. NEVER cite or invent any train number, operator name, timing, or fare not present in <verified_transit_data>.
 * 2. If <verified_transit_data> contains empty direct routes, explicitly state: "No direct trains are available on this route." Then present connecting hub options if provided.
 * 3. If connecting options are displayed, explicitly mention the layover hub name and transfer wait time from the payload.
 * 4. If the data is absent or empty, state: "No verified routes found for this date." Never guess or approximate.
 * 5. If travel date was defaulted, state: "Showing schedules for tomorrow ([Date]). You can change the date anytime."
 */
function formatDeterministicGroundedResponse(transitData) {
  const { query, direct_routes, connecting_routes } = transitData;
  const hasDirect = direct_routes && direct_routes.length > 0;
  const hasConnecting = connecting_routes && connecting_routes.length > 0;

  let text = '';

  // Intelligent Date Fallback notice
  if (query && query.isDefaultDate && query.dateNotice) {
    text += `ℹ️ *${query.dateNotice}*\n\n`;
  }

  if (!hasDirect && !hasConnecting) {
    text += `No verified routes found for this date.`;
    return text.trim();
  }

  if (hasDirect) {
    text += `🚆 **Verified Direct Trains (${query.origin} ➔ ${query.destination})**:\n\n`;
    direct_routes.forEach((t, i) => {
      text += `${i + 1}. **#${t.train_number} — ${t.train_name}**\n`;
      text += `   • Route: ${t.origin_station || t.origin} ➔ ${t.dest_station || t.destination}\n`;
      text += `   • Departure: ${t.departure_time} | Arrival: ${t.arrival_time} (Duration: ${t.duration})\n`;
      text += `   • Frequency: ${t.frequency} (${t.runs_on})\n`;
      text += `   • Fares: ${t.fares}\n\n`;
    });
  } else {
    text += `No direct trains are available on this route.\n\n`;
  }

  if (hasConnecting) {
    text += `🔄 **Verified Connecting Options (via Transit Hubs)**:\n\n`;
    connecting_routes.slice(0, 3).forEach((conn, i) => {
      text += `**Option ${i + 1}: Via ${conn.hub_name} (${conn.hub_code})**\n`;
      text += `• **Layover Transfer**: ${conn.layover_wait_time}\n`;
      text += `• **Total Duration**: ${conn.total_duration}\n`;
      conn.legs.forEach(leg => {
        text += `  - Leg ${leg.leg_number}: #${leg.train_number} ${leg.train_name} from ${leg.from_station} (${leg.departure_time}) to ${leg.to_station} (${leg.arrival_time})\n`;
      });
      text += `\n`;
    });
  }

  return text.trim();
}

/**
 * Grounded LLM Execution with Zero Temperature.
 * Adheres strictly to the architectural rule: Zero Generative Routing.
 */
async function generateGroundedResponse(userMessage, originInput, destInput, travelDate = null) {
  const transitData = await getGroundedTransitData(originInput, destInput, travelDate, userMessage);
  const dataXml = `<verified_transit_data>\n${JSON.stringify(transitData, null, 2)}\n</verified_transit_data>`;

  const systemInstruction = `You are TravelIQ's Grounded Routing Engine.
You must answer the user's inquiry using ONLY the data explicitly provided inside <verified_transit_data>.

RULES:
1. NEVER cite or invent any train number, operator name, timing, or fare not present in <verified_transit_data>.
2. If query.isDefaultDate is true, include the exact note: "Showing schedules for tomorrow (${transitData.query.date}). You can change the date anytime."
3. If <verified_transit_data> contains empty direct routes, explicitly state: "No direct trains are available on this route." Then present connecting hub options if provided.
4. If connecting options are displayed, explicitly mention the layover hub name and transfer wait time from the payload.
5. If the data is absent or empty, state: "No verified routes found for this date." Never guess or approximate.`;

  const fullPrompt = `${systemInstruction}\n\n${dataXml}\n\nUser Question: ${userMessage}`;

  // Try calling Gemini API with strict ZERO TEMPERATURE (0.0)
  const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (rawApiKey && rawApiKey.startsWith('AIzaSy')) {
    const geminiApiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        const response = await axios.post(url, {
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 800
          }
        }, { timeout: 8000 });

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
          const parts = response.data.candidates[0].content?.parts || [];
          if (parts.length > 0 && parts[0].text) {
            return {
              response: parts[0].text.trim(),
              transitData,
              grounded: true,
              source: 'gemini_zero_temp'
            };
          }
        }
      } catch (err) {
        break;
      }
    }
  }

  // Deterministic local grounded output adhering strictly to all rules
  const deterministicText = formatDeterministicGroundedResponse(transitData);
  return {
    response: deterministicText,
    transitData,
    grounded: true,
    source: 'deterministic_engine'
  };
}

module.exports = {
  resolveStation,
  getVerifiedDirectTrains,
  getVerifiedConnectingRoutes,
  getGroundedTransitData,
  formatDeterministicGroundedResponse,
  generateGroundedResponse
};
