from datetime import datetime
import secrets
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request
)
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.training import Training
from app.models.user import User
from app.models.training_participant import TrainingParticipant
from app.services.audit_service import create_audit_log
from app.services.training_email_service import (
    send_training_published_emails,
    send_bulk_training_published_emails,
    get_coordinator_email
)
from app.auth.permissions import require_roles
from app.auth.session import get_current_user_role
from app.schemas.training import (
    TrainingCreate,
    TrainingUpdate,
    TrainingBulkPublishRequest
)

router = APIRouter(
    prefix="/api/trainings",
    tags=["Trainings"]
)

# ============================================================
# GET ALL TRAININGS
# ============================================================

@router.get("")
def get_trainings(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

    training_query = (
        db.query(Training)
        .filter(
            Training.n_flag == 1,
            Training.delete_flag == 0
        )
    )

    role_name = get_current_user_role(
        request=request,
        db=db
    )

    if role_name and role_name.strip().upper() == "COORDINATOR":
        training_query = training_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    trainings = (
        training_query
        .order_by(
            Training.d_training_date.desc(),
            Training.n_training_id.desc()
        )
        .all()
    )

    return {
        "status": "success",
        "count": len(trainings),
        "trainings": [
            {
                "n_training_id": training.n_training_id,
                "s_training_code": training.s_training_code,
                "s_training_name": training.s_training_name,
                "s_description": training.s_description,
                "n_training_month": training.n_training_month,
                "n_training_year": training.n_training_year,
                "d_training_date": training.d_training_date,
                "t_start_time": training.t_start_time,
                "t_end_time": training.t_end_time,
                "dt_registration_start": training.dt_registration_start,
                "dt_registration_end": training.dt_registration_end,
                "s_teams_meeting_link": training.s_teams_meeting_link,
                "n_passing_score": float(
                    training.n_passing_score
                ),
                "n_minimum_attendance_minutes": (
                    training.n_minimum_attendance_minutes
                ),
                "n_assessment_required": (
                    training.n_assessment_required
                ),
                "s_status": training.s_status,
                "n_created_by": training.n_created_by,
                "dt_created_at": training.dt_created_at,
                "n_updated_by": training.n_updated_by,
                "dt_updated_at": training.dt_updated_at
            }
            for training in trainings
        ]
    }


# ============================================================
# GET TRAINING BY ID
# ============================================================

@router.get("/{n_training_id}")
def get_training(
    n_training_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

    training = (
        db.query(Training)
        .filter(
            Training.n_training_id == n_training_id,
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

    role_name = get_current_user_role(
        request=request,
        db=db
    )

    if (
        role_name
        and role_name.strip().upper() == "COORDINATOR"
        and training.n_created_by != current_user.n_user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this training"
        )

    return {
        "status": "success",
        "training": {
            "n_training_id": training.n_training_id,
            "s_training_code": training.s_training_code,
            "s_training_name": training.s_training_name,
            "s_description": training.s_description,
            "n_training_month": training.n_training_month,
            "n_training_year": training.n_training_year,
            "d_training_date": training.d_training_date,
            "t_start_time": training.t_start_time,
            "t_end_time": training.t_end_time,
            "dt_registration_start": training.dt_registration_start,
            "dt_registration_end": training.dt_registration_end,
            "s_teams_meeting_link": training.s_teams_meeting_link,
            "n_passing_score": float(
                training.n_passing_score
            ),
            "n_minimum_attendance_minutes": (
                training.n_minimum_attendance_minutes
            ),
            "n_assessment_required": (
                training.n_assessment_required
            ),
            "s_status": training.s_status,
            "n_created_by": training.n_created_by,
            "dt_created_at": training.dt_created_at,
            "n_updated_by": training.n_updated_by,
            "dt_updated_at": training.dt_updated_at
        }
    }


# ============================================================
# CREATE TRAINING
# ============================================================

@router.post("")
def create_training(
    training_data: TrainingCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

    # --------------------------------------------------------
    # Validate training time
    # --------------------------------------------------------

    if training_data.t_start_time >= training_data.t_end_time:

        raise HTTPException(
            status_code=400,
            detail="Start time must be before end time"
        )

    # --------------------------------------------------------
    # Validate registration period
    # --------------------------------------------------------

    if (
        training_data.dt_registration_start
        >= training_data.dt_registration_end
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Registration start must be before "
                "registration end"
            )
        )

    # --------------------------------------------------------
    # Training start datetime
    # --------------------------------------------------------

    training_start = datetime.combine(
        training_data.d_training_date,
        training_data.t_start_time
    )

    # --------------------------------------------------------
    # Registration must end before training
    # --------------------------------------------------------

    if (
        training_data.dt_registration_end
        > training_start
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Registration must end before "
                "training starts"
            )
        )

    # --------------------------------------------------------
    # Duplicate training code
    # --------------------------------------------------------

    existing_training = (
        db.query(Training)
        .filter(
            Training.s_training_code
            == training_data.s_training_code
        )
        .first()
    )

    if existing_training:

        raise HTTPException(
            status_code=409,
            detail="Training code already exists"
        )

    # --------------------------------------------------------
    # Create training
    # --------------------------------------------------------

    training = Training(
        s_training_code=training_data.s_training_code,
        s_training_name=training_data.s_training_name,
        s_description=training_data.s_description,
        n_training_month=training_data.n_training_month,
        n_training_year=training_data.n_training_year,
        d_training_date=training_data.d_training_date,
        t_start_time=training_data.t_start_time,
        t_end_time=training_data.t_end_time,
        dt_registration_start=(
            training_data.dt_registration_start
        ),
        dt_registration_end=(
            training_data.dt_registration_end
        ),
        s_teams_meeting_link=(
            training_data.s_teams_meeting_link
        ),
        n_passing_score=(
            training_data.n_passing_score
        ),
        n_minimum_attendance_minutes=(
            training_data.n_minimum_attendance_minutes
        ),
        n_assessment_required=(
            training_data.n_assessment_required
        ),
        s_status="DRAFT",

        # Dynamic logged-in user
        n_created_by=current_user.n_user_id,

        n_flag=1,
        delete_flag=0
    )

    db.add(training)

    db.flush()

    # --------------------------------------------------------
    # Audit
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        s_action="CREATE",
        s_module="TRAINING",
        s_entity_type="TRAINING",
        s_entity_id=str(
            training.n_training_id
        ),
        s_description=(
            f"Training created: "
            f"{training.s_training_name}"
        ),
        s_new_value=(
            f"Code={training.s_training_code}; "
            f"Status=DRAFT"
        )
    )

    db.commit()

    db.refresh(training)

    return {
        "status": "success",
        "message": "Training created successfully",
        "n_training_id": training.n_training_id,
        "s_training_code": training.s_training_code,
        "s_status": training.s_status
    }


# ============================================================
# UPDATE TRAINING
# ============================================================

@router.put("/{n_training_id}")
def update_training(
    n_training_id: int,
    training_data: TrainingUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

    training = (
        db.query(Training)
        .filter(
            Training.n_training_id == n_training_id,
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

    role_name = get_current_user_role(
        request=request,
        db=db
    )

    if (
        role_name
        and role_name.strip().upper() == "COORDINATOR"
        and training.n_created_by != current_user.n_user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this training"
        )

    # --------------------------------------------------------
    # Only DRAFT can be edited
    # --------------------------------------------------------

    if training.s_status != "DRAFT":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only DRAFT training can be updated"
            )
        )

    # --------------------------------------------------------
    # Effective values
    # --------------------------------------------------------

    new_date = (
        training_data.d_training_date
        if training_data.d_training_date is not None
        else training.d_training_date
    )

    new_start_time = (
        training_data.t_start_time
        if training_data.t_start_time is not None
        else training.t_start_time
    )

    new_end_time = (
        training_data.t_end_time
        if training_data.t_end_time is not None
        else training.t_end_time
    )

    new_registration_start = (
        training_data.dt_registration_start
        if training_data.dt_registration_start is not None
        else training.dt_registration_start
    )

    new_registration_end = (
        training_data.dt_registration_end
        if training_data.dt_registration_end is not None
        else training.dt_registration_end
    )

    # --------------------------------------------------------
    # Validate time
    # --------------------------------------------------------

    if new_start_time >= new_end_time:

        raise HTTPException(
            status_code=400,
            detail="Start time must be before end time"
        )

    # --------------------------------------------------------
    # Validate registration
    # --------------------------------------------------------

    if (
        new_registration_start
        >= new_registration_end
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Registration start must be before "
                "registration end"
            )
        )

    # --------------------------------------------------------
    # Registration must finish before training
    # --------------------------------------------------------

    training_start = datetime.combine(
        new_date,
        new_start_time
    )

    if new_registration_end > training_start:

        raise HTTPException(
            status_code=400,
            detail=(
                "Registration must end before "
                "training starts"
            )
        )

    # --------------------------------------------------------
    # Old value
    # --------------------------------------------------------

    old_value = (
        f"Name={training.s_training_name}; "
        f"Date={training.d_training_date}; "
        f"Start={training.t_start_time}; "
        f"End={training.t_end_time}; "
        f"Status={training.s_status}"
    )

    # --------------------------------------------------------
    # Update fields
    # --------------------------------------------------------

    update_data = training_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():

        setattr(
            training,
            field,
            value
        )

    training.dt_updated_at = datetime.now()

    # Dynamic logged-in user
    training.n_updated_by = (
        current_user.n_user_id
    )

    # --------------------------------------------------------
    # New value
    # --------------------------------------------------------

    new_value = (
        f"Name={training.s_training_name}; "
        f"Date={training.d_training_date}; "
        f"Start={training.t_start_time}; "
        f"End={training.t_end_time}; "
        f"Status={training.s_status}"
    )

    # --------------------------------------------------------
    # Audit
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        s_action="UPDATE",
        s_module="TRAINING",
        s_entity_type="TRAINING",
        s_entity_id=str(
            training.n_training_id
        ),
        s_description=(
            f"Training updated: "
            f"{training.s_training_name}"
        ),
        s_old_value=old_value,
        s_new_value=new_value
    )

    db.commit()

    db.refresh(training)

    return {
        "status": "success",
        "message": "Training updated successfully",
        "n_training_id": training.n_training_id,
        "s_training_code": training.s_training_code,
        "s_status": training.s_status
    }


# ============================================================
# PUBLISH TRAINING
# ============================================================

@router.post("/{n_training_id}/publish")
def publish_training(
    n_training_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):


    training = (
        db.query(Training)
        .filter(
            Training.n_training_id == n_training_id,
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

    role_name = get_current_user_role(
        request=request,
        db=db
    )

    if (
        role_name
        and role_name.strip().upper() == "COORDINATOR"
        and training.n_created_by != current_user.n_user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to publish this training"
        )

    # --------------------------------------------------------
    # Only DRAFT
    # --------------------------------------------------------

    if training.s_status != "DRAFT":

        raise HTTPException(
            status_code=400,
            detail=(
                f"Training cannot be published because "
                f"current status is {training.s_status}"
            )
        )

    # --------------------------------------------------------
    # Registration period
    # --------------------------------------------------------

    if (
        training.dt_registration_start
        >= training.dt_registration_end
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid registration period"
        )

    # --------------------------------------------------------
    # Training date/time
    # --------------------------------------------------------

    training_start = datetime.combine(
        training.d_training_date,
        training.t_start_time
    )

    training_end = datetime.combine(
        training.d_training_date,
        training.t_end_time
    )

    if training_start >= training_end:

        raise HTTPException(
            status_code=400,
            detail=(
                "Training start time must be "
                "before end time"
            )
        )

    # --------------------------------------------------------
    # Active users
    # --------------------------------------------------------

    users_query = (
        db.query(User)
        .filter(
            User.n_flag == 1,
            User.delete_flag == 0
        )
    )

    if role_name and role_name.strip().upper() == "COORDINATOR":
        users_query = users_query.filter(
            User.s_created_by == current_user.s_email
        )

    users = users_query.all()

    if not users:

        raise HTTPException(
            status_code=400,
            detail="No active users found"
        )

    participant_count = 0
    existing_count = 0

    try:

        for user in users:

            existing_participant = (
                db.query(
                    TrainingParticipant
                )
                .filter(
                    TrainingParticipant.n_training_id
                    == training.n_training_id,

                    TrainingParticipant.n_user_id
                    == user.n_user_id
                )
                .first()
            )

            if existing_participant:

                existing_count += 1

                continue

            participant = TrainingParticipant(

                n_training_id=(
                    training.n_training_id
                ),

                n_user_id=(
                    user.n_user_id
                ),

                s_registration_token=(
                    secrets.token_urlsafe(32)
                ),

                s_registration_status="AVAILABLE",

                dt_registered_at=None,

                s_registration_email_status=(
                    "PENDING"
                ),

                dt_registration_email_sent_at=None,

                s_confirmation_email_status=(
                    "PENDING"
                ),

                dt_confirmation_email_sent_at=None,

                s_attendance_status=(
                    "NOT_PROCESSED"
                ),

                n_attendance_minutes=None,

                dt_attendance_processed_at=None,

                n_assessment_eligible=0,

                s_assessment_email_status=(
                    "PENDING"
                ),

                dt_assessment_email_sent_at=None,

                n_attempt_count=0,

                n_reattempt_count=0,

                n_final_score=None,

                s_final_result=None,

                n_flag=1,

                delete_flag=0,

                dt_created_at=datetime.now(),

                s_created_by=str(
                    current_user.n_user_id
                ),

                dt_updated_at=None,

                s_updated_by=None
            )

            db.add(participant)

            participant_count += 1

        # ----------------------------------------------------
        # Update training
        # ----------------------------------------------------

        training.s_status = "PUBLISHED"

        training.n_updated_by = (
            current_user.n_user_id
        )

        training.dt_updated_at = (
            datetime.now()
        )

        # ----------------------------------------------------
        # Audit
        # ----------------------------------------------------

        create_audit_log(
            db=db,
            s_action="PUBLISH",
            s_module="TRAINING",
            s_entity_type="TRAINING",
            s_entity_id=str(
                training.n_training_id
            ),
            s_description=(
                f"Training published: "
                f"{training.s_training_name}. "
                f"Participants created: "
                f"{participant_count}"
            ),
            s_old_value="Status=DRAFT",
            s_new_value=(
                f"Status=PUBLISHED; "
                f"Participants={participant_count}"
            )
        )

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Training publish failed. "
                "No changes were committed."
            )
        )

    # --------------------------------------------------------
    # Send email
    # --------------------------------------------------------

    try:

        coordinator_email = (
            get_coordinator_email(
                db,
                training
            )
        )

        email_result = (
            send_training_published_emails(
                db=db,
                training_id=(
                    training.n_training_id
                ),
                coordinator_email=(
                    coordinator_email
                ),
                created_by=str(
                    current_user.n_user_id
                )
            )
        )

    except Exception as exc:

        email_result = {
            "status": "failed",
            "message": (
                "Training published successfully, "
                "but email processing failed"
            ),
            "reason": str(exc)
        }

    return {
        "status": "success",
        "message": "Training published successfully",
        "n_training_id": training.n_training_id,
        "s_training_code": training.s_training_code,
        "s_status": training.s_status,
        "total_active_users": len(users),
        "participants_created": (
            participant_count
        ),
        "participants_already_exist": (
            existing_count
        ),
        "email_result": email_result
    }

# ============================================================
# BULK PUBLISH TRAININGS
# ============================================================

@router.post("/bulk-publish")
def bulk_publish_trainings(
    request: TrainingBulkPublishRequest,
    request_http: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "COORDINATOR"
        )
    )
):

    role_name = get_current_user_role(
        request=request_http,
        db=db
    )

    # --------------------------------------------------------
    # Remove duplicate IDs
    # --------------------------------------------------------

    training_ids = list(
        dict.fromkeys(
            request.training_ids
        )
    )

    if not training_ids:
        raise HTTPException(
            status_code=400,
            detail="No training IDs provided"
        )

    # --------------------------------------------------------
    # Load selected trainings
    # --------------------------------------------------------

    training_query = (
        db.query(Training)
        .filter(
            Training.n_training_id.in_(
                training_ids
            ),
            Training.n_flag == 1,
            Training.delete_flag == 0
        )
    )

    if role_name and role_name.strip().upper() == "COORDINATOR":
        training_query = training_query.filter(
            Training.n_created_by == current_user.n_user_id
        )

    trainings = training_query.all()

    training_map = {
        training.n_training_id: training
        for training in trainings
    }

    missing_ids = [
        training_id
        for training_id in training_ids
        if training_id not in training_map
    ]

    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=(
                "Training not found for IDs: "
                + ", ".join(
                    str(training_id)
                    for training_id in missing_ids
                )
            )
        )

    # --------------------------------------------------------
    # Only DRAFT trainings can be bulk published
    # --------------------------------------------------------

    non_draft_trainings = [
        training
        for training in trainings
        if training.s_status != "DRAFT"
    ]

    if non_draft_trainings:

        details = [
            (
                f"{training.s_training_code} "
                f"({training.s_status})"
            )
            for training in non_draft_trainings
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Only DRAFT trainings can be bulk published. "
                + ", ".join(details)
            )
        )

    # --------------------------------------------------------
    # Active users
    # --------------------------------------------------------

    users_query = (
        db.query(User)
        .filter(
            User.n_flag == 1,
            User.delete_flag == 0
        )
    )

    if role_name and role_name.strip().upper() == "COORDINATOR":
        users_query = users_query.filter(
            User.s_created_by == current_user.s_email
        )

    users = users_query.all()

    if not users:
        raise HTTPException(
            status_code=400,
            detail="No active users found"
        )

    results = []
    published_count = 0
    failed_count = 0
    published_training_ids = []

    # --------------------------------------------------------
    # Publish selected trainings
    # --------------------------------------------------------

    for training_id in training_ids:

        training = training_map[training_id]

        try:

            # Validate registration period
            if (
                training.dt_registration_start
                >= training.dt_registration_end
            ):
                raise ValueError(
                    "Invalid registration period"
                )

            # Validate training date/time
            training_start = datetime.combine(
                training.d_training_date,
                training.t_start_time
            )

            training_end = datetime.combine(
                training.d_training_date,
                training.t_end_time
            )

            if training_start >= training_end:
                raise ValueError(
                    "Training start time must be before "
                    "training end time"
                )

            participant_count = 0
            existing_count = 0

            # Create participant row for every active user.
            for user in users:

                existing_participant = (
                    db.query(
                        TrainingParticipant
                    )
                    .filter(
                        TrainingParticipant.n_training_id
                        == training.n_training_id,

                        TrainingParticipant.n_user_id
                        == user.n_user_id
                    )
                    .first()
                )

                if existing_participant:
                    existing_count += 1
                    continue

                participant = TrainingParticipant(
                    n_training_id=(
                        training.n_training_id
                    ),
                    n_user_id=user.n_user_id,
                    s_registration_token=(
                        secrets.token_urlsafe(32)
                    ),
                    s_registration_status="AVAILABLE",
                    dt_registered_at=None,
                    s_registration_email_status="PENDING",
                    dt_registration_email_sent_at=None,
                    s_confirmation_email_status="PENDING",
                    dt_confirmation_email_sent_at=None,
                    s_attendance_status="NOT_PROCESSED",
                    n_attendance_minutes=None,
                    dt_attendance_processed_at=None,
                    n_assessment_eligible=0,
                    s_assessment_email_status="PENDING",
                    dt_assessment_email_sent_at=None,
                    n_attempt_count=0,
                    n_reattempt_count=0,
                    n_final_score=None,
                    s_final_result=None,
                    n_flag=1,
                    delete_flag=0,
                    dt_created_at=datetime.now(),
                    s_created_by=str(
                        current_user.n_user_id
                    ),
                    dt_updated_at=None,
                    s_updated_by=None
                )

                db.add(participant)
                participant_count += 1

            # Publish training.
            training.s_status = "PUBLISHED"

            training.n_updated_by = (
                current_user.n_user_id
            )

            training.dt_updated_at = datetime.now()

            # Audit.
            create_audit_log(
                db=db,
                s_action="PUBLISH",
                s_module="TRAINING",
                s_entity_type="TRAINING",
                s_entity_id=str(
                    training.n_training_id
                ),
                s_description=(
                    f"Training bulk published: "
                    f"{training.s_training_name}. "
                    f"Participants created: "
                    f"{participant_count}"
                ),
                s_old_value="Status=DRAFT",
                s_new_value=(
                    f"Status=PUBLISHED; "
                    f"Participants={participant_count}; "
                    f"BulkPublish=1"
                )
            )

            # Commit this training and its participants.
            db.commit()

            published_count += 1
            published_training_ids.append(
                training.n_training_id
            )

            results.append(
                {
                    "n_training_id": (
                        training.n_training_id
                    ),
                    "s_training_code": (
                        training.s_training_code
                    ),
                    "s_training_name": (
                        training.s_training_name
                    ),
                    "status": "success",
                    "participant_count": (
                        participant_count
                    ),
                    "existing_participant_count": (
                        existing_count
                    )
                }
            )

        except Exception as exc:

            db.rollback()

            failed_count += 1

            results.append(
                {
                    "n_training_id": (
                        training.n_training_id
                    ),
                    "s_training_code": (
                        training.s_training_code
                    ),
                    "s_training_name": (
                        training.s_training_name
                    ),
                    "status": "failed",
                    "message": str(exc)
                }
            )

    # --------------------------------------------------------
    # ONE COMBINED EMAIL PER USER
    # --------------------------------------------------------

    bulk_email_result = {
        "status": "not_processed",
        "training_count": 0,
        "total_users": 0,
        "emails_sent": 0,
        "emails_failed": 0,
        "emails_skipped": 0
    }

    if published_training_ids:

        try:

            coordinator_emails = []

            # Collect unique coordinators of all successfully
            # published trainings.
            for training_id in published_training_ids:

                training = training_map[
                    training_id
                ]

                coordinator_email = (
                    get_coordinator_email(
                        db=db,
                        training=training
                    )
                )

                if not coordinator_email:
                    continue

                if coordinator_email.lower() not in {
                    email.lower()
                    for email in coordinator_emails
                }:
                    coordinator_emails.append(
                        coordinator_email
                    )

            # IMPORTANT:
            # One call handles the whole selected batch and sends
            # ONE email to each user containing all trainings.
            bulk_email_result = (
                send_bulk_training_published_emails(
                    db=db,
                    training_ids=(
                        published_training_ids
                    ),
                    coordinator_emails=(
                        coordinator_emails
                    ),
                    created_by=str(
                        current_user.n_user_id
                    )
                )
            )

        except Exception as email_exc:

            bulk_email_result = {
                "status": "failed",
                "training_count": len(
                    published_training_ids
                ),
                "total_users": len(users),
                "emails_sent": 0,
                "emails_failed": len(users),
                "emails_skipped": 0,
                "reason": str(email_exc)
            }

    # --------------------------------------------------------
    # Add combined email result to successful training rows.
    # --------------------------------------------------------

    for result in results:

        if result.get("status") == "success":
            result["email_result"] = (
                bulk_email_result
            )

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {
        "status": (
            "completed"
            if failed_count == 0
            else "completed_with_errors"
        ),
        "message": (
            "Bulk training publish completed"
        ),
        "total_requested": len(
            training_ids
        ),
        "published_count": published_count,
        "failed_count": failed_count,
        "results": results,
        "bulk_email_result": bulk_email_result
    }

