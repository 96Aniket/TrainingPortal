from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.auth.permissions import require_roles
from app.auth.session import get_current_user_role
from app.database.dependencies import get_db

from app.models.user import User
from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.assessment import Assessment


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("")
def get_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):
    role_name = get_current_user_role(
        request=request,
        db=db
    )

    is_coordinator = (
        role_name
        and role_name.strip().upper() == "COORDINATOR"
    )

    # =========================================================
    # TRAININGS
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

    total_trainings = training_query.count()

    # =========================================================
    # PARTICIPANTS
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
            Training.delete_flag == 0
        )
    )

    if is_coordinator:
        participant_query = participant_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    total_participants = participant_query.count()

    # =========================================================
    # SUMMARY
    # =========================================================

    registration_completed = (
        participant_query
        .filter(
            TrainingParticipant.s_registration_status
            == "REGISTERED"
        )
        .count()
    )

    registration_email_sent = (
        participant_query
        .filter(
            TrainingParticipant.s_registration_email_status
            == "SUCCESS"
        )
        .count()
    )

    confirmation_email_sent = (
        participant_query
        .filter(
            TrainingParticipant.s_confirmation_email_status
            == "SUCCESS"
        )
        .count()
    )

    attendance_completed = (
        participant_query
        .filter(
            TrainingParticipant.s_attendance_status
            == "COMPLETED"
        )
        .count()
    )

    assessment_eligible = (
        participant_query
        .filter(
            TrainingParticipant.n_assessment_eligible == 1
        )
        .count()
    )

    assessment_email_sent = (
        participant_query
        .filter(
            TrainingParticipant.s_assessment_email_status
            == "SUCCESS"
        )
        .count()
    )

    assessment_attempted = (
        participant_query
        .filter(
            TrainingParticipant.n_attempt_count > 0
        )
        .count()
    )

    reattempted = (
        participant_query
        .filter(
            TrainingParticipant.n_reattempt_count > 0
        )
        .count()
    )

    assessment_completed = (
        participant_query
        .filter(
            TrainingParticipant.s_final_result.isnot(None)
        )
        .count()
    )

    passed_count = (
        participant_query
        .filter(
            TrainingParticipant.s_final_result.ilike("PASS")
        )
        .count()
    )

    failed_count = (
        participant_query
        .filter(
            TrainingParticipant.s_final_result.ilike("FAIL")
        )
        .count()
    )

    # =========================================================
    # ASSESSMENTS
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
            Training.delete_flag == 0
        )
    )

    if is_coordinator:
        assessment_query = assessment_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    total_assessments = assessment_query.count()

    # =========================================================
    # DETAIL MONITORING ROWS
    # =========================================================

    monitoring_query = (
        db.query(
            TrainingParticipant,
            User,
            Training
        )
        .join(
            User,
            User.n_user_id == TrainingParticipant.n_user_id
        )
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
            User.n_flag == 1,
            User.delete_flag == 0
        )
    )

    if is_coordinator:
        monitoring_query = monitoring_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    monitoring_query = monitoring_query.order_by(
        Training.d_training_date.desc(),
        User.s_user_name.asc()
    )

    monitoring_rows = monitoring_query.all()

    monitoring = []

    for participant, user, training in monitoring_rows:
        monitoring.append(
            {
                "n_participant_id":
                    participant.n_participant_id,

                "n_training_id":
                    training.n_training_id,

                "n_user_id":
                    user.n_user_id,

                # -------------------------------------------------
                # USER
                # -------------------------------------------------

                "s_employee_id":
                    user.s_employee_id,

                "s_user_name":
                    user.s_user_name,

                "s_email":
                    user.s_email,

                # -------------------------------------------------
                # TRAINING
                # -------------------------------------------------

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

                "s_training_status":
                    training.s_status,

                "n_passing_score":
                    (
                        float(training.n_passing_score)
                        if training.n_passing_score is not None
                        else None
                    ),

                "n_minimum_attendance_minutes":
                    training.n_minimum_attendance_minutes,

                # -------------------------------------------------
                # REGISTRATION
                # -------------------------------------------------

                "s_registration_status":
                    participant.s_registration_status,

                "s_registration_email_status":
                    participant.s_registration_email_status,

                "dt_registration_email_sent_at":
                    (
                        participant.dt_registration_email_sent_at.isoformat()
                        if participant.dt_registration_email_sent_at
                        else None
                    ),

                "dt_registered_at":
                    (
                        participant.dt_registered_at.isoformat()
                        if participant.dt_registered_at
                        else None
                    ),

                # -------------------------------------------------
                # CONFIRMATION
                # -------------------------------------------------

                "s_confirmation_email_status":
                    participant.s_confirmation_email_status,

                "dt_confirmation_email_sent_at":
                    (
                        participant.dt_confirmation_email_sent_at.isoformat()
                        if participant.dt_confirmation_email_sent_at
                        else None
                    ),

                # -------------------------------------------------
                # ATTENDANCE
                # -------------------------------------------------

                "s_attendance_status":
                    participant.s_attendance_status,

                "n_attendance_minutes":
                    participant.n_attendance_minutes,

                "dt_attendance_processed_at":
                    (
                        participant.dt_attendance_processed_at.isoformat()
                        if participant.dt_attendance_processed_at
                        else None
                    ),

                # -------------------------------------------------
                # ASSESSMENT
                # -------------------------------------------------

                "n_assessment_eligible":
                    participant.n_assessment_eligible,

                "s_assessment_email_status":
                    participant.s_assessment_email_status,

                "dt_assessment_email_sent_at":
                    (
                        participant.dt_assessment_email_sent_at.isoformat()
                        if participant.dt_assessment_email_sent_at
                        else None
                    ),

                # -------------------------------------------------
                # ATTEMPTS / RESULTS
                # -------------------------------------------------

                "n_attempt_count":
                    participant.n_attempt_count,

                "n_reattempt_count":
                    participant.n_reattempt_count,

                "n_final_score":
                    (
                        float(participant.n_final_score)
                        if participant.n_final_score is not None
                        else None
                    ),

                "s_final_result":
                    participant.s_final_result,
            }
        )

    # =========================================================
    # RESPONSE
    # =========================================================

    return {
        "status": "success",

        "summary": {
            "total_trainings": total_trainings,
            "total_participants": total_participants,

            "registration_email_sent":
                registration_email_sent,

            "registration_completed":
                registration_completed,

            "confirmation_email_sent":
                confirmation_email_sent,

            "attendance_completed":
                attendance_completed,

            "assessment_eligible":
                assessment_eligible,

            "assessment_email_sent":
                assessment_email_sent,

            "assessment_attempted":
                assessment_attempted,

            "reattempted":
                reattempted,

            "assessment_completed":
                assessment_completed,

            "passed_count":
                passed_count,

            "failed_count":
                failed_count,

            "total_assessments":
                total_assessments
        },

        "monitoring": monitoring
    }