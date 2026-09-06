from datetime import datetime

from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.assessment_option import AssessmentOption
from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.user import User
from app.models.email_log import EmailLog

from app.services.training_email_service import (
    send_assessment_invitation_email
)


def create_assessment(
    db: Session,
    data,
    created_by: int
):
    # ---------------------------------------------------------
    # Validate Training
    # ---------------------------------------------------------

    training = (
        db.query(Training)
        .filter(
            Training.n_training_id
            == data.n_training_id,

            Training.n_flag == 1,

            Training.delete_flag == 0
        )
        .first()
    )

    if not training:
        raise ValueError(
            "Training not found"
        )

    # ---------------------------------------------------------
    # Create Assessment
    # ---------------------------------------------------------

    assessment = Assessment(

        n_training_id=data.n_training_id,

        s_assessment_name=(
            data.s_assessment_name
        ),

        s_description=data.s_description,

        n_total_marks=data.n_total_marks,

        n_passing_score=data.n_passing_score,

        n_duration_minutes=(
            data.n_duration_minutes
        ),

        n_maximum_attempts=(
            data.n_maximum_attempts
        ),

        s_status="DRAFT",

        n_created_by=created_by,

        dt_created_at=datetime.now(),

        n_flag=1,

        delete_flag=0
    )

    db.add(assessment)

    db.commit()

    db.refresh(assessment)

    return assessment


def get_assessment(
    db: Session,
    assessment_id: int
):

    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.n_assessment_id
            == assessment_id,

            Assessment.n_flag == 1,

            Assessment.delete_flag == 0
        )
        .first()
    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    return assessment


def create_question(
    db: Session,
    assessment_id: int,
    data,
    created_by: int
):

    assessment = get_assessment(
        db,
        assessment_id
    )

    if assessment.s_status != "DRAFT":

        raise ValueError(
            "Questions can only be added to a draft assessment"
        )

    # ---------------------------------------------------------
    # Prevent duplicate question number
    # ---------------------------------------------------------

    existing = (
        db.query(AssessmentQuestion)
        .filter(
            AssessmentQuestion.n_assessment_id
            == assessment_id,

            AssessmentQuestion.n_question_number
            == data.n_question_number,

            AssessmentQuestion.n_flag == 1,

            AssessmentQuestion.delete_flag == 0
        )
        .first()
    )

    if existing:

        raise ValueError(
            "Question number already exists"
        )

    question = AssessmentQuestion(

        n_assessment_id=assessment_id,

        n_question_number=(
            data.n_question_number
        ),

        s_question_text=(
            data.s_question_text
        ),

        n_marks=data.n_marks,

        n_flag=1,

        delete_flag=0,

        dt_created_at=datetime.now(),

        s_created_by=str(created_by)
    )

    db.add(question)

    db.commit()

    db.refresh(question)

    return question


def create_option(
    db: Session,
    question_id: int,
    data,
    created_by: int
):

    question = (
        db.query(AssessmentQuestion)
        .filter(
            AssessmentQuestion.n_question_id
            == question_id,

            AssessmentQuestion.n_flag == 1,

            AssessmentQuestion.delete_flag == 0
        )
        .first()
    )

    if not question:

        raise ValueError(
            "Question not found"
        )

    assessment = get_assessment(
        db,
        question.n_assessment_id
    )

    if assessment.s_status != "DRAFT":

        raise ValueError(
            "Options can only be added to a draft assessment"
        )

    # ---------------------------------------------------------
    # Validate correct flag
    # ---------------------------------------------------------

    if data.n_is_correct not in (0, 1):

        raise ValueError(
            "n_is_correct must be 0 or 1"
        )

    # ---------------------------------------------------------
    # Prevent duplicate option label
    # ---------------------------------------------------------

    existing = (
        db.query(AssessmentOption)
        .filter(
            AssessmentOption.n_question_id
            == question_id,

            AssessmentOption.s_option_label
            == data.s_option_label,

            AssessmentOption.n_flag == 1,

            AssessmentOption.delete_flag == 0
        )
        .first()
    )

    if existing:

        raise ValueError(
            "Option label already exists"
        )

    # ---------------------------------------------------------
    # Only one correct answer
    # ---------------------------------------------------------

    if data.n_is_correct == 1:

        correct_option = (
            db.query(AssessmentOption)
            .filter(
                AssessmentOption.n_question_id
                == question_id,

                AssessmentOption.n_is_correct
                == 1,

                AssessmentOption.n_flag == 1,

                AssessmentOption.delete_flag == 0
            )
            .first()
        )

        if correct_option:

            raise ValueError(
                "Question already has a correct option"
            )

    option = AssessmentOption(

        n_question_id=question_id,

        s_option_label=(
            data.s_option_label
        ),

        s_option_text=(
            data.s_option_text
        ),

        n_is_correct=(
            data.n_is_correct
        ),

        n_flag=1,

        delete_flag=0,

        dt_created_at=datetime.now(),

        s_created_by=str(created_by)
    )

    db.add(option)

    db.commit()

    db.refresh(option)

    return option


