from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Time,
    DateTime,
    Numeric,
    text
)

from app.database.database import Base


class Training(Base):
    __tablename__ = "TBL_TRENING_TRAINING_MASTER"

    n_training_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    s_training_code = Column(
        String(50),
        nullable=False
    )

    s_training_name = Column(
        String(200),
        nullable=False
    )

    s_description = Column(
        Text,
        nullable=True
    )

    n_training_month = Column(
        Integer,
        nullable=False
    )

    n_training_year = Column(
        Integer,
        nullable=False
    )

    d_training_date = Column(
        Date,
        nullable=False
    )

    t_start_time = Column(
        Time,
        nullable=False
    )

    t_end_time = Column(
        Time,
        nullable=False
    )

    dt_registration_start = Column(
        DateTime,
        nullable=False
    )

    dt_registration_end = Column(
        DateTime,
        nullable=False
    )

    s_teams_meeting_link = Column(
        String(1000),
        nullable=True
    )

    n_passing_score = Column(
        Numeric(5, 2),
        nullable=False
    )

    n_minimum_attendance_minutes = Column(
        Integer,
        nullable=False
    )

    n_assessment_required = Column(
        Integer,
        nullable=False
    )

    s_status = Column(
        String(30),
        nullable=False
    )

    n_created_by = Column(
        Integer,
        nullable=False
    )

    dt_created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("GETDATE()")
    )

    n_updated_by = Column(
        Integer,
        nullable=True
    )

    dt_updated_at = Column(
        DateTime,
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