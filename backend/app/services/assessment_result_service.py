from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.email_log import EmailLog
from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.user import User


def get_assessment_results(
    db: Session,
    assessment_id: int
):

    # ============================================================
    # VERIFY ASSESSMENT
    # ============================================================

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


    # ============================================================
    # VERIFY TRAINING
    # ============================================================

    training = (
        db.query(Training)
        .filter(
            Training.n_training_id
            == assessment.n_training_id,

            Training.n_flag == 1,

            Training.delete_flag == 0
        )
        .first()
    )

    if not training:

        raise ValueError(
            "Training not found"
        )


    # ============================================================
    # PARTICIPANTS
    # ============================================================

    participant_rows = (
        db.query(
            TrainingParticipant,
            User
        )
        .join(
            User,
            TrainingParticipant.n_user_id
            == User.n_user_id
        )
        .filter(
            TrainingParticipant.n_training_id
            == assessment.n_training_id,

            TrainingParticipant.n_flag == 1,

            TrainingParticipant.delete_flag == 0,

            User.n_flag == 1,

            User.delete_flag == 0
        )
        .order_by(
            TrainingParticipant
            .n_participant_id
        )
        .all()
    )


    # ============================================================
    # BUILD RESULTS
    # ============================================================

    results = []


    for participant, user in participant_rows:

        # --------------------------------------------------------
        # ATTEMPTS
        # --------------------------------------------------------

        attempts = (
            db.query(
                AssessmentAttempt
            )
            .filter(
                AssessmentAttempt
                .n_assessment_id
                == assessment_id,

                AssessmentAttempt
                .n_participant_id
                == participant.n_participant_id,

                AssessmentAttempt.n_flag == 1,

                AssessmentAttempt.delete_flag == 0
            )
            .order_by(
                AssessmentAttempt
                .n_attempt_number
            )
            .all()
        )


        attempt_data = []


        for attempt in attempts:

            attempt_data.append({

                "n_attempt_id":
                    attempt.n_attempt_id,

                "n_attempt_number":
                    attempt.n_attempt_number,

                "dt_started_at":
                    attempt.dt_started_at,

                "dt_submitted_at":
                    attempt.dt_submitted_at,

                "n_score":
                    (
                        float(attempt.n_score)
                        if attempt.n_score is not None
                        else None
                    ),

                "n_percentage":
                    (
                        float(
                            attempt.n_percentage
                        )
                        if attempt.n_percentage is not None
                        else None
                    ),

                "s_result":
                    attempt.s_result

            })


        # --------------------------------------------------------
        # LATEST ASSESSMENT EMAIL
        # --------------------------------------------------------

        latest_email = (
            db.query(
                EmailLog
            )
            .filter(
                EmailLog.n_training_id
                == assessment.n_training_id,

                EmailLog.n_user_id
                == participant.n_user_id,

                EmailLog.s_email_type.in_([
                    "ASSESSMENT_INVITATION",
                    "ASSESSMENT_RESULT",
                    "ASSESSMENT_REATTEMPT"
                ]),

                EmailLog.n_flag == 1,

                EmailLog.delete_flag == 0
            )
            .order_by(
                EmailLog.n_email_log_id.desc()
            )
            .first()
        )


        email_data = None


        if latest_email:

            email_data = {

                "n_email_log_id":
                    latest_email.n_email_log_id,

                "s_email_type":
                    latest_email.s_email_type,

                "s_to_email":
                    latest_email.s_to_email,

                "s_status":
                    latest_email.s_status,

                "dt_sent_at":
                    latest_email.dt_sent_at,

                "s_failure_reason":
                    latest_email.s_failure_reason

            }


        # --------------------------------------------------------
        # RESULT
        # --------------------------------------------------------

        results.append({

            "n_participant_id":
                participant.n_participant_id,

            "n_user_id":
                user.n_user_id,

            "s_employee_id":
                user.s_employee_id,

            "s_user_name":
                user.s_user_name,

            "s_email":
                user.s_email,

            "s_registration_status":
                participant.s_registration_status,

            "n_attendance_minutes":
                participant.n_attendance_minutes,

            "s_attendance_status":
                participant.s_attendance_status,

            "n_assessment_eligible":
                participant.n_assessment_eligible,

            "n_attempt_count":
                participant.n_attempt_count,

            "n_reattempt_count":
                participant.n_reattempt_count,

            "n_final_score":
                (
                    float(
                        participant.n_final_score
                    )
                    if participant.n_final_score is not None
                    else None
                ),

            "s_final_result":
                participant.s_final_result,

            "attempts":
                attempt_data,

            "email":
                email_data

        })


    # ============================================================
    # RESPONSE
    # ============================================================

    return {

        "status": "success",

        "assessment": {

            "n_assessment_id":
                assessment.n_assessment_id,

            "n_training_id":
                assessment.n_training_id,

            "s_training_name":
                training.s_training_name,

            "s_assessment_name":
                assessment.s_assessment_name,

            "n_total_marks":
                float(
                    assessment.n_total_marks
                ),

            "n_passing_score":
                float(
                    assessment.n_passing_score
                ),

            "n_duration_minutes":
                assessment.n_duration_minutes,

            "n_maximum_attempts":
                assessment.n_maximum_attempts,

            "s_status":
                assessment.s_status

        },

        "count":
            len(results),

        "results":
            results
    }