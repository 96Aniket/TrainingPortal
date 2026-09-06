from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    DateTime,
    text
)

from app.database.database import Base


class Assessment(Base):
    __tablename__ = "TBL_TRENING_ASSESSMENT_MASTER"

    n_assessment_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_training_id = Column(
        Integer,
        nullable=False
    )

    s_assessment_name = Column(
        String(200),
        nullable=False
    )

    s_description = Column(
        Text,
        nullable=True
    )

    n_total_marks = Column(
        Numeric(10, 2),
        nullable=False
    )

    n_passing_score = Column(
        Numeric(10, 2),
        nullable=False
    )

    n_duration_minutes = Column(
        Integer,
        nullable=True
    )

    n_maximum_attempts = Column(
        Integer,
        nullable=True
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

    n_published_by = Column(
        Integer,
        nullable=True
    )

    dt_published_at = Column(
        DateTime,
        nullable=True
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