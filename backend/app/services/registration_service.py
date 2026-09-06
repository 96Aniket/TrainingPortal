from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.user import User
from app.models.email_log_training import EmailLogTraining

from app.services.email_service import send_training_email


# ============================================================
# GET USER FROM REGISTRATION TOKEN
# ============================================================

def get_user_from_registration_token(
    db: Session,
    registration_token: str
):
    participant = (
        db.query(TrainingParticipant)
        .filter(
            TrainingParticipant.s_registration_token
            == registration_token,

            TrainingParticipant.n_flag == 1,

            TrainingParticipant.delete_flag == 0
        )
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=404,
            detail="Invalid registration token"
        )

    user = (
        db.query(User)
        .filter(
            User.n_user_id == participant.n_user_id,

            User.n_flag == 1,

            User.delete_flag == 0
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ============================================================
# MULTIPLE TRAINING REGISTRATION
# ============================================================

def register_multiple_trainings(
    *,
    db: Session,
    registration_token: str,
    training_ids: list[int]
):

    # --------------------------------------------------------
    # Validate training selection
    # --------------------------------------------------------

    if not training_ids:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one training"
        )

    # Remove duplicate training IDs
    training_ids = list(dict.fromkeys(training_ids))

    # --------------------------------------------------------
    # Get User
    # --------------------------------------------------------

    user = get_user_from_registration_token(
        db=db,
        registration_token=registration_token
    )

    current_datetime = datetime.now()

    participants_to_update = []
    selected_trainings = []

    # --------------------------------------------------------
    # Validate every selected training
    # --------------------------------------------------------

    for training_id in training_ids:

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id == training_id,

                Training.n_flag == 1,

                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Training not found: {training_id}"
                )
            )

        # ----------------------------------------------------
        # Training status
        # ----------------------------------------------------

        if training.s_status not in [
            "PUBLISHED",
            "OPEN"
        ]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Training '{training.s_training_name}' "
                    f"is not available"
                )
            )

        # ----------------------------------------------------
        # Registration period
        # ----------------------------------------------------

        if (
            current_datetime
            < training.dt_registration_start
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Registration has not started for "
                    f"'{training.s_training_name}'"
                )
            )

        if (
            current_datetime
            > training.dt_registration_end
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Registration has closed for "
                    f"'{training.s_training_name}'"
                )
            )

        # ----------------------------------------------------
        # Find participant record
        # ----------------------------------------------------

        participant = (
            db.query(TrainingParticipant)
            .filter(
                TrainingParticipant.n_training_id
                == training_id,

                TrainingParticipant.n_user_id
                == user.n_user_id,

                TrainingParticipant.n_flag == 1,

                TrainingParticipant.delete_flag == 0
            )
            .first()
        )

        if not participant:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"You are not available for training "
                    f"'{training.s_training_name}'"
                )
            )

        # ----------------------------------------------------
        # Already registered
        # ----------------------------------------------------

        if participant.s_registration_status == "REGISTERED":

            # Don't fail the complete request.
            # Simply keep this training out of the
            # update list.

            selected_trainings.append(
                {
                    "training": training,
                    "participant": participant,
                    "already_registered": True
                }
            )

            continue

        # ----------------------------------------------------
        # Add for registration
        # ----------------------------------------------------

        participant.s_registration_status = "REGISTERED"

        participant.dt_registered_at = current_datetime

        participant.s_confirmation_email_status = "PENDING"

        participants_to_update.append(participant)

        selected_trainings.append(
            {
                "training": training,
                "participant": participant,
                "already_registered": False
            }
        )

    # --------------------------------------------------------
    # Make sure at least one training is available
    # --------------------------------------------------------

    if not selected_trainings:
        raise HTTPException(
            status_code=400,
            detail="No valid training selected"
        )

    # --------------------------------------------------------
    # Commit registrations
    # --------------------------------------------------------

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to complete registration: {str(exc)}"
            )
        )

    # --------------------------------------------------------
    # Build ONE confirmation email
    # --------------------------------------------------------

    training_blocks = []

    for item in selected_trainings:

        training = item["training"]

        training_block = (
            f"<hr>"
            f"<b>Training:</b> "
            f"{training.s_training_name}<br>"
            f"<b>Date:</b> "
            f"{training.d_training_date}<br>"
            f"<b>Time:</b> "
            f"{training.t_start_time} "
            f"- "
            f"{training.t_end_time}<br><br>"
            f"<b>Microsoft Teams Meeting:</b><br>"
            f"<a href=\"{training.s_teams_meeting_link}\">"
            f"Join Training Meeting"
            f"</a>"
        )

        training_blocks.append(training_block)

    training_details = "".join(training_blocks)

    # --------------------------------------------------------
    # Coordinator email
    # --------------------------------------------------------

    coordinator_email = None

    # Use the coordinator/creator of the first selected
    # training for CC when the email template requires it.

    first_training = selected_trainings[0]["training"]

    if first_training.n_created_by:

        coordinator = (
            db.query(User)
            .filter(
                User.n_user_id
                == first_training.n_created_by,

                User.n_flag == 1,

                User.delete_flag == 0
            )
            .first()
        )

        if coordinator:
            coordinator_email = coordinator.s_email

    # --------------------------------------------------------
    # Send ONE confirmation email
    # --------------------------------------------------------

        try:

            email_result = send_training_email(

                db=db,

                email_type="REGISTRATION_CONFIRMATION",

                to_email=user.s_email,

                training_id=first_training.n_training_id,

                user_id=user.n_user_id,

                coordinator_email=coordinator_email,

                template_variables={

                    "UserName": user.s_user_name,

                    "TrainingName": (
                        "Selected Trainings"
                    ),

                    "TrainingDetails": training_details
                },

                created_by=str(
                    user.n_user_id
                )
            )

        except Exception as exc:

            email_result = {
                "status": "failed",
                "message": "Confirmation email failed",
                "reason": str(exc)
            }


        # ========================================================
        # SAVE EMAIL → TRAINING MAPPING
        # ========================================================

        email_log_id = email_result.get(
            "email_log_id"
        )

        if email_log_id:

            for item in selected_trainings:

                training = item["training"]

                email_log_training = EmailLogTraining(

                    n_email_log_id=email_log_id,

                    n_training_id=(
                        training.n_training_id
                    ),

                    n_flag=1,

                    delete_flag=0,

                    dt_created_at=datetime.now(),

                    s_created_by=str(
                        user.n_user_id
                    )
                )

                db.add(
                    email_log_training
                )

            db.commit()

    # --------------------------------------------------------
    # Update confirmation email status
    # --------------------------------------------------------

    if email_result["status"] == "success":

        for participant in participants_to_update:

            participant.s_confirmation_email_status = "SUCCESS"

            participant.dt_confirmation_email_sent_at = (
                datetime.now()
            )

    else:

        for participant in participants_to_update:

            participant.s_confirmation_email_status = "FAILED"

            participant.dt_confirmation_email_sent_at = None

    db.commit()

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    registered_trainings = []

    for item in selected_trainings:

        training = item["training"]

        registered_trainings.append(
            {
                "n_training_id":
                    training.n_training_id,

                "s_training_code":
                    training.s_training_code,

                "s_training_name":
                    training.s_training_name,

                "d_training_date":
                    training.d_training_date,

                "t_start_time":
                    training.t_start_time,

                "t_end_time":
                    training.t_end_time,

                "s_teams_meeting_link":
                    training.s_teams_meeting_link,

                "already_registered":
                    item["already_registered"]
            }
        )

    return {
        "status": "success",

        "message":
            "Multiple training registration completed",

        "n_user_id":
            user.n_user_id,

        "s_user_name":
            user.s_user_name,

        "s_email":
            user.s_email,

        "confirmation_email_status":
            email_result["status"],

        "trainings":
            registered_trainings
    }

