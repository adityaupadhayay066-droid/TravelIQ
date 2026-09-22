const { Transport } = require('../models');

const seedTransports = async () => {
  try {
    const transports = [
      { transport_name: 'Boeing 737', transport_type: 'Flight', availability: true, average_speed: 800.0, comfort_score: 8 },
      { transport_name: 'Vande Bharat', transport_type: 'Train', availability: true, average_speed: 130.0, comfort_score: 7 },
      { transport_name: 'Volvo B11R', transport_type: 'Bus', availability: true, average_speed: 65.0, comfort_score: 6 },
      { transport_name: 'Uber Intercity', transport_type: 'Taxi', availability: true, average_speed: 70.0, comfort_score: 9 }
    ];

    for (const transport of transports) {
      await Transport.findOrCreate({
        where: { transport_type: transport.transport_type },
        defaults: transport
      });
    }
    console.log('Transport seeder executed successfully.');
  } catch (error) {
    console.error('Error seeding transports:', error);
  }
};

module.exports = { seedTransports };
