/**
 * Coordinates dictionary of major Indian travel hubs.
 */
const CITY_COORDINATES = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'goa': { lat: 15.2993, lng: 74.1240 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'jaipur': { lat: 26.9124, lng: 75.7873 }
};

/**
 * Calculate great-circle distance in kilometers between two points using the Haversine formula.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Look up distance between two city strings. Falls back to a default distance if cities are not registered.
 */
function getDistanceBetweenCities(city1, city2) {
  const c1 = (city1 || '').toLowerCase().trim();
  const c2 = (city2 || '').toLowerCase().trim();

  let coords1 = null;
  let coords2 = null;

  for (const key of Object.keys(CITY_COORDINATES)) {
    if (c1.includes(key)) {
      coords1 = CITY_COORDINATES[key];
      break;
    }
  }
  for (const key of Object.keys(CITY_COORDINATES)) {
    if (c2.includes(key)) {
      coords2 = CITY_COORDINATES[key];
      break;
    }
  }

  coords1 = coords1 || CITY_COORDINATES['delhi'];
  coords2 = coords2 || CITY_COORDINATES['bhubaneswar'];

  // If same city, return nominal distance
  if (c1 === c2) return 15.0;

  return calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
}

/**
 * Calculates CO2 emissions in kg for a given distance and travel mode.
 * Coefficients:
 * - flight: 0.140 kg per km
 * - train:  0.021 kg per km
 * - bus:    0.054 kg per km
 */
function calculateEmissions(distance, mode) {
  const dist = parseFloat(distance) || 0.0;
  const m = (mode || '').toLowerCase().trim();

  let coefficient = 0.021; // Default to train
  if (m.includes('flight') || m.includes('air') || m.includes('plane')) {
    coefficient = 0.140;
  } else if (m.includes('bus') || m.includes('road')) {
    coefficient = 0.054;
  } else if (m.includes('train') || m.includes('rail')) {
    coefficient = 0.021;
  }

  return parseFloat((dist * coefficient).toFixed(2));
}

/**
 * Get emissions metrics comparison across all modes for a distance, and saved values.
 */
function compareTripEmissions(distance, chosenMode) {
  const dist = parseFloat(distance) || 100.0;

  const flightCo2 = parseFloat((dist * 0.140).toFixed(2));
  const trainCo2 = parseFloat((dist * 0.021).toFixed(2));
  const busCo2 = parseFloat((dist * 0.054).toFixed(2));

  let chosenCo2 = trainCo2;
  const m = (chosenMode || '').toLowerCase().trim();
  if (m.includes('flight') || m.includes('air') || m.includes('plane')) {
    chosenCo2 = flightCo2;
  } else if (m.includes('bus') || m.includes('road')) {
    chosenCo2 = busCo2;
  }

  // Carbon saved = Max emission (flight) - chosen emission
  // If flight is chosen, saved = flight - train (since train is standard green alternative)
  let savedCo2 = 0.0;
  if (chosenCo2 === flightCo2) {
    savedCo2 = 0.0; // No savings for high impact flights
  } else {
    savedCo2 = parseFloat((flightCo2 - chosenCo2).toFixed(2));
  }

  // Calculate a proportional Eco Score out of 100 (Train = 100, Bus = 80, Flight = 20)
  let ecoScore = 100;
  if (chosenCo2 === flightCo2) ecoScore = 20;
  else if (chosenCo2 === busCo2) ecoScore = 75;

  return {
    flight: flightCo2,
    train: trainCo2,
    bus: busCo2,
    chosen: chosenCo2,
    saved: savedCo2,
    eco_score: ecoScore
  };
}

module.exports = {
  getDistanceBetweenCities,
  calculateEmissions,
  compareTripEmissions
};
