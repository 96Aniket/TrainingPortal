from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime
)

from app.database.database import Base


class AssessmentAnswer(Base):
    __tablename__ = "TBL_TRENING_ASSESSMENT_ANSWER"

    n_answer_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    n_attempt_id = Column(
        Integer,
        nullable=False
    )

    n_question_id = Column(
        Integer,
        nullable=False
    )

    n_selected_option_id = Column(
        Integer,
        nullable=True
    )

    n_is_correct = Column(
        Integer,
        nullable=True
    )

    n_marks_obtained = Column(
        Numeric(10, 2),
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
        nullable=False
    )

    s_created_by = Column(
        String(100),
        nullable=True
    )