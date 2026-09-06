from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, text

from app.database.database import Base


class CoordinatorUser(Base):
    __tablename__ = "TBL_TRENING_COORDINATOR_USER"

    n_coordinator_user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_coordinator_id = Column(
        Integer,
        ForeignKey(
            "TBL_TRENING_USER_MASTER.n_user_id"
        ),
        nullable=False,
        index=True
    )

    n_user_id = Column(
        Integer,
        ForeignKey(
            "TBL_TRENING_USER_MASTER.n_user_id"
        ),
        nullable=False,
        index=True
    )

    n_flag = Column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1")
    )

    delete_flag = Column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0")
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