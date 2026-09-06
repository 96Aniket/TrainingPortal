import os
import secrets

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.user import User

from app.models.email_log import EmailLog
from app.models.email_log_training import EmailLogTraining

from app.services.email_service import send_training_email


# ============================================================
# CONFIGURATION
# ============================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    ""
)

REGISTRATION_PATH = os.getenv(
    "REGISTRATION_PATH",
    "/registration"
)

ASSESSMENT_PATH = os.getenv(
    "ASSESSMENT_PATH",
    "/assessment"
)


# ============================================================
# REGISTRATION URL
# ============================================================

def build_registration_url(
    token: str
) -> str:

    if not FRONTEND_URL:
        raise ValueError(
            "FRONTEND_URL is not configured"
        )

    return (
        FRONTEND_URL.rstrip("/")
        + "/"
        + REGISTRATION_PATH.lstrip("/")
        + "/"
        + token
    )


# ============================================================
# GET TRAINING
# ============================================================

def get_training(
    db: Session,
    training_id: int
) -> Training | None:

    return (
        db.query(Training)
        .filter(
            Training.n_training_id == training_id,
            Training.n_flag == 1,
            Training.delete_flag == 0
        )
        .first()
    )


# ============================================================
# GET USER
# ============================================================

def get_active_user(
    db: Session,
    user_id: int
) -> User | None:

    return (
        db.query(User)
        .filter(
            User.n_user_id == user_id,
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .first()
    )


# ============================================================
# GET TRAINING COORDINATOR EMAIL
# ============================================================
#
# Current database design associates the training creator
# with the training through n_created_by.
#
# No email address is hardcoded here.
# ============================================================

def get_coordinator_email(
    db: Session,
    training: Training
) -> str | None:

    if not training.n_created_by:
        return None

    coordinator = (
        db.query(User)
        .filter(
            User.n_user_id == training.n_created_by,
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .first()
    )

    if not coordinator:
        return None

    return coordinator.s_email


# ============================================================
# SEND TRAINING PUBLISHED EMAILS
# ============================================================

def send_training_published_emails(
    *,
    db: Session,
    training_id: int,
    coordinator_email: str | None = None,
    created_by: str | None = None
):

    # --------------------------------------------------------
    # Get Training
    # --------------------------------------------------------

    training = get_training(
        db=db,
        training_id=training_id
    )

    if not training:
        raise ValueError(
            "Training not found"
        )

    # --------------------------------------------------------
    # Get Participants
    # --------------------------------------------------------

    participants = (
        db.query(TrainingParticipant)
        .filter(
            TrainingParticipant.n_training_id
            == training_id,
            TrainingParticipant.n_flag == 1,
            TrainingParticipant.delete_flag == 0
        )
        .order_by(
            TrainingParticipant.n_user_id
        )
        .all()
    )

    total = len(participants)

    sent = 0
    failed = 0
    skipped = 0

    # --------------------------------------------------------
    # Coordinator Email
    # --------------------------------------------------------

    if coordinator_email is None:
        coordinator_email = get_coordinator_email(
            db=db,
            training=training
        )

    # --------------------------------------------------------
    # Process Each Participant
    # --------------------------------------------------------

    for participant in participants:

        user = get_active_user(
            db=db,
            user_id=participant.n_user_id
        )

        if not user:

            skipped += 1

            continue

        if not user.s_email:

            skipped += 1

            continue

        # ----------------------------------------------------
        # Generate Token
        # ----------------------------------------------------

        if not participant.s_registration_token:

            participant.s_registration_token = (
                secrets.token_urlsafe(32)
            )

            db.flush()

        # ----------------------------------------------------
        # Registration URL
        # ----------------------------------------------------

        registration_url = (
            build_registration_url(
                participant.s_registration_token
            )
        )

        # ----------------------------------------------------
        # Training Details
        # ----------------------------------------------------

        training_details = (
            f"Training: {training.s_training_name}<br>"
            f"Date: {training.d_training_date}<br>"
            f"Time: {training.t_start_time} "
            f"- {training.t_end_time}<br>"
            f"Registration closes: "
            f"{training.dt_registration_end}"
        )

        # ----------------------------------------------------
        # Skip Already Successful Email
        # ----------------------------------------------------

        if (
            participant.s_registration_email_status
            == "SUCCESS"
        ):

            skipped += 1

            continue

        # ----------------------------------------------------
        # Send Individual Email
        # ----------------------------------------------------

        result = send_training_email(

            db=db,

            email_type="TRAINING_PUBLISHED",

            to_email=user.s_email,

            training_id=training.n_training_id,

            user_id=user.n_user_id,

            coordinator_email=coordinator_email,

            template_variables={
                "UserName": (
                    user.s_user_name
                    or ""
                ),

                "TrainingName": (
                    training.s_training_name
                    or ""
                ),

                "TrainingDetails": (
                    training_details
                ),

                "RegistrationLink": (
                    registration_url
                )
            },

            created_by=created_by
        )

        # ----------------------------------------------------
        # Update Participant Email Status
        # ----------------------------------------------------

        if result.get("status") == "success":

            participant.s_registration_email_status = (
                "SUCCESS"
            )

            participant.dt_registration_email_sent_at = (
                datetime.now()
            )

            sent += 1

        else:

            participant.s_registration_email_status = (
                "FAILED"
            )

            participant.dt_registration_email_sent_at = None

            failed += 1

        db.commit()

    return {
        "status": "success",
        "n_training_id": training_id,
        "total_participants": total,
        "emails_sent": sent,
        "emails_failed": failed,
        "emails_skipped": skipped
    }


# ============================================================
# SEND ASSESSMENT INVITATION
# ============================================================
#
# Sends only to the participant selected by the
# assessment publish process.
# ============================================================

def send_assessment_invitation_email(
    *,
    db: Session,
    assessment,
    participant,
    user: User | None = None,
    coordinator_email: str | None = None,
    created_by: str | None = None
):

    # --------------------------------------------------------
    # Get User Dynamically
    # --------------------------------------------------------

    if user is None:

        user = get_active_user(
            db=db,
            user_id=participant.n_user_id
        )

    if not user:
        raise ValueError(
            "User not found or inactive"
        )

    if not user.s_email:
        raise ValueError(
            "User email is not configured"
        )

    # --------------------------------------------------------
    # Get Training
    # --------------------------------------------------------

    training = get_training(
        db=db,
        training_id=assessment.n_training_id
    )

    if not training:
        raise ValueError(
            "Training not found"
        )

    # --------------------------------------------------------
    # Coordinator
    # --------------------------------------------------------

    if coordinator_email is None:

        coordinator_email = get_coordinator_email(
            db=db,
            training=training
        )

    # --------------------------------------------------------
    # Assessment Link
    # --------------------------------------------------------

    if not FRONTEND_URL:
        raise ValueError(
            "FRONTEND_URL is not configured"
        )

    if not participant.s_registration_token:
        raise ValueError(
            "Participant registration token is missing"
        )

    assessment_link = (
        FRONTEND_URL.rstrip("/")
        + "/"
        + ASSESSMENT_PATH.lstrip("/")
        + "/"
        + str(assessment.n_assessment_id)
        + "?token="
        + participant.s_registration_token
    )

    # --------------------------------------------------------
    # Send
    # --------------------------------------------------------

    return send_training_email(

        db=db,

        email_type="ASSESSMENT_AVAILABLE",

        to_email=user.s_email,

        training_id=training.n_training_id,

        user_id=user.n_user_id,

        coordinator_email=coordinator_email,

        template_variables={
            "UserName": (
                user.s_user_name
                or ""
            ),

            "TrainingName": (
                training.s_training_name
                or ""
            ),

            "AssessmentName": (
                assessment.s_assessment_name
                or ""
            ),

            "AssessmentDescription": (
                assessment.s_description
                or ""
            ),

            "AssessmentLink": (
                assessment_link
            ),

            "AssessmentDuration": (
                assessment.n_duration_minutes
                or ""
            ),

            "MaximumAttempts": (
                assessment.n_maximum_attempts
                or ""
            ),

            "PassingScore": (
                assessment.n_passing_score
            )
        },

        created_by=created_by
    )


# ============================================================
# SEND ASSESSMENT RESULT EMAIL
# ============================================================

def send_assessment_result_email(
    *,
    db: Session,
    assessment,
    user: User,
    result,
    score,
    percentage,
    created_by: str | None = None
):

    # --------------------------------------------------------
    # Validate User
    # --------------------------------------------------------

    if not user:
        raise ValueError(
            "User is required"
        )

    if not user.s_email:
        raise ValueError(
            "User email is not configured"
        )

    # --------------------------------------------------------
    # Get Training
    # --------------------------------------------------------

    training = get_training(
        db=db,
        training_id=assessment.n_training_id
    )

    if not training:
        raise ValueError(
            "Training not found"
        )

    # --------------------------------------------------------
    # Dynamic Coordinator
    # --------------------------------------------------------

    coordinator_email = get_coordinator_email(
        db=db,
        training=training
    )

    # --------------------------------------------------------
    # Send
    # --------------------------------------------------------

    return send_training_email(

        db=db,

        email_type="ASSESSMENT_RESULT",

        to_email=user.s_email,

        training_id=training.n_training_id,

        user_id=user.n_user_id,

        coordinator_email=coordinator_email,

        template_variables={

            "UserName": (
                user.s_user_name
                or ""
            ),

            "TrainingName": (
                training.s_training_name
                or ""
            ),

            "Result": (
                result
            ),

            "Score": (
                round(
                    float(percentage),
                    2
                )
            )
        },

        created_by=created_by
    )


# ============================================================
# SEND ASSESSMENT REATTEMPT EMAIL
# ============================================================

def send_assessment_reattempt_email(
    *,
    db: Session,
    assessment,
    participant,
    user: User,
    attempt_number,
    created_by: str | None = None
):

    # --------------------------------------------------------
    # Validate User
    # --------------------------------------------------------

    if not user:
        raise ValueError(
            "User is required"
        )

    if not user.s_email:
        raise ValueError(
            "User email is not configured"
        )

    # --------------------------------------------------------
    # Get Training
    # --------------------------------------------------------

    training = get_training(
        db=db,
        training_id=assessment.n_training_id
    )

    if not training:
        raise ValueError(
            "Training not found"
        )

    # --------------------------------------------------------
    # Dynamic Coordinator
    # --------------------------------------------------------

    coordinator_email = get_coordinator_email(
        db=db,
        training=training
    )

    # --------------------------------------------------------
    # Assessment Link
    # --------------------------------------------------------

    if not FRONTEND_URL:
        raise ValueError(
            "FRONTEND_URL is not configured"
        )

    if not participant:
        raise ValueError(
            "Participant is required"
        )


    if not participant.s_registration_token:
        raise ValueError(
            "Participant registration token is missing"
        )

    assessment_link = (
        FRONTEND_URL.rstrip("/")
        + "/"
        + ASSESSMENT_PATH.lstrip("/")
        + "/"
        + str(assessment.n_assessment_id)
        + "?token="
        + participant.s_registration_token
    )

    # --------------------------------------------------------
    # Send
    # --------------------------------------------------------

    return send_training_email(

        db=db,

        email_type="ASSESSMENT_REATTEMPT",

        to_email=user.s_email,

        training_id=training.n_training_id,

        user_id=user.n_user_id,

        coordinator_email=coordinator_email,

        template_variables={

            "UserName": (
                user.s_user_name
                or ""
            ),

            "TrainingName": (
                training.s_training_name
                or ""
            ),

            "AssessmentLink": (
                assessment_link
            ),

            "AttemptNumber": (
                attempt_number
            ),

            "MaximumAttempts": (
                assessment.n_maximum_attempts
                or ""
            ),

            "PassingScore": (
                assessment.n_passing_score
            )
        },

        created_by=created_by
    )


# ============================================================
# SEND BULK TRAINING PUBLISHED EMAILS
# ============================================================
#
# Bulk publish behavior:
#   - one combined email per user
#   - all successfully published trainings are listed
#   - existing single-training email flow is unchanged
#   - Teams meeting links are NOT included
# ============================================================

def send_bulk_training_published_emails(
    *,
    db: Session,
    training_ids: list[int],
    coordinator_emails: list[str] | None = None,
    created_by: str | None = None
):
    """
    Send ONE combined TRAINING_PUBLISHED email per user
    for all trainings included in one bulk-publish operation.
    """

    # --------------------------------------------------------
    # Validate training IDs
    # --------------------------------------------------------

    if not training_ids:
        raise ValueError(
            "No training IDs provided for bulk email."
        )

    # --------------------------------------------------------
    # Get trainings
    # --------------------------------------------------------

    trainings = (
        db.query(Training)
        .filter(
            Training.n_training_id.in_(training_ids),
            Training.n_flag == 1,
            Training.delete_flag == 0
        )
        .order_by(
            Training.d_training_date.asc(),
            Training.t_start_time.asc(),
            Training.n_training_id.asc()
        )
        .all()
    )

    if not trainings:
        raise ValueError(
            "No valid trainings found for bulk email."
        )

    # --------------------------------------------------------
    # Verify all requested trainings exist
    # --------------------------------------------------------

    found_training_ids = {
        training.n_training_id
        for training in trainings
    }

    missing_ids = [
        training_id
        for training_id in training_ids
        if training_id not in found_training_ids
    ]

    if missing_ids:
        raise ValueError(
            "Training not found for IDs: "
            + ", ".join(
                str(training_id)
                for training_id in missing_ids
            )
        )

    # --------------------------------------------------------
    # Build combined training details
    # Teams link intentionally excluded
    # --------------------------------------------------------

    training_blocks = []

    for index, training in enumerate(
        trainings,
        start=1
    ):
        training_blocks.append(
            f"""
            <div style="
                margin:0 0 16px 0;
                padding:16px;
                border:1px solid #dbe3f0;
                border-radius:10px;
                background:#f8fbff;
            ">
                <div style="
                    margin-bottom:8px;
                    color:#172033;
                    font-size:15px;
                    font-weight:700;
                ">
                    {index}. {training.s_training_name}
                </div>

                <div style="
                    color:#475569;
                    font-size:13px;
                    line-height:1.7;
                ">
                    <strong>Training Code:</strong>
                    {training.s_training_code}<br>

                    <strong>Date:</strong>
                    {training.d_training_date}<br>

                    <strong>Time:</strong>
                    {training.t_start_time}
                    - {training.t_end_time}<br>

                    <strong>Registration closes:</strong>
                    {training.dt_registration_end}
                </div>
            </div>
            """
        )

    combined_training_details = "".join(
        training_blocks
    )

    # --------------------------------------------------------
    # Get participant records
    # Group by user so each user receives ONE email
    # --------------------------------------------------------

    participants = (
        db.query(TrainingParticipant)
        .filter(
            TrainingParticipant.n_training_id.in_(
                training_ids
            ),
            TrainingParticipant.n_flag == 1,
            TrainingParticipant.delete_flag == 0
        )
        .order_by(
            TrainingParticipant.n_user_id.asc()
        )
        .all()
    )

    user_participants = {}

    for participant in participants:
        user_participants.setdefault(
            participant.n_user_id,
            []
        ).append(participant)

    if not user_participants:
        return {
            "status": "success",
            "training_count": len(trainings),
            "total_users": 0,
            "emails_sent": 0,
            "emails_failed": 0,
            "emails_skipped": 0
        }

    # --------------------------------------------------------
    # Build unique coordinator CC list
    # --------------------------------------------------------

    unique_coordinators = []

    for coordinator_email in (
        coordinator_emails or []
    ):
        if not coordinator_email:
            continue

        value = coordinator_email.strip()

        if not value:
            continue

        if value.lower() not in {
            item.lower()
            for item in unique_coordinators
        }:
            unique_coordinators.append(value)

    # Shared email service accepts one coordinator_email string.
    # For bulk publish, pass the unique coordinator list joined by comma.
    coordinator_email = (
        ", ".join(unique_coordinators)
        if unique_coordinators
        else None
    )

    sent = 0
    failed = 0
    skipped = 0

    # --------------------------------------------------------
    # ONE EMAIL PER USER
    # --------------------------------------------------------

    for user_id, user_rows in (
        user_participants.items()
    ):

        user = get_active_user(
            db=db,
            user_id=user_id
        )

        if not user:
            skipped += 1
            continue

        if not user.s_email:
            skipped += 1
            continue

        # ----------------------------------------------------
        # Get a valid registration token for this user
        # ----------------------------------------------------

        token_participant = next(
            (
                participant
                for participant in user_rows
                if participant.s_registration_token
            ),
            None
        )

        if token_participant is None:
            skipped += 1
            continue

        registration_url = build_registration_url(
            token_participant.s_registration_token
        )

        # ----------------------------------------------------
        # Template variables
        # ----------------------------------------------------

        template_variables = {
            "UserName": (
                user.s_user_name or ""
            ),

            "TrainingName": (
                trainings[0].s_training_name
                if len(trainings) == 1
                else f"{len(trainings)} Trainings"
            ),

            "TrainingDetails": (
                combined_training_details
            ),

            "RegistrationLink": (
                registration_url
            )
        }

        # ----------------------------------------------------
        # Send through EXISTING working email service
        # ----------------------------------------------------

        try:
            result = send_training_email(
                db=db,
                email_type="TRAINING_PUBLISHED",
                to_email=user.s_email,
                training_id=trainings[0].n_training_id,
                user_id=user.n_user_id,
                coordinator_email=coordinator_email,
                template_variables=template_variables,
                created_by=created_by
            )

        except Exception as exc:
            failed += 1
            continue

        # ----------------------------------------------------
        # Get email log created by send_training_email()
        # ----------------------------------------------------

        email_log_id = result.get(
            "email_log_id"
        )

        if not email_log_id:
            failed += 1
            continue

        email_log = (
            db.query(EmailLog)
            .filter(
                EmailLog.n_email_log_id
                == email_log_id
            )
            .first()
        )

        # ----------------------------------------------------
        # Mark this email as bulk in DB
        # This keeps the existing template/email sender intact.
        # ----------------------------------------------------

        if email_log:
            email_log.s_email_type = (
                "TRAINING_BULK_PUBLISHED"
            )

        # ----------------------------------------------------
        # Create mapping:
        # ONE email -> ALL trainings in this batch
        # ----------------------------------------------------

        try:
            existing_mapping_count = (
                db.query(EmailLogTraining)
                .filter(
                    EmailLogTraining.n_email_log_id
                    == email_log_id,
                    EmailLogTraining.n_flag == 1,
                    EmailLogTraining.delete_flag == 0
                )
                .count()
            )

            if existing_mapping_count == 0:

                for training in trainings:

                    db.add(
                        EmailLogTraining(
                            n_email_log_id=(
                                email_log_id
                            ),
                            n_training_id=(
                                training.n_training_id
                            ),
                            n_flag=1,
                            delete_flag=0,
                            dt_created_at=datetime.now(),
                            s_created_by=created_by
                        )
                    )

            # ------------------------------------------------
            # Update participant email status
            # ------------------------------------------------

            if result.get("status") == "success":

                sent_time = datetime.now()

                for participant in user_rows:

                    participant.s_registration_email_status = (
                        "SUCCESS"
                    )

                    participant.dt_registration_email_sent_at = (
                        sent_time
                    )

                sent += 1

            else:

                for participant in user_rows:

                    participant.s_registration_email_status = (
                        "FAILED"
                    )

                    participant.dt_registration_email_sent_at = (
                        None
                    )

                failed += 1

            db.commit()

        except Exception:
            db.rollback()
            failed += 1

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {
        "status": (
            "success"
            if failed == 0
            else "completed_with_errors"
        ),
        "training_count": len(trainings),
        "total_users": len(user_participants),
        "emails_sent": sent,
        "emails_failed": failed,
        "emails_skipped": skipped
    }
