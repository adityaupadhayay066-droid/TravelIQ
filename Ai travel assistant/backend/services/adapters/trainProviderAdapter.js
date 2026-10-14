const { Train, TrainSchedule, TrainFare, Station, sequelize: defaultSequelize } = require('../../models');
const { trainRunsOnDate, formatRunningDays, getTrainFrequencyLabel } = require('../routeValidationEngine');
const { validateTransportRecord, VERIFICATION_STATUSES } = require('../transportValidationEngine');

/**
 * Train Provider Adapter
 * Queries authentic train schedules and fares from the SQL database.
 * Never invents train names, numbers, schedules, or fares.
 */
async function searchTrainsFromProvider({ originCodes, destCodes, originName, destName, departureDate, sequelizeInstance }) {
  const db = sequelizeInstance || defaultSequelize;
  if (!originCodes?.length || !destCodes?.length) {
    return { status: 'INVALID_PARAMETERS', trains: [], error: 'Origin and destination station codes required.' };
  }

  const safeDate = departureDate || new Date().toISOString().split('T')[0];

  try {
    const query = `
      SELECT 
          t.train_number, 
          t.train_name, 
          t.runs_on,
          t.service_type,
          t.frequency,
          MIN(s1.departure_time) as source_departure, 
          MIN(s1.day_count) as source_day,
          MIN(s2.arrival_time) as dest_arrival,
          MIN(s2.day_count) as dest_day,
          s1.station_code as matched_origin,
          s2.station_code as matched_dest
      FROM train_schedules s1
      JOIN train_schedules s2 ON s1.train_number = s2.train_number
      JOIN trains t ON s1.train_number = t.train_number
      WHERE s1.station_code IN (:origin_station_codes)
        AND s2.station_code IN (:dest_station_codes)
        AND s1.stop_sequence < s2.stop_sequence
      GROUP BY t.train_number, t.train_name, t.runs_on, t.service_type, t.frequency, s1.station_code, s2.station_code
      ORDER BY source_departure ASC
      LIMIT 100;
    `;

    const dbRoutes = await db.query(query, {
      replacements: { 
        origin_station_codes: originCodes, 
        dest_station_codes: destCodes
      },
      type: db.QueryTypes.SELECT
    });

    if (!dbRoutes || dbRoutes.length === 0) {
      return { status: 'NO_TRAINS_FOUND', trains: [], error: null };
    }

    // Filter by departure date operating schedule
    const validOperatingRoutes = dbRoutes.filter(route => trainRunsOnDate(route, safeDate));
    if (validOperatingRoutes.length === 0) {
      return { 
        status: 'NO_OPERATING_TRAINS_ON_DATE', 
        trains: [], 
        error: `Trains exist on this corridor, but none operate on ${safeDate}.` 
      };
    }

    // Retrieve authentic fares from train_fares table
    const trainNumbers = validOperatingRoutes.map(r => r.train_number);
    let allFares = [];
    try {
      allFares = await TrainFare.findAll({
        where: { train_number: trainNumbers }
      });
    } catch (fareErr) {
      console.warn('[TrainProviderAdapter] Fares query notice:', fareErr.message);
    }

    const fareMap = {};
    for (const f of allFares) {
      if (!fareMap[f.train_number]) fareMap[f.train_number] = {};
      fareMap[f.train_number][f.class_code] = f.fare;
    }

    const validTrainOptions = [];
    const seenTrainNumbers = new Set();

    for (const route of validOperatingRoutes) {
      if (seenTrainNumbers.has(route.train_number)) continue;
      seenTrainNumbers.add(route.train_number);

      const authenticFares = fareMap[route.train_number] || null;

      const rawRecord = {
        mode: 'train',
        provider_id: `irctc_${route.train_number}`,
        service_number: route.train_number,
        service_name: route.train_name,
        origin_code: route.matched_origin || originCodes[0],
        destination_code: route.matched_dest || destCodes[0],
        origin_name: originName || route.matched_origin || originCodes[0],
        destination_name: destName || route.matched_dest || destCodes[0],
        departure_time: route.source_departure ? route.source_departure.substring(0, 5) : null,
        arrival_time: route.dest_arrival ? route.dest_arrival.substring(0, 5) : null,
        source_day: route.source_day || 1,
        dest_day: route.dest_day || 1,
        journey_date: safeDate,
        fare: authenticFares ? Math.min(...Object.values(authenticFares)) : null,
        currency: authenticFares ? 'INR' : null,
        fare_type: authenticFares ? 'actual' : null,
        fares: authenticFares,
        available_classes: authenticFares ? Object.keys(authenticFares) : [],
        source: 'irctc_sql_database',
        verification_status: VERIFICATION_STATUSES.STATIC_REFERENCE,
        is_direct: true,
        operating_days: route.runs_on,
        running_days: formatRunningDays(route.runs_on),
        frequency: route.frequency || getTrainFrequencyLabel(route.runs_on)
      };

      const { isValid, record, errors } = validateTransportRecord(rawRecord);
      if (isValid && record) {
        validTrainOptions.push(record);
      } else {
        console.warn(`[TrainProviderAdapter] Train ${route.train_number} validation rejected:`, errors);
      }
    }

    return {
      status: 'SUCCESS',
      trains: validTrainOptions,
      error: null
    };
  } catch (err) {
    console.error('[TrainProviderAdapter] Execution error:', err);
    return {
      status: 'PROVIDER_ERROR',
      trains: [],
      error: err.message
    };
  }
}

module.exports = {
  searchTrainsFromProvider
};
