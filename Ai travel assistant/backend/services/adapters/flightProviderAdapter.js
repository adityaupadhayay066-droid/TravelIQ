const { resolveAirport, hasCommercialAirport } = require('../../utils/airportRegistry');
const { VERIFIED_FLIGHT_SCHEDULES } = require('../multiModalRoutingEngine');
const { validateTransportRecord, VERIFICATION_STATUSES } = require('../transportValidationEngine');

/**
 * Flight Provider Adapter
 * Queries verified commercial flights between authenticated IATA airports.
 * Strictly avoids generating fictitious airlines, flight numbers, or routes.
 */
async function searchFlightsFromProvider({ originInput, destInput, departureDate }) {
  const srcAirport = resolveAirport(originInput);
  const dstAirport = resolveAirport(destInput);

  const safeDate = departureDate || new Date().toISOString().split('T')[0];

  // 1. Check if both cities actually have commercial airports
  if (!srcAirport || !dstAirport) {
    const missing = [];
    if (!srcAirport) missing.push(`Origin "${typeof originInput === 'string' ? originInput : originInput?.station_name || 'Origin'}" lacks a commercial airport`);
    if (!dstAirport) missing.push(`Destination "${typeof destInput === 'string' ? destInput : destInput?.station_name || 'Destination'}" lacks a commercial airport`);
    return {
      status: 'NO_AIRPORT_AT_ENDPOINT',
      flights: [],
      error: missing.join('; '),
      airports: {
        sourceAirport: srcAirport ? srcAirport.name : null,
        destAirport: dstAirport ? dstAirport.name : null
      }
    };
  }

  // 2. Reject if same airport
  if (srcAirport.iata === dstAirport.iata) {
    return {
      status: 'SAME_AIRPORT',
      flights: [],
      error: `Origin and destination resolve to the same airport: ${srcAirport.iata}`
    };
  }

  try {
    // 3. Search verified commercial flight repository
    const verifiedFlights = VERIFIED_FLIGHT_SCHEDULES.filter(
      f => f.origin_iata === srcAirport.iata && f.dest_iata === dstAirport.iata
    );

    if (verifiedFlights.length === 0) {
      return {
        status: 'NO_DIRECT_FLIGHTS_FOUND',
        flights: [],
        error: `No verified direct flight schedules on record between ${srcAirport.iata} (${srcAirport.city}) and ${dstAirport.iata} (${dstAirport.city}).`,
        airports: {
          sourceAirport: srcAirport.name,
          destAirport: dstAirport.name,
          sourceIata: srcAirport.iata,
          destIata: dstAirport.iata
        }
      };
    }

    const validatedFlights = [];
    for (const fl of verifiedFlights) {
      const rawRecord = {
        mode: 'flight',
        provider_id: `flight_${fl.flight_number}`,
        service_number: fl.flight_number,
        service_name: `${fl.airline} ${fl.flight_number}`,
        origin_code: fl.origin_iata,
        destination_code: fl.dest_iata,
        origin_name: `${srcAirport.city} (${srcAirport.iata})`,
        destination_name: `${dstAirport.city} (${dstAirport.iata})`,
        departure_time: fl.dep_time ? fl.dep_time.substring(0, 5) : null,
        arrival_time: fl.arr_time ? fl.arr_time.substring(0, 5) : null,
        source_day: 1,
        dest_day: 1 + (fl.day_offset || 0),
        journey_date: safeDate,
        fare: fl.fare_inr || null,
        currency: fl.fare_inr ? 'INR' : null,
        fare_type: fl.fare_inr ? 'actual' : null,
        fares: fl.fare_inr ? { 'Economy': fl.fare_inr } : null,
        available_classes: ['Economy'],
        source: 'verified_commercial_flight_registry',
        verification_status: VERIFICATION_STATUSES.PROVIDER_VERIFIED,
        is_direct: true,
        running_days: 'Daily',
        frequency: 'Daily (7 days/week)'
      };

      const { isValid, record, errors } = validateTransportRecord(rawRecord);
      if (isValid && record) {
        validatedFlights.push(record);
      } else {
        console.warn(`[FlightProviderAdapter] Flight ${fl.flight_number} rejected:`, errors);
      }
    }

    return {
      status: 'SUCCESS',
      flights: validatedFlights,
      error: null,
      airports: {
        sourceAirport: srcAirport.name,
        destAirport: dstAirport.name,
        sourceIata: srcAirport.iata,
        destIata: dstAirport.iata
      }
    };
  } catch (err) {
    console.error('[FlightProviderAdapter] Execution error:', err);
    return {
      status: 'PROVIDER_ERROR',
      flights: [],
      error: err.message
    };
  }
}

module.exports = {
  searchFlightsFromProvider
};
