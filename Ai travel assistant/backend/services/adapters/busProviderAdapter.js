const { VERIFIED_INTERCITY_BUSES } = require('../multiModalRoutingEngine');
const { validateTransportRecord, VERIFICATION_STATUSES } = require('../transportValidationEngine');

/**
 * Bus Provider Adapter
 * Queries verified intercity state and private bus schedules.
 * Strictly avoids fabricating fictitious operators or services.
 */
async function searchBusesFromProvider({ originCodes, destCodes, originName, destName, departureDate }) {
  const safeDate = departureDate || new Date().toISOString().split('T')[0];
  const origList = Array.isArray(originCodes) ? originCodes : [originCodes];
  const destList = Array.isArray(destCodes) ? destCodes : [destCodes];

  try {
    const verifiedBuses = VERIFIED_INTERCITY_BUSES.filter(b => 
      origList.includes(b.origin_hub) && destList.includes(b.dest_code)
    );

    if (verifiedBuses.length === 0) {
      return {
        status: 'NO_BUSES_FOUND',
        buses: [],
        error: `No verified bus schedules on record between ${origList.join('/')} and ${destList.join('/')}.`
      };
    }

    const validatedBuses = [];
    for (const b of verifiedBuses) {
      const rawRecord = {
        mode: 'bus',
        provider_id: `bus_${b.bus_number}`,
        service_number: b.bus_number,
        service_name: b.operator,
        origin_code: b.origin_hub,
        destination_code: b.dest_code,
        origin_name: originName || b.origin_hub,
        destination_name: destName || b.dest_code,
        departure_time: b.dep_time ? b.dep_time.substring(0, 5) : null,
        arrival_time: b.arr_time ? b.arr_time.substring(0, 5) : null,
        source_day: 1,
        dest_day: 1,
        journey_date: safeDate,
        duration_hours: b.duration_hours || null,
        fare: b.fare_inr || null,
        currency: b.fare_inr ? 'INR' : null,
        fare_type: b.fare_inr ? 'actual' : null,
        fares: b.fare_inr ? { 'AC Seater': b.fare_inr } : null,
        available_classes: ['AC Seater'],
        source: 'verified_state_transport_directory',
        verification_status: VERIFICATION_STATUSES.PROVIDER_VERIFIED,
        is_direct: true,
        running_days: 'Daily',
        frequency: 'Daily (7 days/week)'
      };

      const { isValid, record, errors } = validateTransportRecord(rawRecord);
      if (isValid && record) {
        validatedBuses.push(record);
      } else {
        console.warn(`[BusProviderAdapter] Bus ${b.bus_number} rejected:`, errors);
      }
    }

    return {
      status: 'SUCCESS',
      buses: validatedBuses,
      error: null
    };
  } catch (err) {
    console.error('[BusProviderAdapter] Execution error:', err);
    return {
      status: 'PROVIDER_ERROR',
      buses: [],
      error: err.message
    };
  }
}

module.exports = {
  searchBusesFromProvider
};
