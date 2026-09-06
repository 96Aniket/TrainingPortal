from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
    HTTPException,
    Request
)

from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.auth.permissions import require_roles
from app.models.user import User
from app.models.training import Training
from app.auth.session import get_current_user_role

from app.services.attendance_service import (
    process_attendance_report
)

from app.services.attendance_report_service import (
    get_training_attendance_report
)

def ensure_training_access(
    request: Request,
    db: Session,
    current_user: User,
    training_id: int
) -> Training:

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

    return training


router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance"]
)




@router.post("/upload")
def upload_attendance_report(
    request: Request,
    training_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):
    ensure_training_access(
        request=request,
        db=db,
        current_user=current_user,
        training_id=training_id
    )

    # ----------------------------------------------------------
    # Validate file extension
    # ----------------------------------------------------------

    allowed_extensions = (
        ".xlsx",
        ".xlsm",
        ".csv"
    )

    file_name = (
        file.filename or ""
    )

    if not file_name.lower().endswith(
        allowed_extensions
    ):

        return {
            "status": "failed",
            "message": (
                "Only Excel files are allowed"
            )
        }

    # ----------------------------------------------------------
    # Read file
    # ----------------------------------------------------------

    file_bytes = file.file.read()

    if not file_bytes:

        return {
            "status": "failed",
            "message": (
                "Uploaded file is empty"
            )
        }

    # ----------------------------------------------------------
    # Process report
    # ----------------------------------------------------------

    try:

        result = process_attendance_report(

            db=db,

            training_id=training_id,

            file_bytes=file_bytes,

            file_name=file_name,

            uploaded_by=current_user.n_user_id
        )

        return result

    except ValueError as exc:

        return {
            "status": "failed",
            "message": str(exc)
        }

    except Exception as exc:

        db.rollback()

        return {
            "status": "failed",
            "message": (
                "Attendance processing failed"
            ),
            "reason": str(exc)
        }

# ==========================================================
# GET TRAINING ATTENDANCE REPORT
# ADMIN + COORDINATOR
# ==========================================================

@router.get("/training/{training_id}")
def get_training_attendance_api(
    training_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    ensure_training_access(
        request=request,
        db=db,
        current_user=current_user,
        training_id=training_id
    )

    try:

        return get_training_attendance_report(
            db=db,
            training_id=training_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Unable to load attendance report"
        )