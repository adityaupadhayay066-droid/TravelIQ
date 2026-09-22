import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
from datetime import datetime, timedelta
import random
import os
import json

def generate_synthetic_data(num_records=5000):
    with open('../backend/data/unique_stations.json', 'r') as f:
        station_data = json.load(f)
        
    # We will pick from a top 50 subset to make sure models learn some consistent patterns 
    # instead of completely random 8500 combinations, but the LabelEncoder will be fit on ALL 8500 later.
    cities = [s['station_name'] for s in station_data[:100]] 
    modes = ['Flight', 'Train', 'Bus', 'Taxi']
    
    data = []
    start_date = datetime.now() - timedelta(days=5*365) # 5 years ago
    
    for _ in range(num_records):
        source = random.choice(cities)
        dest = random.choice(cities)
        while dest == source:
            dest = random.choice(cities)
            
        mode = random.choice(modes)
        
        # Base distance approximation (very rough)
        base_dist = random.uniform(200, 2000)
        
        if mode == 'Flight':
            base_price = base_dist * 5
            base_time = base_dist / 800 # hours
        elif mode == 'Train':
            base_price = base_dist * 1.5
            base_time = base_dist / 80 # hours
        elif mode == 'Bus':
            base_price = base_dist * 1.2
            base_time = base_dist / 60 # hours
        else: # Taxi
            base_price = base_dist * 10
            base_time = base_dist / 65 # hours
            
        # Add randomness
        price = max(100, base_price * random.uniform(0.8, 1.5))
        duration = max(0.5, base_time * random.uniform(0.9, 1.2))
        
        # Date
        travel_date = start_date + timedelta(days=random.randint(0, 5*365))
        
        # Seasonality impact
        month = travel_date.month
        if month in [12, 1, 5, 6]: # Peak seasons
            price *= 1.3
            
        delay_prob = random.uniform(0, 1)
        delay_minutes = 0
        if delay_prob > 0.8: # 20% chance of delay
            delay_minutes = random.randint(15, 120)
            
        data.append({
            'source': source,
            'destination': dest,
            'mode': mode,
            'date': travel_date.strftime('%Y-%m-%d'),
            'month': month,
            'day_of_week': travel_date.weekday(),
            'price': round(price, 2),
            'duration_hours': round(duration, 2),
            'delay_minutes': delay_minutes
        })
        
    df = pd.DataFrame(data)
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/travel_dataset.csv', index=False)
    print("Synthetic dataset generated: data/travel_dataset.csv")

if __name__ == "__main__":
    generate_synthetic_data(10000)
