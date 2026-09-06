from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.dependencies import get_db

from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.user import User

from app.services.email_service import send_training_email
from app.schemas.registration import (
    MultipleTrainingRegistrationRequest
)
from app.services.registration_service import (
    get_available_trainings,
    register_multiple_trainings
)

router = APIRouter(
    prefix="/api/registration",
    tags=["Registration"]
)


# ============================================================
# GET REGISTRATION DETAILS
# ============================================================

@router.get("/{registration_token}")
def get_registration_details(
    registration_token: str,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find Participant using registration token
    # --------------------------------------------------------

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
            detail="Invalid registration link"
        )

    # --------------------------------------------------------
    # Get Training
    # --------------------------------------------------------

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

        raise HTTPException(
            status_code=404,
            detail="Training not found"
        )

    # --------------------------------------------------------
    # Check Training Status
    # --------------------------------------------------------

    if training.s_status not in [
        "PUBLISHED",
        "OPEN"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Training is not available"
        )

    # --------------------------------------------------------
    # Check Registration Period
    # --------------------------------------------------------

    current_datetime = datetime.now()

    if (
        current_datetime
        < training.dt_registration_start
    ):

        raise HTTPException(
            status_code=400,
            detail="Registration has not started yet"
        )

    if (
        current_datetime
        > training.dt_registration_end
    ):

        raise HTTPException(
            status_code=400,
            detail="Registration period has ended"
        )

    # --------------------------------------------------------
    # Get User
    # --------------------------------------------------------

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

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # --------------------------------------------------------
    # IMPORTANT
    # Do NOT return Teams meeting link here.
    # --------------------------------------------------------

    return {

        "status": "success",

        "user": {

            "s_employee_id": (
                user.s_employee_id
            ),

            "s_user_name": (
                user.s_user_name
            ),

            "s_email": (
                user.s_email
            )
        },

        "training": {

            "n_training_id": (
                training.n_training_id
            ),

            "s_training_code": (
                training.s_training_code
            ),

            "s_training_name": (
                training.s_training_name
            ),

            "s_description": (
                training.s_description
            ),

            "d_training_date": (
                training.d_training_date
            ),

            "t_start_time": (
                training.t_start_time
            ),

            "t_end_time": (
                training.t_end_time
            ),

            "dt_registration_start": (
                training.dt_registration_start
            ),

            "dt_registration_end": (
                training.dt_registration_end
            )
        },

        "registration": {

            "n_participant_id": (
                participant.n_participant_id
            ),

            "s_registration_status": (
                participant.s_registration_status
            )
        }
    }


@router.post("/{registration_token}/confirm")
def confirm_registration(
    registration_token: str,
    db: Session = Depends(get_db)
):

    # ========================================================
    # Find Participant
    # ========================================================

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

    # ========================================================
    # Already Registered
    # ========================================================

    if participant.s_registration_status == "REGISTERED":

        return {
            "status": "success",
            "message": "User already registered",
            "n_participant_id": participant.n_participant_id
        }

    # ========================================================
    # Get Training
    # ========================================================

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

        raise HTTPException(
            status_code=404,
            detail="Training not found"
        )

    # ========================================================
    # Check Registration Period
    # ========================================================

    now = datetime.now()

    if now < training.dt_registration_start:

        raise HTTPException(
            status_code=400,
            detail="Registration has not started"
        )

    if now > training.dt_registration_end:

        raise HTTPException(
            status_code=400,
            detail="Registration has closed"
        )

    # ========================================================
    # Get User
    # ========================================================

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

    # ========================================================
    # Update Registration
    # ========================================================

    participant.s_registration_status = "REGISTERED"

    participant.dt_registered_at = datetime.now()

    participant.s_confirmation_email_status = "PENDING"

    db.commit()

    # ========================================================
    # Training Details
    # ========================================================

    training_details = (
        f"Training: {training.s_training_name}<br>"
        f"Date: {training.d_training_date}<br>"
        f"Time: {training.t_start_time} "
        f"- {training.t_end_time}<br><br>"
        f"<b>Microsoft Teams Meeting:</b><br>"
        f"<a href=\"{training.s_teams_meeting_link}\">"
        f"Join Training Meeting"
        f"</a>"
    )

    # ========================================================
    # Send Confirmation Email
    # ========================================================

    result = send_training_email(

        db=db,

        email_type="REGISTRATION_CONFIRMATION",

        to_email=user.s_email,

        training_id=training.n_training_id,

        user_id=user.n_user_id,

        template_variables={

            "UserName": user.s_user_name,

            "TrainingName": training.s_training_name,

            "TrainingDetails": training_details

        },

        created_by=str(
            user.n_user_id
        )
    )

    # ========================================================
    # Update Email Status
    # ========================================================

    if result["status"] == "success":

        participant.s_confirmation_email_status = "SUCCESS"

        participant.dt_confirmation_email_sent_at = (
            datetime.now()
        )

    else:

        participant.s_confirmation_email_status = "FAILED"

        participant.dt_confirmation_email_sent_at = None

    db.commit()

    # ========================================================
    # Response
    # ========================================================

    return {

        "status": "success",

        "message": "Registration completed successfully",

        "n_participant_id": (
            participant.n_participant_id
        ),

        "s_registration_status": (
            participant.s_registration_status
        ),

        "confirmation_email_status": (
            participant.s_confirmation_email_status
        ),

        "training": {

            "s_training_name":
                training.s_training_name,

            "d_training_date":
                training.d_training_date,

            "t_start_time":
                training.t_start_time,

            "t_end_time":
                training.t_end_time,

            "s_teams_meeting_link":
                training.s_teams_meeting_link
        }
    }

# ============================================================
# GET AVAILABLE TRAININGS
# ============================================================

@router.get("/{registration_token}/available-trainings")
def get_available_training_list(
    registration_token: str,
    db: Session = Depends(get_db)
):

    return get_available_trainings(
        db=db,
        registration_token=registration_token
    )

# ============================================================
# MULTIPLE TRAINING REGISTRATION
# ============================================================

@router.post("/{registration_token}/confirm-multiple")
def confirm_multiple_registration(
    registration_token: str,
    request: MultipleTrainingRegistrationRequest,
    db: Session = Depends(get_db)
):

    return register_multiple_trainings(
        db=db,
        registration_token=registration_token,
        training_ids=request.training_ids
    )



