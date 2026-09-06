from datetime import datetime

from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.assessment_option import AssessmentOption
from app.models.assessment_attempt import AssessmentAttempt
from app.models.training_participant import TrainingParticipant
from app.models.user import User
from app.models.assessment_answer import AssessmentAnswer

from app.schemas.assessment_attempt import (
    AssessmentSubmitRequest
)

from app.services.training_email_service import (
    send_assessment_result_email,
    send_assessment_reattempt_email
)


# ============================================================
# START ASSESSMENT
# ============================================================

def start_assessment(
    db: Session,
    assessment_id: int,
    registration_token: str
):

    # ========================================================
    # 1. Validate Assessment
    # ========================================================

    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.n_assessment_id == assessment_id,
            Assessment.n_flag == 1,
            Assessment.delete_flag == 0
        )
        .first()
    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    # ========================================================
    # 2. Assessment must be PUBLISHED
    # ========================================================

    if assessment.s_status != "PUBLISHED":
        raise ValueError(
            "Assessment is not published"
        )

    # ========================================================
    # 3. Validate Registration Token
    # ========================================================

    token = registration_token.strip()

    if not token:
        raise ValueError(
            "Registration token is required"
        )

    # ========================================================
    # 4. Find Registered Eligible Participant
    # ========================================================

    participant = (
        db.query(TrainingParticipant)
        .filter(
            TrainingParticipant.n_training_id
            == assessment.n_training_id,

            TrainingParticipant.s_registration_token
            == token,

            TrainingParticipant.s_registration_status
            == "REGISTERED",

            TrainingParticipant.n_assessment_eligible
            == 1,

            TrainingParticipant.n_flag == 1,

            TrainingParticipant.delete_flag == 0
        )
        .first()
    )

    if not participant:
        raise ValueError(
            "Valid registered assessment participant not found"
        )

    # ========================================================
    # 5. Get Actual User From Participant
    # ========================================================

    user = (
        db.query(User)
        .filter(
            User.n_user_id
            == participant.n_user_id,

            User.n_flag == 1,

            User.delete_flag == 0
        )
        .first()
    )

    if not user:
        raise ValueError(
            "User not found or inactive"
        )

    # ========================================================
    # 6. Get Existing Attempts
    # ========================================================

    attempts = (
        db.query(AssessmentAttempt)
        .filter(
            AssessmentAttempt.n_assessment_id
            == assessment_id,

            AssessmentAttempt.n_participant_id
            == participant.n_participant_id,

            AssessmentAttempt.n_flag == 1,

            AssessmentAttempt.delete_flag == 0
        )
        .order_by(
            AssessmentAttempt.n_attempt_number.desc()
        )
        .all()
    )

    # ========================================================
    # 7. Check Previous PASS
    # ========================================================

    previous_pass = next(
        (
            attempt
            for attempt in attempts
            if attempt.s_result == "PASS"
        ),
        None
    )

    if previous_pass:
        raise ValueError(
            "Assessment already passed"
        )

    completed_attempt_count = len(
        [
            attempt
            for attempt in attempts
            if attempt.dt_submitted_at is not None
        ]
    )

    # ========================================================
    # 8. Check Maximum Attempts
    # ========================================================

    if (
        assessment.n_maximum_attempts is not None
        and completed_attempt_count
        >= assessment.n_maximum_attempts
    ):
        raise ValueError(
            "Maximum assessment attempts reached"
        )

    # ========================================================
    # 9. Prevent Multiple Active Attempts
    # ========================================================

    active_attempt = next(
        (
            attempt
            for attempt in attempts
            if attempt.dt_started_at is not None
            and attempt.dt_submitted_at is None
        ),
        None
    )

    if active_attempt:

        attempt = active_attempt

    else:

        # ----------------------------------------------------
        # New attempt number
        # ----------------------------------------------------

        attempt_number = (
            max(
                [
                    attempt.n_attempt_number
                    for attempt in attempts
                ],
                default=0
            )
            + 1
        )

        attempt = AssessmentAttempt(
            n_assessment_id=assessment_id,

            n_participant_id=(
                participant.n_participant_id
            ),

            n_attempt_number=attempt_number,

            dt_started_at=datetime.now(),

            n_flag=1,

            delete_flag=0,

            dt_created_at=datetime.now(),

            s_created_by=str(
                user.n_user_id
            )
        )

        db.add(attempt)

        db.commit()

        db.refresh(attempt)

    # ========================================================
    # 10. Get Questions
    # ========================================================

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

    if not questions:
        raise ValueError(
            "Assessment has no questions"
        )

    # ========================================================
    # 11. Build Employee-Safe Questions
    # ========================================================

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
                    float(question.n_marks),

                "options": [
                    {
                        "n_option_id":
                            option.n_option_id,

                        "s_option_label":
                            option.s_option_label,

                        "s_option_text":
                            option.s_option_text
                    }
                    for option in options
                ]
            }
        )

    # ========================================================
    # 12. Return Assessment
    # ========================================================

    return {
        "status": "success",

        "message":
            "Assessment started successfully",

        "n_attempt_id":
            attempt.n_attempt_id,

        "n_attempt_number":
            attempt.n_attempt_number,

        "n_assessment_id":
            assessment.n_assessment_id,

        "s_assessment_name":
            assessment.s_assessment_name,

        "n_total_marks":
            float(assessment.n_total_marks),

        "n_passing_score":
            float(assessment.n_passing_score),

        "n_duration_minutes":
            assessment.n_duration_minutes,

        "n_maximum_attempts":
            assessment.n_maximum_attempts,

        "questions":
            result_questions
    }


