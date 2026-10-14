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
    'ticket from', 'journey', 'tatanagar', 'ballia', 'patna', 'delhi'
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
 * Cleans extracted entity string to isolate the pure station/city name.
 */
function cleanEntityString(raw) {
  if (!raw) return '';
  return raw
    .replace(/^(?:show|find|search|check|is\s+there\s+any|any|give\s+me|get\s+me|list)?\s*(?:direct\s+)?(?:trains?|routes?|transit|travel)?\s*(?:from|between)?\s*/i, '')
    .replace(/\b(?:trains?|direct|schedule|timings?|fares?|tickets?)\b/gi, '')
    .replace(/[?.!,]/g, '')
    .trim();
}

/**
 * Extracts origin and destination from message.
 */
function extractTransitEntities(message) {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase().trim();

  let origin = null;
  let destination = null;

  // Pattern 1: "... from <origin> to <destination> ..."
  const fromToRegex = /(?:from|between)\s+([a-zA-Z\s]+?)\s+(?:to|and|➔|->|-->)\s+([a-zA-Z\s]+?)(?:\s+(?:on|for|tomorrow|today|\d{4}|\d{1,2})|$|[?.!,])/i;
  const fromToMatch = lower.match(fromToRegex);
  if (fromToMatch) {
    const rawOrigin = cleanEntityString(fromToMatch[1]);
    const rawDest = cleanEntityString(fromToMatch[2]);
    if (rawOrigin && rawDest) {
      origin = rawOrigin;
      destination = rawDest;
    }
  }

  // Pattern 2: "<origin> to <destination>" e.g. "Tatanagar to Ballia", "Delhi to Patna"
  if (!origin || !destination) {
    const simpleToRegex = /([a-zA-Z\s]+?)\s+(?:to|➔|->|-->)\s+([a-zA-Z\s]+?)(?:\s+(?:on|for|tomorrow|today|\d{4}|\d{1,2})|$|[?.!,])/i;
    const match = lower.match(simpleToRegex);
    if (match) {
      const rawOrigin = cleanEntityString(match[1]);
      const rawDest = cleanEntityString(match[2]);
      if (rawOrigin && rawDest) {
        origin = rawOrigin;
        destination = rawDest;
      }
    }
  }

  // Pattern 3: Fallback using station / cluster keywords order in text
  if (!origin || !destination) {
    const found = [];
    COMMON_STATIONS.forEach(stn => {
      stn.keywords.forEach(kw => {
        const idx = lower.indexOf(kw);
        if (idx !== -1) {
          found.push({ index: idx, code: stn.code, name: stn.name, kwLength: kw.length });
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

  if (origin && destination) {
    return {
      origin: origin.trim(),
      destination: destination.trim(),
      travelDate: dateResult.travelDate,
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
