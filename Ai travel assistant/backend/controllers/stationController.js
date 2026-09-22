const { StationModel, Station } = require('../models');
const { Op } = require('sequelize');

// Helper to generate a procedural 3D station model data
const generateDefaultStationModel = (stationCode, stationName) => {
    // Determine configuration scale based on station
    const platformCount = 4;
    
    const platforms = [];
    const nodes = [];
    const links = [];
    const amenities = [];

    // Let's lay out platforms.
    // Platforms run parallel along the X axis, track length along Z axis (from z = -60 to z = 60)
    // Platform width is 6m, track space is 8m.
    // Platform X coordinate = i * 14 - (platformCount * 7)
    for (let i = 0; i < platformCount; i++) {
        const platformNum = i + 1;
        const xPos = i * 16 - (platformCount * 8);
        platforms.push({
            number: platformNum,
            x: xPos,
            y: 0,
            z: 0,
            width: 6,
            length: 120,
            height: 1.2
        });

        // Add platform center nodes for pathfinding
        // Each platform has 3 nodes: North (z = -30), Middle (z = 0), South (z = 30)
        const nodeN = `p_${platformNum}_n`;
        const nodeM = `p_${platformNum}_m`;
        const nodeS = `p_${platformNum}_s`;

        nodes.push({ id: nodeN, name: `Platform ${platformNum} (North)`, x: xPos, y: 1.2, z: -30, type: 'platform' });
        nodes.push({ id: nodeM, name: `Platform ${platformNum} (Center)`, x: xPos, y: 1.2, z: 0, type: 'platform' });
        nodes.push({ id: nodeS, name: `Platform ${platformNum} (South)`, x: xPos, y: 1.2, z: 30, type: 'platform' });

        // Connect platform nodes together
        links.push({ from: nodeN, to: nodeM });
        links.push({ from: nodeM, to: nodeS });

        // Add platform specific amenities
        if (platformNum % 3 === 1) {
            // Restroom on South side of platforms 1, 4, 7...
            amenities.push({ id: `restroom_${platformNum}`, name: `Restroom P${platformNum}`, type: 'restroom', x: xPos - 1, y: 1.2, z: 20 });
            nodes.push({ id: `node_restroom_${platformNum}`, name: `Restroom P${platformNum}`, x: xPos - 1, y: 1.2, z: 20, type: 'amenity' });
            links.push({ from: nodeS, to: `node_restroom_${platformNum}` });
        }
        if (platformNum % 3 === 2) {
            // Water booth on North side
            amenities.push({ id: `water_${platformNum}`, name: `Water Booth P${platformNum}`, type: 'water', x: xPos + 1, y: 1.2, z: -20 });
            nodes.push({ id: `node_water_${platformNum}`, name: `Water Booth P${platformNum}`, x: xPos + 1, y: 1.2, z: -20, type: 'amenity' });
            links.push({ from: nodeN, to: `node_water_${platformNum}` });
        }
        if (platformNum === 1 || platformNum === platformCount) {
            // Help Desk on Center of platform 1 and last platform
            amenities.push({ id: `help_${platformNum}`, name: `Help Desk P${platformNum}`, type: 'help', x: xPos, y: 1.2, z: 5 });
            nodes.push({ id: `node_help_${platformNum}`, name: `Help Desk P${platformNum}`, x: xPos, y: 1.2, z: 5, type: 'amenity' });
            links.push({ from: nodeM, to: `node_help_${platformNum}` });
        }
    }

    // Add main Entrances on East (Ajmeri Gate) and West (Paharganj) sides
    // East entrance is at X positive outer edge, West is at X negative outer edge
    const eastEntX = (platformCount * 8) + 12;
    const westEntX = -(platformCount * 8) - 12;

    amenities.push({ id: 'ent_east', name: 'Ajmeri Gate Entrance', type: 'entrance', x: eastEntX, y: 0, z: 0 });
    amenities.push({ id: 'ent_west', name: 'Paharganj Entrance', type: 'entrance', x: westEntX, y: 0, z: 0 });

    nodes.push({ id: 'node_ent_east', name: 'Ajmeri Gate Entrance Lobby', x: eastEntX, y: 0, z: 0, type: 'entrance' });
    nodes.push({ id: 'node_ent_west', name: 'Paharganj Entrance Lobby', x: westEntX, y: 0, z: 0, type: 'entrance' });

    // Add Ticket counters and Waiting rooms near entrances
    amenities.push({ id: 'ticket_west', name: 'Ticket Counter (Paharganj)', type: 'ticket', x: westEntX - 4, y: 0, z: -15 });
    nodes.push({ id: 'node_ticket_west', name: 'Paharganj Ticket Area', x: westEntX - 4, y: 0, z: -15, type: 'amenity' });
    links.push({ from: 'node_ent_west', to: 'node_ticket_west' });

    amenities.push({ id: 'waiting_west', name: 'Executive Waiting Lounge', type: 'waiting', x: westEntX - 4, y: 0, z: 15 });
    nodes.push({ id: 'node_waiting_west', name: 'Executive Waiting Lounge', x: westEntX - 4, y: 0, z: 15, type: 'amenity' });
    links.push({ from: 'node_ent_west', to: 'node_waiting_west' });

    amenities.push({ id: 'medical_east', name: 'Emergency Medical Room', type: 'medical', x: eastEntX + 4, y: 0, z: 20 });
    nodes.push({ id: 'node_medical_east', name: 'Emergency Medical Room', x: eastEntX + 4, y: 0, z: 20, type: 'amenity' });
    links.push({ from: 'node_ent_east', to: 'node_medical_east' });

    // Foot Over Bridges (FOB) connecting all platforms
    // FOB North (z = -30, elevated y = 8m)
    // FOB South (z = 30, elevated y = 8m)
    const bridgeNorthY = 8;
    const bridgeSouthY = 8;

    // FOB North Nodes
    const fNodeWestN = 'fob_n_west';
    const fNodeEastN = 'fob_n_east';
    nodes.push({ id: fNodeWestN, name: 'FOB North West Escalator', x: westEntX, y: bridgeNorthY, z: -30, type: 'fob' });
    nodes.push({ id: fNodeEastN, name: 'FOB North East Escalator', x: eastEntX, y: bridgeNorthY, z: -30, type: 'fob' });
    
    // Connect entrances to FOB escalators
    links.push({ from: 'node_ent_west', to: fNodeWestN });
    links.push({ from: 'node_ent_east', to: fNodeEastN });

    // Platform connections to FOB North
    for (let i = 0; i < platformCount; i++) {
        const platformNum = i + 1;
        const xPos = i * 16 - (platformCount * 8);
        const fobStairNode = `fob_n_p_${platformNum}`;
        
        nodes.push({ id: fobStairNode, name: `FOB North Platform ${platformNum} Stairs`, x: xPos, y: bridgeNorthY, z: -30, type: 'fob' });
        
        // Stair links (vertical ramp)
        links.push({ from: `p_${platformNum}_n`, to: fobStairNode });

        // Connect along the bridge itself
        if (i === 0) {
            links.push({ from: fNodeWestN, to: fobStairNode });
        } else {
            const prevFobStair = `fob_n_p_${platformNum - 1}`;
            links.push({ from: prevFobStair, to: fobStairNode });
        }

        if (i === platformCount - 1) {
            links.push({ from: fobStairNode, to: fNodeEastN });
        }
    }

    // FOB South (z = 30) - lets add Food Court here!
    const fNodeWestS = 'fob_s_west';
    const fNodeEastS = 'fob_s_east';
    nodes.push({ id: fNodeWestS, name: 'FOB South West Escalator', x: westEntX, y: bridgeSouthY, z: 30, type: 'fob' });
    nodes.push({ id: fNodeEastS, name: 'FOB South East Escalator', x: eastEntX, y: bridgeSouthY, z: 30, type: 'fob' });

    links.push({ from: 'node_ent_west', to: fNodeWestS });
    links.push({ from: 'node_ent_east', to: fNodeEastS });

    // Food Court on the FOB South Bridge center!
    const foodCourtX = 0;
    amenities.push({ id: 'food_court', name: 'Platform Food Court', type: 'food_court', x: foodCourtX, y: bridgeSouthY, z: 30 });
    nodes.push({ id: 'node_food_court', name: 'Platform Food Court', x: foodCourtX, y: bridgeSouthY, z: 30, type: 'food_court' });

    for (let i = 0; i < platformCount; i++) {
        const platformNum = i + 1;
        const xPos = i * 16 - (platformCount * 8);
        const fobStairNode = `fob_s_p_${platformNum}`;
        
        nodes.push({ id: fobStairNode, name: `FOB South Platform ${platformNum} Stairs`, x: xPos, y: bridgeSouthY, z: 30, type: 'fob' });
        
        // Vertical stair link
        links.push({ from: `p_${platformNum}_s`, to: fobStairNode });

        // Link bridge sections
        if (i === 0) {
            links.push({ from: fNodeWestS, to: fobStairNode });
        } else {
            const prevFobStair = `fob_s_p_${platformNum - 1}`;
            
            // If we cross the center, connect through the Food Court!
            const prevX = (i - 1) * 16 - (platformCount * 8);
            if (prevX < foodCourtX && xPos >= foodCourtX) {
                links.push({ from: prevFobStair, to: 'node_food_court' });
                links.push({ from: 'node_food_court', to: fobStairNode });
            } else {
                links.push({ from: prevFobStair, to: fobStairNode });
            }
        }

        if (i === platformCount - 1) {
            links.push({ from: fobStairNode, to: fNodeEastS });
        }
    }

    return {
        platforms,
        amenities,
        nodes,
        links
    };
};

