const { resolveAirport, hasCommercialAirport, areBothAirportCities, getNearestAirport } = require('../utils/airportRegistry');
const { QueryTypes } = require('sequelize');

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Extracts 3-letter uppercase day name ('MON', 'TUE', etc.) from a date
 * @param {string|Date} dateInput 
 * @returns {string|null}
 */
function getDayOfWeek(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return DAYS_OF_WEEK[d.getDay()];
}

/**
 * Normalizes runs_on representation into a clean array of day codes
 * @param {Array|string} runsOn 
 * @returns {Array<string>}
 */
function normalizeRunsOn(runsOn) {
  if (!runsOn) return [...DAYS_OF_WEEK]; // Default to all days if unspecified
  
  if (Array.isArray(runsOn)) {
    if (runsOn.length === 1 && runsOn[0] === 'Daily') {
      return [...DAYS_OF_WEEK];
    }
    return runsOn.map(d => String(d).toUpperCase().trim());
  }

  if (typeof runsOn === 'string') {
    const trimmed = runsOn.trim();
    if (trimmed.toLowerCase() === 'daily') {
      return [...DAYS_OF_WEEK];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizeRunsOn(parsed);
      }
    } catch {
      // Comma or space separated string
      return trimmed.split(/[\s,]+/).map(d => d.toUpperCase().trim()).filter(Boolean);
    }
  }

  return [...DAYS_OF_WEEK];
}

/**
 * Checks if a train operates on a given date/day
 * @param {object} train - Train model or plain object with runs_on
 * @param {string|Date} travelDate - Selected travel date
 * @returns {boolean}
 */
function trainRunsOnDate(train, travelDate) {
  if (!travelDate) return true; // No date filter requested
  
  const targetDay = getDayOfWeek(travelDate);
  if (!targetDay) return true;

  const runsOn = train.runs_on || (train.Train && train.Train.runs_on) || train.running_days;
  const normalizedDays = normalizeRunsOn(runsOn);

  return normalizedDays.includes(targetDay);
}

/**
 * Returns a human-friendly train frequency label (e.g. "Daily (7 days/week)", "3 days/week (MON, WED, FRI)")
 * @param {Array|string} runsOn 
 * @returns {string}
 */
function getTrainFrequencyLabel(runsOn) {
  const normalized = normalizeRunsOn(runsOn);
  if (normalized.length === 7) {
    return 'Daily (7 days/week)';
  }
  return `${normalized.length} days/week (${normalized.join(', ')})`;
}

/**
 * Formats running days for user display (e.g. "MON, WED, FRI" or "Daily")
 * @param {Array|string} runsOn 
 * @returns {string}
 */
function formatRunningDays(runsOn) {
  const normalized = normalizeRunsOn(runsOn);
  if (normalized.length === 7) {
    return 'Daily';
  }
  return normalized.join(', ');
}

/**
 * Converts time string ("HH:MM" or "HH:MM:SS") to minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * Converts minutes from midnight to "HH:MM" string
 */
function minutesToTime(mins) {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60).toString().padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Discovers valid 2-leg connecting train routes in database
 * @param {string} originCode - Origin station code
 * @param {string} destCode - Destination station code
 * @param {string|Date} travelDate - Date of journey
 * @param {object} sequelize - Sequelize instance
 * @returns {Promise<Array>} List of connecting routes
 */
