from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, text

from app.database.database import Base


class UserRole(Base):
    __tablename__ = "TBL_TRENING_USER_ROLE"

    n_user_role_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_user_id = Column(
        Integer,
        nullable=False
    )

    n_role_id = Column(
        Integer,
        nullable=False
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