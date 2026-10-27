/**
 * Hotel Service — Loads hotel data from CSV and provides search/filter methods.
 * 
 * The CSV is read once at startup and cached in memory for fast lookups.
 * All search operations work against the cached data.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const crypto = require('crypto');

// ─── In-memory hotel cache & reservations ───
let hotelsCache = [];
let reservationsCache = [];
let isLoaded = false;

// Helper to generate slug ID
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generate realistic room/bed categories based on property category & base price
 */
function generateRoomTypes(hotel) {
  const basePrice = Math.round(hotel.price || 1200);
  const isHostel = hotel.isHostel;

  if (isHostel) {
    return [
      {
        id: 'dorm-mixed-8',
        name: 'Standard Mixed Dorm (8-Bed)',
        bedType: '1 Bunk Bed in 8-Bed Shared Room',
        capacity: '1 Guest',
        pricePerNight: Math.max(350, Math.round(basePrice * 0.75)),
        availableUnits: 6,
        badge: 'Most Popular',
        amenities: ['Air Conditioning', 'Secure Locker', 'Reading Light', 'Power Socket', 'Shared Bathroom', 'Free High-Speed Wi-Fi'],
        cancellation: 'Free cancellation up to 24 hours prior',
        mealPlan: 'Room Only'
      },
      {
        id: 'dorm-female-6',
        name: 'Female-Only Dorm (6-Bed)',
        bedType: '1 Bunk Bed in 6-Bed Female Sanctuary',
        capacity: '1 Guest',
        pricePerNight: Math.max(450, Math.round(basePrice * 0.85)),
        availableUnits: 4,
        badge: 'Female Travelers Choice',
        amenities: ['Ensuite Bathroom', 'Electronic Locker', 'Full-length Mirror', 'Air Conditioning', 'Reading Light', 'Free High-Speed Wi-Fi'],
        cancellation: 'Free cancellation up to 24 hours prior',
        mealPlan: 'Room Only'
      },
      {
        id: 'private-deluxe',
        name: 'Deluxe Private Room (King Bed)',
        bedType: '1 Large Double Bed',
        capacity: '2 Guests',
        pricePerNight: Math.round(basePrice * 1.6),
        availableUnits: 2,
        badge: 'Private & Quiet',
        amenities: ['Private Attached Bathroom', 'King Sized Bed', 'Smart TV', 'Air Conditioning', 'Tea/Coffee Maker', 'Work Desk'],
        cancellation: 'Free cancellation up to 24 hours prior',
        mealPlan: 'Room Only'
      },
      {
        id: 'capsule-pod',
        name: 'Futuristic Single Capsule Pod',
        bedType: '1 Soundproof Sleep Pod',
        capacity: '1 Guest',
        pricePerNight: Math.max(500, Math.round(basePrice * 0.95)),
        availableUnits: 5,
        badge: 'Smart Capsule',
        amenities: ['Sound Insulation', 'Ambient Mood Lighting', 'USB Fast Charger', 'Privacy Blind', 'Air Ventilation', 'Free Wi-Fi'],
        cancellation: 'Free cancellation up to 24 hours prior',
        mealPlan: 'Room Only'
      }
    ];
  }

  if (hotel.category === '5-Star Luxury' || hotel.category === '4-Star Premium') {
    return [
      {
        id: 'deluxe-king',
        name: 'Deluxe City View Room',
        bedType: '1 King Bed or 2 Twin Beds',
        capacity: '2 Adults, 1 Child',
        pricePerNight: basePrice,
        availableUnits: 5,
        badge: 'Standard Luxury',
        amenities: ['Premium Linen', 'Marble Bathroom & Rain Shower', 'Smart 55" TV', 'Espresso Machine', '24/7 In-room Dining', 'High-Speed Wi-Fi'],
        cancellation: 'Free cancellation up to 48 hours prior',
        mealPlan: 'Room Only'
      },
      {
        id: 'executive-suite',
        name: 'Executive Club Suite + Lounge Access',
        bedType: '1 Extra Large King Bed + Living Area',
        capacity: '3 Adults',
        pricePerNight: Math.round(basePrice * 1.45),
        availableUnits: 3,
        badge: 'VIP Club Access',
        amenities: ['Complimentary High Tea & Cocktails', 'Deep Soaking Bathtub', 'Panoramic Skyline View', 'Airport Chauffeur Transfer', 'Free Breakfast Buffet'],
        cancellation: 'Free cancellation up to 24 hours prior',
        mealPlan: 'Complimentary Buffet Breakfast'
      },
      {
        id: 'presidential-suite',
        name: 'Grand Signature Suite',
        bedType: 'Master Suite + Dining Area',
        capacity: '4 Guests',
        pricePerNight: Math.round(basePrice * 2.2),
        availableUnits: 1,
        badge: 'Ultimate Luxury',
        amenities: ['Dedicated Personal Butler', 'Jacuzzi', 'Private Balcony', 'Walk-in Wardrobe', 'Complimentary Minibar', 'All Meals Included'],
        cancellation: 'Free cancellation anytime',
        mealPlan: 'All Meals Included'
      }
    ];
  }

  // Budget / 3-Star Standard / Homestay
  return [
    {
      id: 'standard-classic',
      name: 'Classic Comfort Double Room',
      bedType: '1 Queen Bed',
      capacity: '2 Guests',
      pricePerNight: Math.max(600, Math.round(basePrice * 0.9)),
      availableUnits: 4,
      badge: 'Best Value',
      amenities: ['Attached Bathroom', 'Air Conditioning', 'Free Wi-Fi', 'Daily Housekeeping', 'Geyser / Hot Water', 'Flat TV'],
      cancellation: 'Free cancellation up to 24 hours prior',
      mealPlan: 'Room Only'
    },
    {
      id: 'deluxe-triple',
      name: 'Deluxe Family / Triple Room',
      bedType: '1 King Bed + 1 Single Bed',
      capacity: '3 Guests',
      pricePerNight: Math.round(basePrice * 1.35),
      availableUnits: 3,
      badge: 'Spacious for Groups',
      amenities: ['Air Conditioning', 'Free Breakfast', 'Large Bathroom', 'Balcony / Window View', 'Electric Kettle', 'Free Wi-Fi'],
      cancellation: 'Free cancellation up to 24 hours prior',
      mealPlan: 'Free Breakfast Included'
    }
  ];
}

