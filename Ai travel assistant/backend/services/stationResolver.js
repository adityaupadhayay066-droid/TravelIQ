const { Station, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * ════════════════════════════════════════════════════════════════════════════
 * STATION CLUSTER REGISTRY & SYNONYM DICTIONARY
 * ════════════════════════════════════════════════════════════════════════════
 * Multi-station clusters across major Indian metropolitan & transit hubs.
 * Maps city names, station aliases, airport/railway colloquial names, and common typos.
 */
const CITY_CLUSTERS = [
  {
    city: 'Delhi',
    primaryCode: 'NDLS',
    stationCodes: ['NDLS', 'DLI', 'ANVT', 'NZM'],
    synonyms: [
      'delhi', 'delh', 'new delhi', 'old delhi', 'anand vihar', 'anand vihar terminal',
      'nizamuddin', 'hazrat nizamuddin', 'dilli', 'ndls', 'dli', 'anvt', 'nzm', 'dlh'
    ]
  },
  {
    city: 'Patna',
    primaryCode: 'PNBE',
    stationCodes: ['PNBE', 'PPTA', 'DNR', 'RJPB'],
    synonyms: [
      'patna', 'patna jn', 'patna junction', 'patliputra', 'pataliputra',
      'danapur', 'rajendra nagar', 'rajendranagar', 'pnbe', 'ppta', 'dnr', 'rjpb',
      'patnaa', 'patna city'
    ]
  },
  {
    city: 'Tatanagar',
    primaryCode: 'TATA',
    stationCodes: ['TATA'],
    synonyms: [
      'tata', 'tatanagar', 'jamshedpur', 'tatanagar jn', 'tatanagar junction',
      'tatanagr', 'tatangar', 'tatanagarr', 'tata nagar'
    ]
  },
  {
    city: 'Kolkata',
    primaryCode: 'HWH',
    stationCodes: ['HWH', 'SDAH', 'KOAA', 'SHM'],
    synonyms: [
      'calcutta', 'kolkata', 'howrah', 'sealdah', 'kolkata terminal', 'shalimar',
      'hwh', 'sdah', 'koaa', 'shm', 'kolkatta', 'culcutta', 'howrah jn'
    ]
  },
  {
    city: 'Mumbai',
    primaryCode: 'CSMT',
    stationCodes: ['CSMT', 'BDTS', 'LTT', 'BCT'],
    synonyms: [
      'bombay', 'mumbai', 'csmt', 'cstm', 'bandra', 'bandra terminus', 'bdts',
      'lokmanya tilak', 'lokmanya tilak terminus', 'ltt', 'mumbai central',
      'bct', 'bomby', 'mumbay', 'dadar'
    ]
  },
  {
    city: 'Bengaluru',
    primaryCode: 'SBC',
    stationCodes: ['SBC', 'YPR', 'SMVB', 'BNC'],
    synonyms: [
      'bangalore', 'bengaluru', 'ksr bengaluru', 'yesvantpur', 'yeshwantpur',
      'smvt bengaluru', 'bangalore cantt', 'sbc', 'ypr', 'smvb', 'bnc', 'banglore'
    ]
  },
  {
    city: 'Chennai',
    primaryCode: 'MAS',
    stationCodes: ['MAS', 'MS', 'TBM'],
    synonyms: [
      'chennai', 'madras', 'chennai central', 'chennai egmore', 'tambaram',
      'mas', 'ms', 'tbm', 'chenai'
    ]
  },
  {
    city: 'Hyderabad',
    primaryCode: 'SC',
    stationCodes: ['SC', 'HYB', 'KCG'],
    synonyms: [
      'hyderabad', 'secunderabad', 'kacheguda', 'hyb', 'sc', 'kcg',
      'hydrabad', 'secundrabad'
    ]
  },
  {
    city: 'Varanasi',
    primaryCode: 'BSB',
    stationCodes: ['BSB', 'BSBS', 'DDU'],
    synonyms: [
      'varanasi', 'banaras', 'kashi', 'deen dayal upadhyaya', 'mughalsarai',
      'bsb', 'bsbs', 'ddu', 'mgs', 'varnasi', 'benares'
    ]
  },
  {
    city: 'Lucknow',
    primaryCode: 'LKO',
    stationCodes: ['LKO', 'LJN'],
    synonyms: [
      'lucknow', 'lucknow charbagh', 'lucknow jn', 'charbagh', 'lko', 'ljn', 'lakhnow'
    ]
  },
  {
    city: 'Kanpur',
    primaryCode: 'CNB',
    stationCodes: ['CNB'],
    synonyms: [
      'kanpur', 'kanpur central', 'cnb', 'kanpur jn', 'kannpur'
    ]
  },
  {
    city: 'Prayagraj',
    primaryCode: 'PRYJ',
    stationCodes: ['PRYJ'],
    synonyms: [
      'prayagraj', 'allahabad', 'pryj', 'ald', 'prayagraj jn'
    ]
  },
  {
    city: 'Ballia',
    primaryCode: 'BUI',
    stationCodes: ['BUI'],
    synonyms: [
      'ballia', 'bui', 'balia', 'baliya'
    ]
  },
  {
    city: 'Gorakhpur',
    primaryCode: 'GKP',
    stationCodes: ['GKP'],
    synonyms: [
      'gorakhpur', 'gkp', 'gorakhpur jn'
    ]
  },
  {
    city: 'Ranchi',
    primaryCode: 'RNC',
    stationCodes: ['RNC', 'HTE'],
    synonyms: [
      'ranchi', 'hatia', 'rnc', 'hte', 'ranchi jn'
    ]
  },
  {
    city: 'Gaya',
    primaryCode: 'GAYA',
    stationCodes: ['GAYA'],
    synonyms: [
      'gaya', 'gaya jn', 'bodhgaya'
    ]
  },
  {
    city: 'Bhubaneswar',
    primaryCode: 'BBS',
    stationCodes: ['BBS'],
    synonyms: [
      'bhubaneswar', 'bhubaneshwar', 'bbs', 'bhubaneswar jn'
    ]
  },
  {
    city: 'Puri',
    primaryCode: 'PURI',
    stationCodes: ['PURI'],
    synonyms: [
      'puri', 'jagannath puri'
    ]
  },
  {
    city: 'Ahmedabad',
    primaryCode: 'ADI',
    stationCodes: ['ADI'],
    synonyms: [
      'ahmedabad', 'ahmadabad', 'adi', 'kalupur'
    ]
  },
  {
    city: 'Pune',
    primaryCode: 'PUNE',
    stationCodes: ['PUNE'],
    synonyms: [
      'pune', 'pune jn', 'poona'
    ]
  },
  {
    city: 'Jaipur',
    primaryCode: 'JP',
    stationCodes: ['JP'],
    synonyms: [
      'jaipur', 'jaipur jn', 'jp', 'pink city'
    ]
  },
  {
    city: 'Bhopal',
    primaryCode: 'BPL',
    stationCodes: ['BPL', 'HBJ', 'RKMP'],
    synonyms: [
      'bhopal', 'habibganj', 'rani kamlapati', 'bpl', 'hbj', 'rkmp'
    ]
  },
  {
    city: 'Amritsar',
    primaryCode: 'ASR',
    stationCodes: ['ASR'],
    synonyms: [
      'amritsar', 'amritsar jn', 'asr'
    ]
  }
];

/**
 * ════════════════════════════════════════════════════════════════════════════
 * LEVENSHTEIN DISTANCE & STRING NORMALIZATION
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Normalizes input string by lowercasing, stripping punctuation,
 * and removing common railway noise suffixes (station, jn, terminal, etc.).
 */
function normalizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips noise railway words from user input for clean core matching.
 */
function cleanCoreName(input) {
  const norm = normalizeInput(input);
  return norm
    .replace(/\b(railway|station|junction|jn|terminal|trm|cantt|city|central|express)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein edit distance between two strings.
 */
function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const a = s1;
  const b = s2;
  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);

  for (let i = 0; i <= b.length; i++) v0[i] = i;

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }

  return v1[b.length];
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * RESOLVE STATION PIPELINE
 * ════════════════════════════════════════════════════════════════════════════
 * Strict Entity Resolution & Fuzzy Station Matching.
 * Returns StationMatch with multi-station cluster codes.
 */
async function resolveStation(input) {
  if (!input || typeof input !== 'string') return null;

  const rawClean = input.trim().toUpperCase();
  const normalized = normalizeInput(input);
  const core = cleanCoreName(input);

  // 1. Direct station code check against city cluster primary/station codes
  for (const cluster of CITY_CLUSTERS) {
    if (cluster.stationCodes.includes(rawClean)) {
      return {
        cityName: cluster.city,
        primaryStationCode: cluster.primaryCode,
        stationCodes: cluster.stationCodes,
        matchedVia: 'cluster_code',
        displayName: `${cluster.city} Area (${cluster.stationCodes.join(', ')})`
      };
    }
  }

  // 2. Exact city synonym match
  for (const cluster of CITY_CLUSTERS) {
    if (cluster.synonyms.includes(normalized) || (core && cluster.synonyms.includes(core))) {
      return {
        cityName: cluster.city,
        primaryStationCode: cluster.primaryCode,
        stationCodes: cluster.stationCodes,
        matchedVia: 'city_synonym',
        displayName: `${cluster.city} Area (${cluster.stationCodes.join(', ')})`
      };
    }
  }

  // 3. Substring containment match in synonyms
  for (const cluster of CITY_CLUSTERS) {
    for (const syn of cluster.synonyms) {
      if (syn.length >= 4 && (normalized.includes(syn) || (core && core.includes(syn)))) {
        return {
          cityName: cluster.city,
          primaryStationCode: cluster.primaryCode,
          stationCodes: cluster.stationCodes,
          matchedVia: 'synonym_containment',
          displayName: `${cluster.city} Area (${cluster.stationCodes.join(', ')})`
        };
      }
    }
  }

  // 4. Fuzzy Levenshtein matching on cluster synonyms (edit distance <= 2)
  let bestCluster = null;
  let minDistance = Infinity;

  const targetWord = core || normalized;
  if (targetWord.length >= 3) {
    for (const cluster of CITY_CLUSTERS) {
      for (const syn of cluster.synonyms) {
        // Skip comparing short abbreviations (e.g. 2-3 char codes) with long words
        if (Math.abs(syn.length - targetWord.length) > 2) continue;

        const dist = levenshteinDistance(targetWord, syn);
        if (dist <= 2 && dist < minDistance) {
          minDistance = dist;
          bestCluster = cluster;
        }
      }
    }
  }

  if (bestCluster && minDistance <= 2) {
    return {
      cityName: bestCluster.city,
      primaryStationCode: bestCluster.primaryCode,
      stationCodes: bestCluster.stationCodes,
      matchedVia: 'fuzzy_cluster',
      displayName: `${bestCluster.city} Area (${bestCluster.stationCodes.join(', ')})`
    };
  }

  // 5. Database lookup in stations table (exact station_code or station_name)
  try {
    let dbStation = await Station.findOne({
      where: { station_code: rawClean }
    });

    if (!dbStation) {
      dbStation = await Station.findOne({
        where: {
          [Op.or]: [
            { station_name: rawClean },
            sequelize.where(sequelize.fn('LOWER', sequelize.col('station_name')), normalized),
            sequelize.where(sequelize.fn('LOWER', sequelize.col('city')), normalized)
          ]
        }
      });
    }

    if (!dbStation && core.length >= 3) {
      dbStation = await Station.findOne({
        where: {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('station_name')),
              'LIKE',
              `%${core}%`
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('city')),
              'LIKE',
              `%${core}%`
            )
          ]
        }
      });
    }

    if (dbStation) {
      return {
        cityName: dbStation.city || dbStation.station_name,
        primaryStationCode: dbStation.station_code,
        stationCodes: [dbStation.station_code],
        matchedVia: 'db_station',
        displayName: `${dbStation.station_name} (${dbStation.station_code})`
      };
    }
  } catch (dbErr) {
    console.warn('[StationResolver] DB lookup warning:', dbErr.message);
  }

  // 6. Fallback: Treat as individual station code or raw string
  return {
    cityName: input.trim(),
    primaryStationCode: rawClean,
    stationCodes: [rawClean],
    matchedVia: 'fallback',
    displayName: `${input.trim()} (${rawClean})`
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * INTELLIGENT DATE FALLBACK & PARSING
 * ════════════════════════════════════════════════════════════════════════════
 * If travel date is not specified in the user's natural language input:
 * - Defaults automatically to Tomorrow's Date (YYYY-MM-DD).
 * - Generates date notice: "Showing schedules for tomorrow ([Date]). You can change the date anytime."
 */
function parseTravelDate(text) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (!text || typeof text !== 'string') {
    return {
      travelDate: tomorrowStr,
      isDefaultDate: true,
      dateNotice: `Showing schedules for tomorrow (${tomorrowStr}). You can change the date anytime.`
    };
  }

  const lower = text.toLowerCase();

  // 1. Explicit keyword: "today", "tonight"
  if (/\b(today|tonight)\b/i.test(lower)) {
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      travelDate: todayStr,
      isDefaultDate: false,
      dateNotice: null
    };
  }

  // 2. Explicit keyword: "tomorrow", "tmrw"
  if (/\b(tomorrow|tmrw|kal)\b/i.test(lower)) {
    return {
      travelDate: tomorrowStr,
      isDefaultDate: false,
      dateNotice: null
    };
  }

  // 3. Weekday name: "monday", "next friday", etc.
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayName = weekdays[dayIdx];
    const regex = new RegExp(`\\b(?:on\\s+|next\\s+|this\\s+)?${dayName}\\b`, 'i');
    if (regex.test(lower)) {
      const now = new Date();
      const currentDay = now.getDay();
      let diff = dayIdx - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + diff);
      const targetStr = targetDate.toISOString().split('T')[0];
      return {
        travelDate: targetStr,
        isDefaultDate: false,
        dateNotice: null
      };
    }
  }

  // 4. ISO Date format: YYYY-MM-DD
  const isoMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return {
      travelDate: isoMatch[1],
      isDefaultDate: false,
      dateNotice: null
    };
  }

  // 5. Common Indian date format: DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyyMatch = lower.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return {
      travelDate: `${year}-${month}-${day}`,
      isDefaultDate: false,
      dateNotice: null
    };
  }

  // 6. Day + Month text: e.g. "15th Oct", "15 October", "Oct 15"
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const textDateMatch = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i) ||
                        lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);

  if (textDateMatch) {
    let day = textDateMatch[1];
    let monthStr = textDateMatch[2];
    if (isNaN(parseInt(day, 10))) {
      monthStr = textDateMatch[1];
      day = textDateMatch[2];
    }
    const currentYear = new Date().getFullYear();
    const mm = monthMap[monthStr.substring(0, 3).toLowerCase()];
    if (mm) {
      const dd = day.padStart(2, '0');
      return {
        travelDate: `${currentYear}-${mm}-${dd}`,
        isDefaultDate: false,
        dateNotice: null
      };
    }
  }

  // 7. Fallback: User did not specify date -> Default to Tomorrow
  return {
    travelDate: tomorrowStr,
    isDefaultDate: true,
    dateNotice: `Showing schedules for tomorrow (${tomorrowStr}). You can change the date anytime.`
  };
}

module.exports = {
  CITY_CLUSTERS,
  normalizeInput,
  cleanCoreName,
  levenshteinDistance,
  resolveStation,
  parseTravelDate
};
