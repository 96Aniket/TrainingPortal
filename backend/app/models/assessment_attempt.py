from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    String,
    DateTime
)

from app.database.database import Base


class AssessmentAttempt(Base):
    __tablename__ = "TBL_TRENING_ASSESSMENT_ATTEMPT"

    n_attempt_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_assessment_id = Column(
        Integer,
        nullable=False
    )

    n_participant_id = Column(
        Integer,
        nullable=False
    )

    n_attempt_number = Column(
        Integer,
        nullable=False
    )

    dt_started_at = Column(
        DateTime,
        nullable=True
    )

    dt_submitted_at = Column(
        DateTime,
        nullable=True
    )

    n_score = Column(
        Numeric(10, 2),
        nullable=True
    )

    n_percentage = Column(
        Numeric(10, 2),
        nullable=True
    )

    s_result = Column(
        String(30),
        nullable=True
    )

    n_flag = Column(
        Integer,
        nullable=False
    )

    delete_flag = Column(
        Integer,
        nullable=False
    )

    dt_created_at = Column(
        DateTime,
        nullable=False
    )

    s_created_by = Column(
        String(100),
        nullable=True
    )