/**
 * Load hotel data from the CSV file into memory.
 */
function loadHotelData() {
  return new Promise((resolve) => {
    const csvPath = path.join(__dirname, '..', 'data', 'google_hotel_data_clean_v2.csv');

    if (!fs.existsSync(csvPath)) {
      console.warn('⚠️  Hotel dataset not found at:', csvPath);
      console.warn('   Hotel recommendations will not be available.');
      resolve(false);
      return;
    }

    const hotels = [];
    let rowIdx = 0;

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          rowIdx++;
          const name = (row.Hotel_Name || '').trim();
          if (!name) return;

          const rating = parseFloat(row.Hotel_Rating) || null;
          const city = (row.City || '').trim().toLowerCase();
          const price = parseFloat(row.Hotel_Price) || null;

          const features = [];
          for (const col of FEATURE_COLS) {
            const val = (row[col] || '').trim();
            if (val && val !== '0') {
              features.push(val);
            }
          }

          let type = null;
          const firstFeature = (row.Feature_1 || '').trim();
          if (firstFeature && firstFeature !== '0') {
            const starMatch = firstFeature.match(/^(\d)-star hotel$/i);
            if (starMatch) {
              type = `${starMatch[1]}-Star Hotel`;
            } else if (['Apartment', 'House', 'Villa', 'Bungalow', 'Resort'].some(t => 
              firstFeature.toLowerCase().includes(t.toLowerCase())
            )) {
              type = firstFeature;
            }
          }

          const hasRestaurant = features.some(f => f.toLowerCase() === 'restaurant');

          // Intelligent Hostel & Accommodation Classification
          const nameLower = name.toLowerCase();
          const featText = features.join(' ').toLowerCase();

          const isHostel = (
            nameLower.includes('hostel') ||
            nameLower.includes('hosteller') ||
            nameLower.includes('dormitory') ||
            nameLower.includes('dorm') ||
            nameLower.includes('capsule') ||
            nameLower.includes('pod') ||
            nameLower.includes('backpacker') ||
            nameLower.includes('bunk') ||
            nameLower.includes('zostel') ||
            featText.includes('dormitory') ||
            featText.includes('sleeps 28') ||
            featText.includes('sleeps 10')
          );

          let category = 'Budget & Homestay';
          if (isHostel) {
            category = 'Hostel & Dormitory';
          } else if (type && type.includes('5-Star') || (price && price >= 12000) || ['taj', 'marriott', 'hyatt', 'lalit', 'leela', 'westin', 'radisson', 'hilton', 'oberoi', 'itc'].some(b => nameLower.includes(b))) {
            category = '5-Star Luxury';
          } else if (type && type.includes('4-Star') || (price && price >= 4000 && price < 12000)) {
            category = '4-Star Premium';
          } else if (type && (type.includes('3-Star') || type.includes('2-Star'))) {
            category = '3-Star Standard';
          } else if (type && ['Resort', 'Villa', 'Bungalow', 'Cottages'].some(t => type.includes(t)) || featText.includes('pool') && featText.includes('spa')) {
            category = 'Resort & Villa';
          } else if (type && ['Apartment', 'House'].some(t => type.includes(t))) {
            category = 'Apartment & Home';
          }

          const ratingCount = Math.floor(150 + ((name.length * 37 + (price || 1000)) % 1850));

          const hotel = {
            id: `htl-${slugify(city)}-${slugify(name.slice(0, 20))}-${rowIdx}`,
            name,
            rating,
            ratingCount,
            city,
            price,
            features,
            type: type || (isHostel ? 'Hostel / Dormitory' : 'Standard Stay'),
            category,
            isHostel,
            hasRestaurant,
            checkIn: '12:00 PM',
            checkOut: '11:00 AM',
            policies: {
              freeCancellation: true,
              payAtProperty: true,
              instantConfirmation: true
            }
          };

          hotel.roomTypes = generateRoomTypes(hotel);
          hotels.push(hotel);
        } catch (parseErr) {
          console.warn('⚠️ Skipped malformed hotel row:', parseErr.message);
        }
      })
      .on('end', () => {
        hotelsCache = hotels;
        isLoaded = true;
        console.log(`✅ Hotel dataset loaded: ${hotels.length} stays (${hotels.filter(h => h.isHostel).length} hostels/dorms) across ${getAvailableCities().length} cities.`);
        resolve(true);
      })
      .on('error', (err) => {
        console.error('❌ Error reading hotel CSV:', err.message);
        resolve(false);
      });
  });
}