# ============================================================
# SUBMIT ASSESSMENT
# ============================================================

def submit_assessment(
    db: Session,
    assessment_id: int,
    data: AssessmentSubmitRequest
):

    # ========================================================
    # 1. Get Assessment
    # ========================================================

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

    # ========================================================
    # 2. Validate Registration Token
    # ========================================================

    token = data.registration_token.strip()

    if not token:
        raise ValueError(
            "Registration token is required"
        )

    # ========================================================
    # 3. Get Attempt
    # ========================================================

    attempt = (
        db.query(AssessmentAttempt)
        .filter(
            AssessmentAttempt.n_attempt_id
            == data.n_attempt_id,

            AssessmentAttempt.n_assessment_id
            == assessment_id,

            AssessmentAttempt.n_flag == 1,

            AssessmentAttempt.delete_flag == 0
        )
        .first()
    )

    if not attempt:
        raise ValueError(
            "Assessment attempt not found"
        )

    # ========================================================
    # 4. Find Participant From Attempt + Token
    # ========================================================

    participant = (
        db.query(TrainingParticipant)
        .filter(
            TrainingParticipant.n_participant_id
            == attempt.n_participant_id,

            TrainingParticipant.s_registration_token
            == token,

            TrainingParticipant.n_training_id
            == assessment.n_training_id,

            TrainingParticipant.n_flag == 1,

            TrainingParticipant.delete_flag == 0
        )
        .first()
    )

    if not participant:
        raise ValueError(
            "Assessment attempt does not belong to "
            "this registration token"
        )

    # ========================================================
    # 5. Get Actual User
    # ========================================================

    user = (
        db.query(User)
        .filter(
            User.n_user_id
            == participant.n_user_id,

            User.n_flag == 1,

            User.delete_flag == 0
        )
        .first()
    )

    if not user:
        raise ValueError(
            "User not found or inactive"
        )

    # ========================================================
    # 6. Verify Registration / Eligibility
    # ========================================================

    if participant.s_registration_status != "REGISTERED":
        raise ValueError(
            "User is not registered for this training"
        )

    if participant.n_assessment_eligible != 1:
        raise ValueError(
            "User is not eligible for this assessment"
        )

    # ========================================================
    # 7. Verify Attempt Belongs To Participant
    # ========================================================

    if (
        attempt.n_participant_id
        != participant.n_participant_id
    ):
        raise ValueError(
            "Assessment attempt ownership validation failed"
        )

    # ========================================================
    # 8. Prevent Duplicate Submission
    # ========================================================

    if attempt.dt_submitted_at is not None:
        raise ValueError(
            "Assessment has already been submitted"
        )

    # ========================================================
    # 9. Get Questions
    # ========================================================

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
            "Assessment has no questions"
        )

    question_map = {
        question.n_question_id: question
        for question in questions
    }

    # ========================================================
    # 10. Validate Submitted Questions
    # ========================================================

    submitted_question_ids = set()

    for answer in data.answers:

        if answer.n_question_id in submitted_question_ids:

            raise ValueError(
                "Duplicate question submitted"
            )

        submitted_question_ids.add(
            answer.n_question_id
        )

        if answer.n_question_id not in question_map:

            raise ValueError(
                f"Invalid question ID: "
                f"{answer.n_question_id}"
            )

    # ========================================================
    # 11. Validate All Questions Answered
    # ========================================================

    if len(submitted_question_ids) != len(
        question_map
    ):
        raise ValueError(
            "Please answer all assessment questions"
        )

    # ========================================================
    # 12. Calculate Score
    # ========================================================

    total_score = 0

    answer_records = []

    for answer in data.answers:

        question = question_map[
            answer.n_question_id
        ]

        option = (
            db.query(AssessmentOption)
            .filter(
                AssessmentOption.n_option_id
                == answer.n_selected_option_id,

                AssessmentOption.n_question_id
                == answer.n_question_id,

                AssessmentOption.n_flag == 1,

                AssessmentOption.delete_flag == 0
            )
            .first()
        )

        if not option:

            raise ValueError(
                f"Invalid option ID: "
                f"{answer.n_selected_option_id}"
            )

        is_correct = (
            1
            if option.n_is_correct == 1
            else 0
        )

        marks_obtained = (
            question.n_marks
            if is_correct == 1
            else 0
        )

        total_score += float(
            marks_obtained
        )

        answer_record = AssessmentAnswer(

            n_attempt_id=
                attempt.n_attempt_id,

            n_question_id=
                question.n_question_id,

            n_selected_option_id=
                option.n_option_id,

            n_is_correct=
                is_correct,

            n_marks_obtained=
                marks_obtained,

            n_flag=1,

            delete_flag=0,

            dt_created_at=datetime.now(),

            s_created_by=
                str(user.n_user_id)
        )

        answer_records.append(
            answer_record
        )

    # ========================================================
    # 13. Calculate Percentage
    # ========================================================

    total_marks = float(
        assessment.n_total_marks
    )

    if total_marks <= 0:
        raise ValueError(
            "Assessment total marks must be greater than zero"
        )

    percentage = (
        total_score / total_marks
    ) * 100

    # ========================================================
    # 14. Determine Result
    # ========================================================

    if percentage >= float(
        assessment.n_passing_score
    ):

        result = "PASS"

    else:

        result = "FAIL"

    # ========================================================
    # 15. Save Answers
    # ========================================================

    for answer_record in answer_records:

        db.add(answer_record)

    # ========================================================
    # 16. Update Attempt
    # ========================================================

    attempt.dt_submitted_at = datetime.now()

    attempt.n_score = total_score

    attempt.n_percentage = percentage

    attempt.s_result = result

    # ========================================================
    # 17. Update Participant Summary
    # ========================================================

    completed_attempts = (
        db.query(AssessmentAttempt)
        .filter(
            AssessmentAttempt.n_assessment_id
            == assessment_id,

            AssessmentAttempt.n_participant_id
            == attempt.n_participant_id,

            AssessmentAttempt.n_flag == 1,

            AssessmentAttempt.delete_flag == 0,

            AssessmentAttempt.dt_submitted_at
            .isnot(None)
        )
        .count()
    )

    participant.n_attempt_count = (
        completed_attempts
    )

    participant.n_reattempt_count = max(
        completed_attempts - 1,
        0
    )

    participant.n_final_score = total_score

    participant.s_final_result = result

    participant.dt_updated_at = datetime.now()

    participant.s_updated_by = str(
        user.n_user_id
    )

    # ========================================================
    # 18. Commit Assessment Result
    # ========================================================

    db.commit()

    email_status = "NOT_SENT"
    email_message = None

    try:

        # ====================================================
        # PASS
        # ====================================================

        if result == "PASS":

            email_result = (
                send_assessment_result_email(

                    db=db,

                    assessment=assessment,

                    user=user,

                    result=result,

                    score=total_score,

                    percentage=percentage,

                    created_by=str(
                        user.n_user_id
                    )
                )
            )

            email_status = (
                email_result["status"]
            )

            email_message = (
                "Assessment result email sent"
            )

        # ====================================================
        # FAIL
        # ====================================================

        else:

            completed_attempts = (
                db.query(AssessmentAttempt)
                .filter(

                    AssessmentAttempt
                    .n_assessment_id
                    == assessment_id,

                    AssessmentAttempt
                    .n_participant_id
                    == attempt.n_participant_id,

                    AssessmentAttempt.n_flag == 1,

                    AssessmentAttempt.delete_flag == 0,

                    AssessmentAttempt
                    .dt_submitted_at
                    .isnot(None)
                )
                .count()
            )

            maximum_attempts = (
                assessment.n_maximum_attempts
            )

            # ------------------------------------------------
            # Reattempt available
            # ------------------------------------------------

            if (
                maximum_attempts is not None
                and completed_attempts
                < maximum_attempts
            ):

                email_result = (
                    send_assessment_reattempt_email(

                        db=db,

                        assessment=assessment,

                        participant=participant,

                        user=user,

                        attempt_number=(
                            completed_attempts + 1
                        ),

                        created_by=str(
                            user.n_user_id
                        )
                    )
                )

                email_status = (
                    email_result["status"]
                )

                email_message = (
                    "Assessment reattempt email sent"
                )

            # ------------------------------------------------
            # No attempts remaining
            # ------------------------------------------------

            else:

                email_result = (
                    send_assessment_result_email(

                        db=db,

                        assessment=assessment,

                        user=user,

                        result=result,

                        score=total_score,

                        percentage=percentage,

                        created_by=str(
                            user.n_user_id
                        )
                    )
                )

                email_status = (
                    email_result["status"]
                )

                email_message = (
                    "Final assessment result email sent"
                )

    except Exception as exc:

        email_status = "FAILED"

        email_message = str(exc)

    # ========================================================
    # 19. Return Result
    # ========================================================

    return {

        "status": "success",

        "message":
            "Assessment submitted successfully",

        "n_attempt_id":
            attempt.n_attempt_id,

        "n_attempt_number":
            attempt.n_attempt_number,

        "n_assessment_id":
            assessment_id,

        "n_user_id":
            user.n_user_id,

        "n_total_marks":
            total_marks,

        "n_score":
            total_score,

        "n_percentage":
            round(
                percentage,
                2
            ),

        "n_passing_score":
            float(
                assessment.n_passing_score
            ),

        "s_result":
            result,

        "email_status":
            email_status,

        "email_message":
            email_message
    }