async function findConnectingTrains(originCode, destCode, travelDate, sequelize) {
  if (!originCode || !destCode || !sequelize) return [];

  const targetDay = getDayOfWeek(travelDate);

  // Query database for 1-transfer connecting trains via intermediate station
  const sql = `
    SELECT 
      ts1.train_number AS leg1_train_number,
      t1.train_name AS leg1_train_name,
      t1.runs_on AS leg1_runs_on,
      ts1.station_code AS origin_station,
      ts1.departure_time AS leg1_departure,
      ts1_trans.station_code AS transfer_station,
      ts1_trans.arrival_time AS leg1_arrival,
      
      ts2.train_number AS leg2_train_number,
      t2.train_name AS leg2_train_name,
      t2.runs_on AS leg2_runs_on,
      ts2.departure_time AS leg2_departure,
      ts2_dest.station_code AS dest_station,
      ts2_dest.arrival_time AS leg2_arrival
    FROM train_schedules ts1
    JOIN train_schedules ts1_trans ON ts1.train_number = ts1_trans.train_number 
      AND ts1_trans.stop_sequence > ts1.stop_sequence
    JOIN trains t1 ON ts1.train_number = t1.train_number
    
    JOIN train_schedules ts2 ON ts1_trans.station_code = ts2.station_code
    JOIN train_schedules ts2_dest ON ts2.train_number = ts2_dest.train_number 
      AND ts2_dest.stop_sequence > ts2.stop_sequence
    JOIN trains t2 ON ts2.train_number = t2.train_number
    
    WHERE ts1.station_code = :originCode
      AND ts2_dest.station_code = :destCode
      AND ts1.train_number != ts2.train_number
    LIMIT 10;
  `;

  try {
    const rawResults = await sequelize.query(sql, {
      replacements: { originCode, destCode },
      type: QueryTypes.SELECT
    });

    const connectingRoutes = [];

    for (const row of rawResults) {
      // Validate running days if targetDay specified
      if (targetDay) {
        const leg1Days = normalizeRunsOn(row.leg1_runs_on);
        const leg2Days = normalizeRunsOn(row.leg2_runs_on);
        if (!leg1Days.includes(targetDay) || !leg2Days.includes(targetDay)) {
          continue;
        }
      }

      // Layover calculation
      const arrMins = timeToMinutes(row.leg1_arrival);
      const depMins = timeToMinutes(row.leg2_departure);
      let layoverMins = depMins - arrMins;
      if (layoverMins < 0) layoverMins += 1440; // overnight layover

      // Reasonable layover filter: between 30 mins and 8 hours (480 mins)
      if (layoverMins < 30 || layoverMins > 480) {
        continue;
      }

      const totalDurationMins = (timeToMinutes(row.leg1_arrival) - timeToMinutes(row.leg1_departure) + 1440) % 1440
        + layoverMins
        + (timeToMinutes(row.leg2_arrival) - timeToMinutes(row.leg2_departure) + 1440) % 1440;

      const durHours = Math.floor(totalDurationMins / 60);
      const durMinutes = totalDurationMins % 60;
      const durationStr = `${durHours}h ${durMinutes}m`;

      connectingRoutes.push({
        id: `conn_${row.leg1_train_number}_${row.leg2_train_number}`,
        type: 'Train',
        mode: 'Train',
        route_type: 'Connecting',
        direct: false,
        validated: true,
        source_verified: true,
        departure_date: travelDate || null,
        company: `${row.leg1_train_name} → ${row.leg2_train_name}`,
        train_number: `${row.leg1_train_number} / ${row.leg2_train_number}`,
        origin_station: row.origin_station,
        destination_station: row.dest_station,
        transfer_station: row.transfer_station,
        departure_time: row.leg1_departure || '08:00',
        arrival_time: row.leg2_arrival || '20:00',
        duration: durationStr,
        layover: `${Math.floor(layoverMins / 60)}h ${layoverMins % 60}m at ${row.transfer_station}`,
        price: 850,
        running_days: 'Connecting (Day-specific)',
        frequency: 'Connecting Route',
        legs: [
          {
            type: 'Train',
            train_number: row.leg1_train_number,
            train_name: row.leg1_train_name,
            from: row.origin_station,
            to: row.transfer_station,
            departure: row.leg1_departure,
            arrival: row.leg1_arrival,
            running_days: formatRunningDays(row.leg1_runs_on)
          },
          {
            type: 'Layover',
            station: row.transfer_station,
            duration: `${Math.floor(layoverMins / 60)}h ${layoverMins % 60}m`
          },
          {
            type: 'Train',
            train_number: row.leg2_train_number,
            train_name: row.leg2_train_name,
            from: row.transfer_station,
            to: row.dest_station,
            departure: row.leg2_departure,
            arrival: row.leg2_arrival,
            running_days: formatRunningDays(row.leg2_runs_on)
          }
        ]
      });
    }

    return connectingRoutes;
  } catch (err) {
    console.error('Error finding connecting trains:', err.message);
    return [];
  }
}

/**
 * Validates whether a direct flight is possible between two locations.
 * If not, suggests a Flight + Ground Transfer multimodal route if a nearby airport exists.
 * @param {string|object} origin 
 * @param {string|object} destination 
 * @returns {object} { canFlyDirect, sourceAirport, destAirport, multimodalAlternative }
 */
function validateFlightInfrastructure(origin, destination) {
  const sourceAirport = resolveAirport(origin);
  const destAirport = resolveAirport(destination);

  const canFlyDirect = Boolean(sourceAirport && destAirport && sourceAirport.iata !== destAirport.iata);

  let multimodalAlternative = null;

  if (!canFlyDirect) {
    const originNear = sourceAirport ? { airport: sourceAirport, distanceKm: 0, travelTimeHours: 0 } : getNearestAirport(origin, 250);
    const destNear = destAirport ? { airport: destAirport, distanceKm: 0, travelTimeHours: 0 } : getNearestAirport(destination, 250);

    if (originNear && destNear && originNear.airport.iata !== destNear.airport.iata) {
      multimodalAlternative = {
        originAirport: originNear.airport,
        originGroundTransfer: originNear.distanceKm > 0 ? {
          from: typeof origin === 'string' ? origin : origin.city || origin.name,
          to: `${originNear.airport.city} Airport (${originNear.airport.iata})`,
          distanceKm: originNear.distanceKm,
          timeHours: originNear.travelTimeHours,
          mode: originNear.groundMode
        } : null,
        flightSegment: {
          from: `${originNear.airport.city} (${originNear.airport.iata})`,
          to: `${destNear.airport.city} (${destNear.airport.iata})`,
          flightTimeHours: 2.0
        },
        destAirport: destNear.airport,
        destGroundTransfer: destNear.distanceKm > 0 ? {
          from: `${destNear.airport.city} Airport (${destNear.airport.iata})`,
          to: typeof destination === 'string' ? destination : destination.city || destination.name,
          distanceKm: destNear.distanceKm,
          timeHours: destNear.travelTimeHours,
          mode: destNear.groundMode
        } : null
      };
    }
  }

  return {
    canFlyDirect,
    sourceAirport,
    destAirport,
    multimodalAlternative
  };
}

module.exports = {
  DAYS_OF_WEEK,
  getDayOfWeek,
  normalizeRunsOn,
  trainRunsOnDate,
  getTrainFrequencyLabel,
  formatRunningDays,
  findConnectingTrains,
  validateFlightInfrastructure,
  timeToMinutes,
  minutesToTime
};