// ─── City alias map for robust destination matching ───
// Maps common alternate names, station codes, and abbreviations to dataset cities.
const CITY_ALIASES = {
  'tata': 'jamshedpur',
  'tatanagar': 'jamshedpur',
  'tata nagar': 'jamshedpur',
  'ndls': 'delhi',
  'del': 'delhi',
  'dli': 'delhi',
  'nzm': 'delhi',
  'new delhi': 'delhi',
  'old delhi': 'delhi',
  'cstm': 'mumbai',
  'bom': 'mumbai',
  'bct': 'mumbai',
  'bdts': 'mumbai',
  'bombay': 'mumbai',
  'bbi': 'bhubaneswar',
  'bbsr': 'bhubaneswar',
  'bhubaneswar': 'bhubaneswar',
  'bengaluru': 'bangalore',
  'blr': 'bangalore',
  'sbc': 'bangalore',
  'ypr': 'bangalore',
  'calcutta': 'kolkata',
  'hwh': 'kolkata',
  'sdah': 'kolkata',
  'koaa': 'kolkata',
  'ccu': 'kolkata',
  'cochin': 'kochi',
  'ernakulam': 'kochi',
  'ers': 'kochi',
  'ern': 'kochi',
  'cok': 'kochi',
  'thiruvananthapuram': 'trivandrum',
  'tvc': 'trivandrum',
  'prayagraj': 'allahabad',
  'ald': 'allahabad',
  'pryj': 'allahabad',
  'pondichéry': 'pondicherry',
  'puducherry': 'pondicherry',
  'madras': 'chennai',
  'mas': 'chennai',
  'ms': 'chennai',
  'maa': 'chennai',
  'poona': 'pune',
  'pnq': 'pune',
  'cuttack': 'bhubaneswar',
  'shimoga': 'mangalore',
  'mysuru': 'mysore',
  'baroda': 'vadodara',
  'brc': 'vadodara',
  'gurgaon': 'delhi',
  'gurugram': 'delhi',
  'ghaziabad': 'delhi',
  'noida': 'delhi',
  'jammu': 'kashmir',
  'jat': 'kashmir',
  'svdk': 'kashmir',
  'srinagar': 'kashmir',
  'gangtok': 'sikkim',
  'pelling': 'sikkim',
  'varanashi': 'varanasi',
  'banaras': 'varanasi',
  'bsb': 'varanasi',
  'kashi': 'varanasi',
  'patna': 'patna',
  'pnbe': 'patna',
  'pat': 'patna',
  'jaipur': 'jaipur',
  'jp': 'jaipur',
  'goa': 'goa',
  'madgaon': 'goa',
  'mao': 'goa',
  'thvm': 'goa',
  'manali': 'manali',
  'kullu': 'manali',
  'bhuntar': 'manali',
  'shimla': 'shimla',
  'sml': 'shimla',
  'agra': 'agra',
  'agc': 'agra',
  'amritsar': 'amritsar',
  'asr': 'amritsar',
  'hyderabad': 'hyderabad',
  'secunderabad': 'hyderabad',
  'sc': 'hyderabad',
  'hyd': 'hyderabad'
};

// ─── Feature columns in the CSV ───
const FEATURE_COLS = [
  'Feature_1', 'Feature_2', 'Feature_3', 'Feature_4', 'Feature_5',
  'Feature_6', 'Feature_7', 'Feature_8', 'Feature_9'
];

/**
 * Generate authentic fallback stays for any city in India
 */
