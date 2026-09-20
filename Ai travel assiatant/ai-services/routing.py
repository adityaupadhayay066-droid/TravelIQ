import networkx as nx
import json
import os
import math
import logging

logger = logging.getLogger(__name__)

def get_routing_graph():
    G = nx.DiGraph()
    
    # Cities list
    cities = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad']
    
    # Modes
    modes = ['Flight', 'Train', 'Bus', 'Taxi']
    
    # We create nodes representing (City, Mode) to handle transfer times
    for city in cities:
        for mode in modes:
            G.add_node(f"{city}_{mode}")
            
    # Add transfers (switching modes in the same city takes some time and cost)
    for city in cities:
        for mode1 in modes:
            for mode2 in modes:
                if mode1 != mode2:
                    G.add_edge(f"{city}_{mode1}", f"{city}_{mode2}", 
                               weight=2.0, cost=500, type='transfer', mode='Transfer')
                               
    # Add actual travel edges based on a simplified fixed graph
    import random
    random.seed(42) # Deterministic for now
    
    for c1 in cities:
        for c2 in cities:
            if c1 != c2:
                for mode in modes:
                    dist = random.uniform(200, 2000)
                    
                    if mode == 'Flight':
                        price = dist * 5
                        time = dist / 800
                    elif mode == 'Train':
                        price = dist * 1.5
                        time = dist / 80
                    elif mode == 'Bus':
                        price = dist * 1.2
                        time = dist / 60
                    else: # Taxi
                        price = dist * 10
                        time = dist / 65
                        
                    G.add_edge(f"{c1}_{mode}", f"{c2}_{mode}", 
                               weight=time, cost=price, type='travel', mode=mode)
                               
    return G

