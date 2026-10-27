import os
import json
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv
load_dotenv()

# PyTorch
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# Scikit-learn & utilities
import shutil
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score

# AI Engine architectures
from ai_engine.delay_model import TrainDelayLSTM
from ai_engine.fare_model import SmartFareLSTM
from ai_engine.crowd_model import StationCrowdNet
from ai_engine.occupancy_model import TrainOccupancyNet
from ai_engine.route_recommender import RouteRecommenderNet
from ai_engine.chatbot_assistant import ChatbotClassifierNet, SimpleTokenizer, INTENT_CLASSES
from ai_engine.demand_forecaster import DemandForecastLSTM
from ai_engine.behavior_analytics import UserBehaviorNet, PERSONA_DETAILS

# Setup logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

def seed_everything(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def load_master_stations():
    stations_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/data/unique_stations.json'))
    if os.path.exists(stations_path):
        with open(stations_path, 'r') as f:
            return json.load(f)
    else:
        # Fallback list of stations
        return [
            {"station_code": "NDLS", "station_name": "NEW DELHI"},
            {"station_code": "BBS", "station_name": "BHUBANESWAR"},
            {"station_code": "HWH", "station_name": "HOWRAH"},
            {"station_code": "CSMT", "station_name": "MUMBAI CSMT"},
            {"station_code": "MAS", "station_name": "CHENNAI CENTRAL"}
        ]

def generate_comprehensive_datasets():
    logger.info("Generating synthetic training datasets with realistic features and controlled anomalies...")
    stations = load_master_stations()
    station_names = [s['station_name'] for s in stations]
    station_codes = [s['station_code'] for s in stations]
    
    # Deterministic station coordinate/distance mapping for route-dependent pricing
    station_pos = {s: (idx * 137 % 1400 + 100) for idx, s in enumerate(station_names[:25])}
    class_factors = {'SL': 0.85, '3A': 2.1, '2A': 3.2, '1A': 4.8}

    # 1. Delays Dataset
    delay_records = []
    for _ in range(2000):
        train_num = f"{random.randint(12000, 12999)}"
        route = f"{random.choice(station_names)} -> {random.choice(station_names)}"
        day_of_week = random.randint(0, 6)
        month = random.randint(1, 12)
        season = random.randint(0, 3) # 0: Winter, 1: Summer, 2: Monsoon, 3: Autumn
        weather = random.choice(["Sunny", "Rainy", "Foggy", "Overcast"])
        
        # Base delays based on weather/season
        base_delay = 5
        if weather == "Rainy":
            base_delay += random.randint(15, 60)
        elif weather == "Foggy":
            base_delay += random.randint(30, 120)
        
        if season == 2: # Monsoon
            base_delay += random.randint(10, 40)
            
        arr_delay = max(0, base_delay + random.randint(-10, 30))
        dep_delay = max(0, arr_delay + random.randint(-5, 10))
        prob = 0.15
        if arr_delay > 15:
            prob = 0.75
        elif arr_delay > 0:
            prob = 0.40
            
        delay_records.append({
            'train_number': train_num,
            'route': route,
            'day_of_week': day_of_week,
            'month': month,
            'season': season,
            'weather': weather,
            'arr_delay': arr_delay,
            'dep_delay': dep_delay,
            'probability': prob
        })
    df_delay = pd.DataFrame(delay_records)
    
    # Inject realistic anomalies so DataCleaner creates honest, non-zero anomaly reports
    df_delay = pd.concat([df_delay, df_delay.iloc[:15]], ignore_index=True) # 15 duplicate rows
    df_delay.loc[random.sample(range(len(df_delay)), 8), 'arr_delay'] = np.nan # 8 missing values
    df_delay.loc[random.sample(range(len(df_delay)), 4), 'arr_delay'] = 9999.0 # 4 extreme outliers
    
    # 2. Fare Projections Dataset - Structurally dependent on route distance and class
    fare_records = []
    classes = ['SL', '3A', '2A', '1A']
    for _ in range(2000):
        src = random.choice(station_names[:20])
        dst = random.choice(station_names[:20])
        while dst == src:
            dst = random.choice(station_names[:20])
        class_code = random.choice(classes)
        month = random.randint(1, 12)
        season_code = random.randint(0, 3)
        demand_score = random.uniform(0.1, 1.0)
        
        # Route-aware pricing: distance structurally computed from source/destination
        dist_km = max(80.0, abs(station_pos.get(src, 150) - station_pos.get(dst, 750)) + 60.0)
        base_fare = round(dist_km * class_factors.get(class_code, 1.0) * (1.0 + random.uniform(-0.04, 0.04)), 2)
        current_fare = round(base_fare * (1.0 + (demand_score - 0.5) * 0.18 + (season_code * 0.03)), 2)
        forecast_7d = round(current_fare * (1.0 + (demand_score - 0.4) * 0.22 + random.uniform(-0.02, 0.02)), 2)
        forecast_7d = max(100.0, forecast_7d)
        
        fare_records.append({
            'source': src,
            'destination': dst,
            'class_code': class_code,
            'month': month,
            'season_code': season_code,
            'demand_score': demand_score,
            'current_fare': current_fare,
            'forecast_7d': forecast_7d
        })
    df_fare = pd.DataFrame(fare_records)
    
    # 3. Crowd Levels Dataset
    crowd_records = []
    for _ in range(2000):
        st = random.choice(station_codes[:20])
        day = random.randint(0, 6)
        hour = random.randint(0, 23)
        
        # Core patterns: Peak hours 8-10 AM and 5-7 PM
        is_peak = (8 <= hour <= 10) or (17 <= hour <= 19)
        base_crowd = 20.0
        if is_peak:
            base_crowd += random.uniform(40, 70)
        if day in [5, 6]: # Weekend
            base_crowd += random.uniform(5, 15)
            
        crowd_pct = min(100.0, max(5.0, base_crowd + random.uniform(-10, 10)))
        congestion_pct = min(100.0, crowd_pct * random.uniform(0.8, 1.1))
        
        # Classify level
        if crowd_pct > 80: crowd_level = 3 # Very High
        elif crowd_pct > 50: crowd_level = 2 # High
        elif crowd_pct > 25: crowd_level = 1 # Medium
        else: crowd_level = 0 # Low
        
        crowd_records.append({
            'station_code': st,
            'day_of_week': day,
            'hour_of_day': hour,
            'crowd_pct': crowd_pct / 100.0, # regression output
            'congestion_pct': congestion_pct / 100.0, # regression output
            'crowd_level': crowd_level
        })
    df_crowd = pd.DataFrame(crowd_records)
    
    # 4. Occupancy Dataset
    occ_records = []
    for _ in range(2000):
        t_num = f"{random.randint(12000, 12999)}"
        c_code = random.choice(classes)
        month = random.randint(1, 12)
        day = random.randint(0, 6)
        season = random.randint(0, 3)
        
        base_occ = random.uniform(30, 95)
        if month in [5, 6, 12]: # Holiday seasons
            base_occ += random.uniform(10, 20)
            
        occupancy_pct = min(100.0, max(10.0, base_occ + random.uniform(-10, 10)))
        
        # Availability & waitlist calculations
        avail_prob = 1.0 - (occupancy_pct / 100.0)
        wl = 0.0
        if occupancy_pct > 90:
            wl = float(random.randint(5, 50))
            avail_prob = 0.0
            
        if occupancy_pct > 80: demand_lvl = 2 # High
        elif occupancy_pct > 50: demand_lvl = 1 # Medium
        else: demand_lvl = 0 # Low
        
        occ_records.append({
            'train_number': t_num,
            'class_code': c_code,
            'month': month,
            'day_of_week': day,
            'season_code': season,
            'avail_prob': avail_prob,
            'occupancy_pct': occupancy_pct / 100.0,
            'waiting_list': wl,
            'demand_level': demand_lvl
        })
    df_occ = pd.DataFrame(occ_records)
    
    # 5. Route Recommendations (Latent User-Route matrices)
    rec_records = []
    for _ in range(5000):
        user = random.randint(0, 200)
        route_id = random.randint(0, 50)
        cost = random.uniform(100, 5000)
        duration = random.uniform(1, 48)
        eco = random.uniform(0.1, 1.0)
        comfort = random.uniform(0.1, 1.0)
        student = 1.0 if cost < 800 else 0.0
        
        rating = 3.0 + (comfort * 1.5) - (cost / 5000.0) + (eco * 0.5) + random.uniform(-0.5, 0.5)
        rating = min(5.0, max(0.0, rating))
        
        rec_records.append({
            'user_id': user,
            'route_id': route_id,
            'cost': cost / 5000.0,
            'duration': duration / 48.0,
            'eco': eco,
            'comfort': comfort,
            'student_budget': student,
            'rating': rating
        })
    df_rec = pd.DataFrame(rec_records)
    
    # 6. Chatbot NLP Dataset - Disjoint Training and Test Sets (Zero Leakage)
    train_intent_corpus = [
        ("hi hello hey there namaste good morning good afternoon howdy greetings welcome", 0),
        ("cheapest ticket low cost save money budget fare price cheapest train economic rail", 1),
        ("fastest speed quick Vande Bharat fastest route time saving rapid express bullet", 2),
        ("delay late delay prediction expected time cancel postpone status running schedule", 3),
        ("how to book booking ticket reserve seats IRCTC Tatkal ticket berth allocation", 4),
        ("recommend food thali budget meals food category restaurants best food pantry catering", 5),
        ("safe safety secure RPF emergency SOS protection guard railway police helpline", 6),
        ("weather monsoon rain forecast fog storm climate condition rainfall flood temperature", 7),
        ("admin dashboard model retrain metrics accuracy training status benchmarks evaluation", 8),
        ("what is traveliq features change password dark mode profile picture support settings help", 9)
    ]
    nlp_train_records = []
    for phrase_list, label in train_intent_corpus:
        phrases = phrase_list.split()
        for _ in range(40):
            sampled = random.sample(phrases, min(len(phrases), random.randint(2, 5)))
            nlp_train_records.append({'text': " ".join(sampled), 'label': label})
    df_nlp_train = pd.DataFrame(nlp_train_records)

    # Disjoint held-out unseen evaluation queries (different wording and phrasing)
    test_intent_queries = [
        ("good day assistant, are services running?", 0),
        ("namaste traveliq bot, please assist me", 0),
        ("hey system, can you hear me today?", 0),
        ("hello travel guide, i need assistance", 0),
        ("where can i find the lowest cost rail travel?", 1),
        ("show me affordable ticket options for students", 1),
        ("how do i travel economically without overpaying?", 1),
        ("find lowest fares across all available trains", 1),
        ("what is the fastest express connection to delhi?", 2),
        ("i want the shortest travel time between cities", 2),
        ("book me on the rapid vande bharat superfast", 2),
        ("which train takes the least number of hours?", 2),
        ("will the rajdhani arrive behind schedule today?", 3),
        ("check if my train is delayed due to winter fog", 3),
        ("what is the live running status of train 12301?", 3),
        ("has my train departure been postponed or rescheduled?", 3),
        ("explain the tatkal seat booking procedure", 4),
        ("how do i confirm reservations for three passengers?", 4),
        ("can i book sleeper class berths online right now?", 4),
        ("guide me through the irctc reservation steps", 4),
        ("what vegetarian meal options are available onboard?", 5),
        ("can hot food be ordered at intermediate stations?", 5),
        ("how is the catering quality and pantry pricing?", 5),
        ("deliver breakfast thali to coach b3 seat 21", 5),
        ("railway police emergency contact number please", 6),
        ("there is an intruder in our coach, send security", 6),
        ("how do i trigger the passenger sos alert?", 6),
        ("request immediate assistance from rpf patrol", 6),
        ("will severe rainfall disrupt railway tracks today?", 7),
        ("check weather forecast and monsoon flood warnings", 7),
        ("is dense winter fog causing speed restrictions?", 7),
        ("forecast temperature and storms along the route", 7),
        ("display the verified neural network evaluation metrics", 8),
        ("retrain the machine learning models on new data", 8),
        ("show delay prediction accuracy and loss curves", 8),
        ("audit model benchmark statistics in admin center", 8),
        ("how do i switch the theme to night dark mode?", 9),
        ("change my registered mobile phone and password", 9),
        ("where can i view my account profile information?", 9),
        ("update settings and notification preferences", 9)
    ]
    df_nlp_test = pd.DataFrame(test_intent_queries, columns=['text', 'label'])
    
    # 7. Time-Series Demand Forecasting (Daily Revenues)
    demand_seq_records = []
    base_rev = 15000.0
    for day_idx in range(500):
        weekly_factor = 1.2 if (day_idx % 7) in [5, 6] else 0.9
        noise = random.uniform(-1000, 1000)
        revenue = base_rev * weekly_factor + noise + (day_idx * 5.0)
        demand_seq_records.append(revenue)
    
    # 8. User Behavior Analytics Dataset
    behavior_records = []
    for _ in range(500):
        bookings = random.randint(1, 40)
        avg_budget = random.uniform(200, 4000)
        pref_mode = random.choice([0, 1, 2, 3]) # Flight, Train, Bus, Taxi
        frequency = random.uniform(0.1, 8.0)
        satisfaction = random.uniform(2.0, 5.0)
        
        if avg_budget > 2500: persona = 1 # Premium Business
        elif bookings > 20 and frequency > 4.0: persona = 2 # Frequent Commuter
        elif avg_budget < 800: persona = 0 # Budget Backpacker
        else: persona = 3 # Family Vacationer
        
        behavior_records.append({
            'bookings': bookings / 40.0,
            'avg_budget': avg_budget / 4000.0,
            'pref_mode': pref_mode,
            'frequency': frequency / 8.0,
            'satisfaction': satisfaction / 5.0,
            'persona': persona
        })
    df_behavior = pd.DataFrame(behavior_records)

    return {
        'delay': df_delay,
        'fare': df_fare,
        'crowd': df_crowd,
        'occ': df_occ,
        'rec': df_rec,
        'nlp_train': df_nlp_train,
        'nlp_test': df_nlp_test,
        'demand_series': demand_seq_records,
        'behavior': df_behavior
    }

from data_cleaner import DataCleaner

def train_and_save_all(custom_data=None):
    logger.info("Initializing automated data cleaning and model training pipeline with seed 42...")
    seed_everything(42)
    cleaner = DataCleaner()
    quality_summary = {}

    if custom_data is not None:
        data = custom_data
    else:
        data = generate_comprehensive_datasets()

    # Automatically clean and sanitize all datasets
    cleaned_data = {}
    for key, dtype in [('delay', 'delay'), ('fare', 'fare'), ('crowd', 'crowd'), ('occ', 'occupancy'), ('rec', 'rec'), ('behavior', 'behavior')]:
        if key in data and isinstance(data[key], pd.DataFrame):
            df_c, q_metric = cleaner.clean_dataset(data[key], dtype)
            cleaned_data[key] = df_c
            quality_summary[key] = q_metric
        elif key in data:
            cleaned_data[key] = data[key]

    if 'nlp_train' in data:
        cleaned_data['nlp_train'] = data['nlp_train']
    if 'nlp_test' in data:
        cleaned_data['nlp_test'] = data['nlp_test']
    if 'demand_series' in data:
        cleaned_data['demand_series'] = data['demand_series']

    # Save Quality Report
    clean_report_path = os.path.join(MODELS_DIR, 'data_quality_report.json')
    with open(clean_report_path, 'w') as f:
        json.dump({
            "status": "Success",
            "timestamp": datetime.now().isoformat(),
            "summary": quality_summary
        }, f, indent=2)

    encoders = {}
    metrics_log = {}
    criterion = nn.MSELoss()
    criterion_cls = nn.CrossEntropyLoss()

    def safe_encode(le, series, fit=False):
        if fit:
            le.fit(series)
            return torch.tensor(le.transform(series), dtype=torch.long)
        class_to_idx = {cls: idx for idx, cls in enumerate(le.classes_)}
        unknown_idx = len(le.classes_)
        mapped = [class_to_idx.get(val, unknown_idx) for val in series]
        return torch.tensor(mapped, dtype=torch.long)

    def validate_and_save_model(model, filename):
        for name, param in model.named_parameters():
            if torch.isnan(param).any() or torch.isinf(param).any():
                raise ValueError(f"Model validation failed: NaN or Inf detected in parameter '{name}' of {filename}")
        tmp_path = os.path.join(MODELS_DIR, f"{filename}.tmp")
        final_path = os.path.join(MODELS_DIR, filename)
        bak_path = os.path.join(MODELS_DIR, f"{filename}.bak")
        torch.save(model.state_dict(), tmp_path)
        if os.path.exists(final_path):
            shutil.copyfile(final_path, bak_path)
        os.replace(tmp_path, final_path)

    # --- 1. Delay Prediction Model ---
    logger.info("Training Train Delay Predictor LSTM Model with 80/20 train/test split...")
    df_d = cleaned_data['delay']
    train_d, test_d = train_test_split(df_d, test_size=0.2, random_state=42)

    le_train = LabelEncoder()
    le_weather = LabelEncoder()
    le_route = LabelEncoder()

    train_idx_tr = safe_encode(le_train, train_d['train_number'], fit=True)
    weather_idx_tr = safe_encode(le_weather, train_d['weather'], fit=True)
    route_idx_tr = safe_encode(le_route, train_d['route'], fit=True)

    encoders['delay_train'] = le_train
    encoders['delay_weather'] = le_weather
    encoders['delay_route'] = le_route

    num_feats_tr = torch.tensor(train_d[['day_of_week', 'month', 'season']].values, dtype=torch.float32)
    targets_tr = torch.tensor(train_d[['arr_delay', 'dep_delay', 'probability']].values, dtype=torch.float32)

    vocab_sizes = {
        'train': len(le_train.classes_) + 5,
        'route': len(le_route.classes_) + 5,
        'weather': len(le_weather.classes_) + 5
    }
    embedding_dims = {'train': 16, 'route': 16, 'weather': 8}

    model_delay = TrainDelayLSTM(vocab_sizes, embedding_dims)
    optimizer_delay = optim.Adam(model_delay.parameters(), lr=0.008)

    ds_delay = TensorDataset(train_idx_tr, route_idx_tr, weather_idx_tr, num_feats_tr, targets_tr)
    loader_delay = DataLoader(ds_delay, batch_size=64, shuffle=True)

    model_delay.train()
    for epoch in range(25):
        for b_t, b_r, b_w, b_num, b_y in loader_delay:
            optimizer_delay.zero_grad()
            out = model_delay(b_t, b_r, b_w, b_num)
            loss_delay = criterion(out[:, :2] / 60.0, b_y[:, :2] / 60.0)
            loss_prob = criterion(out[:, 2], b_y[:, 2]) * 8.0
            loss = loss_delay + loss_prob
            loss.backward()
            optimizer_delay.step()

    # Evaluation on Hold-Out Test Set
    model_delay.eval()
    with torch.no_grad():
        train_idx_te = safe_encode(le_train, test_d['train_number'], fit=False)
        weather_idx_te = safe_encode(le_weather, test_d['weather'], fit=False)
        route_idx_te = safe_encode(le_route, test_d['route'], fit=False)
        num_feats_te = torch.tensor(test_d[['day_of_week', 'month', 'season']].values, dtype=torch.float32)
        targets_te = test_d[['arr_delay', 'dep_delay', 'probability']].values

        preds_d = model_delay(train_idx_te, route_idx_te, weather_idx_te, num_feats_te).cpu().numpy()
        arr_delay_mae = float(np.mean(np.abs(preds_d[:, 0] - targets_te[:, 0])))
        arr_delay_rmse = float(np.sqrt(np.mean((preds_d[:, 0] - targets_te[:, 0]) ** 2)))
        dep_delay_mae = float(np.mean(np.abs(preds_d[:, 1] - targets_te[:, 1])))
        prob_mae = float(np.mean(np.abs(preds_d[:, 2] - targets_te[:, 2])))

        # Baseline comparison: constant prediction (mean of targets)
        const_baseline_prob = float(np.mean(targets_te[:, 2]))
        const_baseline_prob_mae = float(np.mean(np.abs(targets_te[:, 2] - const_baseline_prob)))

        test_loss_d = float(criterion(torch.tensor(preds_d), torch.tensor(targets_te, dtype=torch.float32)).item())

    validate_and_save_model(model_delay, 'delay_model.pth')
    metrics_log['delay_model'] = {
        'model_type': 'regression',
        'test_loss': round(test_loss_d, 4),
        'arrival_delay_mae_minutes': round(arr_delay_mae, 2),
        'arrival_delay_rmse_minutes': round(arr_delay_rmse, 2),
        'departure_delay_mae_minutes': round(dep_delay_mae, 2),
        'delay_probability_mae': round(prob_mae, 4),
        'constant_baseline_prob_mae': round(const_baseline_prob_mae, 4),
        'beats_constant_baseline': bool(prob_mae < const_baseline_prob_mae),
        'train_samples': len(train_d),
        'test_samples': len(test_d),
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'loss': round(test_loss_d, 4)
    }

    # --- 2. Smart Fare Forecast Model ---
    logger.info("Training Smart Fare Forecast LSTM Model with 80/20 train/test split...")
    df_f = cleaned_data['fare']
    train_f, test_f = train_test_split(df_f, test_size=0.2, random_state=42)

    le_src = LabelEncoder()
    le_dst = LabelEncoder()
    le_class = LabelEncoder()

    src_tr = safe_encode(le_src, train_f['source'], fit=True)
    dst_tr = safe_encode(le_dst, train_f['destination'], fit=True)
    class_tr = safe_encode(le_class, train_f['class_code'], fit=True)

    encoders['fare_src'] = le_src
    encoders['fare_dst'] = le_dst
    encoders['fare_class'] = le_class

    X_num_f_tr = torch.tensor(train_f[['month', 'season_code', 'demand_score']].values, dtype=torch.float32)
    y_fare_ratio_tr = torch.tensor((train_f['forecast_7d'].values / train_f['current_fare'].values), dtype=torch.float32).unsqueeze(1)

    vocab_sizes_f = {
        'source': len(le_src.classes_) + 5,
        'dest': len(le_dst.classes_) + 5,
        'class': len(le_class.classes_) + 5
    }
    embedding_dims_f = {'source': 16, 'dest': 16, 'class': 8}

    model_fare = SmartFareLSTM(vocab_sizes_f, embedding_dims_f)
    optimizer_f = optim.Adam(model_fare.parameters(), lr=0.008)

    ds_fare = TensorDataset(src_tr, dst_tr, class_tr, X_num_f_tr, y_fare_ratio_tr)
    loader_fare = DataLoader(ds_fare, batch_size=64, shuffle=True)

    model_fare.train()
    for epoch in range(25):
        for b_src, b_dst, b_cls, b_num, b_y in loader_fare:
            optimizer_f.zero_grad()
            out = model_fare(b_src, b_dst, b_cls, b_num)
            loss_f = criterion(out, b_y)
            loss_f.backward()
            optimizer_f.step()

    # Evaluation on Hold-Out Test Set
    model_fare.eval()
    with torch.no_grad():
        src_te = safe_encode(le_src, test_f['source'], fit=False)
        dst_te = safe_encode(le_dst, test_f['destination'], fit=False)
        class_te = safe_encode(le_class, test_f['class_code'], fit=False)
        X_num_f_te = torch.tensor(test_f[['month', 'season_code', 'demand_score']].values, dtype=torch.float32)

        pred_ratios = model_fare(src_te, dst_te, class_te, X_num_f_te).cpu().numpy().squeeze()
        actual_fares = test_f['forecast_7d'].values
        current_fares = test_f['current_fare'].values
        predicted_fares_inr = pred_ratios * current_fares

        fare_mae_inr = float(np.mean(np.abs(predicted_fares_inr - actual_fares)))
        fare_rmse_inr = float(np.sqrt(np.mean((predicted_fares_inr - actual_fares) ** 2)))

        # Compare against mean baseline
        mean_baseline_fare = float(np.mean(actual_fares))
        mean_baseline_mae = float(np.mean(np.abs(actual_fares - mean_baseline_fare)))

        ratio_loss = float(criterion(torch.tensor(pred_ratios), torch.tensor(actual_fares / current_fares, dtype=torch.float32)).item())

    validate_and_save_model(model_fare, 'fare_model.pth')
    metrics_log['fare_model'] = {
        'model_type': 'regression',
        'test_loss': round(ratio_loss, 4),
        'fare_mae_rupees': round(fare_mae_inr, 2),
        'fare_rmse_rupees': round(fare_rmse_inr, 2),
        'mean_baseline_mae_rupees': round(mean_baseline_mae, 2),
        'beats_mean_baseline': bool(fare_mae_inr < mean_baseline_mae),
        'train_samples': len(train_f),
        'test_samples': len(test_f),
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'loss': round(ratio_loss, 4)
    }

    # --- 3. Crowd Level Classifier Net ---
    logger.info("Training Station Crowd Net Model with 80/20 train/test split...")
    df_c = cleaned_data['crowd']
    train_c, test_c = train_test_split(df_c, test_size=0.2, random_state=42)

    le_station = LabelEncoder()
    st_tr = safe_encode(le_station, train_c['station_code'], fit=True)
    encoders['crowd_station'] = le_station

    num_c_tr = torch.tensor(train_c[['day_of_week', 'hour_of_day']].values / 24.0, dtype=torch.float32)
    targets_c_cls_tr = torch.tensor(train_c['crowd_level'].values, dtype=torch.long)
    targets_c_reg_tr = torch.tensor(train_c[['crowd_pct', 'congestion_pct']].values, dtype=torch.float32)

    model_crowd = StationCrowdNet(vocab_size=len(le_station.classes_) + 5)
    optimizer_c = optim.Adam(model_crowd.parameters(), lr=0.008)

    ds_crowd = TensorDataset(st_tr, num_c_tr, targets_c_cls_tr, targets_c_reg_tr)
    loader_crowd = DataLoader(ds_crowd, batch_size=64, shuffle=True)

    model_crowd.train()
    for epoch in range(25):
        for b_st, b_num, b_cls, b_reg in loader_crowd:
            optimizer_c.zero_grad()
            logits, reg = model_crowd(b_st, b_num)
            l_cls = criterion_cls(logits, b_cls)
            l_reg = criterion(reg, b_reg)
            total_loss = l_cls + 2.0 * l_reg
            total_loss.backward()
            optimizer_c.step()

    # Evaluation on Hold-Out Test Set
    model_crowd.eval()
    with torch.no_grad():
        st_te = safe_encode(le_station, test_c['station_code'], fit=False)
        num_c_te = torch.tensor(test_c[['day_of_week', 'hour_of_day']].values / 24.0, dtype=torch.float32)
        logits_te, reg_te = model_crowd(st_te, num_c_te)

        preds_cls_c = np.argmax(logits_te.cpu().numpy(), axis=1)
        actual_cls_c = test_c['crowd_level'].values
        acc_c = float(np.mean(preds_cls_c == actual_cls_c) * 100.0)
        f1_c = float(f1_score(actual_cls_c, preds_cls_c, average='macro'))

        majority_cls = int(pd.Series(train_c['crowd_level']).mode()[0])
        majority_baseline_acc = float(np.mean(actual_cls_c == majority_cls) * 100.0)

        reg_np_c = reg_te.cpu().numpy()
        actual_reg_c = test_c[['crowd_pct', 'congestion_pct']].values
        crowd_pct_mae = float(np.mean(np.abs(reg_np_c[:, 0] - actual_reg_c[:, 0])))
        congestion_pct_mae = float(np.mean(np.abs(reg_np_c[:, 1] - actual_reg_c[:, 1])))

    validate_and_save_model(model_crowd, 'crowd_model.pth')
    metrics_log['crowd_model'] = {
        'model_type': 'hybrid_classification_regression',
        'test_loss': round(float(total_loss.item()), 4),
        'crowd_level_accuracy_pct': round(acc_c, 2),
        'majority_baseline_accuracy_pct': round(majority_baseline_acc, 2),
        'beats_majority_baseline': bool(acc_c > majority_baseline_acc),
        'crowd_level_macro_f1': round(f1_c, 4),
        'crowd_density_mae_pct': round(crowd_pct_mae, 4),
        'congestion_mae_pct': round(congestion_pct_mae, 4),
        'train_samples': len(train_c),
        'test_samples': len(test_c),
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'accuracy': round(acc_c, 2),
        'loss': round(float(total_loss.item()), 4)
    }

    # --- 4. Coach Occupancy Prediction Model ---
    logger.info("Training Train Occupancy Net Model with 80/20 train/test split...")
    df_o = cleaned_data['occ']
    train_o, test_o = train_test_split(df_o, test_size=0.2, random_state=42)

    le_occ_train = LabelEncoder()
    le_occ_class = LabelEncoder()

    t_occ_tr = safe_encode(le_occ_train, train_o['train_number'], fit=True)
    c_occ_tr = safe_encode(le_occ_class, train_o['class_code'], fit=True)
    encoders['occ_train'] = le_occ_train
    encoders['occ_class'] = le_occ_class

    num_occ_tr = torch.tensor(train_o[['month', 'day_of_week', 'season_code']].values / 12.0, dtype=torch.float32)
    targets_o_reg_tr = torch.tensor(train_o[['avail_prob', 'occupancy_pct', 'waiting_list']].values, dtype=torch.float32)
    targets_o_cls_tr = torch.tensor(train_o['demand_level'].values, dtype=torch.long)

    v_sizes_o = {
        'train': len(le_occ_train.classes_) + 5,
        'class': len(le_occ_class.classes_) + 5
    }
    emb_dims_o = {'train': 16, 'class': 8}

    model_occ = TrainOccupancyNet(v_sizes_o, emb_dims_o)
    optimizer_o = optim.Adam(model_occ.parameters(), lr=0.008)

    ds_occ = TensorDataset(t_occ_tr, c_occ_tr, num_occ_tr, targets_o_reg_tr, targets_o_cls_tr)
    loader_occ = DataLoader(ds_occ, batch_size=64, shuffle=True)

    model_occ.train()
    for epoch in range(25):
        for b_t, b_c, b_num, b_reg, b_cls in loader_occ:
            optimizer_o.zero_grad()
            reg, logits = model_occ(b_t, b_c, b_num)
            l_reg = criterion(reg[:, :2], b_reg[:, :2]) + (criterion(reg[:, 2:], b_reg[:, 2:]) / 50.0)
            l_cls = criterion_cls(logits, b_cls)
            total_loss_o = 2.0 * l_reg + l_cls
            total_loss_o.backward()
            optimizer_o.step()

    # Evaluation on Hold-Out Test Set
    model_occ.eval()
    with torch.no_grad():
        t_occ_te = safe_encode(le_occ_train, test_o['train_number'], fit=False)
        c_occ_te = safe_encode(le_occ_class, test_o['class_code'], fit=False)
        num_occ_te = torch.tensor(test_o[['month', 'day_of_week', 'season_code']].values / 12.0, dtype=torch.float32)
        reg_te, logits_te = model_occ(t_occ_te, c_occ_te, num_occ_te)

        preds_cls_o = np.argmax(logits_te.cpu().numpy(), axis=1)
        actual_cls_o = test_o['demand_level'].values
        acc_o = float(np.mean(preds_cls_o == actual_cls_o) * 100.0)
        f1_o = float(f1_score(actual_cls_o, preds_cls_o, average='macro'))

        majority_cls_o = int(pd.Series(train_o['demand_level']).mode()[0])
        majority_baseline_acc_o = float(np.mean(actual_cls_o == majority_cls_o) * 100.0)

        reg_np_o = reg_te.cpu().numpy()
        actual_reg_o = test_o[['avail_prob', 'occupancy_pct', 'waiting_list']].values
        avail_prob_mae = float(np.mean(np.abs(reg_np_o[:, 0] - actual_reg_o[:, 0])))
        occupancy_pct_mae = float(np.mean(np.abs(reg_np_o[:, 1] - actual_reg_o[:, 1])))

    validate_and_save_model(model_occ, 'occupancy_model.pth')
    metrics_log['occupancy_model'] = {
        'model_type': 'hybrid_classification_regression',
        'test_loss': round(float(total_loss_o.item()), 4),
        'demand_level_accuracy_pct': round(acc_o, 2),
        'majority_baseline_accuracy_pct': round(majority_baseline_acc_o, 2),
        'beats_majority_baseline': bool(acc_o > majority_baseline_acc_o),
        'demand_level_macro_f1': round(f1_o, 4),
        'occupancy_mae_pct': round(occupancy_pct_mae, 4),
        'availability_probability_mae': round(avail_prob_mae, 4),
        'train_samples': len(train_o),
        'test_samples': len(test_o),
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'accuracy': round(acc_o, 2),
        'loss': round(float(total_loss_o.item()), 4)
    }

    # --- 5. Route Recommendation NCF Model ---
    logger.info("Training Route Recommender NCF Model with 80/20 train/test split...")
    df_r = cleaned_data['rec']
    train_r, test_r = train_test_split(df_r, test_size=0.2, random_state=42)

    u_tr = torch.tensor(train_r['user_id'].values, dtype=torch.long)
    route_tr = torch.tensor(train_r['route_id'].values, dtype=torch.long)
    feats_r_tr = torch.tensor(train_r[['cost', 'duration', 'eco', 'comfort', 'student_budget']].values, dtype=torch.float32)
    targets_r_tr = torch.tensor(train_r['rating'].values, dtype=torch.float32).unsqueeze(1)

    model_rec = RouteRecommenderNet(num_users=250, num_routes=100)
    optimizer_r = optim.Adam(model_rec.parameters(), lr=0.008)

    ds_rec = TensorDataset(u_tr, route_tr, feats_r_tr, targets_r_tr)
    loader_rec = DataLoader(ds_rec, batch_size=128, shuffle=True)

    model_rec.train()
    for epoch in range(20):
        for b_u, b_route, b_feats, b_y in loader_rec:
            optimizer_r.zero_grad()
            out = model_rec(b_u, b_route, b_feats)
            loss_r = criterion(out, b_y)
            loss_r.backward()
            optimizer_r.step()

    # Evaluation on Hold-Out Test Set
    model_rec.eval()
    with torch.no_grad():
        u_te = torch.tensor(test_r['user_id'].values, dtype=torch.long)
        route_te = torch.tensor(test_r['route_id'].values, dtype=torch.long)
        feats_r_te = torch.tensor(test_r[['cost', 'duration', 'eco', 'comfort', 'student_budget']].values, dtype=torch.float32)
        preds_r = model_rec(u_te, route_te, feats_r_te).cpu().numpy().squeeze()
        actual_r = test_r['rating'].values

        rating_mae = float(np.mean(np.abs(preds_r - actual_r)))
        rating_rmse = float(np.sqrt(np.mean((preds_r - actual_r) ** 2)))
        test_loss_r = float(criterion(torch.tensor(preds_r), torch.tensor(actual_r, dtype=torch.float32)).item())

    validate_and_save_model(model_rec, 'route_recommender.pth')
    metrics_log['route_recommender'] = {
        'model_type': 'regression',
        'test_loss': round(test_loss_r, 4),
        'rating_mae_stars': round(rating_mae, 2),
        'rating_rmse_stars': round(rating_rmse, 2),
        'train_samples': len(train_r),
        'test_samples': len(test_r),
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'loss': round(test_loss_r, 4)
    }

    # --- 6. Chatbot Assistant Intent Classifier (Zero Synthetic Leakage) ---
    logger.info("Training Chatbot NLP Intent Classifier with disjoint holdout test set...")
    train_n = cleaned_data['nlp_train']
    test_n = cleaned_data['nlp_test']

    tokenizer = SimpleTokenizer()
    tokenizer.fit_on_texts(train_n['text'].tolist())
    encoders['chatbot_tokenizer'] = tokenizer

    seqs_tr = tokenizer.texts_to_sequences(train_n['text'].tolist())
    flat_indices_tr = []
    offsets_tr = []
    curr_off = 0
    for seq in seqs_tr:
        offsets_tr.append(curr_off)
        flat_indices_tr.extend(seq)
        curr_off += len(seq)

    flat_indices_tr = torch.tensor(flat_indices_tr, dtype=torch.long)
    offsets_tr = torch.tensor(offsets_tr, dtype=torch.long)
    targets_nlp_tr = torch.tensor(train_n['label'].values, dtype=torch.long)

    model_chatbot = ChatbotClassifierNet(vocab_size=len(tokenizer.vocab) + 10, num_classes=10)
    optimizer_nlp = optim.Adam(model_chatbot.parameters(), lr=0.01)

    model_chatbot.train()
    for epoch in range(35):
        optimizer_nlp.zero_grad()
        out = model_chatbot(flat_indices_tr, offsets_tr)
        loss_nlp = criterion_cls(out, targets_nlp_tr)
        loss_nlp.backward()
        optimizer_nlp.step()

    # Evaluation on Unseen Held-Out Test Queries
    model_chatbot.eval()
    with torch.no_grad():
        seqs_te = tokenizer.texts_to_sequences(test_n['text'].tolist())
        flat_indices_te = []
        offsets_te = []
        curr_off_te = 0
        for seq in seqs_te:
            offsets_te.append(curr_off_te)
            flat_indices_te.extend(seq if seq else [0])
            curr_off_te += len(seq) if seq else 1

        flat_indices_te = torch.tensor(flat_indices_te, dtype=torch.long)
        offsets_te = torch.tensor(offsets_te, dtype=torch.long)
        out_te = model_chatbot(flat_indices_te, offsets_te)
        preds_nlp = np.argmax(out_te.cpu().numpy(), axis=1)
        actual_nlp = test_n['label'].values

        acc_nlp = float(np.mean(preds_nlp == actual_nlp) * 100.0)
        f1_nlp = float(f1_score(actual_nlp, preds_nlp, average='macro'))
        test_loss_nlp = float(criterion_cls(out_te, torch.tensor(actual_nlp, dtype=torch.long)).item())

    validate_and_save_model(model_chatbot, 'chatbot_classifier.pth')
    metrics_log['chatbot_model'] = {
        'model_type': 'classification',
        'test_loss': round(test_loss_nlp, 4),
        'accuracy': round(acc_nlp, 2),
        'macro_f1': round(f1_nlp, 4),
        'intent_classes_count': 10,
        'train_samples': len(train_n),
        'test_samples': len(test_n),
        'evaluation_method': 'disjoint_unseen_queries_zero_leakage',
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'loss': round(test_loss_nlp, 4)
    }

    # --- 7. Time-Series Demand Forecast (Temporal Cutoff Split) ---
    logger.info("Training Demand Forecast LSTM Model with temporal 80/20 train/test split...")
    series = np.array(cleaned_data['demand_series'])

    split_idx = int(len(series) * 0.8)
    train_series = series[:split_idx]
    test_series = series[split_idx:]

    series_min = float(train_series.min())
    series_max = float(train_series.max())
    encoders['demand_scale'] = {'min': series_min, 'max': series_max}

    denom = (series_max - series_min) if (series_max - series_min) != 0 else 1.0
    train_norm = (train_series - series_min) / denom
    test_norm = (test_series - series_min) / denom

    window_size = 30
    X_tr_seq, y_tr_seq = [], []
    for i in range(len(train_norm) - window_size):
        X_tr_seq.append(train_norm[i:i + window_size])
        y_tr_seq.append(train_norm[i + window_size])

    X_tr_seq = np.array(X_tr_seq).reshape(-1, window_size, 1)
    y_tr_seq = np.array(y_tr_seq).reshape(-1, 1)

    X_tr_t = torch.tensor(X_tr_seq, dtype=torch.float32)
    y_tr_t = torch.tensor(y_tr_seq, dtype=torch.float32)

    model_demand = DemandForecastLSTM()
    optimizer_d = optim.Adam(model_demand.parameters(), lr=0.01)

    model_demand.train()
    for epoch in range(15):
        optimizer_d.zero_grad()
        out = model_demand(X_tr_t)
        loss_d = criterion(out, y_tr_t)
        loss_d.backward()
        optimizer_d.step()

    # Evaluation on Hold-Out Temporal Test Set
    model_demand.eval()
    with torch.no_grad():
        X_te_seq, y_te_seq = [], []
        combined_test = np.concatenate([train_norm[-window_size:], test_norm])
        for i in range(len(combined_test) - window_size):
            X_te_seq.append(combined_test[i:i + window_size])
            y_te_seq.append(combined_test[i + window_size])

        X_te_t = torch.tensor(np.array(X_te_seq).reshape(-1, window_size, 1), dtype=torch.float32)
        preds_seq_norm = model_demand(X_te_t).cpu().numpy().squeeze()
        actual_seq_norm = np.array(y_te_seq)

        preds_passengers = preds_seq_norm * denom + series_min
        actual_passengers = actual_seq_norm * denom + series_min

        demand_mae = float(np.mean(np.abs(preds_passengers - actual_passengers)))
        demand_rmse = float(np.sqrt(np.mean((preds_passengers - actual_passengers) ** 2)))
        test_loss_seq = float(criterion(torch.tensor(preds_seq_norm), torch.tensor(actual_seq_norm, dtype=torch.float32)).item())

    validate_and_save_model(model_demand, 'demand_forecaster.pth')
    metrics_log['demand_forecaster'] = {
        'model_type': 'time_series_forecasting',
        'split_method': 'temporal_cutoff_80_20',
        'test_loss': round(test_loss_seq, 4),
        'demand_mae_passengers': round(demand_mae, 2),
        'demand_rmse_passengers': round(demand_rmse, 2),
        'train_samples': len(X_tr_seq),
        'test_samples': len(X_te_seq),
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'loss': round(test_loss_seq, 4)
    }

    # --- 8. User Behavior Net ---
    logger.info("Training User Behavior Analytics Net with 80/20 train/test split...")
    df_b = cleaned_data['behavior']
    train_b, test_b = train_test_split(df_b, test_size=0.2, random_state=42, stratify=df_b['persona'])

    X_b_tr = torch.tensor(train_b[['bookings', 'avg_budget', 'pref_mode', 'frequency', 'satisfaction']].values, dtype=torch.float32)
    y_b_tr = torch.tensor(train_b['persona'].values, dtype=torch.long)

    model_behavior = UserBehaviorNet()
    optimizer_b = optim.Adam(model_behavior.parameters(), lr=0.01)

    model_behavior.train()
    for epoch in range(15):
        optimizer_b.zero_grad()
        out = model_behavior(X_b_tr)
        loss_b = criterion_cls(out, y_b_tr)
        loss_b.backward()
        optimizer_b.step()

    # Evaluation on Hold-Out Test Set
    model_behavior.eval()
    with torch.no_grad():
        X_b_te = torch.tensor(test_b[['bookings', 'avg_budget', 'pref_mode', 'frequency', 'satisfaction']].values, dtype=torch.float32)
        out_b = model_behavior(X_b_te)
        preds_b = np.argmax(out_b.cpu().numpy(), axis=1)
        actual_b = test_b['persona'].values

        acc_b = float(np.mean(preds_b == actual_b) * 100.0)
        f1_b = float(f1_score(actual_b, preds_b, average='macro'))
        test_loss_b = float(criterion_cls(out_b, torch.tensor(actual_b, dtype=torch.long)).item())

    validate_and_save_model(model_behavior, 'behavior_net.pth')
    metrics_log['behavior_net'] = {
        'model_type': 'classification',
        'test_loss': round(test_loss_b, 4),
        'accuracy': round(acc_b, 2),
        'macro_f1': round(f1_b, 4),
        'persona_count': len(PERSONA_DETAILS),
        'train_samples': len(train_b),
        'test_samples': len(test_b),
        'dataset_provenance': 'synthetic_simulation',
        'evaluated_at': datetime.now().isoformat(),
        'model_version': '1.0.0',
        'loss': round(test_loss_b, 4)
    }

    # --- Save Encoders & Meta ---
    with open(os.path.join(MODELS_DIR, 'encoders.pkl'), 'wb') as f:
        pickle.dump(encoders, f)

    # Save metrics log to metadata JSON
    with open(os.path.join(MODELS_DIR, 'model_metrics.json'), 'w') as f:
        json.dump(metrics_log, f, indent=2)

    # Write to MySQL model_metrics table if MySQL connection works, else log
    write_metrics_to_db(metrics_log)

    logger.info("🎉 All PyTorch travel intelligence models trained, evaluated on test sets, and saved successfully!")

def write_metrics_to_db(metrics_log):
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "traveliq_app"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "traveliq"),
            port=int(os.getenv("DB_PORT", 3306))
        )
        cursor = conn.cursor()
        for model_name, metrics in metrics_log.items():
            query = """
            INSERT INTO model_metrics (model_name, model_version, accuracy, loss, training_samples, status, metrics_data, last_trained_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE 
                accuracy = VALUES(accuracy),
                loss = VALUES(loss),
                training_samples = VALUES(training_samples),
                status = VALUES(status),
                metrics_data = VALUES(metrics_data),
                last_trained_at = NOW()
            """
            cursor.execute(query, (
                model_name,
                metrics.get("model_version", "1.0.0"),
                metrics.get("accuracy"),
                metrics.get("loss", metrics.get("test_loss")),
                metrics.get("train_samples", metrics.get("samples", 0)),
                "Active",
                json.dumps(metrics)
            ))
        conn.commit()
        cursor.close()
        conn.close()
        logger.info("✅ Model metrics loaded into MySQL database successfully.")
    except Exception as e:
        logger.warning(f"⚠️ Could not write metrics to MySQL database: {e}")

if __name__ == "__main__":
    train_and_save_all()
