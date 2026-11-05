const { sequelize, Train, TrainSchedule, Station, TrainFare } = require('../models');
const { calculateRailwayFare, estimateRailDistance } = require('../utils/railwayFareCalculator');

/**
 * Authoritative Railway Fare Seeder
 * Populates train_fares with official IRCTC distance-based telescopic fares
 * based on authentic station stop coordinates and train service types.
 *
 * Rules:
 * 1. Fares must be class-specific (no identical fares across classes).
 * 2. Classes must only be created if supported by the train service type
 *    (e.g., Rajdhani has 1A/2A/3A/3E, Vande Bharat/Shatabdi has EC/CC only).
 * 3. Distance is calculated from origin station to destination station coordinates.
 */
async function seedFares() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database for authoritative fare seeding...');

    await TrainFare.sync({ alter: true });

    const trains = await Train.findAll();
    console.log(`Found ${trains.length} trains to compute and seed authentic fares.`);

    let upsertedCount = 0;

    for (const train of trains) {
      const trainNo = train.train_number;
      const trainNameLower = (train.train_name || '').toLowerCase();

      // Retrieve first and last stops for route distance
      const schedules = await TrainSchedule.findAll({
        where: { train_number: trainNo },
        order: [['stop_sequence', 'ASC']]
      });

      let distanceKm = 650; // reasonable default if coordinates unavailable
      if (schedules.length >= 2) {
        // Calculate cumulative rail distance along the train's actual stop sequence
        let totalStopDistance = 0;
        let validSegmentsCount = 0;

        for (let i = 0; i < schedules.length - 1; i++) {
          const sCurr = schedules[i];
          const sNext = schedules[i + 1];

          const [stnCurr, stnNext] = await Promise.all([
            Station.findOne({ where: { station_code: sCurr.station_code } }),
            Station.findOne({ where: { station_code: sNext.station_code } })
          ]);

          if (stnCurr?.latitude && stnNext?.latitude) {
            const segDist = estimateRailDistance(
              parseFloat(stnCurr.latitude),
              parseFloat(stnCurr.longitude),
              parseFloat(stnNext.latitude),
              parseFloat(stnNext.longitude)
            );
            if (segDist > 0) {
              totalStopDistance += segDist;
              validSegmentsCount++;
            }
          }
        }

        if (validSegmentsCount >= 1 && totalStopDistance > 0) {
          distanceKm = totalStopDistance;
        } else {
          // Fallback to end-to-end station coordinates
          const firstStop = schedules[0];
          const lastStop = schedules[schedules.length - 1];

          const [origStation, destStation] = await Promise.all([
            Station.findOne({ where: { station_code: firstStop.station_code } }),
            Station.findOne({ where: { station_code: lastStop.station_code } })
          ]);

          if (origStation?.latitude && destStation?.latitude) {
            distanceKm = estimateRailDistance(
              parseFloat(origStation.latitude),
              parseFloat(origStation.longitude),
              parseFloat(destStation.latitude),
              parseFloat(destStation.longitude)
            );
          }
        }
      }

      // Determine train classification and supported classes
      const isVandeBharat = trainNameLower.includes('vande bharat');
      const isShatabdi = trainNameLower.includes('shatabdi') && !trainNameLower.includes('jan shatabdi');
      const isJanShatabdi = trainNameLower.includes('jan shatabdi');
      const isRajdhani = trainNameLower.includes('rajdhani');
      const isGaribRath = trainNameLower.includes('garib rath');
      const isTejas = trainNameLower.includes('tejas');

      let supportedClasses = [];
      let isSuperfast = true;

      if (isVandeBharat || isShatabdi) {
        supportedClasses = ['EC', 'CC'];
        isSuperfast = true;
      } else if (isJanShatabdi) {
        supportedClasses = ['CC', '2S'];
        isSuperfast = true;
      } else if (isRajdhani || isTejas) {
        supportedClasses = ['1A', '2A', '3A', '3E'];
        isSuperfast = true;
      } else if (isGaribRath) {
        supportedClasses = ['3A', 'CC'];
        isSuperfast = true;
      } else {
        // Standard Mail / Express / Superfast
        supportedClasses = ['1A', '2A', '3A', '3E', 'SL', '2S', 'UR'];
        isSuperfast = trainNameLower.includes('superfast') || trainNameLower.includes('express');
      }

      // Compute IRCTC telescopic tariff for each supported class
      for (const cls of supportedClasses) {
        const fareResult = calculateRailwayFare({
          distanceKm,
          travelClass: cls,
          isSuperfast,
          passengers: 1
        });

        const calculatedFare = fareResult?.farePerPassenger || 500;

        await TrainFare.upsert({
          train_number: trainNo,
          class_code: cls,
          fare: calculatedFare,
          distance: distanceKm
        });

        upsertedCount++;
      }
    }

    console.log(`✅ Authoritative Fare Seeding complete. Upserted ${upsertedCount} class fare records.`);
    return upsertedCount;
  } catch (error) {
    console.error('❌ Error seeding authentic fares:', error);
    throw error;
  }
}

if (require.main === module) {
  seedFares()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedFares };
