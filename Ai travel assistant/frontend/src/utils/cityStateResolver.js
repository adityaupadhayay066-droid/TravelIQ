/**
 * City and State resolution utility for TravelIQ.
 * Normalizes station codes, city aliases, and regions across India.
 */

export const CITY_STATE_MAP = {
  // Jharkhand
  'jamshedpur': { city: 'Jamshedpur', state: 'Jharkhand' },
  'tata': { city: 'Jamshedpur', state: 'Jharkhand' },
  'tatanagar': { city: 'Jamshedpur', state: 'Jharkhand' },
  'tata nagar': { city: 'Jamshedpur', state: 'Jharkhand' },
  'ranchi': { city: 'Ranchi', state: 'Jharkhand' },
  'rnc': { city: 'Ranchi', state: 'Jharkhand' },
  'dhanbad': { city: 'Dhanbad', state: 'Jharkhand' },
  'dhn': { city: 'Dhanbad', state: 'Jharkhand' },
  'bokaro': { city: 'Bokaro', state: 'Jharkhand' },
  'deoghar': { city: 'Deoghar', state: 'Jharkhand' },

  // Goa
  'goa': { city: 'Goa', state: 'Goa' },
  'madgaon': { city: 'Goa', state: 'Goa' },
  'mao': { city: 'Goa', state: 'Goa' },
  'thivim': { city: 'Goa', state: 'Goa' },
  'thvm': { city: 'Goa', state: 'Goa' },
  'panaji': { city: 'Panaji', state: 'Goa' },
  'panjim': { city: 'Panaji', state: 'Goa' },
  'vasco': { city: 'Vasco da Gama', state: 'Goa' },
  'vasco da gama': { city: 'Vasco da Gama', state: 'Goa' },
  'calangute': { city: 'Calangute', state: 'Goa' },
  'candolim': { city: 'Candolim', state: 'Goa' },
  'anjuna': { city: 'Anjuna', state: 'Goa' },
  'baga': { city: 'Baga', state: 'Goa' },

  // Delhi NCR
  'delhi': { city: 'Delhi', state: 'Delhi' },
  'new delhi': { city: 'New Delhi', state: 'Delhi' },
  'ndls': { city: 'New Delhi', state: 'Delhi' },
  'dli': { city: 'Old Delhi', state: 'Delhi' },
  'nzm': { city: 'Delhi', state: 'Delhi' },
  'del': { city: 'Delhi', state: 'Delhi' },
  'noida': { city: 'Noida', state: 'Uttar Pradesh' },
  'gurgaon': { city: 'Gurugram', state: 'Haryana' },
  'gurugram': { city: 'Gurugram', state: 'Haryana' },

  // Maharashtra
  'mumbai': { city: 'Mumbai', state: 'Maharashtra' },
  'bombay': { city: 'Mumbai', state: 'Maharashtra' },
  'cstm': { city: 'Mumbai', state: 'Maharashtra' },
  'bom': { city: 'Mumbai', state: 'Maharashtra' },
  'bct': { city: 'Mumbai', state: 'Maharashtra' },
  'bdts': { city: 'Mumbai', state: 'Maharashtra' },
  'pune': { city: 'Pune', state: 'Maharashtra' },
  'pnq': { city: 'Pune', state: 'Maharashtra' },
  'nagpur': { city: 'Nagpur', state: 'Maharashtra' },
  'ngp': { city: 'Nagpur', state: 'Maharashtra' },
  'nashik': { city: 'Nashik', state: 'Maharashtra' },
  'shirdi': { city: 'Shirdi', state: 'Maharashtra' },

  // Karnataka
  'bangalore': { city: 'Bangalore', state: 'Karnataka' },
  'bengaluru': { city: 'Bengaluru', state: 'Karnataka' },
  'blr': { city: 'Bengaluru', state: 'Karnataka' },
  'sbc': { city: 'Bengaluru', state: 'Karnataka' },
  'ypr': { city: 'Bengaluru', state: 'Karnataka' },
  'mysore': { city: 'Mysore', state: 'Karnataka' },
  'mysuru': { city: 'Mysuru', state: 'Karnataka' },
  'mangalore': { city: 'Mangalore', state: 'Karnataka' },
  'hampi': { city: 'Hampi', state: 'Karnataka' },

  // West Bengal
  'kolkata': { city: 'Kolkata', state: 'West Bengal' },
  'calcutta': { city: 'Kolkata', state: 'West Bengal' },
  'hwh': { city: 'Kolkata', state: 'West Bengal' },
  'sdah': { city: 'Kolkata', state: 'West Bengal' },
  'koaa': { city: 'Kolkata', state: 'West Bengal' },
  'ccu': { city: 'Kolkata', state: 'West Bengal' },
  'darjeeling': { city: 'Darjeeling', state: 'West Bengal' },
  'siliguri': { city: 'Siliguri', state: 'West Bengal' },

  // Kerala
  'kochi': { city: 'Kochi', state: 'Kerala' },
  'cochin': { city: 'Kochi', state: 'Kerala' },
  'ernakulam': { city: 'Kochi', state: 'Kerala' },
  'ers': { city: 'Kochi', state: 'Kerala' },
  'cok': { city: 'Kochi', state: 'Kerala' },
  'trivandrum': { city: 'Trivandrum', state: 'Kerala' },
  'thiruvananthapuram': { city: 'Thiruvananthapuram', state: 'Kerala' },
  'tvc': { city: 'Thiruvananthapuram', state: 'Kerala' },
  'munnar': { city: 'Munnar', state: 'Kerala' },
  'alleppey': { city: 'Alleppey', state: 'Kerala' },
  'alappuzha': { city: 'Alappuzha', state: 'Kerala' },

  // Rajasthan
  'jaipur': { city: 'Jaipur', state: 'Rajasthan' },
  'jp': { city: 'Jaipur', state: 'Rajasthan' },
  'udaipur': { city: 'Udaipur', state: 'Rajasthan' },
  'jodhpur': { city: 'Jodhpur', state: 'Rajasthan' },
  'jaisalmer': { city: 'Jaisalmer', state: 'Rajasthan' },
  'pushkar': { city: 'Pushkar', state: 'Rajasthan' },

  // Uttar Pradesh
  'varanasi': { city: 'Varanasi', state: 'Uttar Pradesh' },
  'banaras': { city: 'Varanasi', state: 'Uttar Pradesh' },
  'kashi': { city: 'Varanasi', state: 'Uttar Pradesh' },
  'bsb': { city: 'Varanasi', state: 'Uttar Pradesh' },
  'agra': { city: 'Agra', state: 'Uttar Pradesh' },
  'agc': { city: 'Agra', state: 'Uttar Pradesh' },
  'lucknow': { city: 'Lucknow', state: 'Uttar Pradesh' },
  'lko': { city: 'Lucknow', state: 'Uttar Pradesh' },
  'prayagraj': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  'pryj': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  'ayodhya': { city: 'Ayodhya', state: 'Uttar Pradesh' },
  'mathura': { city: 'Mathura', state: 'Uttar Pradesh' },
  'kanpur': { city: 'Kanpur', state: 'Uttar Pradesh' },

  // Himachal Pradesh
  'manali': { city: 'Manali', state: 'Himachal Pradesh' },
  'shimla': { city: 'Shimla', state: 'Himachal Pradesh' },
  'dharamshala': { city: 'Dharamshala', state: 'Himachal Pradesh' },
  'kullu': { city: 'Kullu', state: 'Himachal Pradesh' },
  'kasol': { city: 'Kasol', state: 'Himachal Pradesh' },

  // Uttarakhand
  'dehradun': { city: 'Dehradun', state: 'Uttarakhand' },
  'rishikesh': { city: 'Rishikesh', state: 'Uttarakhand' },
  'haridwar': { city: 'Haridwar', state: 'Uttarakhand' },
  'nainital': { city: 'Nainital', state: 'Uttarakhand' },
  'mussoorie': { city: 'Mussoorie', state: 'Uttarakhand' },

  // Tamil Nadu
  'chennai': { city: 'Chennai', state: 'Tamil Nadu' },
  'madras': { city: 'Chennai', state: 'Tamil Nadu' },
  'mas': { city: 'Chennai', state: 'Tamil Nadu' },
  'coimbatore': { city: 'Coimbatore', state: 'Tamil Nadu' },
  'madurai': { city: 'Madurai', state: 'Tamil Nadu' },

  // Telangana & Andhra Pradesh
  'hyderabad': { city: 'Hyderabad', state: 'Telangana' },
  'secunderabad': { city: 'Secunderabad', state: 'Telangana' },
  'hyd': { city: 'Hyderabad', state: 'Telangana' },
  'sc': { city: 'Hyderabad', state: 'Telangana' },
  'visakhapatnam': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'vizag': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'tirupati': { city: 'Tirupati', state: 'Andhra Pradesh' },

  // Odisha
  'bhubaneswar': { city: 'Bhubaneswar', state: 'Odisha' },
  'bbsr': { city: 'Bhubaneswar', state: 'Odisha' },
  'puri': { city: 'Puri', state: 'Odisha' },

  // Bihar
  'patna': { city: 'Patna', state: 'Bihar' },
  'pnbe': { city: 'Patna', state: 'Bihar' },
  'gaya': { city: 'Gaya', state: 'Bihar' },

  // Punjab
  'amritsar': { city: 'Amritsar', state: 'Punjab' },
  'asr': { city: 'Amritsar', state: 'Punjab' },
  'chandigarh': { city: 'Chandigarh', state: 'Punjab' },

  // Gujarat
  'ahmedabad': { city: 'Ahmedabad', state: 'Gujarat' },
  'surat': { city: 'Surat', state: 'Gujarat' },
  'vadodara': { city: 'Vadodara', state: 'Gujarat' },

  // Jammu & Kashmir
  'srinagar': { city: 'Srinagar', state: 'Jammu and Kashmir' },
  'jammu': { city: 'Jammu', state: 'Jammu and Kashmir' },

  // Assam & Sikkim
  'guwahati': { city: 'Guwahati', state: 'Assam' },
  'gangtok': { city: 'Gangtok', state: 'Sikkim' }
};

