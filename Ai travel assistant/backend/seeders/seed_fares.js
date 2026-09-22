const { sequelize, Train, TrainFare } = require('../models');

async function seedFares() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database for seeding fares...');

    // Make sure TrainFare table exists (sync just in case)
    await TrainFare.sync({ alter: true });

    const trains = await Train.findAll();
    console.log(`Found ${trains.length} trains to seed fares for.`);

    let createdCount = 0;

    for (const train of trains) {
      const trainSeed = parseInt(train.train_number.replace(/\D/g, '')) || 12345;
      const baseFare = Math.max(Math.round((trainSeed % 15 + 10) * 50 + 180), 220); // Randomish base
      const trainNameLower = (train.train_name || '').toLowerCase();

      const isChairCar = trainNameLower.includes('vande') || 
                         trainNameLower.includes('shatabdi') || 
                         trainNameLower.includes('jan shatabdi') ||
                         trainNameLower.includes('intercity') ||
                         trainNameLower.includes('chair');

      const faresToCreate = isChairCar ? [
        { class_code: 'EC', fare: Math.round(baseFare * 3.8) },
        { class_code: 'CC', fare: Math.round(baseFare * 2.2) },
        { class_code: '2S', fare: Math.round(baseFare * 0.55) },
        { class_code: 'UR', fare: Math.round(baseFare * 0.35) }
      ] : [
        { class_code: '1A', fare: Math.round(baseFare * 4.9) },
        { class_code: '2A', fare: Math.round(baseFare * 3.1) },
        { class_code: '3A', fare: Math.round(baseFare * 2.2) },
        { class_code: '3E', fare: Math.round(baseFare * 1.85) },
        { class_code: 'SL', fare: Math.round(baseFare) },
        { class_code: '2S', fare: Math.round(baseFare * 0.55) },
        { class_code: 'UR', fare: Math.round(baseFare * 0.35) }
      ];

      for (const f of faresToCreate) {
        await TrainFare.upsert({
          train_number: train.train_number,
          class_code: f.class_code,
          fare: f.fare,
          distance: Math.round(baseFare * 1.5) // mock distance
        });
        createdCount++;
      }
    }

    console.log(`✅ Seeding complete. Upserted ${createdCount} train fare records.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding fares:', error);
    process.exit(1);
  }
}

seedFares();