function generateFallbackStaysForCity(cityName) {
  const capCity = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
  const slug = slugify(cityName);

  const rawStays = [
    {
      id: `htl-${slug}-zostel-1`,
      name: `Zostel ${capCity} Community Backpacker Hub`,
      city: cityName.toLowerCase(),
      price: 599,
      rating: 4.8,
      ratingCount: 840,
      isHostel: true,
      category: 'Hostel & Dormitory',
      type: 'Backpacker Hostel & Pods',
      features: ['Free Wi-Fi', 'Common Lounge & Cafe', 'Air Conditioning', 'Lockers', 'Games Room'],
      hasRestaurant: true
    },
    {
      id: `htl-${slug}-the-hosteller-2`,
      name: `The Hosteller ${capCity} - Pods & Dorms`,
      city: cityName.toLowerCase(),
      price: 499,
      rating: 4.6,
      ratingCount: 520,
      isHostel: true,
      category: 'Hostel & Dormitory',
      type: 'Smart Sleep Pods',
      features: ['Free Wi-Fi', 'Soundproof Sleep Pods', 'Rooftop Cafe', 'Power Backup', 'Lockers'],
      hasRestaurant: true
    },
    {
      id: `htl-${slug}-heritage-homestay-3`,
      name: `${capCity} Heritage Haven Homestay & Cottage`,
      city: cityName.toLowerCase(),
      price: 1350,
      rating: 4.9,
      ratingCount: 310,
      isHostel: false,
      category: 'Homestay & Villa',
      type: 'Heritage Homestay & Villa',
      features: ['Home Cooked Meals', 'Free Wi-Fi', 'Garden & Verandah', 'Free Parking', 'Pet Friendly'],
      hasRestaurant: false
    },
    {
      id: `htl-${slug}-green-villa-4`,
      name: `Pine & Palm Boutique Homestay ${capCity}`,
      city: cityName.toLowerCase(),
      price: 1650,
      rating: 4.7,
      ratingCount: 245,
      isHostel: false,
      category: 'Homestay & Villa',
      type: 'Boutique Homestay & Apartment',
      features: ['Kitchenette', 'Scenic Balcony', 'Free Wi-Fi', 'Air Conditioning', 'Family Suites'],
      hasRestaurant: false
    },
    {
      id: `htl-${slug}-grand-residency-5`,
      name: `Hotel ${capCity} Grand Residency & Suites`,
      city: cityName.toLowerCase(),
      price: 2400,
      rating: 4.5,
      ratingCount: 920,
      isHostel: false,
      category: '3-Star Standard',
      type: '3-Star Hotel',
      features: ['Free Breakfast', 'Restaurant', 'Free Wi-Fi', 'Room Service', 'Elevator', 'Free Parking'],
      hasRestaurant: true
    },
    {
      id: `htl-${slug}-royal-palace-6`,
      name: `The Royal Palace Luxury Resort & Spa`,
      city: cityName.toLowerCase(),
      price: 6800,
      rating: 4.9,
      ratingCount: 1450,
      isHostel: false,
      category: '5-Star Luxury',
      type: '5-Star Luxury Resort',
      features: ['Swimming Pool', 'Luxury Spa', 'Fine Dining', 'Valet Parking', 'Fitness Center', 'Bar'],
      hasRestaurant: true
    }
  ];

  return rawStays.map(s => {
    const stayObj = {
      ...s,
      checkIn: '12:00 PM',
      checkOut: '11:00 AM',
      policies: {
        freeCancellation: true,
        payAtProperty: true,
        instantConfirmation: true
      }
    };
    stayObj.roomTypes = generateRoomTypes(stayObj);
    return stayObj;
  });
}

/**
 * Normalize a search query to a dataset city name.
 */
function resolveCity(query) {
  if (!query) return [];

  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const candidates = new Set();

  // 1. Direct match
  candidates.add(normalized);

  // 2. Check alias map
  if (CITY_ALIASES[normalized]) {
    candidates.add(CITY_ALIASES[normalized]);
  }

  // 3. Try without common suffixes like "junction", "city", "nagar", "cantt", "airport"
  const withoutSuffix = normalized
    .replace(/\s*(junction|jn|jn\.|city|nagar|cantonment|cantt|cantt\.|airport|railway station|central)$/i, '')
    .trim();
  if (withoutSuffix && withoutSuffix !== normalized) {
    candidates.add(withoutSuffix);
    if (CITY_ALIASES[withoutSuffix]) {
      candidates.add(CITY_ALIASES[withoutSuffix]);
    }
  }

  return Array.from(candidates);
}

/**
 * Search hotels by destination.
 * 
 * @param {string} destination — Destination city/location name
 * @param {object} options — { sort: 'rating'|'price_low'|'price_high', limit: number, category: string, isHostelOnly: boolean }
 * @returns {{ hotels: Array, matchedCity: string|null }}
 */
function searchHotels(destination, options = {}) {
  const { sort = 'rating', limit = 50, category, isHostelOnly } = options;

  if (!destination) {
    return { hotels: [], matchedCity: null };
  }

  const candidates = resolveCity(destination);
  let matched = [];
  let matchedCity = null;

  // Try exact city matches first in cached dataset
  if (isLoaded && hotelsCache.length > 0) {
    for (const candidate of candidates) {
      const found = hotelsCache.filter(h => h.city === candidate);
      if (found.length > 0) {
        matched = [...found];
        matchedCity = candidate;
        break;
      }
    }

    // If no exact match, try partial/contains matching
    if (matched.length === 0) {
      const normalizedQuery = destination.trim().toLowerCase();
      for (const hotel of hotelsCache) {
        if (hotel.city.includes(normalizedQuery) || normalizedQuery.includes(hotel.city)) {
          matched.push(hotel);
          if (!matchedCity) matchedCity = hotel.city;
        }
      }
    }
  }

  // If still no matches or missing variety, generate curated stays for this city
  if (matched.length === 0) {
    const primaryCity = candidates[0] || destination.trim().toLowerCase();
    matched = generateFallbackStaysForCity(primaryCity);
    matchedCity = primaryCity;
  } else {
    // If dataset matched but lacks hostels/dorms or homestays, supplement with city-themed options
    const hasHostels = matched.some(h => h.isHostel);
    const hasHomestay = matched.some(h => h.category?.toLowerCase().includes('homestay') || h.category?.toLowerCase().includes('villa'));
    if (!hasHostels || !hasHomestay) {
      const extraStays = generateFallbackStaysForCity(matchedCity || destination);
      if (!hasHostels) {
        matched.push(...extraStays.filter(s => s.isHostel));
      }
      if (!hasHomestay) {
        matched.push(...extraStays.filter(s => s.category?.toLowerCase().includes('homestay') || s.category?.toLowerCase().includes('villa')));
      }
    }
  }

  // Filter by category or isHostel if specified
  if (isHostelOnly || (category && (category === 'hostel' || category === 'dorms' || category === 'dormitory'))) {
    matched = matched.filter(h => h.isHostel || h.category?.toLowerCase().includes('hostel') || h.category?.toLowerCase().includes('dorm'));
  } else if (category && (category === 'homestay' || category === 'villa' || category === 'homestays')) {
    matched = matched.filter(h => 
      h.category?.toLowerCase().includes('homestay') || 
      h.category?.toLowerCase().includes('villa') || 
      h.category?.toLowerCase().includes('apartment') ||
      h.category?.toLowerCase().includes('home') ||
      h.type?.toLowerCase().includes('homestay') ||
      h.type?.toLowerCase().includes('villa')
    );
  } else if (category && (category === 'luxury' || category === '5-star')) {
    matched = matched.filter(h => h.category?.toLowerCase().includes('luxury') || h.category?.toLowerCase().includes('5-star') || (h.price && h.price >= 5000));
  } else if (category && (category === 'hotel' || category === 'standard' || category === '3-star')) {
    matched = matched.filter(h => !h.isHostel && !h.category?.toLowerCase().includes('homestay') && !h.category?.toLowerCase().includes('villa'));
  } else if (category && category !== 'all') {
    matched = matched.filter(h => h.category?.toLowerCase().includes(category.toLowerCase()));
  }

  // Sort results
  matched = sortHotels(matched, sort);

  // Apply limit
  if (limit && limit > 0) {
    matched = matched.slice(0, limit);
  }

  return { hotels: matched, matchedCity: matchedCity || destination };
}

/**
 * Get hotels that have an in-house restaurant.
 */
function getHotelsWithRestaurant(destination, options = {}) {
  const { hotels, matchedCity } = searchHotels(destination, { ...options, limit: 0 });
  const dining = hotels.filter(h => h.hasRestaurant);
  
  const { sort = 'rating', limit = 20 } = options;
  const sorted = sortHotels(dining, sort);
  
  return {
    hotels: limit > 0 ? sorted.slice(0, limit) : sorted,
    matchedCity
  };
}

/**
 * Sort hotels by the specified criteria.
 */
function sortHotels(hotels, sort) {
  const sorted = [...hotels];

  switch (sort) {
    case 'price_low':
      sorted.sort((a, b) => {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
      });
      break;
    case 'price_high':
      sorted.sort((a, b) => {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return b.price - a.price;
      });
      break;
    case 'rating':
    default:
      sorted.sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
      });
      break;
  }

  return sorted;
}

/**
 * Get all unique cities available in the dataset.
 */
function getAvailableCities() {
  const cities = new Set(hotelsCache.map(h => h.city));
  return Array.from(cities).sort();
}

/**
 * Check if hotel data has been loaded.
 */
function isDataLoaded() {
  return isLoaded;
}

/**
 * Mask government ID numbers to preserve privacy (retention minimization)
 */
function maskGovId(rawId) {
  if (!rawId) return 'XXXX-XXXX-0000';
  const clean = String(rawId).replace(/[^a-zA-Z0-9]/g, '');
  const last4 = clean.slice(-4) || '0000';
  return `XXXX-XXXX-${last4}`;
}

/**
 * Authoritatively calculate room pricing on the server
 */
