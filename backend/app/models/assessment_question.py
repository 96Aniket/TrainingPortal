from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    DateTime
)

from app.database.database import Base


class AssessmentQuestion(Base):
    __tablename__ = "TBL_TRENING_ASSESSMENT_QUESTION"

    n_question_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_assessment_id = Column(
        Integer,
        nullable=False
    )

    n_question_number = Column(
        Integer,
        nullable=False
    )

    s_question_text = Column(
        Text,
        nullable=False
    )

    n_marks = Column(
        Numeric(10, 2),
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