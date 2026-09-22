import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("DataCleaner")

class DataCleaner:
    """
    Automated Data Hygiene, Cleaning, and Sanitization Pipeline.
    Handles duplicate rows, missing values, extreme noise/outliers, 
    type coercion, and produces an audit report.
    """

    def __init__(self):
        self.quality_report = {
            "cleaned_at": None,
            "datasets": {},
            "overall_status": "Clean"
        }

    def clean_dataset(self, df: pd.DataFrame, dataset_type: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Main entrypoint for dataset cleaning based on target model type.
        dataset_type: 'delay', 'fare', 'crowd', 'occupancy', 'rec', 'behavior', 'demand'
        """
        if df is None or len(df) == 0:
            return pd.DataFrame(), {"error": "Empty dataset provided"}

        initial_count = len(df)
        df_clean = df.copy()

        # 1. Deduplication
        df_clean = df_clean.drop_duplicates()
        dedup_count = initial_count - len(df_clean)

        # 2. String trimming & casing normalization
        for col in df_clean.select_dtypes(include=['object']).columns:
            df_clean[col] = df_clean[col].astype(str).str.strip()

        # 3. Model-specific cleaning & domain boundary enforcement
        metrics = {
            "initial_rows": initial_count,
            "duplicate_rows_removed": dedup_count,
            "nulls_imputed": 0,
            "outliers_clipped": 0,
            "final_clean_rows": 0
        }

        if dataset_type == 'delay':
            df_clean, metrics = self._clean_delay_data(df_clean, metrics)
        elif dataset_type == 'fare':
            df_clean, metrics = self._clean_fare_data(df_clean, metrics)
        elif dataset_type == 'crowd':
            df_clean, metrics = self._clean_crowd_data(df_clean, metrics)
        elif dataset_type == 'occupancy':
            df_clean, metrics = self._clean_occupancy_data(df_clean, metrics)
        elif dataset_type == 'rec':
            df_clean, metrics = self._clean_rec_data(df_clean, metrics)
        elif dataset_type == 'behavior':
            df_clean, metrics = self._clean_behavior_data(df_clean, metrics)
        elif dataset_type == 'demand':
            df_clean, metrics = self._clean_demand_data(df_clean, metrics)

        metrics["final_clean_rows"] = len(df_clean)
        logger.info(f"[{dataset_type.upper()}] Cleaned {initial_count} rows -> {len(df_clean)} valid rows (Removed {dedup_count} duplicates, {metrics['outliers_clipped']} outliers treated, {metrics['nulls_imputed']} nulls imputed).")
        
        return df_clean, metrics

    def _clean_delay_data(self, df: pd.DataFrame, metrics: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        required = ['train_number', 'route', 'day_of_week', 'month', 'season', 'weather', 'arr_delay', 'dep_delay', 'probability']
        
        # Ensure all columns exist, fill default if missing
        for col in required:
            if col not in df.columns:
                df[col] = np.nan

        # Impute missing categoricals
        if df['weather'].isnull().sum() > 0:
            metrics['nulls_imputed'] += int(df['weather'].isnull().sum())
            df['weather'] = df['weather'].fillna("Sunny")
        if df['route'].isnull().sum() > 0:
            metrics['nulls_imputed'] += int(df['route'].isnull().sum())
            df['route'] = df['route'].fillna("NEW DELHI -> MUMBAI CSMT")
        if df['train_number'].isnull().sum() > 0:
            metrics['nulls_imputed'] += int(df['train_number'].isnull().sum())
            df['train_number'] = df['train_number'].fillna("12001")

        # Numerical conversion & imputation
        for num_col in ['day_of_week', 'month', 'season']:
            df[num_col] = pd.to_numeric(df[num_col], errors='coerce')
            nulls = df[num_col].isnull().sum()
            if nulls > 0:
                metrics['nulls_imputed'] += int(nulls)
                df[num_col] = df[num_col].fillna(0).astype(int)

        # Delays & probability
        df['arr_delay'] = pd.to_numeric(df['arr_delay'], errors='coerce')
        df['dep_delay'] = pd.to_numeric(df['dep_delay'], errors='coerce')
        df['probability'] = pd.to_numeric(df['probability'], errors='coerce')

        # Treat missing delays
        arr_nulls = df['arr_delay'].isnull().sum()
        if arr_nulls > 0:
            metrics['nulls_imputed'] += int(arr_nulls)
            df['arr_delay'] = df['arr_delay'].fillna(df['arr_delay'].median() if not df['arr_delay'].dropna().empty else 10.0)

        dep_nulls = df['dep_delay'].isnull().sum()
        if dep_nulls > 0:
            metrics['nulls_imputed'] += int(dep_nulls)
            df['dep_delay'] = df['dep_delay'].fillna(df['arr_delay'])

        # Outlier clipping (delays should be >= 0 and <= 720 mins (12 hrs))
        outliers_arr = (df['arr_delay'] < 0) | (df['arr_delay'] > 720)
        outliers_dep = (df['dep_delay'] < 0) | (df['dep_delay'] > 720)
        metrics['outliers_clipped'] += int(outliers_arr.sum() + outliers_dep.sum())
        
        df['arr_delay'] = df['arr_delay'].clip(lower=0.0, upper=720.0)
        df['dep_delay'] = df['dep_delay'].clip(lower=0.0, upper=720.0)

        # Probability bound [0.0, 1.0]
        prob_nulls = df['probability'].isnull().sum()
        if prob_nulls > 0:
            metrics['nulls_imputed'] += int(prob_nulls)
            df['probability'] = df['probability'].fillna(0.3)
        df['probability'] = df['probability'].clip(lower=0.0, upper=1.0)

        return df, metrics

    def _clean_fare_data(self, df: pd.DataFrame, metrics: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        required = ['source', 'destination', 'class_code', 'month', 'season_code', 'demand_score', 'current_fare', 'forecast_7d']
        for col in required:
            if col not in df.columns:
                df[col] = np.nan

        # Normalize strings
        df['source'] = df['source'].fillna("NEW DELHI").astype(str).str.upper()
        df['destination'] = df['destination'].fillna("MUMBAI CSMT").astype(str).str.upper()
        df['class_code'] = df['class_code'].fillna("SL").astype(str).str.upper()

        # Numerics
        for num_col in ['month', 'season_code']:
            df[num_col] = pd.to_numeric(df[num_col], errors='coerce').fillna(1).astype(int)

        df['demand_score'] = pd.to_numeric(df['demand_score'], errors='coerce').fillna(0.5).clip(lower=0.0, upper=1.0)
        
        df['current_fare'] = pd.to_numeric(df['current_fare'], errors='coerce')
        fare_nulls = df['current_fare'].isnull().sum()
        if fare_nulls > 0:
            metrics['nulls_imputed'] += int(fare_nulls)
            df['current_fare'] = df['current_fare'].fillna(800.0)

        # Outlier clipping: fares between ₹50 and ₹25,000
        outliers = (df['current_fare'] < 50) | (df['current_fare'] > 25000)
        metrics['outliers_clipped'] += int(outliers.sum())
        df['current_fare'] = df['current_fare'].clip(lower=50.0, upper=25000.0)

        df['forecast_7d'] = pd.to_numeric(df['forecast_7d'], errors='coerce')
        if df['forecast_7d'].isnull().sum() > 0:
            df['forecast_7d'] = df['forecast_7d'].fillna(df['current_fare'])
        df['forecast_7d'] = df['forecast_7d'].clip(lower=50.0, upper=30000.0)

        return df, metrics

    def _clean_crowd_data(self, df: pd.DataFrame, metrics: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        df['station_code'] = df.get('station_code', pd.Series(['NDLS']*len(df))).fillna('NDLS').astype(str).str.upper()
        df['day_of_week'] = pd.to_numeric(df.get('day_of_week', 0), errors='coerce').fillna(0).astype(int).clip(0, 6)
        df['hour_of_day'] = pd.to_numeric(df.get('hour_of_day', 12), errors='coerce').fillna(12).astype(int).clip(0, 23)

        df['crowd_pct'] = pd.to_numeric(df.get('crowd_pct', 0.5), errors='coerce').fillna(0.5).clip(0.0, 1.0)
        df['congestion_pct'] = pd.to_numeric(df.get('congestion_pct', 0.5), errors='coerce').fillna(0.5).clip(0.0, 1.0)
        df['crowd_level'] = pd.to_numeric(df.get('crowd_level', 1), errors='coerce').fillna(1).astype(int).clip(0, 3)

        return df, metrics

    def _clean_occupancy_data(self, df: pd.DataFrame, metrics: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        df['train_number'] = df.get('train_number', pd.Series(['12001']*len(df))).fillna('12001').astype(str)
        df['class_code'] = df.get('class_code', pd.Series(['SL']*len(df))).fillna('SL').astype(str).str.upper()
        df['month'] = pd.to_numeric(df.get('month', 1), errors='coerce').fillna(1).astype(int).clip(1, 12)
        df['day_of_week'] = pd.to_numeric(df.get('day_of_week', 0), errors='coerce').fillna(0).astype(int).clip(0, 6)
        df['season_code'] = pd.to_numeric(df.get('season_code', 0), errors='coerce').fillna(0).astype(int).clip(0, 3)

        df['avail_prob'] = pd.to_numeric(df.get('avail_prob', 0.5), errors='coerce').fillna(0.5).clip(0.0, 1.0)
        df['occupancy_pct'] = pd.to_numeric(df.get('occupancy_pct', 0.7), errors='coerce').fillna(0.7).clip(0.0, 1.0)
        df['waiting_list'] = pd.to_numeric(df.get('waiting_list', 0), errors='coerce').fillna(0.0).clip(lower=0.0, upper=500.0)
        df['demand_level'] = pd.to_numeric(df.get('demand_level', 1), errors='coerce').fillna(1).astype(int).clip(0, 2)

        return df, metrics

    def _clean_rec_data(self, df: pd.DataFrame, metrics: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        for col in ['user_id', 'route_id']:
            df[col] = pd.to_numeric(df.get(col, 0), errors='coerce').fillna(0).astype(int)
        for col in ['cost', 'duration', 'eco', 'comfort', 'student_budget']:
            df[col] = pd.to_numeric(df.get(col, 0.5), errors='coerce').fillna(0.5).clip(0.0, 1.0)
        df['rating'] = pd.to_numeric(df.get('rating', 3.0), errors='coerce').fillna(3.0).clip(0.0, 5.0)
        return df, metrics

    def _clean_behavior_data(self, df: pd.DataFrame, metrics: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        for col in ['bookings', 'avg_budget', 'pref_mode', 'frequency', 'satisfaction']:
            df[col] = pd.to_numeric(df.get(col, 0.5), errors='coerce').fillna(0.5).clip(0.0, 1.0)
        df['persona'] = pd.to_numeric(df.get('persona', 0), errors='coerce').fillna(0).astype(int).clip(0, 3)
        return df, metrics

    def _clean_demand_data(self, df: pd.DataFrame, metrics: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        df['demand'] = pd.to_numeric(df.get('demand', 50.0), errors='coerce').fillna(50.0).clip(lower=0.0)
        return df, metrics
