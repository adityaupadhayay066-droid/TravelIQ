import os
import pytest
from fastapi.testclient import TestClient
from main import app, INTERNAL_SERVICE_KEY

client = TestClient(app)

INTERNAL_ROUTES = [
    ("POST", "/predict-delay", {"train_number": "12301", "route": "DEL-MUM", "weather": "Clear", "day_of_week": 1, "month": 5, "season": 1}),
    ("POST", "/predict-fare", {"source": "NDLS", "destination": "BBS", "class_code": "3A", "current_fare": 1500.0, "month": 5, "season_code": 1, "demand_score": 0.8}),
    ("POST", "/predict-crowd", {"station_code": "NDLS", "day_of_week": 2, "hour_of_day": 14}),
    ("POST", "/predict-occupancy", {"train_number": "12301", "class_code": "3A", "month": 5, "day_of_week": 2, "season_code": 1}),
    ("POST", "/recommend-route", {"user_id": 1, "route_id": 10, "cost": 1200.0, "duration": 8.5, "eco": 4.5, "comfort": 4.0, "student_budget": 1.0}),
    ("POST", "/recommend-food", {"destination": "Bhubaneswar", "budget": "Medium", "travelers": 2, "is_student": False}),
    ("POST", "/chat", {"message": "Hello assistant"}),
    ("POST", "/predict-behavior", {"bookings": 5, "avg_budget": 2000.0, "pref_mode": 1, "frequency": 2.0, "satisfaction": 4.0}),
    ("POST", "/optimize-route", {"source": "Delhi", "destination": "Bhubaneswar", "preference": "time"}),
    ("GET", "/data-quality-report", None),
    ("GET", "/model-metrics", None),
    ("POST", "/retrain", None),
    ("POST", "/retrain-with-data", {"model_name": "delay_model", "training_records": []}),
    ("POST", "/rag/upload", {"filename": "test.txt", "file_path": "uploads/test.txt", "category": "general"}),
    ("POST", "/rag/query", {"query": "train luggage rules", "user_id": 1}),
    ("POST", "/voice/respond", {"text": "show trains from Delhi to Mumbai", "language": "en"}),
    ("POST", "/copilot/query", {"query": "trains from Delhi to Bhubaneswar", "user_id": 1}),
    ("POST", "/memory/profile", {"user_id": 1}),
    ("POST", "/memory/update", {"user_id": 1, "preferred_class": "3A", "preferred_budget": 4000.0}),
    ("POST", "/api/v1/transport/validate", {"id": "TR-101", "name": "Rajdhani Express", "type": "Train", "source": "Delhi", "destination": "Mumbai", "departure_time": "16:00", "arrival_time": "08:00", "duration_minutes": 960, "price_inr": 2500.0, "carbon_kg": 25.0, "verification_status": "VERIFIED_IRCTC", "reliability_score": 98.0, "amenities": ["Pantry"], "booking_link": "https://irctc.co.in", "available_seats": 50, "real_time_tracking": True, "created_at": "2026-10-27T00:00:00Z"}),
]

def test_public_endpoints_accessible_without_auth():
    """Verify that only genuinely public endpoints (/ and /health) are accessible without auth."""
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "AEVORA" in res_root.json()["message"] or "TravelIQ" in res_root.json()["message"]

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"

@pytest.mark.parametrize("method,path,payload", INTERNAL_ROUTES)
def test_all_internal_routes_reject_missing_key(method, path, payload):
    """Every internal endpoint must reject requests missing X-Internal-Service-Key with 403."""
    if method == "GET":
        res = client.get(path)
    else:
        res = client.post(path, json=payload) if payload is not None else client.post(path)
    assert res.status_code == 403, f"Expected 403 on missing key for {method} {path}, got {res.status_code}"
    assert "Forbidden" in res.json().get("detail", "")

@pytest.mark.parametrize("method,path,payload", INTERNAL_ROUTES)
def test_all_internal_routes_reject_invalid_key(method, path, payload):
    """Every internal endpoint must reject requests with an invalid service key with 403."""
    headers = {"X-Internal-Service-Key": "forged_malicious_internal_key"}
    if method == "GET":
        res = client.get(path, headers=headers)
    else:
        res = client.post(path, json=payload, headers=headers) if payload is not None else client.post(path, headers=headers)
    assert res.status_code == 403, f"Expected 403 on invalid key for {method} {path}, got {res.status_code}"
    assert "Forbidden" in res.json().get("detail", "")

@pytest.mark.parametrize("method,path,payload", INTERNAL_ROUTES)
def test_all_internal_routes_accept_valid_key(method, path, payload):
    """Every internal endpoint must authenticate successfully when given the correct service key."""
    headers = {"X-Internal-Service-Key": os.getenv("INTERNAL_SERVICE_KEY", "traveliq_internal_svc_token_secure_2026")}
    if method == "GET":
        res = client.get(path, headers=headers)
    else:
        res = client.post(path, json=payload, headers=headers) if payload is not None else client.post(path, headers=headers)
    # Status code must not be 403 Forbidden
    assert res.status_code != 403, f"Expected authenticated access for {method} {path}, but received 403: {res.text}"
