/**
 * Transport Validation Engine
 * Implements strict data normalization, validation, and provenance tracking for TravelIQ.
 * Ensures zero fabricated identifiers, zero negative or default fares, and clear verification taxonomy.
 */

const VERIFICATION_STATUSES = {
  PROVIDER_VERIFIED: 'provider_verified',
  STATIC_REFERENCE: 'static_reference',
  HISTORICAL: 'historical',
  ESTIMATED: 'estimated',
  UNAVAILABLE: 'unavailable'
};

const FORBIDDEN_IDENTIFIERS = new Set([
  'XXXXX', 'YYYYY', 'TR1', 'TR2', 'TRAIN', 'TRANSIT', 'UNKNOWN', 'PLACEHOLDER', 'DUMMY', 'TEMP'
]);

function isForbiddenIdentifier(str) {
  if (!str) return false;
  const u = String(str).toUpperCase().trim();
  if (FORBIDDEN_IDENTIFIERS.has(u)) return true;
  return /\b(XXXXX|YYYYY|TR1|TR2|DUMMY|TEMP|PLACEHOLDER)\b/i.test(u);
}

/**
 * Validates a single transport option according to strict TravelIQ provenance criteria.
 * Returns { isValid: boolean, record: object|null, errors: string[] }
 */
function validateTransportRecord(rawRecord) {
  const errors = [];
  if (!rawRecord || typeof rawRecord !== 'object') {
    return { isValid: false, record: null, errors: ['Record must be a non-null object'] };
  }

  // 1. Mode Validation
  const rawMode = String(rawRecord.mode || rawRecord.type || '').toLowerCase().trim();
  let normalizedMode = null;
  if (rawMode.includes('train') || rawMode.includes('rail')) {
    normalizedMode = 'train';
  } else if (rawMode.includes('flight') || rawMode.includes('air')) {
    normalizedMode = 'flight';
  } else if (rawMode.includes('bus')) {
    normalizedMode = 'bus';
  } else {
    errors.push(`Invalid or unsupported transport mode: "${rawRecord.mode || rawRecord.type}"`);
  }

  // 2. Service Identifier Validation
  const serviceNumber = String(
    rawRecord.service_number || rawRecord.train_number || rawRecord.number || rawRecord.flightNo || rawRecord.bus_number || ''
  ).trim();

  if (!serviceNumber) {
    errors.push('Missing service identifier (service_number/train_number/flight_number)');
  } else if (isForbiddenIdentifier(serviceNumber)) {
    errors.push(`Forbidden placeholder / dummy service identifier: "${serviceNumber}"`);
  }

  const serviceName = String(
    rawRecord.service_name || rawRecord.train_name || rawRecord.name || rawRecord.carrier || rawRecord.operator || ''
  ).trim();

  if (!serviceName) {
    errors.push('Missing service or operator name');
  } else if (isForbiddenIdentifier(serviceName)) {
    errors.push(`Forbidden placeholder / dummy service name: "${serviceName}"`);
  }

  // 3. Station / Airport Code Validation
  const originCode = String(
    rawRecord.origin_code || rawRecord.source_code || rawRecord.origin_station || rawRecord.origin || rawRecord.depStationCode || ''
  ).toUpperCase().trim();

  const destCode = String(
    rawRecord.destination_code || rawRecord.dest_code || rawRecord.dest_station || rawRecord.destination || rawRecord.arrStationCode || ''
  ).toUpperCase().trim();

  if (!originCode || originCode.length < 2) {
    errors.push(`Invalid origin station/airport code: "${originCode}"`);
  }
  if (!destCode || destCode.length < 2) {
    errors.push(`Invalid destination station/airport code: "${destCode}"`);
  }
  if (originCode && destCode && originCode === destCode) {
    errors.push(`Origin and destination codes cannot be identical: "${originCode}"`);
  }

  // 4. Departure Date Validation
  const journeyDate = String(rawRecord.journey_date || rawRecord.departure_date || '').trim();
  if (!journeyDate || !/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
    errors.push(`Journey date must be formatted as YYYY-MM-DD, received: "${journeyDate}"`);
  }

  // 5. Timings & Timestamp Validation
  const depTime = rawRecord.departure_time || rawRecord.depTime || rawRecord.source_departure || null;
  const arrTime = rawRecord.arrival_time || rawRecord.arrTime || rawRecord.dest_arrival || null;

  let depUtc = rawRecord.departure_utc || rawRecord.departure_time_utc || null;
  let arrUtc = rawRecord.arrival_utc || rawRecord.arrival_time_utc || null;

  // Build ISO timestamps if not already provided
  if ((!depUtc || !arrUtc) && depTime && arrTime && journeyDate) {
    const parseClock = (clockStr) => {
      const match = String(clockStr).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const period = match[4] ? match[4].toUpperCase() : null;
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return { h, m };
    };

    const depClock = parseClock(depTime);
    const arrClock = parseClock(arrTime);

    if (depClock && arrClock) {
      const depDate = new Date(`${journeyDate}T00:00:00Z`);
      depDate.setUTCHours(depClock.h, depClock.m, 0, 0);
      depUtc = depDate.toISOString();

      const arrDate = new Date(`${journeyDate}T00:00:00Z`);
      const explicitDayGiven = (rawRecord.dest_day !== undefined || rawRecord.arr_day !== undefined);
      let dayOffset = Number(rawRecord.dest_day || rawRecord.arr_day || 1) - Number(rawRecord.source_day || rawRecord.dep_day || 1);
      if (dayOffset < 0) dayOffset = 0;

      // Check cross-midnight rollover if same day count
      if (dayOffset === 0 && (arrClock.h * 60 + arrClock.m) < (depClock.h * 60 + depClock.m)) {
        if (explicitDayGiven) {
          errors.push(`Arrival time (${arrTime}) cannot precede departure time (${depTime}) on the same calendar day.`);
        } else {
          dayOffset = 1;
        }
      }
      arrDate.setUTCDate(arrDate.getUTCDate() + dayOffset);
      arrDate.setUTCHours(arrClock.h, arrClock.m, 0, 0);
      arrUtc = arrDate.toISOString();
    }
  }

  // Check temporal validity
  if (depUtc && arrUtc) {
    const tDep = new Date(depUtc).getTime();
    const tArr = new Date(arrUtc).getTime();
    if (isNaN(tDep) || isNaN(tArr)) {
      errors.push('Invalid ISO timestamps for departure or arrival');
    } else if (tArr <= tDep) {
      errors.push(`Arrival timestamp (${arrUtc}) must be strictly after departure timestamp (${depUtc})`);
    }
  }

  // 6. Fare Validation (Strict: Never negative, never defaulted to fake values)
  let validatedFare = null;
  let currency = null;
  let fareType = null;
  let faresMap = null;

  if (rawRecord.fare !== undefined && rawRecord.fare !== null && rawRecord.fare !== '') {
    const parsed = Number(rawRecord.fare);
    if (isNaN(parsed) || parsed < 0) {
      errors.push(`Invalid fare amount: "${rawRecord.fare}". Must be a non-negative number.`);
    } else {
      validatedFare = parsed;
      currency = rawRecord.currency || 'INR';
      fareType = rawRecord.fare_type || 'actual';
    }
  } else if (rawRecord.price !== undefined && rawRecord.price !== null && rawRecord.price !== '') {
    const parsed = Number(rawRecord.price);
    if (!isNaN(parsed) && parsed >= 0) {
      validatedFare = parsed;
      currency = rawRecord.currency || 'INR';
      fareType = rawRecord.fare_type || (rawRecord.fares ? 'actual' : 'estimated');
    }
  }

  if (rawRecord.fares && typeof rawRecord.fares === 'object') {
    faresMap = {};
    for (const [cls, amt] of Object.entries(rawRecord.fares)) {
      const parsedAmt = Number(amt);
      if (isNaN(parsedAmt) || parsedAmt < 0) {
        errors.push(`Fare for class ${cls} must be a positive number: "${amt}"`);
      } else {
        faresMap[cls] = parsedAmt;
      }
    }
    if (validatedFare === null && Object.keys(faresMap).length > 0) {
      validatedFare = Math.min(...Object.values(faresMap));
      currency = 'INR';
      fareType = rawRecord.fare_type || 'actual';
    }
  }


  // 7. Provenance & Verification Status Validation
  const source = String(rawRecord.source || '').trim();
  if (!source) {
    errors.push('Missing authoritative data source provenance');
  }

  let verificationStatus = rawRecord.verification_status;
  if (!verificationStatus) {
    if (rawRecord.source_verified === true || rawRecord.verified === true) {
      verificationStatus = VERIFICATION_STATUSES.PROVIDER_VERIFIED;
    } else if (rawRecord.validated === true) {
      verificationStatus = VERIFICATION_STATUSES.STATIC_REFERENCE;
    } else {
      verificationStatus = VERIFICATION_STATUSES.UNAVAILABLE;
    }
  }

  if (!Object.values(VERIFICATION_STATUSES).includes(verificationStatus)) {
    verificationStatus = VERIFICATION_STATUSES.UNAVAILABLE;
  }

  if (errors.length > 0) {
    return { isValid: false, record: null, errors };
  }

  // Duration calculation
  let durationHours = rawRecord.duration_hours || null;
  let durationFormatted = rawRecord.dur || rawRecord.duration || null;
  if (depUtc && arrUtc && !durationHours) {
    const diffHours = (new Date(arrUtc).getTime() - new Date(depUtc).getTime()) / (3600 * 1000);
    durationHours = parseFloat(diffHours.toFixed(2));
    const h = Math.floor(diffHours);
    const m = Math.round((diffHours - h) * 60);
    durationFormatted = `${h}h ${m}m`;
  }

  // Canonical Normalized Record
  const canonicalRecord = {
    mode: normalizedMode,
    type: normalizedMode.charAt(0).toUpperCase() + normalizedMode.slice(1),
    provider_id: rawRecord.provider_id || `${normalizedMode}_${serviceNumber}`,
    service_number: serviceNumber,
    service_name: serviceName,
    train_number: serviceNumber, // Backward compatibility
    train_name: serviceName,   // Backward compatibility
    number: serviceNumber,       // Backward compatibility
    name: serviceName,           // Backward compatibility
    origin_code: originCode,
    destination_code: destCode,
    origin_name: rawRecord.origin_name || rawRecord.depStation || originCode,
    destination_name: rawRecord.destination_name || rawRecord.arrStation || destCode,
    depStation: rawRecord.origin_name || rawRecord.depStation || originCode, // Frontend compatibility
    arrStation: rawRecord.destination_name || rawRecord.arrStation || destCode, // Frontend compatibility
    departure_time: depTime,
    arrival_time: arrTime,
    depTime: depTime, // Frontend compatibility
    arrTime: arrTime, // Frontend compatibility
    departure_utc: depUtc,
    arrival_utc: arrUtc,
    departure_timezone: rawRecord.departure_timezone || 'Asia/Kolkata',
    arrival_timezone: rawRecord.arrival_timezone || 'Asia/Kolkata',
    journey_date: journeyDate,
    departure_date: journeyDate,
    duration_hours: durationHours,
    duration_formatted: durationFormatted,
    dur: durationFormatted, // Frontend compatibility
    duration: durationFormatted,
    fare: validatedFare,
    price: validatedFare, // Frontend compatibility
    fare_inr: validatedFare,
    currency: currency,
    fare_type: fareType,
    fares: faresMap,
    classes: faresMap ? Object.entries(faresMap).map(([c, p]) => `${c} - ₹${p.toLocaleString()}`) : (rawRecord.classes || []),
    available_classes: rawRecord.available_classes || (faresMap ? Object.keys(faresMap) : []),
    available_seats: rawRecord.available_seats || null,
    source: source,
    retrieved_at: rawRecord.retrieved_at || new Date().toISOString(),
    verification_status: verificationStatus,
    verified: verificationStatus === VERIFICATION_STATUSES.PROVIDER_VERIFIED || verificationStatus === VERIFICATION_STATUSES.STATIC_REFERENCE,
    source_verified: verificationStatus === VERIFICATION_STATUSES.PROVIDER_VERIFIED,
    booking_url: rawRecord.booking_url || null,
    is_direct: rawRecord.is_direct !== undefined ? Boolean(rawRecord.is_direct) : (rawRecord.direct !== false),
    direct: rawRecord.is_direct !== undefined ? Boolean(rawRecord.is_direct) : (rawRecord.direct !== false),
    route_type: rawRecord.route_type || (rawRecord.direct === false ? 'Connecting' : 'Direct'),
    legs: rawRecord.legs || null,
    operating_days: rawRecord.operating_days || rawRecord.runs_on || null,
    running_days: rawRecord.running_days || (Array.isArray(rawRecord.runs_on) ? rawRecord.runs_on.join(', ') : 'Daily'),
    frequency: rawRecord.frequency || 'Daily'
  };

  return { isValid: true, record: canonicalRecord, errors: [] };
}