/**
 * Resolves a city name and state from any query string or station object.
 * @param {string|object} input 
 * @returns {{ city: string, state: string }}
 */
export function resolveCityAndState(input) {
  if (!input) return { city: '', state: '' };

  if (typeof input === 'object') {
    const cityName = input.city || input.station_name || '';
    const stateName = input.state || '';
    if (stateName && cityName) return { city: cityName, state: stateName };
    if (cityName) return resolveCityAndState(cityName);
  }

  const raw = String(input).trim();
  if (!raw) return { city: '', state: '' };

  const lower = raw.toLowerCase();

  // Direct map lookup
  if (CITY_STATE_MAP[lower]) {
    return { ...CITY_STATE_MAP[lower] };
  }

  // Remove trailing station suffixes e.g. "Jamshedpur Junction", "Tatanagar Jn"
  const stripped = lower.replace(/\s*(junction|jn|jn\.|city|cantt|cantt\.|airport|railway station|station|terminal)$/i, '').trim();
  if (stripped && CITY_STATE_MAP[stripped]) {
    return { ...CITY_STATE_MAP[stripped] };
  }

  // Fallback: title case the raw string
  const capitalized = raw
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return { city: capitalized, state: '' };
}

/**
 * Extracts a numeric guest count from a string like "2 Guests, 1 Room" or "1".
 * @param {string|number} val 
 * @returns {number}
 */
export function parseGuestsCount(val) {
  if (typeof val === 'number') return Math.max(1, Math.floor(val));
  if (!val) return 1;
  const match = String(val).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}
