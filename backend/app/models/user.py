from sqlalchemy import Column, Integer, String, DateTime, text

from app.database.database import Base


class User(Base):
    __tablename__ = "TBL_TRENING_USER_MASTER"

    n_user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    s_employee_id = Column(
        String(50),
        nullable=True
    )

    s_user_name = Column(
        String(150),
        nullable=True
    )

    s_email = Column(
        String(255),
        nullable=False
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