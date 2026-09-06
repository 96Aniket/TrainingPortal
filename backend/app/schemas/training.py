from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, Field

from typing import List


class TrainingCreate(BaseModel):

    s_training_code: str = Field(
        min_length=1,
        max_length=50
    )

    s_training_name: str = Field(
        min_length=1,
        max_length=200
    )

    s_description: Optional[str] = None

    n_training_month: int = Field(
        ge=1,
        le=12
    )

    n_training_year: int = Field(
        ge=2020,
        le=2100
    )

    d_training_date: date

    t_start_time: time

    t_end_time: time

    dt_registration_start: datetime

    dt_registration_end: datetime

    s_teams_meeting_link: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    n_passing_score: float = Field(
        default=80,
        ge=0,
        le=100
    )

    n_minimum_attendance_minutes: int = Field(
        default=30,
        ge=0
    )

    n_assessment_required: int = Field(
        default=1,
        ge=0,
        le=1
    )


class TrainingUpdate(BaseModel):

    s_training_name: Optional[str] = Field(
        default=None,
        max_length=200
    )

    s_description: Optional[str] = None

    n_training_month: Optional[int] = Field(
        default=None,
        ge=1,
        le=12
    )

    n_training_year: Optional[int] = Field(
        default=None,
        ge=2020,
        le=2100
    )

    d_training_date: Optional[date] = None

    t_start_time: Optional[time] = None

    t_end_time: Optional[time] = None

    dt_registration_start: Optional[datetime] = None

    dt_registration_end: Optional[datetime] = None

    s_teams_meeting_link: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    n_passing_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=100
    )

    n_minimum_attendance_minutes: Optional[int] = Field(
        default=None,
        ge=0
    )

    n_assessment_required: Optional[int] = Field(
        default=None,
        ge=0,
        le=1
    )

class TrainingBulkPublishRequest(BaseModel):
    training_ids: List[int] = Field(
        min_length=1
    )
