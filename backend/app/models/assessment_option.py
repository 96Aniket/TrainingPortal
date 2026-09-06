from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime
)

from app.database.database import Base


class AssessmentOption(Base):
    __tablename__ = "TBL_TRENING_ASSESSMENT_OPTION"

    n_option_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_question_id = Column(
        Integer,
        nullable=False
    )

    s_option_label = Column(
        String(10),
        nullable=False
    )

    s_option_text = Column(
        Text,
        nullable=False
    )

    n_is_correct = Column(
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

    dt_created_at = Column(
        DateTime,
        nullable=False
    )

    s_created_by = Column(
        String(100),
        nullable=True
    )