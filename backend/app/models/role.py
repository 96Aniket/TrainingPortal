from sqlalchemy import Column, Integer, String, DateTime, text

from app.database.database import Base


class Role(Base):
    __tablename__ = "TBL_TRENING_ROLE_MASTER"

    n_role_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    s_role_name = Column(
        String(50),
        nullable=False
    )

    s_description = Column(
        String(500),
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