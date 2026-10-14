"""
Automated regression tests for Python AI Service Transport Schema.
Tests strict Pydantic validation:
- Rejection of dummy service identifiers (XXXXX, TR1, etc.)
- Rejection of negative fares
- Journey date format enforcement
- Provenance source verification consistency
- Serialization of TransportSearchResponse
"""

import pytest
from pydantic import ValidationError
import sys
import os

# Ensure ai-services root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from transport_schema import (
    TransportOption,
    TransportMode,
    VerificationStatus,
    RouteLeg,
    TransportSearchResponse
)

def test_valid_train_option():
    """Verify a genuine train option with valid data succeeds."""
    option = TransportOption(
        mode=TransportMode.TRAIN,
        provider_id="train_12562",
        service_number="12562",
        service_name="Swatantrata Senani Superfast Express",
        origin_code="NDLS",
        destination_code="CNB",
        departure_time="21:15",
        arrival_time="03:15",
        journey_date="2026-10-20",
        duration_hours=6.0,
        fare=1250.0,
        source="irctc_sql_timetable",
        retrieved_at="2026-10-14T10:00:00Z",
        verification_status=VerificationStatus.PROVIDER_VERIFIED
    )
    assert option.service_number == "12562"
    assert option.fare == 1250.0
    assert option.currency == "INR"
    assert option.verification_status == VerificationStatus.PROVIDER_VERIFIED

def test_reject_dummy_identifiers():
    """Verify rejection of dummy service numbers like XXXXX, TR1, etc."""
    for dummy in ["XXXXX", "TR1", "TR2", "TRAIN", "TRANSIT"]:
        with pytest.raises(ValidationError) as exc_info:
            TransportOption(
                mode=TransportMode.TRAIN,
                provider_id=f"train_{dummy}",
                service_number=dummy,
                service_name="Dummy Express",
                origin_code="NDLS",
                destination_code="CNB",
                journey_date="2026-10-20",
                source="test",
                retrieved_at="2026-10-14T10:00:00Z",
                verification_status=VerificationStatus.UNAVAILABLE
            )
        assert "Dummy identifier" in str(exc_info.value) or "forbidden" in str(exc_info.value)

def test_reject_negative_fare():
    """Verify that negative fares are rejected."""
    with pytest.raises(ValidationError) as exc_info:
        TransportOption(
            mode=TransportMode.TRAIN,
            provider_id="train_12562",
            service_number="12562",
            service_name="Swatantrata Senani Superfast Express",
            origin_code="NDLS",
            destination_code="CNB",
            journey_date="2026-10-20",
            fare=-150.0,
            source="irctc_sql_timetable",
            retrieved_at="2026-10-14T10:00:00Z",
            verification_status=VerificationStatus.STATIC_REFERENCE
        )
    assert "Fare cannot be negative" in str(exc_info.value)

def test_reject_invalid_date_format():
    """Verify journey_date must be YYYY-MM-DD."""
    with pytest.raises(ValidationError) as exc_info:
        TransportOption(
            mode=TransportMode.TRAIN,
            provider_id="train_12562",
            service_number="12562",
            service_name="Swatantrata Senani Superfast Express",
            origin_code="NDLS",
            destination_code="CNB",
            journey_date="20/10/2026",
            source="irctc_sql_timetable",
            retrieved_at="2026-10-14T10:00:00Z",
            verification_status=VerificationStatus.STATIC_REFERENCE
        )
    assert "Journey date must be formatted YYYY-MM-DD" in str(exc_info.value)

def test_reject_provider_verified_with_simulated_source():
    """Verify provider_verified status cannot use fake or simulated sources."""
    with pytest.raises(ValidationError) as exc_info:
        TransportOption(
            mode=TransportMode.FLIGHT,
            provider_id="flight_6E205",
            service_number="6E-205",
            service_name="IndiGo 6E-205",
            origin_code="DEL",
            destination_code="BOM",
            journey_date="2026-10-20",
            source="simulated",
            retrieved_at="2026-10-14T10:00:00Z",
            verification_status=VerificationStatus.PROVIDER_VERIFIED
        )
    assert "must have an authoritative genuine source" in str(exc_info.value)

def test_route_leg_validation():
    """Verify RouteLeg enforces genuine identifiers."""
    with pytest.raises(ValidationError) as exc_info:
        RouteLeg(
            leg_number=1,
            mode="train",
            service_number="TR1",
            service_name="Leg 1 Express",
            from_code="TATA",
            to_code="DDU"
        )
    assert "Dummy service identifier" in str(exc_info.value)

def test_transport_search_response():
    """Verify complete TransportSearchResponse aggregation."""
    res = TransportSearchResponse(
        origin="NDLS",
        destination="CNB",
        journey_date="2026-10-20",
        trains=[
            TransportOption(
                mode=TransportMode.TRAIN,
                provider_id="train_12562",
                service_number="12562",
                service_name="Swatantrata Senani Superfast Express",
                origin_code="NDLS",
                destination_code="CNB",
                departure_time="21:15",
                arrival_time="03:15",
                journey_date="2026-10-20",
                duration_hours=6.0,
                source="irctc_sql_timetable",
                retrieved_at="2026-10-14T10:00:00Z",
                verification_status=VerificationStatus.PROVIDER_VERIFIED
            )
        ],
        flights=[],
        buses=[],
        provider_status={"trains": "ok", "flights": "no_airport", "buses": "ok"}
    )
    assert len(res.trains) == 1
    assert res.trains[0].fare is None
    assert res.flights == []
    json_data = res.model_dump()
    assert json_data["origin"] == "NDLS"
    assert json_data["trains"][0]["fare"] is None
