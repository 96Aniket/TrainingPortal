from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ============================================================
# ASSESSMENT CREATE
# ============================================================

class AssessmentCreate(BaseModel):

    n_training_id: int

    s_assessment_name: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    s_description: Optional[str] = None

    n_total_marks: Decimal = Field(
        gt=0
    )

    n_passing_score: Decimal = Field(
        ge=0,
        le=100
    )

    n_duration_minutes: Optional[int] = Field(
        default=None,
        gt=0
    )

    n_maximum_attempts: Optional[int] = Field(
        default=1,
        gt=0
    )


# ============================================================
# QUESTION CREATE
# ============================================================

class AssessmentQuestionCreate(BaseModel):

    n_question_number: int = Field(
        gt=0
    )

    s_question_text: str = Field(
        min_length=1
    )

    n_marks: Decimal = Field(
        gt=0
    )


# ============================================================
# OPTION CREATE
# ============================================================

class AssessmentOptionCreate(BaseModel):

    s_option_label: str = Field(
        min_length=1,
        max_length=50
    )

    s_option_text: str = Field(
        min_length=1
    )

    n_is_correct: int = Field(
        ge=0,
        le=1
    )