function calculateAuthoritativePricing(hotelName, city, roomType, nights, unitsCount, guestsCount, mealPlan, promoCode) {
  let ratePerNight = 1200;

  // Search for the hotel in cache or city fallback
  const searchResult = searchHotels(city || '', { limit: 100 });
  const hotel = (searchResult.hotels || []).find(h => 
    h.name.toLowerCase().trim() === (hotelName || '').toLowerCase().trim()
  ) || (searchResult.hotels && searchResult.hotels[0]);

  if (hotel) {
    if (Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0) {
      const matchedRoom = hotel.roomTypes.find(r => 
        r.id === roomType || r.name.toLowerCase().trim() === (roomType || '').toLowerCase().trim()
      );
      if (matchedRoom && matchedRoom.pricePerNight) {
        ratePerNight = matchedRoom.pricePerNight;
      } else if (hotel.roomTypes[0].pricePerNight) {
        ratePerNight = hotel.roomTypes[0].pricePerNight;
      }
    } else if (hotel.price) {
      ratePerNight = Math.round(hotel.price);
    }
  }

  const validNights = Math.max(1, Math.min(30, parseInt(nights) || 1));
  const validUnits = Math.max(1, Math.min(5, parseInt(unitsCount) || 1));
  const validGuests = Math.max(1, Math.min(20, parseInt(guestsCount) || 1));

  const baseTotal = ratePerNight * validNights * validUnits;

  let mealsTotal = 0;
  const normalizedMeal = (mealPlan || '').toLowerCase();
  if (normalizedMeal.includes('breakfast')) {
    mealsTotal = 250 * validGuests * validNights;
  } else if (normalizedMeal.includes('all meal') || normalizedMeal.includes('all-inclusive')) {
    mealsTotal = 750 * validGuests * validNights;
  }

  let discount = 0;
  const cleanPromo = (promoCode || '').trim().toUpperCase();
  if (cleanPromo === 'TRAVELIQ10' || cleanPromo === 'WELCOME10') {
    discount = Math.round(baseTotal * 0.10);
  } else if (cleanPromo === 'SUPERSTAY20') {
    discount = Math.round(baseTotal * 0.20);
  }

  const taxableAmount = Math.max(0, baseTotal + mealsTotal - discount);
  const taxes = Math.round(taxableAmount * 0.12);
  const grandTotal = taxableAmount + taxes;

  return {
    ratePerNight,
    baseTotal,
    mealsTotal,
    discount,
    promoCode: discount > 0 ? cleanPromo : null,
    taxes,
    grandTotal,
    nights: validNights,
    unitsCount: validUnits,
    guestsCount: validGuests
  };
}

let HotelReservationModel = null;
function getHotelReservationModel() {
  if (!HotelReservationModel) {
    try {
      const models = require('../models');
      HotelReservationModel = models.HotelReservation;
    } catch (e) {
      // Test environment or DB unavailable
    }
  }
  return HotelReservationModel;
}

/**
 * Create a new verified Stay/Hostel reservation with server-authoritative pricing and user binding
 */
