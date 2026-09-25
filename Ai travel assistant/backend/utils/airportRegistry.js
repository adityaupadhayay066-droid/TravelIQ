// Comprehensive registry of operational commercial airports in India and major hubs.
// Non-airport cities/towns (e.g., Ballia, Buxar, Alwar, Mathura, Jhansi, Mirzapur, etc.) MUST NOT have direct flights.

const AIRPORT_REGISTRY = {
  // Metro & Major International / Domestic Airport Hubs
  'DEL': { iata: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', lat: 28.5562, lng: 77.1000, aliases: ['delhi', 'new delhi', 'ndls', 'dli', 'nzm', 'anvt', 'dec'] },
  'BOM': { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', lat: 19.0896, lng: 72.8656, aliases: ['mumbai', 'bombay', 'bct', 'cstm', 'csmt', 'bdts', 'ltt', 'bvi', 'dadar', 'panvel'] },
  'BLR': { iata: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', lat: 13.1986, lng: 77.7066, aliases: ['bengaluru', 'bangalore', 'sbc', 'ypr', 'smvb', 'kjm', 'ynk'] },
  'MAA': { iata: 'MAA', name: 'Chennai International Airport', city: 'Chennai', lat: 12.9941, lng: 80.1709, aliases: ['chennai', 'madras', 'mas', 'ms', 'tbm', 'per'] },
  'CCU': { iata: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', lat: 22.6547, lng: 88.4467, aliases: ['kolkata', 'calcutta', 'hwh', 'sdah', 'koaa', 'shm', 'howrah', 'sealdah'] },
  'HYD': { iata: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', lat: 17.2403, lng: 78.4294, aliases: ['hyderabad', 'secunderabad', 'sc', 'kcg', 'hyb', 'lingampalli', 'lpi'] },
  'AMD': { iata: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', lat: 23.0734, lng: 72.6347, aliases: ['ahmedabad', 'adi', 'adij', 'sbt', 'sabarmati'] },
  'PNQ': { iata: 'PNQ', name: 'Pune International Airport', city: 'Pune', lat: 18.5822, lng: 73.9197, aliases: ['pune', 'pune jn', 'shivajinagar', 'svjr'] },
  'GOI': { iata: 'GOI', name: 'Dabolim Airport / Mopa Manohar International', city: 'Goa', lat: 15.3808, lng: 73.8313, aliases: ['goa', 'madgaon', 'mao', 'vasco da gama', 'vsg', 'karmali', 'krmi', 'thivim', 'gox'] },
  'JAI': { iata: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', lat: 26.8242, lng: 75.8122, aliases: ['jaipur', 'jp', 'dpa', 'gadhar'] },
  'LKO': { iata: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', lat: 26.7606, lng: 80.8893, aliases: ['lucknow', 'lko', 'ljn', 'ash', 'aishbagh'] },
  'PAT': { iata: 'PAT', name: 'Jay Prakash Narayan International Airport', city: 'Patna', lat: 25.5913, lng: 85.0880, aliases: ['patna', 'pnbe', 'danapur', 'dnr', 'rajendra nagar', 'rjpb', 'patliputra', 'ppta'] },
  'COK': { iata: 'COK', name: 'Cochin International Airport', city: 'Kochi', lat: 10.1556, lng: 76.4019, aliases: ['kochi', 'cochin', 'ernakulam', 'ers', 'ern', 'alwaye', 'awy'] },
  'GAU': { iata: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', lat: 26.1061, lng: 91.5859, aliases: ['guwahati', 'ghy', 'kamakhya', 'kyq'] },
  'IXC': { iata: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', lat: 30.6735, lng: 76.7885, aliases: ['chandigarh', 'cdg'] },
  'VNS': { iata: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', lat: 25.4524, lng: 82.8593, aliases: ['varanasi', 'bsb', 'manduadih', 'muv', 'banaras', 'pt deen dayal upadhyaya', 'ddu', 'mgs'] },
  'ATQ': { iata: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', lat: 31.7096, lng: 74.7973, aliases: ['amritsar', 'asr'] },
  'SXR': { iata: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', lat: 33.9871, lng: 74.7741, aliases: ['srinagar', 'sxr'] },
  'IXJ': { iata: 'IXJ', name: 'Jammu Airport', city: 'Jammu', lat: 32.6891, lng: 74.8374, aliases: ['jammu', 'jammu tawi', 'jat'] },
  'IDR': { iata: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', lat: 22.7217, lng: 75.8011, aliases: ['indore', 'indb'] },
  'BHO': { iata: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', lat: 23.2875, lng: 77.3378, aliases: ['bhopal', 'bpl', 'rani kamlapati', 'rkmp', 'habibganj', 'hbj'] },
  'BBI': { iata: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', lat: 20.2444, lng: 85.8178, aliases: ['bhubaneswar', 'bbs'] },
  'VTZ': { iata: 'VTZ', name: 'Visakhapatnam Airport', city: 'Visakhapatnam', lat: 17.7212, lng: 83.2245, aliases: ['visakhapatnam', 'vskp', 'vizag'] },
  'RPR': { iata: 'RPR', name: 'Swami Vivekananda Airport', city: 'Raipur', lat: 21.1804, lng: 81.7388, aliases: ['raipur', 'r', 'raipur jn'] },
  'IXR': { iata: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', lat: 23.3143, lng: 85.3217, aliases: ['ranchi', 'rnc', 'hatia', 'hte'] },
  'STV': { iata: 'STV', name: 'Surat International Airport', city: 'Surat', lat: 21.1139, lng: 72.7419, aliases: ['surat', 'st'] },
  'BDQ': { iata: 'BDQ', name: 'Vadodara Airport', city: 'Vadodara', lat: 22.3362, lng: 73.2263, aliases: ['vadodara', 'brc', 'baroda'] },
  'MDU': { iata: 'MDU', name: 'Madurai Airport', city: 'Madurai', lat: 9.8345, lng: 78.0934, aliases: ['madurai', 'mdu'] },
  'CJB': { iata: 'CJB', name: 'Coimbatore International Airport', city: 'Coimbatore', lat: 11.0299, lng: 77.0434, aliases: ['coimbatore', 'cbe'] },
  'TRZ': { iata: 'TRZ', name: 'Tiruchirappalli International Airport', city: 'Tiruchirappalli', lat: 10.7654, lng: 78.7097, aliases: ['tiruchirappalli', 'trichy', 'tpj'] },
  'CCJ': { iata: 'CCJ', name: 'Calicut International Airport', city: 'Kozhikode', lat: 11.1368, lng: 75.9553, aliases: ['kozhikode', 'calicut', 'clt'] },
  'CNN': { iata: 'CNN', name: 'Kannur International Airport', city: 'Kannur', lat: 11.9194, lng: 75.5484, aliases: ['kannur', 'can'] },
  'TRV': { iata: 'TRV', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram', lat: 8.4821, lng: 76.9200, aliases: ['thiruvananthapuram', 'trivandrum', 'tvc', 'kochuveli', 'kcvl'] },
  'IXE': { iata: 'IXE', name: 'Mangaluru International Airport', city: 'Mangalore', lat: 12.9613, lng: 74.8901, aliases: ['mangalore', 'mangaluru', 'maq', 'majn'] },
  'DED': { iata: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun', lat: 30.1897, lng: 78.1803, aliases: ['dehradun', 'ddn', 'rishikesh', 'haridwar', 'hw'] },
  'IXB': { iata: 'IXB', name: 'Bagdogra International Airport', city: 'Bagdogra / Siliguri', lat: 26.6812, lng: 88.3286, aliases: ['bagdogra', 'siliguri', 'ixb', 'new jalpaiguri', 'njp'] },
  'AGTL': { iata: 'IXA', name: 'Maharaja Bir Bikram Airport', city: 'Agartala', lat: 23.8869, lng: 91.2405, aliases: ['agartala', 'agtl', 'ixa'] },
  'IMF': { iata: 'IMF', name: 'Bir Tikendrajit International Airport', city: 'Imphal', lat: 24.7600, lng: 93.8967, aliases: ['imphal', 'imf'] },
  'DMU': { iata: 'DMU', name: 'Dimapur Airport', city: 'Dimapur', lat: 25.8839, lng: 93.7711, aliases: ['dimapur', 'dmu'] },
  'AJL': { iata: 'AJL', name: 'Lengpui Airport', city: 'Aizawl', lat: 23.8406, lng: 92.6192, aliases: ['aizawl', 'ajl'] },
  'SHL': { iata: 'SHL', name: 'Shillong Airport', city: 'Shillong', lat: 25.7036, lng: 91.9787, aliases: ['shillong', 'shl'] },
  'DIB': { iata: 'DIB', name: 'Dibrugarh Airport', city: 'Dibrugarh', lat: 27.4839, lng: 95.0178, aliases: ['dibrugarh', 'dib', 'dbrt', 'dbrg'] },
  'GAY': { iata: 'GAY', name: 'Gaya Airport', city: 'Gaya', lat: 24.7443, lng: 84.9512, aliases: ['gaya', 'gaya jn'] },
  'GWL': { iata: 'GWL', name: 'Rajmata Vijaya Raje Scindia Airport', city: 'Gwalior', lat: 26.2933, lng: 78.2278, aliases: ['gwalior', 'gwl'] },
  'JDH': { iata: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', lat: 26.2511, lng: 73.0489, aliases: ['jodhpur', 'ju'] },
  'JSA': { iata: 'JSA', name: 'Jaisalmer Airport', city: 'Jaisalmer', lat: 26.8887, lng: 70.8651, aliases: ['jaisalmer', 'jsa'] },
  'BKB': { iata: 'BKB', name: 'Nal Airport', city: 'Bikaner', lat: 28.0706, lng: 73.2064, aliases: ['bikaner', 'bkn', 'bkb'] },
  'UDR': { iata: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', lat: 24.6178, lng: 73.8961, aliases: ['udaipur', 'udz', 'udr'] },
  'AYJ': { iata: 'AYJ', name: 'Maharishi Valmiki International Airport', city: 'Ayodhya', lat: 26.7444, lng: 82.1539, aliases: ['ayodhya', 'ay', 'ayc', 'faizabad', 'fd'] },
  'TIR': { iata: 'TIR', name: 'Tirupati Airport', city: 'Tirupati', lat: 13.6325, lng: 79.5433, aliases: ['tirupati', 'tpty', 'ru', 'renigunta'] },
  'IXU': { iata: 'IXU', name: 'Aurangabad Airport', city: 'Chhatrapati Sambhajinagar', lat: 19.8631, lng: 75.3981, aliases: ['aurangabad', 'sambhajinagar', 'awb', 'ixu'] },
  'HBX': { iata: 'HBX', name: 'Hubballi Airport', city: 'Hubli', lat: 15.3617, lng: 75.0849, aliases: ['hubli', 'hubballi', 'ubl', 'hbx'] },
  'IXG': { iata: 'IXG', name: 'Belagavi Airport', city: 'Belgaum', lat: 15.8593, lng: 74.6183, aliases: ['belgaum', 'belagavi', 'bgm', 'ixg'] },
  'RAJ': { iata: 'RAJ', name: 'Rajkot Airport', city: 'Rajkot', lat: 22.3092, lng: 70.7794, aliases: ['rajkot', 'rjt', 'raj'] },
  'JBP': { iata: 'JLR', name: 'Dumna Airport', city: 'Jabalpur', lat: 23.1778, lng: 80.0522, aliases: ['jabalpur', 'jbp', 'jlr'] },
  'HJR': { iata: 'HJR', name: 'Khajuraho Airport', city: 'Khajuraho', lat: 24.8172, lng: 79.9192, aliases: ['khajuraho', 'kurj', 'hjr'] },
  'IXD': { iata: 'IXD', name: 'Prayagraj Airport', city: 'Prayagraj', lat: 25.4403, lng: 81.7342, aliases: ['prayagraj', 'allahabad', 'ald', 'pryj', 'ixd'] },
  'GOP': { iata: 'GOP', name: 'Mahayogi Gorakhnath Airport', city: 'Gorakhpur', lat: 26.7397, lng: 83.4497, aliases: ['gorakhpur', 'gkp', 'gop'] },
  'BEK': { iata: 'BEK', name: 'Bareilly Airport', city: 'Bareilly', lat: 28.4222, lng: 79.4503, aliases: ['bareilly', 'bry', 'be', 'bek'] },
  'KNU': { iata: 'KNU', name: 'Kanpur Chakeri Airport', city: 'Kanpur', lat: 26.4411, lng: 80.4128, aliases: ['kanpur', 'cnb', 'cpa', 'knu'] },
  'DBR': { iata: 'DBR', name: 'Darbhanga Airport', city: 'Darbhanga', lat: 26.1953, lng: 85.9189, aliases: ['darbhanga', 'dbg', 'dbr'] },
  'JRG': { iata: 'JRG', name: 'Veer Surendra Sai Airport', city: 'Jharsuguda', lat: 21.9142, lng: 84.0506, aliases: ['jharsuguda', 'jsg', 'jrg'] },
  'IXZ': { iata: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', lat: 11.6414, lng: 92.7297, aliases: ['port blair', 'ixz'] }
};

/**
 * Well-known city coordinate fallbacks for non-airport cities
 */
const KNOWN_CITY_COORDINATES = {
  'ballia': { lat: 25.7615, lng: 84.1487, city: 'Ballia' },
  'buxar': { lat: 25.5647, lng: 83.9777, city: 'Buxar' },
  'mathura': { lat: 27.4924, lng: 77.6737, city: 'Mathura' },
  'jhansi': { lat: 25.4484, lng: 78.5685, city: 'Jhansi' },
  'alwar': { lat: 27.5530, lng: 76.6346, city: 'Alwar' },
  'mirzapur': { lat: 25.1460, lng: 82.5690, city: 'Mirzapur' },
  'chhapra': { lat: 25.7848, lng: 84.7274, city: 'Chhapra' },
  'siwan': { lat: 26.2196, lng: 84.3567, city: 'Siwan' },
  'haridwar': { lat: 29.9457, lng: 78.1642, city: 'Haridwar' },
  'rishikesh': { lat: 30.0869, lng: 78.2676, city: 'Rishikesh' },
  'roorkee': { lat: 29.8543, lng: 77.8880, city: 'Roorkee' },
  'muzaffarnagar': { lat: 29.4727, lng: 77.7085, city: 'Muzaffarnagar' },
  'meerut': { lat: 28.9845, lng: 77.7064, city: 'Meerut' },
  'moradabad': { lat: 28.8386, lng: 78.7733, city: 'Moradabad' },
  'aligarh': { lat: 27.8974, lng: 78.0880, city: 'Aligarh' }
};

/**
 * Normalizes input string (station code or city name)
 */
function normalizeString(str) {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Haversine formula to compute great circle distance in km
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Common stop words in airport names to avoid matching generic terms
 */
const AIRPORT_STOP_WORDS = new Set(['airport', 'international', 'domestic', 'terminal', 'aerodrome', 'scindia', 'maharishi', 'valmiki', 'shri', 'guru']);

/**
 * Checks if a given station code, station name, or city has a commercial operational airport
 * @param {string|object} location - Station code, name, or city
 * @returns {object|null} - Airport info if exists, null otherwise
 */
function resolveAirport(location) {
  if (!location) return null;
  
  let searchTerms = new Set();
  if (typeof location === 'string') {
    const raw = location.toLowerCase().trim();
    searchTerms.add(normalizeString(raw));
    raw.split(/[\s,/-]+/).forEach(w => {
      const norm = normalizeString(w);
      if (norm.length >= 2 && !AIRPORT_STOP_WORDS.has(norm)) {
        searchTerms.add(norm);
      }
    });
  } else if (typeof location === 'object') {
    if (location.station_code) searchTerms.add(normalizeString(location.station_code));
    if (location.city) {
      searchTerms.add(normalizeString(location.city));
      location.city.toLowerCase().split(/[\s,/-]+/).forEach(w => {
        const norm = normalizeString(w);
        if (norm.length >= 2 && !AIRPORT_STOP_WORDS.has(norm)) searchTerms.add(norm);
      });
    }
    if (location.station_name) {
      searchTerms.add(normalizeString(location.station_name));
      location.station_name.toLowerCase().split(/[\s,/-]+/).forEach(w => {
        const norm = normalizeString(w);
        if (norm.length >= 2 && !AIRPORT_STOP_WORDS.has(norm)) searchTerms.add(norm);
      });
    }
    if (location.name) {
      searchTerms.add(normalizeString(location.name));
    }
  }

  for (const [key, airport] of Object.entries(AIRPORT_REGISTRY)) {
    const normIata = normalizeString(airport.iata);
    const normCity = normalizeString(airport.city);
    const normKey = normalizeString(key);
    const normAliases = (airport.aliases || []).map(normalizeString);
    const nameWords = airport.name.toLowerCase().split(/[\s,/-]+/).map(normalizeString).filter(w => w.length >= 3 && !AIRPORT_STOP_WORDS.has(w));

    for (const term of searchTerms) {
      if (!term || term.length < 2) continue;
      if (
        term === normIata ||
        term === normKey ||
        term === normCity ||
        normAliases.includes(term) ||
        nameWords.includes(term)
      ) {
        return airport;
      }
    }
  }

  return null;
}

/**
 * Returns true only if the location has an operational commercial airport
 */
function hasCommercialAirport(location) {
  return resolveAirport(location) !== null;
}

/**
 * Returns true strictly if BOTH source and destination have operational airports
 */
function areBothAirportCities(source, destination) {
  const sourceAirport = resolveAirport(source);
  const destAirport = resolveAirport(destination);
  return Boolean(sourceAirport && destAirport && sourceAirport.iata !== destAirport.iata);
}

/**
 * Finds the nearest commercial airport for a given non-airport city or station
 * @param {string|object} location - Station code, name, city or location object
 * @param {number} maxDistanceKm - Maximum search radius in km (default: 300)
 * @returns {object|null} - { airport, distanceKm, travelTimeHours, groundMode }
 */
function getNearestAirport(location, maxDistanceKm = 300) {
  if (!location) return null;

  // Direct airport check
  const directAirport = resolveAirport(location);
  if (directAirport) {
    return {
      airport: directAirport,
      distanceKm: 0,
      travelTimeHours: 0,
      groundMode: 'Local'
    };
  }

  // Resolve location coordinates
  let locLat = null;
  let locLng = null;

  if (typeof location === 'object') {
    if (location.latitude && location.longitude) {
      locLat = Number(location.latitude);
      locLng = Number(location.longitude);
    }
  }

  const locNorm = typeof location === 'string' ? normalizeString(location) : normalizeString(location.city || location.station_name || '');
  if (!locLat && KNOWN_CITY_COORDINATES[locNorm]) {
    locLat = KNOWN_CITY_COORDINATES[locNorm].lat;
    locLng = KNOWN_CITY_COORDINATES[locNorm].lng;
  }

  // Fallback lookups for known non-airport regions
  if (!locLat) {
    if (locNorm.includes('ballia') || locNorm.includes('bui')) {
      locLat = 25.7615; locLng = 84.1487; // Patna PAT ~110km, Varanasi VNS ~135km
    } else if (locNorm.includes('buxar') || locNorm.includes('bxr')) {
      locLat = 25.5647; locLng = 83.9777; // Patna PAT ~115km, Varanasi VNS ~110km
    } else if (locNorm.includes('mathura') || locNorm.includes('mtj')) {
      locLat = 27.4924; locLng = 77.6737; // Delhi DEL ~140km
    } else if (locNorm.includes('alwar') || locNorm.includes('awr')) {
      locLat = 27.5530; locLng = 76.6346; // Jaipur JAI ~150km, Delhi DEL ~140km
    } else if (locNorm.includes('jhansi') || locNorm.includes('jhs')) {
      locLat = 25.4484; locLng = 78.5685; // Gwalior GWL ~100km
    } else if (locNorm.includes('mirzapur') || locNorm.includes('mzp')) {
      locLat = 25.1460; locLng = 82.5690; // Varanasi VNS ~65km
    } else if (locNorm.includes('rishikesh') || locNorm.includes('haridwar')) {
      locLat = 30.0869; locLng = 78.2676; // Dehradun DED ~20km
    }
  }

  if (!locLat || !locLng) {
    return null;
  }

  let closestAirport = null;
  let minDistance = Infinity;

  for (const airport of Object.values(AIRPORT_REGISTRY)) {
    if (!airport.lat || !airport.lng) continue;
    const dist = calculateDistanceKm(locLat, locLng, airport.lat, airport.lng);
    if (dist < minDistance && dist <= maxDistanceKm) {
      minDistance = dist;
      closestAirport = airport;
    }
  }

  if (closestAirport) {
    // Average ground speed ~ 50 km/h with buffer
    const travelTimeHours = Math.round((minDistance / 50 + 0.5) * 10) / 10;
    return {
      airport: closestAirport,
      distanceKm: minDistance,
      travelTimeHours,
      groundMode: minDistance <= 80 ? 'Taxi/Cab' : 'Bus / Regional Train'
    };
  }

  return null;
}

module.exports = {
  AIRPORT_REGISTRY,
  KNOWN_CITY_COORDINATES,
  resolveAirport,
  hasCommercialAirport,
  areBothAirportCities,
  getNearestAirport,
  calculateDistanceKm
};

