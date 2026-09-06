from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    text
)

from app.database.database import Base


class TrainingParticipant(Base):
    __tablename__ = "TBL_TRENING_TRAINING_PARTICIPANT"

    n_participant_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_training_id = Column(
        Integer,
        nullable=False
    )

    n_user_id = Column(
        Integer,
        nullable=False
    )

    s_registration_status = Column(
        String(30),
        nullable=False,
        default="AVAILABLE"
    )

    s_registration_token = Column(
        String(100),
        nullable=True,
        unique=True
    )

    dt_registered_at = Column(
        DateTime,
        nullable=True
    )

    s_registration_email_status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    dt_registration_email_sent_at = Column(
        DateTime,
        nullable=True
    )

    s_confirmation_email_status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    dt_confirmation_email_sent_at = Column(
        DateTime,
        nullable=True
    )

    s_attendance_status = Column(
        String(30),
        nullable=False,
        default="NOT_PROCESSED"
    )

    n_attendance_minutes = Column(
        Integer,
        nullable=True
    )

    dt_attendance_processed_at = Column(
        DateTime,
        nullable=True
    )

    n_assessment_eligible = Column(
        Integer,
        nullable=False,
        default=0
    )

    s_assessment_email_status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    dt_assessment_email_sent_at = Column(
        DateTime,
        nullable=True
    )

    n_attempt_count = Column(
        Integer,
        nullable=False,
        default=0
    )

    n_reattempt_count = Column(
        Integer,
        nullable=False,
        default=0
    )

    n_final_score = Column(
        Numeric(5, 2),
        nullable=True
    )

    s_final_result = Column(
        String(30),
        nullable=True
    )

    n_flag = Column(
        Integer,
        nullable=False,
        default=1
    )

    delete_flag = Column(
        Integer,
        nullable=False,
        default=0
    )

    dt_created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        server_default=text("GETDATE()")
    )

    s_created_by = Column(
        String(100),
        nullable=True
    )

    dt_updated_at = Column(
        DateTime,
        nullable=True
    )

    s_updated_by = Column(
        String(100),
        nullable=True
    )