from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    DateTime,
    text
)

from app.database.database import Base


class EmailLog(Base):

    __tablename__ = "TBL_TRENING_EMAIL_LOG"

    n_email_log_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    n_email_template_id = Column(
        Integer,
        nullable=True
    )

    n_training_id = Column(
        Integer,
        nullable=True
    )

    n_user_id = Column(
        Integer,
        nullable=True
    )

    s_email_type = Column(
        String(100),
        nullable=False
    )

    s_from_email = Column(
        String(255),
        nullable=True
    )

    s_to_email = Column(
        String,
        nullable=False
    )

    s_cc_email = Column(
        String,
        nullable=True
    )

    s_bcc_email = Column(
        String,
        nullable=True
    )

    s_subject = Column(
        String(500),
        nullable=False
    )

    s_status = Column(
        String(20),
        nullable=False
    )

    s_message_id = Column(
        String(500),
        nullable=True
    )

    dt_queued_at = Column(
        DateTime,
        nullable=False,
        server_default=text("GETDATE()")
    )

    dt_sent_at = Column(
        DateTime,
        nullable=True
    )

    dt_failed_at = Column(
        DateTime,
        nullable=True
    )

    s_failure_reason = Column(
        String,
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