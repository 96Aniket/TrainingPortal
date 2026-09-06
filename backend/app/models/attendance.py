from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    text
)

from app.database.database import Base


class Attendance(Base):
    __tablename__ = "TBL_TRENING_ATTENDANCE"

    n_attendance_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_participant_id = Column(
        Integer,
        nullable=False
    )

    s_attendance_status = Column(
        String(30),
        nullable=False
    )

    n_total_attendance_minutes = Column(
        Integer,
        nullable=False
    )

    n_assessment_eligible = Column(
        Integer,
        nullable=False
    )

    s_report_file_name = Column(
        String(500),
        nullable=True
    )

    n_uploaded_by = Column(
        Integer,
        nullable=True
    )

    dt_uploaded_at = Column(
        DateTime,
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