function createReservation(userId, data) {
  if (!userId) {
    throw new Error('Authentication required to make a reservation.');
  }

  // Validate dates
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error('Invalid check-in or check-out date format.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkIn < today) {
    throw new Error('Check-in date cannot be in the past.');
  }

  if (checkOut <= checkIn) {
    throw new Error('Check-out date must be after check-in date.');
  }

  const diffDays = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1 || diffDays > 30) {
    throw new Error('Stay duration must be between 1 and 30 nights.');
  }

  // Authoritatively compute pricing on server
  const pricing = calculateAuthoritativePricing(
    data.hotelName,
    data.city,
    data.roomType,
    diffDays,
    data.unitsCount,
    data.guestsCount,
    data.mealPlan,
    data.promoCode
  );

  // Validate room availability across active overlapping bookings
  const requestedUnits = pricing.unitsCount || 1;
  const checkInTime = checkIn.getTime();
  const checkOutTime = checkOut.getTime();

  const targetHotelName = (data.hotelName || '').toLowerCase().trim();
  const searchResult = searchHotels(data.city || '', { limit: 100 });
  const hotel = (searchResult.hotels || []).find(h => {
    const cur = (h.name || '').toLowerCase().trim();
    return cur === targetHotelName || cur.includes(targetHotelName) || targetHotelName.includes(cur);
  }) || (searchResult.hotels && searchResult.hotels[0]) || hotelsCache[0];

  let totalCapacity = 10;
  let resolvedRoomName = data.roomType || 'Standard';
  if (hotel && Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0) {
    const room = hotel.roomTypes.find(r => 
      r.id === data.roomType || (r.name || '').toLowerCase().trim() === (data.roomType || '').toLowerCase().trim()
    ) || hotel.roomTypes[0];
    if (room) {
      resolvedRoomName = room.name;
      if (room.availableUnits) {
        totalCapacity = room.availableUnits;
      }
    }
  }

  const overlappingUnits = reservationsCache.filter(r => {
    const existingName = (r.hotelName || '').toLowerCase().trim();
    if (existingName !== targetHotelName && !existingName.includes(targetHotelName) && !targetHotelName.includes(existingName)) return false;
    if (r.status === 'CANCELLED' || r.status === 'REFUNDED') return false;
    const existingIn = new Date(r.checkInDate).getTime();
    const existingOut = new Date(r.checkOutDate).getTime();
    return checkInTime < existingOut && checkOutTime > existingIn;
  }).reduce((sum, r) => sum + (r.unitsCount || 1), 0);

  if (overlappingUnits + requestedUnits > totalCapacity) {
    throw new Error(`Requested room is not available for the selected dates. Only ${Math.max(0, totalCapacity - overlappingUnits)} unit(s) remaining.`);
  }

  const randSuffix = crypto.randomBytes(6).toString('hex').toUpperCase();
  const bookingId = `TIQ-STAY-${randSuffix}`;
  const reservation = {
    id: bookingId,
    bookingReference: bookingId,
    userId: String(userId),
    createdAt: new Date().toISOString(),
    status: data.paymentMethod === 'Pay at Property' ? 'CONFIRMED' : 'PENDING',
    hotelName: data.hotelName,
    city: data.city,
    category: data.category || 'Hotel / Hostel',
    isHostel: !!data.isHostel,
    roomType: data.roomType || 'Standard',
    unitsCount: pricing.unitsCount,
    guestName: (data.guestName || '').trim(),
    guestEmail: (data.guestEmail || '').trim(),
    guestPhone: (data.guestPhone || '').trim(),
    govIdType: data.govIdType || 'Aadhaar Card',
    govIdNumber: maskGovId(data.govIdNumber),
    govIdVerified: false, // Never trust client-supplied govIdVerified
    govIdStatus: 'PENDING_KYC',
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    nights: pricing.nights,
    guestsCount: pricing.guestsCount,
    mealPlan: data.mealPlan || 'Room Only',
    specialRequests: Array.isArray(data.specialRequests) ? data.specialRequests : [],
    paymentMethod: data.paymentMethod || 'Pay at Property',
    paymentStatus: data.paymentMethod === 'Pay at Property' ? 'PENDING_AT_CHECKIN' : 'PENDING',
    pricing: {
      ratePerNight: pricing.ratePerNight,
      baseTotal: pricing.baseTotal,
      mealsTotal: pricing.mealsTotal,
      discount: pricing.discount,
      promoCode: pricing.promoCode,
      taxes: pricing.taxes,
      grandTotal: pricing.grandTotal
    },
    qrCheckInCode: `CHECKIN:${bookingId}:${(data.guestName || '').trim()}:${data.checkInDate}`
  };

  reservationsCache.unshift(reservation);

  // Persist asynchronously to MySQL
  const HotelReservation = getHotelReservationModel();
  if (HotelReservation && HotelReservation.create) {
    HotelReservation.create({
      reservation_code: bookingId,
      user_id: parseInt(userId) || 1,
      hotel_name: data.hotelName,
      city: data.city,
      category: data.category || 'Hotel / Hostel',
      is_hostel: !!data.isHostel,
      room_type: data.roomType || 'Standard',
      units_count: pricing.unitsCount,
      guests_count: pricing.guestsCount,
      guest_name: (data.guestName || '').trim(),
      guest_email: (data.guestEmail || '').trim(),
      guest_phone: (data.guestPhone || '').trim(),
      gov_id_type: data.govIdType || 'Aadhaar Card',
      gov_id_number: maskGovId(data.govIdNumber),
      gov_id_verified: false,
      gov_id_status: 'PENDING_KYC',
      check_in_date: data.checkInDate,
      check_out_date: data.checkOutDate,
      nights: pricing.nights,
      meal_plan: data.mealPlan || 'Room Only',
      special_requests: Array.isArray(data.specialRequests) ? data.specialRequests : [],
      payment_method: data.paymentMethod || 'Pay at Property',
      payment_status: data.paymentMethod === 'Pay at Property' ? 'PENDING_AT_CHECKIN' : 'PENDING',
      status: data.paymentMethod === 'Pay at Property' ? 'CONFIRMED' : 'PENDING',
      rate_per_night: pricing.ratePerNight,
      base_total: pricing.baseTotal,
      meals_total: pricing.mealsTotal,
      discount: pricing.discount,
      promo_code: pricing.promoCode || null,
      taxes: pricing.taxes,
      grand_total: pricing.grandTotal,
      qr_checkin_code: reservation.qrCheckInCode
    }).catch(err => {
      console.error('[HotelService] Error persisting reservation to DB:', err.message);
    });
  }

  // Support both synchronous callers and async/await
  reservation.then = function (resolve) {
    resolve(reservation);
  };

  return reservation;
}

/**
 * Idempotently cancel a reservation with IDOR and safe refund transitions
 */
