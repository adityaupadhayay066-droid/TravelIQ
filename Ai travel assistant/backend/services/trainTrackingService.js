const { Train, TrainSchedule, Station, LiveTrainStatus } = require('../models');
const { Op } = require('sequelize');
const {
    trainRunsOnDate,
    getTrainFrequencyLabel,
    formatRunningDays,
    normalizeRunsOn,
    DAYS_OF_WEEK
} = require('./routeValidationEngine');

const ALL_WEEK_DAYS = [
    { code: 'MON', label: 'M', full: 'Mon', name: 'Monday' },
    { code: 'TUE', label: 'T', full: 'Tue', name: 'Tuesday' },
    { code: 'WED', label: 'W', full: 'Wed', name: 'Wednesday' },
    { code: 'THU', label: 'T', full: 'Thu', name: 'Thursday' },
    { code: 'FRI', label: 'F', full: 'Fri', name: 'Friday' },
    { code: 'SAT', label: 'S', full: 'Sat', name: 'Saturday' },
    { code: 'SUN', label: 'S', full: 'Sun', name: 'Sunday' }
];

/**
 * Generates comprehensive live running status, weekly running days, and route timeline for a train
 * Similar to 'Where is My Train' app.
 */
async function getTrainTrackingDetails(params) {
    let trainNumber = null;
    let journeyDate = null;
    let selectedDay = null;

    if (typeof params === 'object' && params !== null) {
        trainNumber = params.trainNumber || params.train_number || null;
        journeyDate = params.journeyDate || null;
        selectedDay = params.selectedDay || null;
    } else {
        trainNumber = params;
    }

    if (!trainNumber) return null;

    const trimmed = String(trainNumber).trim();

    // 1. Find train
    let train = await Train.findByPk(trimmed);
    if (!train) {
        train = await Train.findOne({
            where: {
                [Op.or]: [
                    { train_number: trimmed },
                    { train_name: { [Op.like]: `%${trimmed}%` } }
                ]
            }
        });
    }

    if (!train) return null;

    // 2. Schedule lookup
    const schedules = await TrainSchedule.findAll({
        where: { train_number: train.train_number },
        order: [['stop_sequence', 'ASC']]
    });

    if (!schedules.length) {
        return {
            train_number: train.train_number,
            train_name: train.train_name,
            source_station: train.source_station || 'NDLS',
            destination_station: train.destination_station || 'BBS',
            runs_on: train.runs_on || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
            timeline: [],
            message: 'No schedule registered for this train yet.'
        };
    }

    // 3. Station enrichment
    const schedulesWithStation = await Promise.all(schedules.map(async (sch) => {
        const station = await Station.findOne({ where: { station_code: sch.station_code } });
        return {
            stop_sequence: sch.stop_sequence,
            station_code: sch.station_code,
            station_name: station?.station_name || sch.station_code,
            city: station?.city || '',
            state: station?.state || '',
            arrival_time: sch.arrival_time,
            departure_time: sch.departure_time,
            day_count: sch.day_count || 1,
            latitude: station ? station.latitude : null,
            longitude: station ? station.longitude : null
        };
    }));

    // 4. Running Days normalization & Week Day Badges
    const normalizedRuns = normalizeRunsOn(train.runs_on);
    const weeklyRunningDays = ALL_WEEK_DAYS.map(d => ({
        ...d,
        operates: normalizedRuns.includes(d.code)
    }));

    const formattedRunningDays = formatRunningDays(train.runs_on);
    const frequencyLabel = getTrainFrequencyLabel(train.runs_on);

    // 5. Check if train operates on selected date
    const now = new Date();
    const currentIST_MS = now.getTime() + (5.5 * 60 * 60 * 1000);
    const currentTime = new Date(currentIST_MS);

    let baseDate;
    if (journeyDate) {
        baseDate = new Date(`${journeyDate}T00:00:00Z`);
        if (isNaN(baseDate.getTime())) {
            baseDate = new Date(Date.UTC(currentTime.getUTCFullYear(), currentTime.getUTCMonth(), currentTime.getUTCDate()));
        }
    } else {
        baseDate = new Date(Date.UTC(currentTime.getUTCFullYear(), currentTime.getUTCMonth(), currentTime.getUTCDate()));
    }

    const dateToCheck = journeyDate || baseDate;
    const operatesOnDate = trainRunsOnDate(train, dateToCheck);

    // 6. Live status from DB or simulated telemetry
    const liveRecord = await LiveTrainStatus.findOne({ where: { train_number: train.train_number } });
    const delayMinutes = liveRecord ? (liveRecord.delay_minutes || 0) : 0;
    const manualStatus = liveRecord ? (liveRecord.status || 'On Time') : null;

    // Helper to parse HH:MM:SS
    const parseTime = (t) => {
        if (!t) return null;
        const parts = t.split(':');
        return { h: parseInt(parts[0]) || 0, m: parseInt(parts[1]) || 0 };
    };

    const formatTimeOnly = (d) => {
        if (!d) return '--';
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    };

    // Calculate timeline in UTC space (IST relative)
    const rawTimeline = schedulesWithStation.map((stop) => {
        const arr = parseTime(stop.arrival_time);
        const dep = parseTime(stop.departure_time);
        const dayOffset = (stop.day_count || 1) - 1;

        let schedArr = null;
        let actualArr = null;
        if (arr) {
            schedArr = new Date(baseDate);
            schedArr.setUTCDate(schedArr.getUTCDate() + dayOffset);
            schedArr.setUTCHours(arr.h, arr.m, 0, 0);

            actualArr = new Date(schedArr);
            actualArr.setUTCMinutes(actualArr.getUTCMinutes() + delayMinutes);
        }

        let schedDep = null;
        let actualDep = null;
        if (dep) {
            schedDep = new Date(baseDate);
            schedDep.setUTCDate(schedDep.getUTCDate() + dayOffset);
            schedDep.setUTCHours(dep.h, dep.m, 0, 0);

            actualDep = new Date(schedDep);
            actualDep.setUTCMinutes(actualDep.getUTCMinutes() + delayMinutes);
        }

        return {
            ...stop,
            schedArr,
            schedDep,
            actualArr,
            actualDep
        };
    });

    const source = rawTimeline[0];
    const destination = rawTimeline[rawTimeline.length - 1];

    let dynamicStatus = 'On Time';
    let current_station_code = null;
    let next_station_code = null;
    let last_crossed_station = null;
    let last_status_message = '';

    if (currentTime < source.actualDep) {
        dynamicStatus = 'Not Started';
        current_station_code = source.station_code;
        next_station_code = rawTimeline[1] ? rawTimeline[1].station_code : null;
        last_status_message = `Train scheduled to depart ${source.station_name} at ${formatTimeOnly(source.schedDep)}.`;
    } else if (destination.actualArr && currentTime > destination.actualArr) {
        dynamicStatus = 'Completed';
        current_station_code = destination.station_code;
        last_crossed_station = destination.station_code;
        last_status_message = `Train has arrived at destination ${destination.station_name}.`;
    } else {
        dynamicStatus = delayMinutes > 15 ? 'Delayed' : 'Running';
        for (let i = 0; i < rawTimeline.length; i++) {
            const stop = rawTimeline[i];
            if (stop.actualArr && stop.actualDep) {
                if (currentTime >= stop.actualArr && currentTime <= stop.actualDep) {
                    current_station_code = stop.station_code;
                    last_crossed_station = stop.station_code;
                    next_station_code = rawTimeline[i + 1] ? rawTimeline[i + 1].station_code : null;
                    last_status_message = `Standing at ${stop.station_name}. Expected departure: ${formatTimeOnly(stop.actualDep)}.`;
                    break;
                }
            }
            const nextStop = rawTimeline[i + 1];
            if (nextStop && stop.actualDep && nextStop.actualArr) {
                if (currentTime > stop.actualDep && currentTime < nextStop.actualArr) {
                    last_crossed_station = stop.station_code;
                    current_station_code = null; // Between stations
                    next_station_code = nextStop.station_code;
                    last_status_message = `Departed ${stop.station_name}. Heading to ${nextStop.station_name} (ETA: ${formatTimeOnly(nextStop.actualArr)}).`;
                    break;
                }
            }
        }
    }

    if (!last_status_message) {
        last_status_message = `${train.train_name} running ${delayMinutes > 0 ? delayMinutes + 'm late' : 'on time'}.`;
    }

    const finalStatus = manualStatus && manualStatus !== 'On Time' ? manualStatus : dynamicStatus;
    const active_station_code = current_station_code || last_crossed_station || source.station_code;

    // Approximate total distance & milestones
    const totalStopsCount = rawTimeline.length;
    const totalDistanceEst = Math.max(100, (totalStopsCount - 1) * 95);

    const timeline = rawTimeline.map((stop, idx) => {
        let is_completed = false;
        if (finalStatus === 'Completed') {
            is_completed = true;
        } else if (stop.actualDep && currentTime > stop.actualDep) {
            is_completed = true;
        }

        const is_current = stop.station_code === current_station_code || (!current_station_code && stop.station_code === last_crossed_station);
        const is_next = stop.station_code === next_station_code;

        // Halt duration calculation
        let haltMinutes = 0;
        if (stop.arrival_time && stop.departure_time) {
            const a = parseTime(stop.arrival_time);
            const d = parseTime(stop.departure_time);
            if (a && d) {
                haltMinutes = Math.max(0, (d.h * 60 + d.m) - (a.h * 60 + a.m));
            }
        }

        const authenticPlatform = (liveRecord && liveRecord.station_code === stop.station_code) ? liveRecord.platform : null;
        const distKm = Math.round((idx / Math.max(1, totalStopsCount - 1)) * totalDistanceEst);

        return {
            stop_sequence: stop.stop_sequence,
            station_code: stop.station_code,
            station_name: stop.station_name,
            city: stop.city,
            state: stop.state,
            arrival_time: stop.arrival_time,
            departure_time: stop.departure_time,
            sched_arr: formatTimeOnly(stop.schedArr),
            sched_dep: formatTimeOnly(stop.schedDep),
            actual_arr: formatTimeOnly(stop.actualArr),
            actual_dep: formatTimeOnly(stop.actualDep),
            halt_minutes: haltMinutes,
            platform: authenticPlatform,
            platform_display: authenticPlatform ? `PF #${authenticPlatform}` : 'Unassigned / TBA',
            distance_km: distKm,
            day_count: stop.day_count,
            latitude: stop.latitude,
            longitude: stop.longitude,
            is_completed,
            is_current,
            is_next
        };
    });

    const activeStop = timeline.find(s => s.station_code === active_station_code) || timeline[0];
    const nextStopObj = timeline.find(s => s.station_code === next_station_code);

    return {
        train_number: train.train_number,
        train_name: train.train_name,
        source_station: train.source_station || source.station_code,
        destination_station: train.destination_station || destination.station_code,
        source_station_name: source.station_name,
        destination_station_name: destination.station_name,
        service_type: train.service_type || 'Superfast Express',
        frequency: frequencyLabel,
        running_days: formattedRunningDays,
        weekly_running_days: weeklyRunningDays,
        operates_on_date: operatesOnDate,
        operation_note: operatesOnDate ? null : `Train does not run on ${selectedDay || 'this date'}. Operating days: ${formattedRunningDays} (${frequencyLabel}).`,
        journey_date: journeyDate || baseDate.toISOString().split('T')[0],
        classes: ['1A', '2A', '3A', 'SL'],
        total_stops: totalStopsCount,
        total_distance_km: totalDistanceEst,
        live_status: {
            status: finalStatus,
            delay_minutes: delayMinutes,
            delay_text: delayMinutes > 0 ? `${delayMinutes} min late` : 'On Time',
            is_live_telemetry: Boolean(liveRecord),
            telemetry_source: liveRecord ? 'live_railway_gps' : 'scheduled_timetable',
            verification_status: liveRecord ? 'verified' : 'static_reference',
            telemetry_disclaimer: liveRecord ? null : 'Estimated from scheduled timetable; live GPS telemetry not active for this train run.',
            current_station_code: active_station_code,
            current_station_name: activeStop?.station_name || active_station_code,
            next_station_code: next_station_code,
            next_station_name: nextStopObj?.station_name || next_station_code,
            last_crossed_station: last_crossed_station,
            last_status_message: last_status_message,
            current_lat: activeStop?.latitude,
            current_lng: activeStop?.longitude,
            last_updated_at: new Date()
        },
        timeline
    };
}

module.exports = {
    getTrainTrackingDetails,
    ALL_WEEK_DAYS
};