/**
 * Validates and deduplicates a batch of transport options deterministically.
 */
function normalizeAndValidateTransportBatch(rawList) {
  if (!Array.isArray(rawList)) return { validRecords: [], rejectedCount: 0, errors: ['Input must be an array'] };

  const validRecords = [];
  const seenKeys = new Set();
  let rejectedCount = 0;
  const rejectionDetails = [];

  for (const item of rawList) {
    const { isValid, record, errors } = validateTransportRecord(item);
    if (!isValid || !record) {
      rejectedCount++;
      rejectionDetails.push({ raw: item, errors });
      continue;
    }

    // Deterministic deduplication key
    const dedupKey = `${record.mode}_${record.service_number}_${record.journey_date}_${record.origin_code}_${record.destination_code}`;
    if (seenKeys.has(dedupKey)) {
      continue; // Skip duplicate without error
    }
    seenKeys.add(dedupKey);
    validRecords.push(record);
  }

  return {
    validRecords,
    rejectedCount,
    rejectionDetails
  };
}

/**
 * Deterministically deduplicates an array of transport options.
 */
function deduplicateOptions(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const deduped = [];
  for (const item of list) {
    const mode = item.mode || item.type || 'mode';
    const num = item.service_number || item.train_number || item.number || item.id;
    const date = item.journey_date || item.departure_date || 'date';
    const orig = item.origin_code || item.source_code || item.depStation || 'orig';
    const dest = item.destination_code || item.dest_code || item.arrStation || 'dest';
    const key = `${mode}_${num}_${date}_${orig}_${dest}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }
  return deduped;
}

module.exports = {
  VERIFICATION_STATUSES,
  FORBIDDEN_IDENTIFIERS,
  validateTransportRecord,
  normalizeAndValidateTransportBatch,
  deduplicateOptions
};

