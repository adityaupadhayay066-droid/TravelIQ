const fs = require('fs');
const path = require('path');
const { Station } = require('../models');

const ESSENTIAL_STATIONS = [
  // Delhi Hub
  { station_code: 'NDLS', station_name: 'NEW DELHI', city: 'New Delhi', state: 'Delhi', latitude: 28.6448, longitude: 77.2167 },
  { station_code: 'NZM', station_name: 'HAZRAT NIZAMUDDIN', city: 'Delhi', state: 'Delhi', latitude: 28.5886, longitude: 77.2534 },
  { station_code: 'ANVT', station_name: 'ANAND VIHAR TERMINAL', city: 'Delhi', state: 'Delhi', latitude: 28.6482, longitude: 77.3153 },
  { station_code: 'DLI', station_name: 'OLD DELHI', city: 'Delhi', state: 'Delhi', latitude: 28.6619, longitude: 77.2289 },
  { station_code: 'GZB', station_name: 'GHAZIABAD', city: 'Ghaziabad', state: 'Uttar Pradesh', latitude: 28.6692, longitude: 77.4538 },

  // Punjab & Haryana
  { station_code: 'ASR', station_name: 'AMRITSAR JN', city: 'Amritsar', state: 'Punjab', latitude: 31.6340, longitude: 74.8723 },
  { station_code: 'LDH', station_name: 'LUDHIANA JN', city: 'Ludhiana', state: 'Punjab', latitude: 30.9100, longitude: 75.8500 },
  { station_code: 'UMB', station_name: 'AMBALA CANTT JN', city: 'Ambala', state: 'Haryana', latitude: 30.3300, longitude: 76.8300 },

  // Western Corridor & Mumbai Hub
  { station_code: 'MTJ', station_name: 'MATHURA JN', city: 'Mathura', state: 'Uttar Pradesh', latitude: 27.4924, longitude: 77.6737 },
  { station_code: 'KOTA', station_name: 'KOTA JN', city: 'Kota', state: 'Rajasthan', latitude: 25.2138, longitude: 75.8648 },
  { station_code: 'RTM', station_name: 'RATLAM JN', city: 'Ratlam', state: 'Madhya Pradesh', latitude: 23.3441, longitude: 75.0416 },
  { station_code: 'BRC', station_name: 'VADODARA JN', city: 'Vadodara', state: 'Gujarat', latitude: 22.3107, longitude: 73.1812 },
  { station_code: 'ST', station_name: 'SURAT', city: 'Surat', state: 'Gujarat', latitude: 21.2049, longitude: 72.8406 },
  { station_code: 'BVI', station_name: 'BORIVALI', city: 'Mumbai', state: 'Maharashtra', latitude: 19.2290, longitude: 72.8569 },
  { station_code: 'BDTS', station_name: 'MUMBAI BANDRA TERMINUS', city: 'Mumbai', state: 'Maharashtra', latitude: 19.0620, longitude: 72.8410 },
  { station_code: 'BCT', station_name: 'MUMBAI CENTRAL', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9696, longitude: 72.8193 },
  { station_code: 'CSMT', station_name: 'MUMBAI CSMT', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9400, longitude: 72.8353 },
  { station_code: 'CSTM', station_name: 'MUMBAI CSMT', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9400, longitude: 72.8353 },
  { station_code: 'DR', station_name: 'DADAR', city: 'Mumbai', state: 'Maharashtra', latitude: 19.0178, longitude: 72.8478 },
  { station_code: 'KYN', station_name: 'KALYAN JN', city: 'Kalyan', state: 'Maharashtra', latitude: 19.2354, longitude: 73.1299 },
  { station_code: 'LNL', station_name: 'LONAVALA', city: 'Lonavala', state: 'Maharashtra', latitude: 18.7557, longitude: 73.4091 },
  { station_code: 'PUNE', station_name: 'PUNE JN', city: 'Pune', state: 'Maharashtra', latitude: 18.5284, longitude: 73.8744 },
  { station_code: 'ADI', station_name: 'AHMEDABAD JN', city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.6000 },
  { station_code: 'JP', station_name: 'JAIPUR JN', city: 'Jaipur', state: 'Rajasthan', latitude: 26.9200, longitude: 75.7900 },

  // Eastern & Central UP / Bihar Hub
  { station_code: 'CNB', station_name: 'KANPUR CENTRAL', city: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.4547, longitude: 80.3507 },
  { station_code: 'LKO', station_name: 'LUCKNOW CHARBAGH', city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8322, longitude: 80.9197 },
  { station_code: 'PRYJ', station_name: 'PRAYAGRAJ JN', city: 'Prayagraj', state: 'Uttar Pradesh', latitude: 25.4484, longitude: 81.8333 },
  { station_code: 'ALD', station_name: 'PRAYAGRAJ JN', city: 'Prayagraj', state: 'Uttar Pradesh', latitude: 25.4484, longitude: 81.8333 },
  { station_code: 'MZP', station_name: 'MIRZAPUR', city: 'Mirzapur', state: 'Uttar Pradesh', latitude: 25.1460, longitude: 82.5690 },
  { station_code: 'DDU', station_name: 'PT DEEN DAYAL UPADHYAYA JN', city: 'Mughalsarai', state: 'Uttar Pradesh', latitude: 25.2818, longitude: 83.1189 },
  { station_code: 'MGS', station_name: 'MUGHALSARAI JN', city: 'Mughalsarai', state: 'Uttar Pradesh', latitude: 25.2818, longitude: 83.1189 },
  { station_code: 'BSB', station_name: 'VARANASI JN', city: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3268, longitude: 82.9868 },
  { station_code: 'GCT', station_name: 'GHAZIPUR CITY', city: 'Ghazipur', state: 'Uttar Pradesh', latitude: 25.5866, longitude: 83.5786 },
  { station_code: 'BUI', station_name: 'BALLIA', city: 'Ballia', state: 'Uttar Pradesh', latitude: 25.7600, longitude: 84.1500 },
  { station_code: 'CPR', station_name: 'CHHAPRA JN', city: 'Chhapra', state: 'Bihar', latitude: 25.7833, longitude: 84.7333 },
  { station_code: 'GKP', station_name: 'GORAKHPUR JN', city: 'Gorakhpur', state: 'Uttar Pradesh', latitude: 26.7588, longitude: 83.3697 },
  { station_code: 'PNBE', station_name: 'PATNA JN', city: 'Patna', state: 'Bihar', latitude: 25.6015, longitude: 85.1376 },
  { station_code: 'PPTA', station_name: 'PATLIPUTRA JN', city: 'Patna', state: 'Bihar', latitude: 25.6377, longitude: 85.0934 },
  { station_code: 'DNR', station_name: 'DANAPUR', city: 'Danapur', state: 'Bihar', latitude: 25.6267, longitude: 85.0444 },
  { station_code: 'RJPB', station_name: 'RAJENDRA NAGAR TERMINAL', city: 'Patna', state: 'Bihar', latitude: 25.5975, longitude: 85.1611 },
  { station_code: 'GAYA', station_name: 'GAYA JN', city: 'Gaya', state: 'Bihar', latitude: 24.7955, longitude: 85.0002 },
  { station_code: 'DOS', station_name: 'DEHRI ON SONE', city: 'Dehri', state: 'Bihar', latitude: 24.9128, longitude: 84.1843 },
  { station_code: 'SSM', station_name: 'SASARAM', city: 'Sasaram', state: 'Bihar', latitude: 24.9500, longitude: 84.0300 },
  { station_code: 'BBU', station_name: 'BHABUA ROAD', city: 'Bhabua', state: 'Bihar', latitude: 25.0400, longitude: 83.6100 },

  // Eastern Hub (Bengal, Jharkhand, Odisha)
  { station_code: 'DHN', station_name: 'DHANBAD JN', city: 'Dhanbad', state: 'Jharkhand', latitude: 23.7957, longitude: 86.4304 },
  { station_code: 'GMO', station_name: 'NETAJI SC BOSE GOMOH', city: 'Gomoh', state: 'Jharkhand', latitude: 23.8722, longitude: 86.1556 },
  { station_code: 'PNME', station_name: 'PARASNATH', city: 'Isri', state: 'Jharkhand', latitude: 23.9786, longitude: 86.0664 },
  { station_code: 'KQR', station_name: 'KODERMA JN', city: 'Koderma', state: 'Jharkhand', latitude: 24.4697, longitude: 85.5947 },
  { station_code: 'ASN', station_name: 'ASANSOL JN', city: 'Asansol', state: 'West Bengal', latitude: 23.6889, longitude: 86.9661 },
  { station_code: 'HWH', station_name: 'HOWRAH JN', city: 'Kolkata', state: 'West Bengal', latitude: 22.5851, longitude: 88.3412 },
  { station_code: 'SDAH', station_name: 'SEALDAH', city: 'Kolkata', state: 'West Bengal', latitude: 22.5675, longitude: 88.3711 },
  { station_code: 'TATA', station_name: 'TATANAGAR JN', city: 'Jamshedpur', state: 'Jharkhand', latitude: 22.7719, longitude: 86.2029 },
  { station_code: 'ROU', station_name: 'ROURKELA', city: 'Rourkela', state: 'Odisha', latitude: 22.2260, longitude: 84.8770 },
  { station_code: 'JSG', station_name: 'JHARSUGUDA JN', city: 'Jharsuguda', state: 'Odisha', latitude: 21.8570, longitude: 84.0080 },
  { station_code: 'BSP', station_name: 'BILASPUR JN', city: 'Bilaspur', state: 'Chhattisgarh', latitude: 22.0797, longitude: 82.1409 },
  { station_code: 'RIG', station_name: 'RAIGARH', city: 'Raigarh', state: 'Chhattisgarh', latitude: 21.8974, longitude: 83.3950 },
  { station_code: 'BBS', station_name: 'BHUBANESWAR', city: 'Bhubaneswar', state: 'Odisha', latitude: 20.2644, longitude: 85.8395 },
  { station_code: 'CTC', station_name: 'CUTTACK', city: 'Cuttack', state: 'Odisha', latitude: 20.4625, longitude: 85.8830 },
  { station_code: 'PURI', station_name: 'PURI', city: 'Puri', state: 'Odisha', latitude: 19.8135, longitude: 85.8312 },

  // Southern Hub
  { station_code: 'MAS', station_name: 'CHENNAI CENTRAL', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { station_code: 'SBC', station_name: 'BANGALORE CITY JN', city: 'Bengaluru', state: 'Karnataka', latitude: 12.9780, longitude: 77.5683 },
  { station_code: 'BZA', station_name: 'VIJAYAWADA JN', city: 'Vijayawada', state: 'Andhra Pradesh', latitude: 16.5193, longitude: 80.6305 },
  { station_code: 'SC', station_name: 'SECUNDERABAD JN', city: 'Hyderabad', state: 'Telangana', latitude: 17.4334, longitude: 78.5016 },
  { station_code: 'HYB', station_name: 'HYDERABAD DECCAN', city: 'Hyderabad', state: 'Telangana', latitude: 17.3916, longitude: 78.4735 },
  { station_code: 'KZJ', station_name: 'KAZIPET JN', city: 'Warangal', state: 'Telangana', latitude: 17.9785, longitude: 79.5218 },
  { station_code: 'BPQ', station_name: 'BALHARSHAH', city: 'Balharshah', state: 'Maharashtra', latitude: 19.8519, longitude: 79.3522 },
  { station_code: 'NGP', station_name: 'NAGPUR', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1528, longitude: 79.0882 },
  { station_code: 'BPL', station_name: 'BHOPAL JN', city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
  { station_code: 'HBJ', station_name: 'HABIBGANJ', city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2186, longitude: 77.4372 },
  { station_code: 'JHS', station_name: 'V LAKSHMIBAI JHANSI', city: 'Jhansi', state: 'Uttar Pradesh', latitude: 25.4484, longitude: 78.5685 },
  { station_code: 'GWL', station_name: 'GWALIOR', city: 'Gwalior', state: 'Madhya Pradesh', latitude: 26.2183, longitude: 78.1828 },
  { station_code: 'AGC', station_name: 'AGRA CANTT', city: 'Agra', state: 'Uttar Pradesh', latitude: 27.1587, longitude: 78.0081 },
  { station_code: 'ERS', station_name: 'ERNAKULAM JN', city: 'Kochi', state: 'Kerala', latitude: 9.9674, longitude: 76.2906 },
  { station_code: 'TVC', station_name: 'THIRUVANANTHAPURAM CENTRAL', city: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.4875, longitude: 76.9525 }
];

const seedStations = async (options = {}) => {
  const { force = false } = options;
  const metrics = {
    totalSourceRecords: 0,
    validRecords: 0,
    essentialCount: ESSENTIAL_STATIONS.length,
    insertedOrExistingCount: 0,
    duplicateCount: 0,
    rejectedCount: 0,
    finalDatabaseCount: 0
  };

  const dataPath = path.join(__dirname, '../data/unique_stations.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`DATASET_NOT_FOUND: Required station dataset is missing at ${dataPath}. Cannot initialize station registry.`);
  }

  let rawData;
  try {
    rawData = fs.readFileSync(dataPath, 'utf8');
  } catch (readErr) {
    throw new Error(`DATASET_UNREADABLE: Failed to read station dataset: ${readErr.message}`);
  }

  let stations;
  try {
    stations = JSON.parse(rawData);
  } catch (parseErr) {
    throw new Error(`DATASET_INVALID_JSON: Station dataset contains malformed JSON: ${parseErr.message}`);
  }

  if (!Array.isArray(stations) || stations.length === 0) {
    throw new Error(`DATASET_EMPTY: Station dataset contains zero records.`);
  }

  metrics.totalSourceRecords = stations.length;

  // 1. Strict Record & Duplicate Validation
  const seenCodes = new Set();
  const validStations = [];

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const code = (s.station_code || '').trim().toUpperCase();
    const name = (s.station_name || '').trim();

    // Required field validation
    if (!code || !name) {
      metrics.rejectedCount++;
      continue;
    }

    // Duplicate detection within source dataset
    if (seenCodes.has(code)) {
      metrics.duplicateCount++;
      continue;
    }
    seenCodes.add(code);

    validStations.push({
      station_code: code,
      station_name: name,
      city: (s.city || name).trim(),
      state: (s.state || 'India').trim(),
      latitude: s.latitude ? Number(s.latitude) : null,
      longitude: s.longitude ? Number(s.longitude) : null
    });
  }

  metrics.validRecords = validStations.length;

  // 2. Authoritatively upsert essential stations first
  for (const st of ESSENTIAL_STATIONS) {
    await Station.upsert({
      station_code: st.station_code.toUpperCase().trim(),
      station_name: st.station_name.trim(),
      city: st.city.trim(),
      state: st.state.trim(),
      latitude: Number(st.latitude),
      longitude: Number(st.longitude)
    });
  }

  // 3. Check existing count: If already fully seeded, verify coordinates aren't stale before skipping
  const currentCount = await Station.count();
  if (!force && currentCount >= metrics.validRecords) {
    const jat = await Station.findOne({ where: { station_code: 'JAT' }, attributes: ['latitude'] });
    const hasStaleCoords = jat && jat.latitude !== null && Number(jat.latitude) < 25;
    if (!hasStaleCoords) {
      metrics.insertedOrExistingCount = currentCount;
      metrics.finalDatabaseCount = currentCount;
      console.log(`✅ [Station Seeder] Stations verified: ${currentCount} stations present in database.`);
      return metrics;
    }
    console.log('⏳ [Station Seeder] Detected stale station coordinates. Updating coordinates from verified dataset...');
    const chunkSize = 500;
    for (let i = 0; i < validStations.length; i += chunkSize) {
      const chunk = validStations.slice(i, i + chunkSize);
      await Station.bulkCreate(chunk, { updateOnDuplicate: ['latitude', 'longitude', 'state'] });
    }
    metrics.insertedOrExistingCount = currentCount;
    metrics.finalDatabaseCount = currentCount;
    console.log(`✅ [Station Seeder] Station coordinates updated for ${currentCount} stations.`);
    return metrics;
  }

  console.log(`⏳ [Station Seeder] Seeding ${metrics.validRecords} verified railway stations (Source: ${metrics.totalSourceRecords}, Rejected: ${metrics.rejectedCount}, Duplicates: ${metrics.duplicateCount})...`);

  // 4. Idempotent bulk creation in chunks
  const chunkSize = 500;
  for (let i = 0; i < validStations.length; i += chunkSize) {
    const chunk = validStations.slice(i, i + chunkSize);
    await Station.bulkCreate(chunk, { ignoreDuplicates: true });
  }

  metrics.finalDatabaseCount = await Station.count();
  metrics.insertedOrExistingCount = metrics.finalDatabaseCount;

  // 5. Verification: Do not report success if dataset is partial
  if (metrics.finalDatabaseCount < metrics.validRecords) {
    throw new Error(`SEPARATION_FAILURE: Partial station seeding detected! Expected at least ${metrics.validRecords} stations, but found ${metrics.finalDatabaseCount} in database.`);
  }

  console.log(`✅ [Station Seeder] Station seeding completed successfully. Total active stations: ${metrics.finalDatabaseCount}`);
  return metrics;
};

module.exports = { seedStations, ESSENTIAL_STATIONS };