def get_assessment_details(
    db: Session,
    assessment_id: int
):

    assessment = get_assessment(
        db,
        assessment_id
    )

    questions = (
        db.query(AssessmentQuestion)
        .filter(
            AssessmentQuestion.n_assessment_id
            == assessment_id,

            AssessmentQuestion.n_flag == 1,

            AssessmentQuestion.delete_flag == 0
        )
        .order_by(
            AssessmentQuestion.n_question_number
        )
        .all()
    )

    result_questions = []

    for question in questions:

        options = (
            db.query(AssessmentOption)
            .filter(
                AssessmentOption.n_question_id
                == question.n_question_id,

                AssessmentOption.n_flag == 1,

                AssessmentOption.delete_flag == 0
            )
            .order_by(
                AssessmentOption.n_option_id
            )
            .all()
        )

        result_questions.append(
            {
                "n_question_id":
                    question.n_question_id,

                "n_question_number":
                    question.n_question_number,

                "s_question_text":
                    question.s_question_text,

                "n_marks":
                    question.n_marks,

                "options": [
                    {
                        "n_option_id":
                            option.n_option_id,

                        "s_option_label":
                            option.s_option_label,

                        "s_option_text":
                            option.s_option_text,

                        "n_is_correct":
                            option.n_is_correct
                    }
                    for option in options
                ]
            }
        )

    return {
        "n_assessment_id":
            assessment.n_assessment_id,

        "n_training_id":
            assessment.n_training_id,

        "s_assessment_name":
            assessment.s_assessment_name,

        "s_description":
            assessment.s_description,

        "n_total_marks":
            assessment.n_total_marks,

        "n_passing_score":
            assessment.n_passing_score,

        "n_duration_minutes":
            assessment.n_duration_minutes,

        "n_maximum_attempts":
            assessment.n_maximum_attempts,

        "s_status":
            assessment.s_status,

        "questions":
            result_questions
    }

def publish_assessment(
    db: Session,
    assessment_id: int,
    published_by: int
):

    # ==========================================================
    # 1. Get Assessment
    # ==========================================================

    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.n_assessment_id
            == assessment_id,

            Assessment.n_flag == 1,

            Assessment.delete_flag == 0
        )
        .first()
    )

    if not assessment:

        raise ValueError(
            "Assessment not found"
        )

    # ==========================================================
    # 2. Must be DRAFT
    # ==========================================================

    if assessment.s_status != "DRAFT":

        raise ValueError(
            "Only draft assessment can be published"
        )

    # ==========================================================
    # 3. Get Questions
    # ==========================================================

    questions = (
        db.query(AssessmentQuestion)
        .filter(
            AssessmentQuestion.n_assessment_id
            == assessment_id,

            AssessmentQuestion.n_flag == 1,

            AssessmentQuestion.delete_flag == 0
        )
        .all()
    )

    if not questions:

        raise ValueError(
            "Assessment must contain at least one question"
        )

    # ==========================================================
    # 4. Validate Questions / Options
    # ==========================================================

    calculated_total_marks = 0

    for question in questions:

        calculated_total_marks += (
            question.n_marks
        )

        options = (
            db.query(AssessmentOption)
            .filter(
                AssessmentOption.n_question_id
                == question.n_question_id,

                AssessmentOption.n_flag == 1,

                AssessmentOption.delete_flag == 0
            )
            .all()
        )

        if len(options) < 2:

            raise ValueError(
                f"Question "
                f"{question.n_question_number} "
                f"must have at least 2 options"
            )

        correct_options = [
            option
            for option in options
            if option.n_is_correct == 1
        ]

        if len(correct_options) != 1:

            raise ValueError(
                f"Question "
                f"{question.n_question_number} "
                f"must have exactly one correct option"
            )

    # ==========================================================
    # 5. Validate Total Marks
    # ==========================================================

    if float(calculated_total_marks) != float(
        assessment.n_total_marks
    ):

        raise ValueError(
            "Question marks total does not match "
            "assessment total marks"
        )

    # ==========================================================
    # 6. Find Eligible Participants
    # ==========================================================

    eligible_participants = (
        db.query(
            TrainingParticipant,
            User
        )
        .join(
            User,
            User.n_user_id
            == TrainingParticipant.n_user_id
        )
        .filter(

            TrainingParticipant.n_training_id
            == assessment.n_training_id,

            TrainingParticipant.s_registration_status
            == "REGISTERED",

            TrainingParticipant.n_assessment_eligible
            == 1,

            TrainingParticipant.n_flag == 1,

            TrainingParticipant.delete_flag == 0,

            User.n_flag == 1,

            User.delete_flag == 0
        )
        .all()
    )

    # ==========================================================
    # 7. Publish Assessment
    # ==========================================================

    assessment.s_status = "PUBLISHED"

    assessment.n_published_by = published_by

    assessment.dt_published_at = datetime.now()

    assessment.n_updated_by = published_by

    assessment.dt_updated_at = datetime.now()

    # Commit publish status first.
    db.commit()

    # ==========================================================
    # 8. Send Emails ONLY to Eligible Users
    # ==========================================================

    emails_sent = 0
    emails_failed = 0

    for participant, user in eligible_participants:

        result = (
            send_assessment_invitation_email(
                db=db,

                assessment=assessment,

                participant=participant,

                user=user,

                coordinator_email=None,

                created_by=str(
                    published_by
                )
            )
        )

        if result["status"] == "success":

            emails_sent += 1

        else:

            emails_failed += 1

    # ==========================================================
    # 9. Final Commit
    # ==========================================================

    db.commit()

    return {

        "status": "success",

        "message":
            "Assessment published successfully",

        "n_assessment_id":
            assessment_id,

        "eligible_users":
            len(eligible_participants),

        "emails_sent":
            emails_sent,

        "emails_failed":
            emails_failed
    }

