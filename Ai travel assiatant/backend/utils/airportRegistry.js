// Comprehensive registry of operational commercial airports in India and major hubs.
// Non-airport cities/towns (e.g., Ballia, Buxar, Alwar, Mathura, Jhansi, Mirzapur, etc.) MUST NOT have flights.

const AIRPORT_REGISTRY = {
  // Metro & Major International / Domestic Airport Hubs
  'DEL': { iata: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', aliases: ['delhi', 'new delhi', 'ndls', 'dli', 'nzm', 'anvt', 'dec', 'dli'] },
  'BOM': { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', aliases: ['mumbai', 'bombay', 'bct', 'cstm', 'csmt', 'bdts', 'ltt', 'bvi', 'dadar', 'panvel'] },
  'BLR': { iata: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', aliases: ['bengaluru', 'bangalore', 'sbc', 'ypr', 'smvb', 'kjm', 'ynk'] },
  'MAA': { iata: 'MAA', name: 'Chennai International Airport', city: 'Chennai', aliases: ['chennai', 'madras', 'mas', 'ms', 'tbm', 'per'] },
  'CCU': { iata: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', aliases: ['kolkata', 'calcutta', 'hwh', 'sdah', 'koaa', 'shm', 'howrah', 'sealdah'] },
  'HYD': { iata: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', aliases: ['hyderabad', 'secunderabad', 'sc', 'kcg', 'hyb', 'lingampalli', 'lpi'] },
  'AMD': { iata: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', aliases: ['ahmedabad', 'adi', 'adij', 'sbt', 'sabarmati'] },
  'PNQ': { iata: 'PNQ', name: 'Pune International Airport', city: 'Pune', aliases: ['pune', 'pune jn', 'shivajinagar', 'svjr'] },
  'GOI': { iata: 'GOI', name: 'Dabolim Airport / Mopa Manohar International', city: 'Goa', aliases: ['goa', 'madgaon', 'mao', 'vasco da gama', 'vsg', 'karmali', 'krmi', 'thivim', 'gox'] },
  'JAI': { iata: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', aliases: ['jaipur', 'jp', 'dpa', 'gadhar'] },
  'LKO': { iata: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', aliases: ['lucknow', 'lko', 'ljn', 'ash', 'aishbagh'] },
  'PAT': { iata: 'PAT', name: 'Jay Prakash Narayan International Airport', city: 'Patna', aliases: ['patna', 'pnbe', 'danapur', 'dnr', 'rajendra nagar', 'rjpb', 'patliputra', 'ppta'] },
  'COK': { iata: 'COK', name: 'Cochin International Airport', city: 'Kochi', aliases: ['kochi', 'cochin', 'ernakulam', 'ers', 'ern', 'alwaye', 'awy'] },
  'GAU': { iata: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', aliases: ['guwahati', 'ghy', 'kamakhya', 'kyq'] },
  'IXC': { iata: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', aliases: ['chandigarh', 'cdg'] },
  'VNS': { iata: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', aliases: ['varanasi', 'bsb', 'manduadih', 'muv', 'banaras', 'pt deen dayal upadhyaya', 'ddu', 'mgs'] },
  'ATQ': { iata: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', aliases: ['amritsar', 'asr'] },
  'SXR': { iata: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', aliases: ['srinagar', 'sxr'] },
  'IXJ': { iata: 'IXJ', name: 'Jammu Airport', city: 'Jammu', aliases: ['jammu', 'jammu tawi', 'jat'] },
  'IDR': { iata: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', aliases: ['indore', 'indb'] },
  'BHO': { iata: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', aliases: ['bhopal', 'bpl', 'rani kamlapati', 'rkmp', 'habibganj', 'hbj'] },
  'BBI': { iata: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', aliases: ['bhubaneswar', 'bbs'] },
  'VTZ': { iata: 'VTZ', name: 'Visakhapatnam Airport', city: 'Visakhapatnam', aliases: ['visakhapatnam', 'vskp', 'vizag'] },
  'RPR': { iata: 'RPR', name: 'Swami Vivekananda Airport', city: 'Raipur', aliases: ['raipur', 'r', 'raipur jn'] },
  'IXR': { iata: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', aliases: ['ranchi', 'rnc', 'hatia', 'hte'] },
  'STV': { iata: 'STV', name: 'Surat International Airport', city: 'Surat', aliases: ['surat', 'st'] },
  'BDQ': { iata: 'BDQ', name: 'Vadodara Airport', city: 'Vadodara', aliases: ['vadodara', 'brc', 'baroda'] },
  'MDU': { iata: 'MDU', name: 'Madurai Airport', city: 'Madurai', aliases: ['madurai', 'mdu'] },
  'CJB': { iata: 'CJB', name: 'Coimbatore International Airport', city: 'Coimbatore', aliases: ['coimbatore', 'cbe'] },
  'TRZ': { iata: 'TRZ', name: 'Tiruchirappalli International Airport', city: 'Tiruchirappalli', aliases: ['tiruchirappalli', 'trichy', 'tpj'] },
  'CCJ': { iata: 'CCJ', name: 'Calicut International Airport', city: 'Kozhikode', aliases: ['kozhikode', 'calicut', 'clt'] },
  'CNN': { iata: 'CNN', name: 'Kannur International Airport', city: 'Kannur', aliases: ['kannur', 'can'] },
  'TRV': { iata: 'TRV', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram', aliases: ['thiruvananthapuram', 'trivandrum', 'tvc', 'kochuveli', 'kcvl'] },
  'IXE': { iata: 'IXE', name: 'Mangaluru International Airport', city: 'Mangalore', aliases: ['mangalore', 'mangaluru', 'maq', 'majn'] },
  'DED': { iata: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun', aliases: ['dehradun', 'ddn', 'rishikesh', 'haridwar', 'hw'] },
  'IXB': { iata: 'IXB', name: 'Bagdogra International Airport', city: 'Bagdogra / Siliguri', aliases: ['bagdogra', 'siliguri', 'ixb', 'new jalpaiguri', 'njp'] },
  'AGTL': { iata: 'IXA', name: 'Maharaja Bir Bikram Airport', city: 'Agartala', aliases: ['agartala', 'agtl', 'ixa'] },
  'IMF': { iata: 'IMF', name: 'Bir Tikendrajit International Airport', city: 'Imphal', aliases: ['imphal', 'imf'] },
  'DMU': { iata: 'DMU', name: 'Dimapur Airport', city: 'Dimapur', aliases: ['dimapur', 'dmu'] },
  'AJL': { iata: 'AJL', name: 'Lengpui Airport', city: 'Aizawl', aliases: ['aizawl', 'ajl'] },
  'SHL': { iata: 'SHL', name: 'Shillong Airport', city: 'Shillong', aliases: ['shillong', 'shl'] },
  'DIB': { iata: 'DIB', name: 'Dibrugarh Airport', city: 'Dibrugarh', aliases: ['dibrugarh', 'dib', 'dbrt', 'dbrg'] },
  'GAY': { iata: 'GAY', name: 'Gaya Airport', city: 'Gaya', aliases: ['gaya', 'gaya jn'] },
  'GWL': { iata: 'GWL', name: 'Rajmata Vijaya Raje Scindia Airport', city: 'Gwalior', aliases: ['gwalior', 'gwl'] },
  'JDH': { iata: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', aliases: ['jodhpur', 'ju'] },
  'JSA': { iata: 'JSA', name: 'Jaisalmer Airport', city: 'Jaisalmer', aliases: ['jaisalmer', 'jsa'] },
  'BKB': { iata: 'BKB', name: 'Nal Airport', city: 'Bikaner', aliases: ['bikaner', 'bkn', 'bkb'] },
  'UDR': { iata: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', aliases: ['udaipur', 'udz', 'udr'] },
  'AYJ': { iata: 'AYJ', name: 'Maharishi Valmiki International Airport', city: 'Ayodhya', aliases: ['ayodhya', 'ay', 'ayc', 'faizabad', 'fd'] },
  'TIR': { iata: 'TIR', name: 'Tirupati Airport', city: 'Tirupati', aliases: ['tirupati', 'tpty', 'ru', 'renigunta'] },
  'IXU': { iata: 'IXU', name: 'Aurangabad Airport', city: 'Chhatrapati Sambhajinagar', aliases: ['aurangabad', 'sambhajinagar', 'awb', 'ixu'] },
  'HBX': { iata: 'HBX', name: 'Hubballi Airport', city: 'Hubli', aliases: ['hubli', 'hubballi', 'ubl', 'hbx'] },
  'IXG': { iata: 'IXG', name: 'Belagavi Airport', city: 'Belgaum', aliases: ['belgaum', 'belagavi', 'bgm', 'ixg'] },
  'RAJ': { iata: 'RAJ', name: 'Rajkot Airport', city: 'Rajkot', aliases: ['rajkot', 'rjt', 'raj'] },
  'JBP': { iata: 'JLR', name: 'Dumna Airport', city: 'Jabalpur', aliases: ['jabalpur', 'jbp', 'jlr'] },
  'HJR': { iata: 'HJR', name: 'Khajuraho Airport', city: 'Khajuraho', aliases: ['khajuraho', 'kurj', 'hjr'] },
  'IXD': { iata: 'IXD', name: 'Prayagraj Airport', city: 'Prayagraj', aliases: ['prayagraj', 'allahabad', 'ald', 'pryj', 'ixd'] },
  'GOP': { iata: 'GOP', name: 'Mahayogi Gorakhnath Airport', city: 'Gorakhpur', aliases: ['gorakhpur', 'gkp', 'gop'] },
  'BEK': { iata: 'BEK', name: 'Bareilly Airport', city: 'Bareilly', aliases: ['bareilly', 'bry', 'be', 'bek'] },
  'KNU': { iata: 'KNU', name: 'Kanpur Chakeri Airport', city: 'Kanpur', aliases: ['kanpur', 'cnb', 'cpa', 'knu'] },
  'DBR': { iata: 'DBR', name: 'Darbhanga Airport', city: 'Darbhanga', aliases: ['darbhanga', 'dbg', 'dbr'] },
  'JRG': { iata: 'JRG', name: 'Veer Surendra Sai Airport', city: 'Jharsuguda', aliases: ['jharsuguda', 'jsg', 'jrg'] },
  'IXZ': { iata: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', aliases: ['port blair', 'ixz'] }
};

/**
 * Normalizes input string (station code or city name)
 */
function normalizeString(str) {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a given station code, station name, or city has a commercial operational airport
 * @param {string|object} location - Station code, name, or city
 * @returns {object|null} - Airport info if exists, null otherwise
 */
function resolveAirport(location) {
  if (!location) return null;
  
  let searchTerms = [];
  if (typeof location === 'string') {
    searchTerms.push(normalizeString(location));
    // also split words
    location.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 2) searchTerms.push(normalizeString(w));
    });
  } else if (typeof location === 'object') {
    if (location.station_code) searchTerms.push(normalizeString(location.station_code));
    if (location.station_name) searchTerms.push(normalizeString(location.station_name));
    if (location.city) searchTerms.push(normalizeString(location.city));
    if (location.name) searchTerms.push(normalizeString(location.name));
  }

  for (const [key, airport] of Object.entries(AIRPORT_REGISTRY)) {
    const normIata = normalizeString(airport.iata);
    const normCity = normalizeString(airport.city);
    const normName = normalizeString(airport.name);
    const normKey = normalizeString(key);
    const normAliases = airport.aliases.map(normalizeString);

    for (const term of searchTerms) {
      if (!term || term.length < 2) continue;
      if (
        term === normIata ||
        term === normKey ||
        term === normCity ||
        normAliases.includes(term) ||
        (normCity.includes(term) && term.length >= 4) ||
        (normName.includes(term) && term.length >= 5)
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

module.exports = {
  AIRPORT_REGISTRY,
  resolveAirport,
  hasCommercialAirport,
  areBothAirportCities
};
