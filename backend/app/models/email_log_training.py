from datetime import datetime

from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    DateTime,
    String,
    ForeignKey
)

from app.database.database import Base


class EmailLogTraining(Base):

    __tablename__ = "TBL_TRENING_EMAIL_LOG_TRAINING"

    n_email_log_training_id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    n_email_log_id = Column(
        BigInteger,
        ForeignKey(
            "TBL_TRENING_EMAIL_LOG.n_email_log_id"
        ),
        nullable=False
    )

    n_training_id = Column(
        Integer,
        ForeignKey(
            "TBL_TRENING_TRAINING_MASTER.n_training_id"
        ),
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
        default=datetime.now
    )

    s_created_by = Column(
        String(100),
        nullable=True
    )