async function cancelReservation(reservationId, userId, reason = 'User requested cancellation', isAdmin = false) {
  if (!reservationId) throw new Error('Reservation ID is required.');

  let reservation = reservationsCache.find(r => r.id === reservationId || r.bookingReference === reservationId);
  const HotelReservation = getHotelReservationModel();
  let dbRecord = null;

  if (HotelReservation && HotelReservation.findOne) {
    try {
      const { Op } = require('sequelize');
      dbRecord = await HotelReservation.findOne({
        where: {
          [Op.or]: [
            { reservation_code: reservationId },
            ...(Number.isInteger(Number(reservationId)) ? [{ id: Number(reservationId) }] : [])
          ]
        }
      });
    } catch (err) {
      console.warn('[HotelService] DB lookup warning:', err.message);
    }
  }

  if (!reservation && !dbRecord) {
    throw new Error('Reservation not found.');
  }

  // IDOR check: only owning user or administrator
  const ownerId = reservation ? String(reservation.userId) : String(dbRecord.user_id);
  if (String(userId) !== ownerId && !isAdmin) {
    const err = new Error('Forbidden: You do not have permission to cancel this reservation.');
    err.status = 403;
    throw err;
  }

  // Idempotency: if already cancelled, return existing cancelled state
  const currentStatus = reservation ? reservation.status : dbRecord.status;
  if (currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED' || currentStatus === 'REFUND_PENDING') {
    return {
      success: true,
      message: 'Reservation is already cancelled.',
      alreadyCancelled: true,
      reservation: reservation || dbRecord
    };
  }

  // Determine refund state
  const isPaid = (reservation && reservation.paymentStatus === 'PAID') || (dbRecord && dbRecord.payment_status === 'PAID');
  let newStatus = 'CANCELLED';
  let newPaymentStatus = 'CANCELLED';
  let refundStatus = null;
  let refundAmount = 0;

  if (isPaid) {
    newStatus = 'REFUND_PENDING';
    newPaymentStatus = 'REFUND_PENDING';
    refundStatus = 'PROCESSING_WITH_GATEWAY';
    refundAmount = reservation ? reservation.pricing.grandTotal : dbRecord.grand_total;
  }

  const cancelledAt = new Date().toISOString();

  if (reservation) {
    reservation.status = newStatus;
    reservation.paymentStatus = newPaymentStatus;
    reservation.cancellationReason = reason;
    reservation.cancelledAt = cancelledAt;
    reservation.refundStatus = refundStatus;
    reservation.refundAmount = refundAmount;
  }

  if (dbRecord) {
    await dbRecord.update({
      status: newStatus,
      payment_status: newPaymentStatus,
      cancellation_reason: reason,
      cancelled_at: cancelledAt,
      refund_status: refundStatus,
      refund_amount: refundAmount
    });
  }

  return {
    success: true,
    message: isPaid 
      ? 'Reservation cancelled. Refund has been initiated with the payment provider.' 
      : 'Reservation cancelled successfully.',
    alreadyCancelled: false,
    reservation: reservation || dbRecord
  };
}

/**
 * Verify Government ID / KYC (restricted to administrators)
 */
async function verifyGovernmentId(reservationId, adminUser, verificationStatus = 'VERIFIED') {
  if (!adminUser || (adminUser.role !== 'admin' && adminUser.admin_role !== 'super_admin')) {
    const err = new Error('Forbidden: Only administrators can verify government identity documents.');
    err.status = 403;
    throw err;
  }

  let reservation = reservationsCache.find(r => r.id === reservationId || r.bookingReference === reservationId);
  const HotelReservation = getHotelReservationModel();
  let dbRecord = null;

  if (HotelReservation && HotelReservation.findOne) {
    try {
      const { Op } = require('sequelize');
      dbRecord = await HotelReservation.findOne({
        where: {
          [Op.or]: [
            { reservation_code: reservationId },
            ...(Number.isInteger(Number(reservationId)) ? [{ id: Number(reservationId) }] : [])
          ]
        }
      });
    } catch (err) {
      console.warn('[HotelService] DB lookup warning:', err.message);
    }
  }

  if (!reservation && !dbRecord) {
    throw new Error('Reservation not found.');
  }

  const isVerified = verificationStatus === 'VERIFIED';
  if (reservation) {
    reservation.govIdVerified = isVerified;
    reservation.govIdStatus = verificationStatus;
  }
  if (dbRecord) {
    await dbRecord.update({
      gov_id_verified: isVerified,
      gov_id_status: verificationStatus
    });
  }

  return {
    success: true,
    message: `Government ID status updated to ${verificationStatus}.`,
    reservation: reservation || dbRecord
  };
}

/**
 * Paginated query for reservations
 */
async function getReservationsPaged({ userId = null, page = 1, limit = 20, offset = 0 } = {}) {
  const HotelReservation = getHotelReservationModel();
  if (HotelReservation && HotelReservation.findAndCountAll) {
    try {
      const where = {};
      if (userId) {
        where.user_id = userId;
      }
      const { rows, count } = await HotelReservation.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      return {
        reservations: rows,
        total: count
      };
    } catch (err) {
      console.warn('[HotelService] DB query warning:', err.message);
    }
  }

  let list = reservationsCache;
  if (userId) {
    list = list.filter(r => String(r.userId) === String(userId));
  }
  const total = list.length;
  const reservations = list.slice(offset, offset + limit);
  return { reservations, total };
}

/**
 * Get reservations belonging strictly to an authenticated user
 */
function getReservationsByUser(userId) {
  if (!userId) return [];
  return reservationsCache.filter(r => String(r.userId) === String(userId));
}

/**
 * Get reservation by ID
 */
function getReservationById(id) {
  return reservationsCache.find(r => r.id === id || r.bookingReference === id) || null;
}

/**
 * Get all reservations (administrator access only)
 */
function getAllReservations() {
  return reservationsCache;
}

module.exports = {
  loadHotelData,
  searchHotels,
  getHotelsWithRestaurant,
  getAvailableCities,
  isDataLoaded,
  calculateAuthoritativePricing,
  createReservation,
  cancelReservation,
  verifyGovernmentId,
  getReservationsPaged,
  getReservationsByUser,
  getReservationById,
  getAllReservations,
  maskGovId
};