# ============================================================
# GET AVAILABLE TRAININGS
# ============================================================

def get_available_trainings(
    *,
    db: Session,
    registration_token: str
):

    # --------------------------------------------------------
    # Get User
    # --------------------------------------------------------

    user = get_user_from_registration_token(
        db=db,
        registration_token=registration_token
    )

    current_datetime = datetime.now()

    # --------------------------------------------------------
    # Get User's Available Training Participants
    # --------------------------------------------------------

    participants = (
        db.query(TrainingParticipant)
        .filter(
            TrainingParticipant.n_user_id
            == user.n_user_id,

            TrainingParticipant.s_registration_status
            == "AVAILABLE",

            TrainingParticipant.n_flag == 1,

            TrainingParticipant.delete_flag == 0
        )
        .all()
    )

    available_trainings = []

    for participant in participants:

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id
                == participant.n_training_id,

                Training.n_flag == 1,

                Training.delete_flag == 0
            )
            .first()
        )

        if not training:
            continue

        # ----------------------------------------------------
        # Training must be published/open
        # ----------------------------------------------------

        if training.s_status not in [
            "PUBLISHED",
            "OPEN"
        ]:
            continue

        # ----------------------------------------------------
        # Registration period
        # ----------------------------------------------------

        if (
            current_datetime
            < training.dt_registration_start
        ):
            continue

        if (
            current_datetime
            > training.dt_registration_end
        ):
            continue

        # ----------------------------------------------------
        # IMPORTANT
        # Teams link is NOT returned here.
        # ----------------------------------------------------

        available_trainings.append(
            {
                "n_training_id":
                    training.n_training_id,

                "s_training_code":
                    training.s_training_code,

                "s_training_name":
                    training.s_training_name,

                "s_description":
                    training.s_description,

                "d_training_date":
                    training.d_training_date,

                "t_start_time":
                    training.t_start_time,

                "t_end_time":
                    training.t_end_time,

                "dt_registration_start":
                    training.dt_registration_start,

                "dt_registration_end":
                    training.dt_registration_end,

                "s_registration_status":
                    participant.s_registration_status
            }
        )

    return {
        "status": "success",

        "n_user_id":
            user.n_user_id,

        "s_user_name":
            user.s_user_name,

        "s_email":
            user.s_email,

        "trainings":
            available_trainings
    }
