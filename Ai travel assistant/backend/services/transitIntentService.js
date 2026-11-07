const { Station } = require('../models');
const { CITY_CLUSTERS, parseTravelDate, cleanCoreName } = require('./stationResolver');

/**
 * Common Indian city & station keyword dictionary for fast deterministic entity extraction
 */
const COMMON_STATIONS = [
  { keywords: ['tatanagar', 'tata', 'jamshedpur'], code: 'TATA', name: 'Tatanagar Jn' },
  { keywords: ['ballia', 'bui'], code: 'BUI', name: 'Ballia' },
  { keywords: ['new delhi', 'delhi', 'delh', 'ndls', 'dli', 'nizamuddin', 'nzm', 'anand vihar', 'anvt'], code: 'NDLS', name: 'New Delhi' },
  { keywords: ['patna', 'patna jn', 'patnaa', 'pnbe', 'patliputra', 'ppta', 'danapur', 'dnr', 'rajendra nagar', 'rjpb'], code: 'PNBE', name: 'Patna Jn' },
  { keywords: ['varanasi', 'bsb', 'banaras', 'kashi', 'ddu', 'mughalsarai'], code: 'BSB', name: 'Varanasi Jn' },
  { keywords: ['howrah', 'hwh', 'kolkata', 'calcutta', 'sealdah', 'sdah', 'shalimar'], code: 'HWH', name: 'Howrah Jn' },
  { keywords: ['mumbai', 'cstm', 'csmt', 'bombay', 'bct', 'bandra', 'bdts', 'lokmanya tilak', 'ltt'], code: 'CSMT', name: 'Mumbai CSMT' },
  { keywords: ['bhubaneswar', 'bbs'], code: 'BBS', name: 'Bhubaneswar' },
  { keywords: ['khurda', 'kurdha', 'khordha', 'kur', 'khurda road'], code: 'KUR', name: 'Khurda Road Jn' },
  { keywords: ['chhapra', 'cpr'], code: 'CPR', name: 'Chhapra Jn' },
  { keywords: ['gorakhpur', 'gkp'], code: 'GKP', name: 'Gorakhpur Jn' },
  { keywords: ['lucknow', 'lko', 'ljn', 'charbagh'], code: 'LKO', name: 'Lucknow Charbagh' },
  { keywords: ['kanpur', 'cnb', 'kanpur central'], code: 'CNB', name: 'Kanpur Central' },
  { keywords: ['prayagraj', 'pryj', 'allahabad', 'ald'], code: 'PRYJ', name: 'Prayagraj Jn' },
  { keywords: ['deen dayal upadhyaya', 'ddu', 'mughalsarai', 'mgs'], code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Jn' },
  { keywords: ['gaya'], code: 'GAYA', name: 'Gaya Jn' },
  { keywords: ['asansol', 'asn'], code: 'ASN', name: 'Asansol Jn' },
  { keywords: ['bangalore', 'bengaluru', 'sbc', 'ksr bengaluru', 'yesvantpur', 'ypr', 'smvb'], code: 'SBC', name: 'Bangalore City (KSR)' },
  { keywords: ['chennai', 'mas', 'chennai central', 'madras'], code: 'MAS', name: 'Chennai Central' },
  { keywords: ['hyderabad', 'secunderabad', 'sc', 'hyb', 'kcg'], code: 'SC', name: 'Secunderabad Jn' },
  { keywords: ['ahmedabad', 'adi'], code: 'ADI', name: 'Ahmedabad Jn' },
  { keywords: ['pune', 'pun'], code: 'PUNE', name: 'Pune Jn' },
  { keywords: ['jaipur', 'jp'], code: 'JP', name: 'Jaipur Jn' },
  { keywords: ['goa', 'madgaon', 'mao', 'vasco', 'vsg'], code: 'MAO', name: 'Madgaon Jn' },
  { keywords: ['amritsar', 'asr'], code: 'ASR', name: 'Amritsar Jn' },
  { keywords: ['bhopal', 'bpl', 'hbj', 'rkmp'], code: 'BPL', name: 'Bhopal Jn' },
  { keywords: ['guwahati', 'ghy'], code: 'GHY', name: 'Guwahati' },
  { keywords: ['ranchi', 'rnc', 'hatia', 'hte'], code: 'RNC', name: 'Ranchi Jn' },
  { keywords: ['puri'], code: 'PURI', name: 'Puri' }
];

/**
 * Checks if a message represents a transit, route, or train query.
 */
function isTransitRoutingQuery(message) {
  if (!message || typeof message !== 'string') return false;
  const lower = message.toLowerCase();

  const routingTriggers = [
    'train', 'trains', 'route', 'routes', 'from', ' to ', 'reach', 'travel',
    'transit', 'direct train', 'connecting', 'schedule', 'timing', 'fares',
    'ticket from', 'journey', 'tatanagar', 'ballia', 'patna', 'delhi',
    'form ', 'frm ', 'ticket', 'tickets', 'book'
  ];

  const hasTrigger = routingTriggers.some(t => lower.includes(t));
  if (!hasTrigger) return false;

  // Check if at least one station / city keyword is present in COMMON_STATIONS or CITY_CLUSTERS
  const hasCommon = COMMON_STATIONS.some(s => s.keywords.some(k => lower.includes(k)));
  if (hasCommon) return true;

  const hasCluster = CITY_CLUSTERS.some(c => c.synonyms.some(s => lower.includes(s)));
  return hasCluster;
}

/**
 * Strips conversational intent and action prefixes like "help me to book a train ticket"
 */
function stripIntentPrefix(msg) {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    .replace(/^(?:please\s+)?(?:help\s+(?:me\s+)?(?:to\s+)?|i\s+(?:want|need|wish)\s+to\s+|can\s+you\s+(?:please\s+)?(?:help\s+(?:me\s+)?(?:to\s+)?)?|how\s+(?:can\s+i|to)\s+|looking\s+to\s+)?(?:book|find|check|search|get|reserve|view)?\s*(?:me\s+)?(?:a\s+)?(?:train\s+)?(?:tickets?|seats?|routes?|transit)?\s*/i, '')
    .trim();
}

/**
 * Checks if a word or phrase matches a known Indian station or city cluster.
 */
function isKnownStationOrCluster(word) {
  if (!word || typeof word !== 'string') return false;
  const w = word.toLowerCase().trim();
  if (w.length < 2) return false;
  if (COMMON_STATIONS.some(s => s.code.toLowerCase() === w || s.keywords.some(k => k === w))) return true;
  if (CITY_CLUSTERS.some(c => c.primaryCode.toLowerCase() === w || c.synonyms.some(s => s === w))) return true;
  return false;
}

/**
 * Cleans extracted entity string to isolate the pure station/city name.
 */
function cleanEntityString(raw) {
  if (!raw) return '';
  return raw
    .replace(/^(?:show|find|search|check|is\s+there\s+any|any|give\s+me|get\s+me|list)?\s*(?:direct\s+)?(?:trains?|routes?|transit|travel)?\s*(?:from|form|frm|between)?\s*/i, '')
    .replace(/\b(?:trains?|direct|schedule|timings?|fares?|tickets?)\b/gi, '')
    .replace(/\b(?:sleeper|ac|general|tatkal|chair\s+car|executive|[123]a|2s|cc|ec|sl)\b/gi, '')
    .replace(/\b(?:at|on|for|by|in|dated?|around)\s*$/i, '')
    .replace(/[?.!,]/g, '')
    .trim();
}

/**
 * Extracts origin and destination from message.
 */
function extractTransitEntities(message) {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase().trim();
  const cleanedText = stripIntentPrefix(lower);

  let origin = null;
  let destination = null;

  // Pattern 1: "... from/form <origin> to <destination> ..."
  // Tested on both cleanedText and raw lower
  const fromToRegex = /(?:from|form|frm|fom|between|btwn)\s+([a-zA-Z\s]+?)\s+(?:to|and|➔|->|-->)\s+([a-zA-Z\s]+?)(?:\s+(?:on|at|for|by|in|dated?|tomorrow|today|\d{4}|\d{1,2})|$|[?.!,])/i;
  for (const text of [cleanedText, lower]) {
    const fromToMatch = text.match(fromToRegex);
    if (fromToMatch) {
      const rawOrigin = cleanEntityString(fromToMatch[1]);
      const rawDest = cleanEntityString(fromToMatch[2]);
      if (rawOrigin && rawDest) {
        origin = rawOrigin;
        destination = rawDest;
        break;
      }
    }
  }

  // Pattern 2: "<origin> to <destination>" (excluding verbs like "to book", "to travel")
  if (!origin || !destination || (!isKnownStationOrCluster(origin) && !isKnownStationOrCluster(destination))) {
    const simpleToRegex = /(?:^|\s)([a-zA-Z\s]+?)\s+(?:to|➔|->|-->)\s+(?!book|go|travel|reach|find|get|check|reserve)([a-zA-Z\s]+?)(?:\s+(?:on|at|for|by|in|dated?|tomorrow|today|\d{4}|\d{1,2})|$|[?.!,])/i;
    for (const text of [cleanedText, lower]) {
      const match = text.match(simpleToRegex);
      if (match) {
        const rawOrigin = cleanEntityString(match[1]);
        const rawDest = cleanEntityString(match[2]);
        if (rawOrigin && rawDest && (isKnownStationOrCluster(rawOrigin) || isKnownStationOrCluster(rawDest))) {
          origin = rawOrigin;
          destination = rawDest;
          break;
        }
      }
    }
  }

  // Pattern 3: Fallback using station / cluster keywords order in text
  if (!origin || !destination || (!isKnownStationOrCluster(origin) && !isKnownStationOrCluster(destination))) {
    const found = [];
    COMMON_STATIONS.forEach(stn => {
      stn.keywords.forEach(kw => {
        const idx = lower.indexOf(kw);
        if (idx !== -1) {
          found.push({ index: idx, code: stn.code, name: stn.name, kwLength: kw.length });
        }
      });
    });
    CITY_CLUSTERS.forEach(cluster => {
      cluster.synonyms.forEach(syn => {
        const idx = lower.indexOf(syn);
        if (idx !== -1) {
          found.push({ index: idx, code: cluster.primaryCode, name: cluster.city, kwLength: syn.length });
        }
      });
    });

    found.sort((a, b) => a.index - b.index);

    if (found.length >= 2) {
      const first = found[0];
      const second = found.find(f => f.code !== first.code);
      if (second) {
        origin = first.name || first.code;
        destination = second.name || second.code;
      }
    }
  }

  // Parse travel date with intelligent fallback to tomorrow
  const dateResult = parseTravelDate(lower);

  // Detect preferred travel class
  let travelClass = null;
  if (/\b(?:sleeper|sl)\b/i.test(lower)) travelClass = 'SL';
  else if (/\b(?:3a|3rd\s*ac|3\s*ac|third\s*ac)\b/i.test(lower)) travelClass = '3A';
  else if (/\b(?:2a|2nd\s*ac|2\s*ac|second\s*ac)\b/i.test(lower)) travelClass = '2A';
  else if (/\b(?:1a|1st\s*ac|1\s*ac|first\s*ac)\b/i.test(lower)) travelClass = '1A';
  else if (/\b(?:cc|chair\s*car)\b/i.test(lower)) travelClass = 'CC';
  else if (/\b(?:2s|second\s*sitting)\b/i.test(lower)) travelClass = '2S';

  if (origin && destination) {
    return {
      origin: origin.trim(),
      destination: destination.trim(),
      travelDate: dateResult.travelDate,
      travelClass,
      isDefaultDate: dateResult.isDefaultDate,
      dateNotice: dateResult.dateNotice
    };
  }

  return null;
}

module.exports = {
  isTransitRoutingQuery,
  extractTransitEntities,
  COMMON_STATIONS
};