// GET /api/station/3d
const getStation3DModel = async (req, res) => {
    try {
        const { station_code } = req.query;

        if (!station_code) {
            return res.status(400).json({ message: 'station_code parameter is required.' });
        }

        const code = station_code.toUpperCase().trim();
        let stationModel = await StationModel.findOne({ where: { station_code: code } });

        if (!stationModel) {
            // Dynamically generate default model data if missing
            const dbStation = await Station.findOne({ where: { station_code: code } });
            const name = dbStation ? dbStation.station_name : `${code} Station`;
            const data = generateDefaultStationModel(code, name);
            
            stationModel = await StationModel.create({
                station_code: code,
                station_name: name,
                model_data: data
            });
        }

        return res.status(200).json({
            station_code: stationModel.station_code,
            station_name: stationModel.station_name,
            model_data: stationModel.model_data
        });
    } catch (error) {
        console.error('Fetch Station 3D Error:', error);
        return res.status(500).json({ message: 'Internal server error fetching station model.' });
    }
};

// Shortest Path Router using BFS (since weights are coordinate distances)
const findShortestPath = (nodes, links, startId, endId) => {
    // Build adjacency list
    const adj = {};
    nodes.forEach(n => {
        adj[n.id] = [];
    });

    links.forEach(l => {
        if (adj[l.from] && adj[l.to]) {
            adj[l.from].push(l.to);
            adj[l.to].push(l.from); // Undirected graph
        }
    });

    // BFS Queue
    const queue = [startId];
    const visited = {};
    visited[startId] = true;
    
    // Parent map to reconstruct path
    const parent = {};

    let found = false;
    while (queue.length > 0) {
        const curr = queue.shift();
        
        if (curr === endId) {
            found = true;
            break;
        }

        const neighbors = adj[curr] || [];
        for (const neighbor of neighbors) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                parent[neighbor] = curr;
                queue.push(neighbor);
            }
        }
    }

    if (!found) return null;

    // Reconstruct path
    const pathNodeIds = [];
    let temp = endId;
    while (temp) {
        pathNodeIds.push(temp);
        temp = parent[temp];
    }
    pathNodeIds.reverse();

    // Map to node objects
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    return pathNodeIds.map(id => nodeMap[id]);
};

