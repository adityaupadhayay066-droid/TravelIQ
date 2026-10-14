from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone
from enum import Enum
import re

class VerificationStatus(str, Enum):
    PROVIDER_VERIFIED = "provider_verified"
    STATIC_REFERENCE = "static_reference"
    HISTORICAL = "historical"
    ESTIMATED = "estimated"
    UNAVAILABLE = "unavailable"

class TransportMode(str, Enum):
    TRAIN = "train"
    FLIGHT = "flight"
    BUS = "bus"

class RouteLeg(BaseModel):
    leg_number: int = Field(ge=1)
    mode: str
    service_number: str
    service_name: str
    from_code: str
    to_code: str
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    departure_utc: Optional[str] = None
    arrival_utc: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    is_cluster_transfer: bool = False

    @field_validator("service_number", "service_name", "from_code", "to_code")
    @classmethod
    def reject_dummy_identifiers(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Service and station identifiers cannot be empty")
        if cleaned.upper() in ["XXXXX", "YYYYY", "TR1", "TR2", "TRAIN", "TRANSIT"]:
            raise ValueError(f"Dummy service identifier '{cleaned}' is forbidden")
        return cleaned

class TransportOption(BaseModel):
    mode: TransportMode
    provider_id: str
    service_number: str
    service_name: str
    origin_code: str
    destination_code: str
    origin_name: Optional[str] = None
    destination_name: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    departure_utc: Optional[str] = None
    arrival_utc: Optional[str] = None
    departure_timezone: str = "Asia/Kolkata"
    arrival_timezone: str = "Asia/Kolkata"
    journey_date: str
    duration_hours: Optional[float] = Field(default=None, ge=0.0)
    duration_formatted: Optional[str] = None
    fare: Optional[float] = None
    currency: Optional[str] = None
    fare_type: Optional[Literal["actual", "estimated", "historical"]] = None
    fares: Optional[Dict[str, float]] = None
    available_classes: List[str] = Field(default_factory=list)
    available_seats: Optional[Dict[str, int]] = None
    source: str
    retrieved_at: str
    verification_status: VerificationStatus
    booking_url: Optional[str] = None
    is_direct: bool = True
    legs: Optional[List[RouteLeg]] = None
    operating_days: Optional[List[str]] = None
    frequency_label: Optional[str] = None

    @field_validator("service_number", "service_name", "origin_code", "destination_code")
    @classmethod
    def validate_identifiers(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Identifier cannot be empty")
        if cleaned.upper() in ["XXXXX", "YYYYY", "TR1", "TR2", "TRAIN", "TRANSIT"]:
            raise ValueError(f"Dummy identifier '{cleaned}' is not permitted in verified transport options")
        return cleaned

    @field_validator("fare")
    @classmethod
    def validate_fare_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Fare cannot be negative")
        return v

    @field_validator("journey_date")
    @classmethod
    def validate_journey_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Journey date must be formatted YYYY-MM-DD")
        return v

    @model_validator(mode="after")
    def validate_source_consistency(self):
        if self.fare is not None and not self.currency:
            self.currency = "INR"

        if self.fare is None and self.fare_type == "actual":
            self.fare_type = None

        if self.verification_status == VerificationStatus.PROVIDER_VERIFIED:
            if not self.source or self.source.lower() in ["unknown", "simulated", "generated"]:
                raise ValueError("Provider-verified record must have an authoritative genuine source")

        return self

class TransportSearchResponse(BaseModel):
    origin: str
    destination: str
    journey_date: str
    trains: List[TransportOption] = Field(default_factory=list)
    flights: List[TransportOption] = Field(default_factory=list)
    buses: List[TransportOption] = Field(default_factory=list)
    provider_status: Dict[str, str] = Field(default_factory=dict)
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    date_notice: Optional[str] = None