def _load_station_data():
    """Load station data with robust path resolution."""
    # Try multiple paths to find the station data
    possible_paths = [
        os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'unique_stations.json'),
        os.path.join(os.path.dirname(__file__), 'data', 'unique_stations.json'),
        '../backend/data/unique_stations.json',
    ]
    
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            try:
                with open(abs_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                logger.info(f"Loaded {len(data)} stations from {abs_path}")
                return data
            except Exception as e:
                logger.warning(f"Failed to load stations from {abs_path}: {e}")
    
    logger.warning("No station data file found. Route optimization will use defaults.")
    return []

# Helper function to compute Haversine distance
def _calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def find_best_route(source, destination, preference='time'):
    # preference can be 'time' or 'cost'
    G = get_routing_graph()
    
    modes = ['Flight', 'Train', 'Bus', 'Taxi']

    # Load station data with robust path resolution
    station_data = _load_station_data()

    # Create map of station -> coords
    station_map = {}
    for s in station_data:
        try:
            lat = float(s.get('latitude', 0))
            lon = float(s.get('longitude', 0))
            if lat != 0 and lon != 0:
                station_map[s['station_name'].lower().strip()] = (lat, lon)
        except (ValueError, TypeError):
            continue
        
    DEFAULT_HUB_COORDS = {
        'new delhi': (28.6139, 77.2090),
        'delhi': (28.6139, 77.2090),
        'mumbai central': (18.9696, 72.8193),
        'mumbai': (18.9696, 72.8193),
        'bangalore city jn': (12.9780, 77.5683),
        'bangalore': (12.9780, 77.5683),
        'bengaluru': (12.9780, 77.5683),
        'howrah jn': (22.5851, 88.3412),
        'kolkata': (22.5851, 88.3412),
        'chennai central': (13.0827, 80.2707),
        'chennai': (13.0827, 80.2707),
        'bhubaneswar': (20.2961, 85.8245),
        'bbs': (20.2961, 85.8245),
        'hyderabad': (17.3850, 78.4867),
        'pune': (18.5204, 73.8567),
        'ahmedabad': (23.0225, 72.5714),
        'ranchi': (23.3441, 85.3096),
        'rnc': (23.3441, 85.3096),
        'igi': (28.5562, 77.1000)
    }

    AIRPORT_CITIES = {
        'delhi', 'new delhi', 'ndls', 'dli', 'nzm', 'anvt', 'igi',
        'mumbai', 'mumbai central', 'bct', 'cstm', 'csmt', 'bdts', 'bom',
        'bangalore', 'bengaluru', 'blr', 'sbc', 'ypr',
        'chennai', 'chennai central', 'mas', 'ms', 'maa',
        'kolkata', 'howrah', 'howrah jn', 'hwh', 'sdah', 'ccu',
        'hyderabad', 'secunderabad', 'sc', 'hyd',
        'ahmedabad', 'adi', 'amd',
        'pune', 'pnq',
        'goa', 'goi', 'gox', 'mao',
        'jaipur', 'jp', 'jai',
        'lucknow', 'lko', 'ljn',
        'patna', 'pnbe', 'pat',
        'kochi', 'cochin', 'ers', 'cok',
        'guwahati', 'ghy', 'gau',
        'chandigarh', 'cdg', 'ixc',
        'varanasi', 'bsb', 'vns',
        'amritsar', 'asr', 'atq',
        'srinagar', 'sxr',
        'jammu', 'jat', 'ixj',
        'indore', 'indb', 'idr',
        'bhopal', 'bpl', 'bho',
        'bhubaneswar', 'bbs', 'bbi',
        'visakhapatnam', 'vskp', 'vtz',
        'raipur', 'r', 'rpr',
        'ranchi', 'rnc', 'ixr',
        'surat', 'st', 'stv',
        'vadodara', 'brc', 'bdq',
        'dehradun', 'ddn', 'ded',
        'bagdogra', 'siliguri', 'njp', 'ixb',
        'gaya', 'gaya jn', 'gay',
        'gwalior', 'gwl',
        'jodhpur', 'ju', 'jdh',
        'udaipur', 'udz', 'udr',
        'ayodhya', 'ay', 'ayj',
        'tirupati', 'tpty', 'tir',
        'gorakhpur', 'gkp', 'gop',
        'kanpur', 'cnb', 'knu',
        'darbhanga', 'dbg', 'dbr'
    }

    # Dynamically add source and dest to graph if they don't exist
    for city in [source, destination]:
        city_clean = city.lower().strip()
        has_city_airport = city_clean in AIRPORT_CITIES
        allowed_modes = [m for m in modes if m != 'Flight' or has_city_airport]

        if f"{city}_Train" not in G.nodes():
            for mode in allowed_modes:
                G.add_node(f"{city}_{mode}")
            for mode1 in allowed_modes:
                for mode2 in allowed_modes:
                    if mode1 != mode2:
                        G.add_edge(f"{city}_{mode1}", f"{city}_{mode2}", weight=2.0, cost=500, type='transfer', mode='Transfer')
            
            major_hubs = ['NEW DELHI', 'MUMBAI CENTRAL', 'BANGALORE CITY JN', 'HOWRAH JN', 'CHENNAI CENTRAL']
            connect_to = major_hubs + ([destination] if city == source else [source])
            
            c_lat, c_lng = station_map.get(city_clean, DEFAULT_HUB_COORDS.get(city_clean, (20.59, 78.96)))
            
            for hub in connect_to:
                hub_clean = hub.lower().strip()
                has_hub_airport = hub_clean in AIRPORT_CITIES
                if city_clean != hub_clean:
                    h_lat, h_lng = station_map.get(hub_clean, DEFAULT_HUB_COORDS.get(hub_clean, (22.57, 88.36)))
                    dist = _calculate_distance(c_lat, c_lng, h_lat, h_lng)
                    dist = max(dist, 50)
                    
                    for mode in modes:
                        if mode == 'Flight':
                            if not has_city_airport or not has_hub_airport:
                                continue # No flights for non-airport cities
                            price, time = dist * 5, dist / 800
                        elif mode == 'Train':
                            price, time = dist * 1.5, dist / 80
                        elif mode == 'Bus':
                            price, time = dist * 1.2, dist / 60
                        else:
                            price, time = dist * 10, dist / 65
                        G.add_edge(f"{city}_{mode}", f"{hub}_{mode}", weight=time, cost=price, type='travel', mode=mode)
                        G.add_edge(f"{hub}_{mode}", f"{city}_{mode}", weight=time, cost=price, type='travel', mode=mode)
    
    # Create virtual start and end nodes to connect to available modes in source and dest
    G.add_node('START')
    G.add_node('END')
    
    for mode in modes:
        if G.has_node(f"{source}_{mode}"):
            G.add_edge('START', f"{source}_{mode}", weight=0, cost=0, type='virtual', mode='Start')
        if G.has_node(f"{destination}_{mode}"):
            G.add_edge(f"{destination}_{mode}", 'END', weight=0, cost=0, type='virtual', mode='End')
        
    weight_param = 'weight' if preference == 'time' else 'cost'
    
    try:
        path = nx.dijkstra_path(G, 'START', 'END', weight=weight_param)
        
        # Format the path
        route_steps = []
        total_time = 0
        total_cost = 0
        
        for i in range(1, len(path) - 2): # Skip START and END
            u = path[i]
            v = path[i+1]
            edge_data = G.get_edge_data(u, v)
            
            if edge_data is None:
                continue
            
            if edge_data['type'] == 'travel':
                city1 = u.split('_')[0]
                city2 = v.split('_')[0]
                mode = edge_data['mode']
                route_steps.append(f"{city1} to {city2} via {mode}")
            elif edge_data['type'] == 'transfer':
                city = u.split('_')[0]
                route_steps.append(f"Transfer at {city}")
                
            total_time += edge_data['weight']
            total_cost += edge_data['cost']
            
        return {
            'route': route_steps if route_steps else [f"{source} to {destination} via Express Train"],
            'total_time_hours': round(total_time, 2),
            'total_cost_inr': round(total_cost, 2)
        }
    except Exception as e:
        logger.warning(f"Route calculation fallback triggered for {source} -> {destination}: {e}")
        # Production resilient fallback: Direct flight (if airports exist) or Superfast train
        src_clean = source.lower().strip()
        dst_clean = destination.lower().strip()
        both_have_airports = (src_clean in AIRPORT_CITIES) and (dst_clean in AIRPORT_CITIES)

        c1_lat, c1_lng = DEFAULT_HUB_COORDS.get(src_clean, (28.6139, 77.2090))
        c2_lat, c2_lng = DEFAULT_HUB_COORDS.get(dst_clean, (19.0760, 72.8777))
        dist = max(100.0, _calculate_distance(c1_lat, c1_lng, c2_lat, c2_lng))
        
        if both_have_airports and preference == 'time':
            return {
                'route': [f"{source} to {destination} via Direct Flight"],
                'total_time_hours': round(dist / 750.0 + 1.2, 2),
                'total_cost_inr': round(dist * 5.2, 2),
                'fallback': True
            }
        else:
            return {
                'route': [f"{source} to {destination} via Superfast Express Train"],
                'total_time_hours': round(dist / 75.0, 2),
                'total_cost_inr': round(dist * 1.6, 2),
                'fallback': True
            }
