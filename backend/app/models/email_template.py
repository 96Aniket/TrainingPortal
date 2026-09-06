from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    text
)

from app.database.database import Base


class EmailTemplate(Base):

    __tablename__ = "TBL_TRENING_EMAIL_TEMPLATE"

    n_email_template_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    s_template_code = Column(
        String(100),
        nullable=False
    )

    s_template_name = Column(
        String(200),
        nullable=False
    )

    s_subject_template = Column(
        String(500),
        nullable=False
    )

    s_body_template = Column(
        String,
        nullable=False
    )

    n_cc_coordinator = Column(
        Integer,
        nullable=False
    )

    n_flag = Column(
        Integer,
        nullable=False
    )

    delete_flag = Column(
        Integer,
        nullable=False
    )

    n_created_by = Column(
        Integer,
        nullable=True
    )

    dt_created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("GETDATE()")
    )

    n_updated_by = Column(
        Integer,
        nullable=True
    )

    dt_updated_at = Column(
        DateTime,
        nullable=True
    )