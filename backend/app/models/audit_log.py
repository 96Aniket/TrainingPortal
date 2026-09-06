from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, BigInteger, Text, text

from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "TBL_TRENING_AUDIT_LOG"

    n_audit_log_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    n_user_id = Column(
        Integer,
        nullable=True
    )

    s_action = Column(
        String(100),
        nullable=False
    )

    s_module = Column(
        String(100),
        nullable=False
    )

    s_entity_type = Column(
        String(100),
        nullable=True
    )

    s_entity_id = Column(
        String(100),
        nullable=True
    )

    s_description = Column(
        Text,
        nullable=True
    )

    s_old_value = Column(
        Text,
        nullable=True
    )

    s_new_value = Column(
        Text,
        nullable=True
    )

    s_ip_address = Column(
        String(100),
        nullable=True
    )

    dt_created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        server_default=text("GETDATE()")
    )