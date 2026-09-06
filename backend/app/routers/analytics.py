from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.permissions import require_roles
from app.auth.session import get_current_user_role
from app.database.dependencies import get_db

from app.models.user import User
from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


@router.get("")
def get_analytics(
    request: Request,
    training_id: int | None = Query(
        default=None
    ),
    date_from: date | None = Query(
        default=None
    ),
    date_to: date | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):
    # =========================================================
    # ROLE
    # =========================================================

    role_name = get_current_user_role(
        request=request,
        db=db
    )

    is_coordinator = (
        role_name
        and role_name.strip().upper() == "COORDINATOR"
    )

    # =========================================================
    # BASE TRAINING QUERY
    # =========================================================

    training_query = (
        db.query(Training)
        .filter(
            Training.n_flag == 1,
            Training.delete_flag == 0
        )
    )

    if is_coordinator:
        training_query = training_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    if training_id is not None:
        training_query = training_query.filter(
            Training.n_training_id == training_id
        )

    if date_from is not None:
        training_query = training_query.filter(
            Training.d_training_date >= date_from
        )

    if date_to is not None:
        training_query = training_query.filter(
            Training.d_training_date <= date_to
        )

    trainings = training_query.all()

    training_ids = [
        training.n_training_id
        for training in trainings
    ]

    # =========================================================
    # BASE PARTICIPANT QUERY
    # =========================================================

    participant_query = (
        db.query(TrainingParticipant)
        .join(
            Training,
            Training.n_training_id
            == TrainingParticipant.n_training_id
        )
        .filter(
            TrainingParticipant.n_flag == 1,
            TrainingParticipant.delete_flag == 0,
            Training.n_flag == 1,
            Training.delete_flag == 0,
            Training.n_training_id.in_(training_ids)
        )
    )

    if is_coordinator:
        participant_query = participant_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    participants = participant_query.all()

    # =========================================================
    # BASE ASSESSMENT QUERY
    # =========================================================

    assessment_query = (
        db.query(Assessment)
        .join(
            Training,
            Training.n_training_id
            == Assessment.n_training_id
        )
        .filter(
            Assessment.n_flag == 1,
            Assessment.delete_flag == 0,
            Training.n_flag == 1,
            Training.delete_flag == 0,
            Training.n_training_id.in_(training_ids)
        )
    )

    if is_coordinator:
        assessment_query = assessment_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    assessments = assessment_query.all()

    # =========================================================
    # OVERVIEW COUNTS
    # =========================================================

    total_trainings = len(trainings)
    total_participants = len(participants)
    total_assessments = len(assessments)

    registration_completed = sum(
        1
        for participant in participants
        if (
            participant.s_registration_status
            and participant.s_registration_status
            .strip()
            .upper()
            == "REGISTERED"
        )
    )

    attendance_completed = sum(
        1
        for participant in participants
        if (
            participant.s_attendance_status
            and participant.s_attendance_status
            .strip()
            .upper()
            == "COMPLETED"
        )
    )

    assessment_eligible = sum(
        1
        for participant in participants
        if participant.n_assessment_eligible == 1
    )

    # =========================================================
    # ASSESSMENT OVERVIEW
    # =========================================================

    overview_attempts = (
        db.query(AssessmentAttempt)
        .join(
            Assessment,
            Assessment.n_assessment_id
            == AssessmentAttempt.n_assessment_id
        )
        .filter(
            Assessment.n_training_id.in_(training_ids),

            AssessmentAttempt.n_flag == 1,
            AssessmentAttempt.delete_flag == 0,

            Assessment.n_flag == 1,
            Assessment.delete_flag == 0
        )
        .all()
    )

    # ---------------------------------------------------------
    # Participants who actually started an assessment
    # ---------------------------------------------------------

    assessment_attempted = len(
        {
            attempt.n_participant_id
            for attempt in overview_attempts
        }
    )

    # ---------------------------------------------------------
    # Keep only latest completed attempt for each
    # participant + assessment
    # ---------------------------------------------------------

    latest_completed_attempts = {}

    for attempt in overview_attempts:

        if attempt.dt_submitted_at is None:
            continue

        key = (
            attempt.n_participant_id,
            attempt.n_assessment_id
        )

        existing_attempt = (
            latest_completed_attempts.get(key)
        )

        if (
            existing_attempt is None
            or attempt.n_attempt_number
            > existing_attempt.n_attempt_number
        ):
            latest_completed_attempts[key] = attempt

    final_overview_attempts = list(
        latest_completed_attempts.values()
    )

    # ---------------------------------------------------------
    # Completed assessment count
    # ---------------------------------------------------------

    assessment_completed = len(
        final_overview_attempts
    )

    # ---------------------------------------------------------
    # Final PASS count
    # ---------------------------------------------------------

    passed_count = sum(
        1
        for attempt in final_overview_attempts
        if (
            attempt.s_result
            and attempt.s_result.strip().upper()
            == "PASS"
        )
    )

    # ---------------------------------------------------------
    # Final FAIL count
    # ---------------------------------------------------------

    failed_count = sum(
        1
        for attempt in final_overview_attempts
        if (
            attempt.s_result
            and attempt.s_result.strip().upper()
            == "FAIL"
        )
    )

    # ---------------------------------------------------------
    # Reattempted assessment count
    # ---------------------------------------------------------

    reattempted_keys = set()

    for attempt in overview_attempts:

        if attempt.n_attempt_number > 1:
            reattempted_keys.add(
                (
                    attempt.n_participant_id,
                    attempt.n_assessment_id
                )
            )

    reattempted = len(reattempted_keys)

    # =========================================================
    # RATE CALCULATIONS
    # =========================================================

    registration_rate = (
        round(
            (
                registration_completed
                / total_participants
            ) * 100,
            2
        )
        if total_participants > 0
        else 0
    )

    attendance_rate = (
        round(
            (
                attendance_completed
                / total_participants
            ) * 100,
            2
        )
        if total_participants > 0
        else 0
    )

    assessment_eligibility_rate = (
        round(
            (
                assessment_eligible
                / total_participants
            ) * 100,
            2
        )
        if total_participants > 0
        else 0
    )

    assessment_completion_rate = (
        round(
            (
                assessment_completed
                / assessment_eligible
            ) * 100,
            2
        )
        if assessment_eligible > 0
        else 0
    )

    total_results = (
        passed_count + failed_count
    )

    pass_rate = (
        round(
            (
                passed_count
                / total_results
            ) * 100,
            2
        )
        if total_results > 0
        else 0
    )

    # =========================================================
    # SCORE ANALYTICS
    # =========================================================

    completed_attempts = (
        db.query(AssessmentAttempt)
        .join(
            Assessment,
            Assessment.n_assessment_id
            == AssessmentAttempt.n_assessment_id
        )
        .filter(
            AssessmentAttempt.dt_submitted_at.isnot(None),
            AssessmentAttempt.n_flag == 1,
            AssessmentAttempt.delete_flag == 0,

            Assessment.n_flag == 1,
            Assessment.delete_flag == 0,

            Assessment.n_training_id.in_(training_ids)
        )
        .all()
    )

    # ---------------------------------------------------------
    # Score analytics from final/latest completed attempts
    # ---------------------------------------------------------

    scores = [
        float(attempt.n_percentage)
        for attempt in final_overview_attempts
        if attempt.n_percentage is not None
    ]

    average_score = (
        round(
            sum(scores) / len(scores),
            2
        )
        if scores
        else 0
    )

    highest_score = (
        round(
            max(scores),
            2
        )
        if scores
        else 0
    )

    lowest_score = (
        round(
            min(scores),
            2
        )
        if scores
        else 0
    )
    # =========================================================
    # ATTENDANCE ANALYTICS
    # =========================================================

    attendance_minutes = [
        participant.n_attendance_minutes
        for participant in participants
        if participant.n_attendance_minutes
        is not None
    ]

    average_attendance_minutes = (
        round(
            sum(attendance_minutes)
            / len(attendance_minutes),
            2
        )
        if attendance_minutes
        else 0
    )

    highest_attendance_minutes = (
        max(attendance_minutes)
        if attendance_minutes
        else 0
    )

    lowest_attendance_minutes = (
        min(attendance_minutes)
        if attendance_minutes
        else 0
    )

    # =========================================================
    # EMAIL ANALYTICS
    # =========================================================

    registration_email_success = sum(
        1
        for participant in participants
        if (
            participant.s_registration_email_status
            and participant
            .s_registration_email_status
            .strip()
            .upper()
            == "SUCCESS"
        )
    )

    registration_email_failed = sum(
        1
        for participant in participants
        if (
            participant.s_registration_email_status
            and participant
            .s_registration_email_status
            .strip()
            .upper()
            == "FAILED"
        )
    )

    confirmation_email_success = sum(
        1
        for participant in participants
        if (
            participant.s_confirmation_email_status
            and participant
            .s_confirmation_email_status
            .strip()
            .upper()
            == "SUCCESS"
        )
    )

    confirmation_email_failed = sum(
        1
        for participant in participants
        if (
            participant.s_confirmation_email_status
            and participant
            .s_confirmation_email_status
            .strip()
            .upper()
            == "FAILED"
        )
    )

    assessment_email_success = sum(
        1
        for participant in participants
        if (
            participant.s_assessment_email_status
            and participant
            .s_assessment_email_status
            .strip()
            .upper()
            == "SUCCESS"
        )
    )

    assessment_email_failed = sum(
        1
        for participant in participants
        if (
            participant.s_assessment_email_status
            and participant
            .s_assessment_email_status
            .strip()
            .upper()
            == "FAILED"
        )
    )

    # =========================================================
    # TRAINING-WISE PERFORMANCE
    # =========================================================

    training_performance = []

    assessment_training_map = {
        assessment.n_assessment_id: assessment.n_training_id
        for assessment in assessments
    }

    for training in trainings:
        training_participants = [
            participant
            for participant in participants
            if participant.n_training_id
            == training.n_training_id
        ]

        participant_count = len(
            training_participants
        )

        registered_count = sum(
            1
            for participant in training_participants
            if (
                participant.s_registration_status
                and participant
                .s_registration_status
                .strip()
                .upper()
                == "REGISTERED"
            )
        )

        attendance_count = sum(
            1
            for participant in training_participants
            if (
                participant.s_attendance_status
                and participant
                .s_attendance_status
                .strip()
                .upper()
                == "COMPLETED"
            )
        )

        eligible_count = sum(
            1
            for participant in training_participants
            if participant.n_assessment_eligible == 1
        )

        # ---------------------------------------------------------
        # Actual completed assessment attempts for this training
        # ---------------------------------------------------------

        training_participant_ids = {
            participant.n_participant_id
            for participant in training_participants
        }

        training_attempts = [
            attempt
            for attempt in completed_attempts
            if (
                attempt.n_participant_id
                in training_participant_ids
                and assessment_training_map.get(
                    attempt.n_assessment_id
                )
                == training.n_training_id
            )
        ]

        # ---------------------------------------------------------
        # Keep only the latest completed attempt for each
        # participant + assessment combination
        # ---------------------------------------------------------

        latest_attempts = {}

        for attempt in training_attempts:

            key = (
                attempt.n_participant_id,
                attempt.n_assessment_id
            )

            existing_attempt = latest_attempts.get(key)

            if (
                existing_attempt is None
                or attempt.n_attempt_number
                > existing_attempt.n_attempt_number
            ):
                latest_attempts[key] = attempt

        training_final_attempts = list(
            latest_attempts.values()
        )

        # ---------------------------------------------------------
        # Assessment completion count
        # ---------------------------------------------------------

        completed_count = len(
            training_final_attempts
        )

        # ---------------------------------------------------------
        # Pass / Fail from actual latest attempts
        # ---------------------------------------------------------

        passed = sum(
            1
            for attempt in training_final_attempts
            if (
                attempt.s_result
                and attempt.s_result
                .strip()
                .upper()
                == "PASS"
            )
        )

        failed = sum(
            1
            for attempt in training_final_attempts
            if (
                attempt.s_result
                and attempt.s_result
                .strip()
                .upper()
                == "FAIL"
            )
        )

        # ---------------------------------------------------------
        # Score from actual assessment percentage
        # ---------------------------------------------------------

        training_scores = [
            float(attempt.n_percentage)
            for attempt in training_final_attempts
            if attempt.n_percentage is not None
        ]

        training_average_score = (
            round(
                sum(training_scores)
                / len(training_scores),
                2
            )
            if training_scores
            else 0
        )

        training_pass_rate = (
            round(
                (
                    passed
                    / (passed + failed)
                ) * 100,
                2
            )
            if (passed + failed) > 0
            else 0
        )

        training_registration_rate = (
            round(
                (
                    registered_count
                    / participant_count
                ) * 100,
                2
            )
            if participant_count > 0
            else 0
        )

        training_attendance_rate = (
            round(
                (
                    attendance_count
                    / participant_count
                ) * 100,
                2
            )
            if participant_count > 0
            else 0
        )

        training_performance.append(
            {
                "n_training_id":
                    training.n_training_id,

                "s_training_code":
                    training.s_training_code,

                "s_training_name":
                    training.s_training_name,

                "d_training_date":
                    (
                        training.d_training_date.isoformat()
                        if training.d_training_date
                        else None
                    ),

                "s_status":
                    training.s_status,

                "n_participants":
                    participant_count,

                "n_registered":
                    registered_count,

                "registration_rate":
                    training_registration_rate,

                "n_attendance_completed":
                    attendance_count,

                "attendance_rate":
                    training_attendance_rate,

                "n_assessment_eligible":
                    eligible_count,

                "n_assessment_completed":
                    completed_count,

                "n_passed":
                    passed,

                "n_failed":
                    failed,

                "average_score":
                    training_average_score,

                "pass_rate":
                    training_pass_rate,
            }
        )

    # =========================================================
    # ASSESSMENT PERFORMANCE
    # =========================================================

    assessment_performance = []

    for assessment in assessments:

        assessment_attempts = (
            db.query(AssessmentAttempt)
            .filter(
                AssessmentAttempt.n_assessment_id
                == assessment.n_assessment_id,

                AssessmentAttempt.dt_submitted_at.isnot(None),

                AssessmentAttempt.n_flag == 1,
                AssessmentAttempt.delete_flag == 0
            )
            .all()
        )

        # ---------------------------------------------------------
        # Keep only the latest completed attempt for each
        # participant + assessment
        # ---------------------------------------------------------

        latest_assessment_attempts = {}

        for attempt in assessment_attempts:

            key = (
                attempt.n_participant_id,
                attempt.n_assessment_id
            )

            existing_attempt = (
                latest_assessment_attempts.get(key)
            )

            if (
                existing_attempt is None
                or attempt.n_attempt_number
                > existing_attempt.n_attempt_number
            ):
                latest_assessment_attempts[key] = attempt

        assessment_final_attempts = list(
            latest_assessment_attempts.values()
        )

        # ---------------------------------------------------------
        # Scores from actual assessment attempts
        # ---------------------------------------------------------
        assessment_scores = [
            float(attempt.n_percentage)
            for attempt in assessment_final_attempts
            if attempt.n_percentage is not None
        ]

        # ---------------------------------------------------------
        # Passed attempts
        # ---------------------------------------------------------
        assessment_passed = sum(
            1
            for attempt in assessment_final_attempts
            if (
                attempt.s_result
                and attempt.s_result.strip().upper()
                == "PASS"
            )
        )

        # ---------------------------------------------------------
        # Failed attempts
        # ---------------------------------------------------------
        assessment_failed = sum(
            1
            for attempt in assessment_final_attempts
            if (
                attempt.s_result
                and attempt.s_result.strip().upper()
                == "FAIL"
            )
        )

        # ---------------------------------------------------------
        # Assessment performance
        # ---------------------------------------------------------
        assessment_performance.append(
            {
                "n_assessment_id":
                    assessment.n_assessment_id,

                "n_training_id":
                    assessment.n_training_id,

                "s_assessment_name":
                    assessment.s_assessment_name,

                "s_status":
                    assessment.s_status,

                "n_participants":
                    len(assessment_final_attempts),

                "n_passed":
                    assessment_passed,

                "n_failed":
                    assessment_failed,

                "average_score":
                    (
                        round(
                            sum(assessment_scores)
                            / len(assessment_scores),
                            2
                        )
                        if assessment_scores
                        else 0
                    ),

                "highest_score":
                    (
                        round(
                            max(assessment_scores),
                            2
                        )
                        if assessment_scores
                        else 0
                    ),

                "lowest_score":
                    (
                        round(
                            min(assessment_scores),
                            2
                        )
                        if assessment_scores
                        else 0
                    )
            }
        )

    # =========================================================
    # RESPONSE
    # =========================================================

    return {
        "status": "success",

        "overview": {
            "total_trainings":
                total_trainings,

            "total_participants":
                total_participants,

            "total_assessments":
                total_assessments,

            "registration_completed":
                registration_completed,

            "attendance_completed":
                attendance_completed,

            "assessment_eligible":
                assessment_eligible,

            "assessment_attempted":
                assessment_attempted,

            "assessment_completed":
                assessment_completed,

            "passed_count":
                passed_count,

            "failed_count":
                failed_count,

            "reattempted":
                reattempted
        },

        "rates": {
            "registration_rate":
                registration_rate,

            "attendance_rate":
                attendance_rate,

            "assessment_eligibility_rate":
                assessment_eligibility_rate,

            "assessment_completion_rate":
                assessment_completion_rate,

            "pass_rate":
                pass_rate
        },

        "score_analytics": {
            "average_score":
                average_score,

            "highest_score":
                highest_score,

            "lowest_score":
                lowest_score,

            "completed_assessments":
                len(scores)
        },

        "attendance_analytics": {
            "average_minutes":
                average_attendance_minutes,

            "highest_minutes":
                highest_attendance_minutes,

            "lowest_minutes":
                lowest_attendance_minutes,

            "processed_participants":
                len(attendance_minutes)
        },

        "email_analytics": {
            "registration": {
                "success":
                    registration_email_success,
                "failed":
                    registration_email_failed
            },

            "confirmation": {
                "success":
                    confirmation_email_success,
                "failed":
                    confirmation_email_failed
            },

            "assessment": {
                "success":
                    assessment_email_success,
                "failed":
                    assessment_email_failed
            }
        },

        "training_performance":
            training_performance,

        "assessment_performance":
            assessment_performance
    }