// Calculate Euclidean Distance in 3D
const calculateDistance3D = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// GET/POST /api/station/navigation
const getStationNavigation = async (req, res) => {
    try {
        const { station_code, from, to } = { ...req.query, ...req.body };

        if (!station_code || !from || !to) {
            return res.status(400).json({ message: 'station_code, from, and to parameters are required.' });
        }

        const code = station_code.toUpperCase().trim();
        const stationModel = await StationModel.findOne({ where: { station_code: code } });

        if (!stationModel) {
            return res.status(404).json({ message: 'Station model not found.' });
        }

        const { nodes, links } = stationModel.model_data;

        // Find match nodes
        // from/to could be amenity ids, or node ids
        const startNode = nodes.find(n => n.id === from || n.name.toLowerCase().includes(from.toLowerCase()));
        const endNode = nodes.find(n => n.id === to || n.name.toLowerCase().includes(to.toLowerCase()));

        if (!startNode) {
            return res.status(400).json({ message: `Starting location "${from}" could not be matched inside the station.` });
        }
        if (!endNode) {
            return res.status(400).json({ message: `Destination "${to}" could not be matched inside the station.` });
        }

        const path = findShortestPath(nodes, links, startNode.id, endNode.id);

        if (!path) {
            return res.status(404).json({ message: 'No viable navigation path found between the selected locations.' });
        }

        // Calculate total distance and walk time (speed = 1.2 m/s)
        let totalDistance = 0;
        const coordinates = path.map(n => [n.x, n.y, n.z]);
        const instructions = [];

        instructions.push(`Start at ${path[0].name}.`);

        for (let i = 1; i < path.length; i++) {
            const prev = path[i-1];
            const curr = path[i];
            const dist = calculateDistance3D(prev, curr);
            totalDistance += dist;

            // Generate turn-by-turn text instructions based on coordinates
            if (curr.y > prev.y) {
                instructions.push(`Go UP the stairs/escalator to ${curr.name} (Height increase: ${(curr.y - prev.y).toFixed(1)}m).`);
            } else if (curr.y < prev.y) {
                instructions.push(`Go DOWN the stairs/escalator to ${curr.name} (Height decrease: ${(prev.y - curr.y).toFixed(1)}m).`);
            } else {
                const dx = curr.x - prev.x;
                const dz = curr.z - prev.z;
                
                if (Math.abs(dx) > Math.abs(dz)) {
                    const dir = dx > 0 ? 'East / Right' : 'West / Left';
                    instructions.push(`Walk ${dir} about ${dist.toFixed(0)} meters to ${curr.name}.`);
                } else {
                    const dir = dz > 0 ? 'South / Straight' : 'North / Straight';
                    instructions.push(`Walk ${dir} about ${dist.toFixed(0)} meters to ${curr.name}.`);
                }
            }
        }

        instructions.push(`Arrived at destination: ${endNode.name}.`);

        const walkTimeSeconds = Math.round(totalDistance / 1.2);
        const walkTimeMinutes = Math.max(1, Math.round(walkTimeSeconds / 60));

        return res.status(200).json({
            station_code: code,
            from: startNode.name,
            to: endNode.name,
            total_distance_meters: Math.round(totalDistance),
            estimated_walk_time_mins: walkTimeMinutes,
            path: coordinates,
            instructions
        });
    } catch (error) {
        console.error('Calculate Navigation Error:', error);
        return res.status(500).json({ message: 'Internal server error computing walking route.' });
    }
};

const searchStations = async (req, res) => {
    try {
        const query = (req.query.q || req.query.query || '').trim();
        
        let stations = [];
        if (!query) {
            stations = await Station.findAll({ limit: 10 });
        } else {
            stations = await Station.findAll({
                where: {
                    [Op.or]: [
                        { station_code: { [Op.like]: `%${query}%` } },
                        { station_name: { [Op.like]: `%${query}%` } }
                    ]
                },
                limit: 20
            });
        }

        return res.status(200).json(stations);
    } catch (error) {
        console.error('Search Stations Error:', error);
        return res.status(500).json({ message: 'Internal server error searching stations.' });
    }
};

module.exports = {
    getStation3DModel,
    getStationNavigation,
    searchStations
};

