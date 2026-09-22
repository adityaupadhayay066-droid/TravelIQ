const fs = require('fs');
const path = require('path');
const { Station } = require('../models');

const ESSENTIAL_STATIONS = [
  { station_code: 'BUI', station_name: 'BALLIA', city: 'Ballia', state: 'Uttar Pradesh', latitude: 25.7600, longitude: 84.1500 },
  { station_code: 'CPR', station_name: 'CHHAPRA JN', city: 'Chhapra', state: 'Bihar', latitude: 25.7833, longitude: 84.7333 },
  { station_code: 'BSB', station_name: 'VARANASI JN', city: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3268, longitude: 82.9868 },
  { station_code: 'NDLS', station_name: 'NEW DELHI', city: 'New Delhi', state: 'Delhi', latitude: 28.6448, longitude: 77.2167 },
  { station_code: 'BCT', station_name: 'MUMBAI CENTRAL', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9696, longitude: 72.8193 },
  { station_code: 'SBC', station_name: 'BANGALORE CITY JN', city: 'Bengaluru', state: 'Karnataka', latitude: 12.9780, longitude: 77.5683 },
  { station_code: 'HWH', station_name: 'HOWRAH JN', city: 'Kolkata', state: 'West Bengal', latitude: 22.5851, longitude: 88.3412 },
  { station_code: 'PNBE', station_name: 'PATNA JN', city: 'Patna', state: 'Bihar', latitude: 25.6015, longitude: 85.1376 },
  { station_code: 'LKO', station_name: 'LUCKNOW CHARBAGH', city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8322, longitude: 80.9197 },
  { station_code: 'GKP', station_name: 'GORAKHPUR JN', city: 'Gorakhpur', state: 'Uttar Pradesh', latitude: 26.7588, longitude: 83.3697 },
];

const seedStations = async () => {
  try {
    // Always guarantee essential stations exist
    for (const st of ESSENTIAL_STATIONS) {
      await Station.findOrCreate({
        where: { station_code: st.station_code },
        defaults: st
      });
    }

    const count = await Station.count();
    if (count > 20) {
      console.log('Stations already seeded. Skipping...');
      return;
    }

    const dataPath = path.join(__dirname, '../data/unique_stations.json');
    if (!fs.existsSync(dataPath)) {
      console.log('unique_stations.json not found. Skipping station seeding.');
      return;
    }

    const rawData = fs.readFileSync(dataPath);
    const stations = JSON.parse(rawData);

    console.log(`Seeding ${stations.length} stations. This may take a moment...`);
    
    // Bulk create in chunks to avoid overwhelming the database
    const chunkSize = 1000;
    for (let i = 0; i < stations.length; i += chunkSize) {
      const chunk = stations.slice(i, i + chunkSize);
      await Station.bulkCreate(chunk, { ignoreDuplicates: true });
      console.log(`Seeded ${Math.min(i + chunkSize, stations.length)} / ${stations.length} stations...`);
    }

    console.log('Stations seeded successfully!');
  } catch (error) {
    console.error('Error seeding stations:', error);
  }
};

module.exports = { seedStations, ESSENTIAL_STATIONS };
