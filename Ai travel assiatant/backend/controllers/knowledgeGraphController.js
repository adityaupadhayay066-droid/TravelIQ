const { Station, Train } = require('../models');

/**
 * Serve Nodes and Links for the Interactive Knowledge Graph.
 */
const getGraphData = async (req, res) => {
    try {
        const stations = await Station.findAll({ limit: 10 });
        const trains = await Train.findAll({ limit: 5 });

        const nodes = [];
        const links = [];

        // Users & Bookings
        nodes.push({ id: 'user_current', label: req.user?.name || 'Current Traveler', group: 'user', value: 20 });
        nodes.push({ id: 'booking_active', label: 'Active Search / Booking', group: 'booking', value: 15 });
        links.push({ source: 'user_current', target: 'booking_active', label: 'holds' });

        for (const st of stations) {
            const stNodeId = `station_${st.station_code}`;
            const cityNodeId = `city_${st.station_code}`;
            const cityName = st.station_name.split(' ')[0];

            nodes.push({ id: stNodeId, label: st.station_name, group: 'station', value: 18 });
            nodes.push({ id: cityNodeId, label: cityName, group: 'city', value: 25 });
            
            links.push({ source: cityNodeId, target: stNodeId, label: 'contains' });
        }

        // Link active booking randomly to the first station
        if (stations.length > 0) {
            links.push({ source: 'booking_active', target: `station_${stations[0].station_code}`, label: 'departs_from' });
            if (stations.length > 1) {
                links.push({ source: 'booking_active', target: `station_${stations[1].station_code}`, label: 'arrives_at' });
            }
        }

        for (const tr of trains) {
            const trainNodeId = `train_${tr.train_number}`;
            nodes.push({ id: trainNodeId, label: tr.train_name, group: 'route', value: 16 });
            links.push({ source: 'booking_active', target: trainNodeId, label: 'exploring' });
        }

        res.json({ nodes, links });
    } catch (e) {
        console.error('[Get Knowledge Graph Error]:', e);
        res.status(500).json({ message: e.message });
    }
};

module.exports = { getGraphData };
