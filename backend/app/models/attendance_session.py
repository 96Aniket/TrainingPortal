from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    text
)

from app.database.database import Base


class AttendanceSession(Base):
    __tablename__ = "TBL_TRENING_ATTENDANCE_SESSION"

    n_attendance_session_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_attendance_id = Column(
        Integer,
        nullable=False
    )

    dt_join_time = Column(
        DateTime,
        nullable=False
    )

    dt_leave_time = Column(
        DateTime,
        nullable=True
    )

    n_duration_minutes = Column(
        Integer,
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