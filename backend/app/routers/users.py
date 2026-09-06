from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.auth.permissions import require_roles
from app.database.dependencies import get_db

from app.models.user import User
from app.models.coordinator_user import CoordinatorUser

from app.models.role import Role
from app.models.user_role import UserRole

from app.schemas.user import (
    UserCreate,
    UserUpdate,
)

from app.services.audit_service import create_audit_log

from app.services.user_upload_service import (
    process_user_excel,
    import_valid_users
)


router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

# ============================================================
# ROLE HELPERS
# ============================================================

def user_has_admin_role(
    db: Session,
    n_user_id: int
) -> bool:

    return (
        db.query(UserRole)
        .join(
            Role,
            Role.n_role_id == UserRole.n_role_id
        )
        .filter(
            UserRole.n_user_id == n_user_id,
            UserRole.n_flag == 1,
            UserRole.delete_flag == 0,
            Role.s_role_name == "ADMIN",
            Role.n_flag == 1,
            Role.delete_flag == 0
        )
        .first()
        is not None
    )


def protect_admin_target(
    db: Session,
    current_user: User,
    target_user: User,
    action: str
) -> None:

    target_is_admin = user_has_admin_role(
        db=db,
        n_user_id=target_user.n_user_id
    )

    if not target_is_admin:
        return

    current_user_is_admin = user_has_admin_role(
        db=db,
        n_user_id=current_user.n_user_id
    )

    if not current_user_is_admin:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Coordinator cannot {action} an ADMIN user"
            )
        )

def coordinator_has_user_mapping(
    db: Session,
    coordinator_id: int,
    user_id: int
) -> bool:

    return (
        db.query(CoordinatorUser)
        .filter(
            CoordinatorUser.n_coordinator_id == coordinator_id,
            CoordinatorUser.n_user_id == user_id,
            CoordinatorUser.n_flag == 1,
            CoordinatorUser.delete_flag == 0
        )
        .first()
        is not None
    )

def get_active_admin_count(
    db: Session
) -> int:

    return (
        db.query(UserRole)
        .join(
            Role,
            Role.n_role_id == UserRole.n_role_id
        )
        .join(
            User,
            User.n_user_id == UserRole.n_user_id
        )
        .filter(
            UserRole.n_flag == 1,
            UserRole.delete_flag == 0,
            Role.s_role_name == "ADMIN",
            Role.n_flag == 1,
            Role.delete_flag == 0,
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .count()
    )

# ============================================================
# GET ALL USERS
# ============================================================

@router.get("")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    is_admin = user_has_admin_role(
        db=db,
        n_user_id=current_user.n_user_id
    )

    if is_admin:

        users = (
            db.query(User)
            .filter(
                User.delete_flag == 0
            )
            .order_by(
                User.n_user_id.desc()
            )
            .all()
        )

    else:

        users = (
            db.query(User)
            .join(
                CoordinatorUser,
                CoordinatorUser.n_user_id == User.n_user_id
            )
            .filter(
                CoordinatorUser.n_coordinator_id
                == current_user.n_user_id,

                CoordinatorUser.n_flag == 1,
                CoordinatorUser.delete_flag == 0,

                User.delete_flag == 0
            )
            .order_by(
                User.n_user_id.desc()
            )
            .all()
        )

    return {
        "status": "success",
        "count": len(users),
        "users": [
            {
                "n_user_id": user.n_user_id,
                "s_employee_id": user.s_employee_id,
                "s_user_name": user.s_user_name,
                "s_email": user.s_email,
                "n_flag": user.n_flag,
                "delete_flag": user.delete_flag
            }
            for user in users
        ]
    }


# ============================================================
# GET USER BY ID
# ============================================================

@router.get("/{n_user_id}")
def get_user(
    n_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    user = (
        db.query(User)
        .filter(
            User.n_user_id == n_user_id,
            User.delete_flag == 0
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not user_has_admin_role(
        db=db,
        n_user_id=current_user.n_user_id
    ):
        user_mapping = (
            db.query(CoordinatorUser)
            .filter(
                CoordinatorUser.n_coordinator_id
                == current_user.n_user_id,

                CoordinatorUser.n_user_id
                == user.n_user_id,

                CoordinatorUser.n_flag == 1,
                CoordinatorUser.delete_flag == 0
            )
            .first()
        )

        if not user_mapping:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this user"
            )

    return {
        "status": "success",
        "user": {
            "n_user_id": user.n_user_id,
            "s_employee_id": user.s_employee_id,
            "s_user_name": user.s_user_name,
            "s_email": user.s_email,
            "n_flag": user.n_flag,
            "delete_flag": user.delete_flag
        }
    }


# ============================================================
# CREATE USER
# ============================================================

@router.post("")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    email = str(user_data.s_email).strip().lower()

    existing_user = (
        db.query(User)
        .filter(
            User.s_email == email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="User with this email already exists"
        )

    user = User(
        s_employee_id=(
            user_data.s_employee_id.strip()
            if user_data.s_employee_id
            else None
        ),
        s_user_name=(
            user_data.s_user_name.strip()
            if user_data.s_user_name
            else None
        ),
        s_email=email,
        n_flag=1,
        delete_flag=0,
        s_created_by=current_user.s_email
    )

    db.add(user)
    db.flush()

    # --------------------------------------------------------
    # Assign newly created user to the Coordinator
    # --------------------------------------------------------

    if not user_has_admin_role(
        db=db,
        n_user_id=current_user.n_user_id
    ):
        coordinator_user = CoordinatorUser(
            n_coordinator_id=current_user.n_user_id,
            n_user_id=user.n_user_id,
            n_flag=1,
            delete_flag=0,
            s_created_by=current_user.s_email
        )

        db.add(coordinator_user)

    create_audit_log(
        db=db,
        s_action="CREATE",
        s_module="USER",
        n_user_id=current_user.n_user_id,
        s_entity_type="USER",
        s_entity_id=str(user.n_user_id),
        s_description=(
            f"User created: {user.s_email} "
            f"by {current_user.s_email}"
        ),
        s_new_value=(
            f"Employee ID={user.s_employee_id}; "
            f"Name={user.s_user_name}; "
            f"Email={user.s_email}; "
            f"Performed By={current_user.n_user_id}"
        )
    )

    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "User created successfully",
        "n_user_id": user.n_user_id
    }


# ============================================================
# UPDATE USER
# ============================================================

@router.put("/{n_user_id}")
def update_user(
    n_user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    user = (
        db.query(User)
        .filter(
            User.n_user_id == n_user_id,
            User.delete_flag == 0
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    protect_admin_target(
        db=db,
        current_user=current_user,
        target_user=user,
        action="update"
    )

    # --------------------------------------------------------
    # Coordinator can update only assigned users.
    # ADMIN can update any user.
    # --------------------------------------------------------

    if not user_has_admin_role(
        db=db,
        n_user_id=current_user.n_user_id
    ):
        if not coordinator_has_user_mapping(
            db=db,
            coordinator_id=current_user.n_user_id,
            user_id=user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to update this user"
            )

    old_value = (
        f"Employee ID={user.s_employee_id}; "
        f"Name={user.s_user_name}; "
        f"Email={user.s_email}"
    )

    if user_data.s_employee_id is not None:
        user.s_employee_id = (
            user_data.s_employee_id.strip()
            or None
        )

    if user_data.s_user_name is not None:
        user.s_user_name = (
            user_data.s_user_name.strip()
            or None
        )

    if user_data.s_email is not None:

        email = (
            str(user_data.s_email)
            .strip()
            .lower()
        )

        existing_user = (
            db.query(User)
            .filter(
                User.s_email == email,
                User.n_user_id != n_user_id,
                User.delete_flag == 0
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Another user already has this email"
            )

        user.s_email = email

    user.dt_updated_at = datetime.now()
    user.s_updated_by = current_user.s_email

    new_value = (
        f"Employee ID={user.s_employee_id}; "
        f"Name={user.s_user_name}; "
        f"Email={user.s_email}"
    )

    create_audit_log(
        db=db,
        s_action="UPDATE",
        s_module="USER",
        n_user_id=current_user.n_user_id,
        s_entity_type="USER",
        s_entity_id=str(user.n_user_id),
        s_description=(
            f"User updated: {user.s_email} "
            f"by {current_user.s_email}"
        ),
        s_old_value=old_value,
        s_new_value=(
            f"{new_value}; "
            f"Performed By={current_user.n_user_id}"
        )
    )

    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "User updated successfully"
    }


# ============================================================
# DEACTIVATE USER
# ============================================================

@router.patch("/{n_user_id}/deactivate")
def deactivate_user(
    n_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    user = (
        db.query(User)
        .filter(
            User.n_user_id == n_user_id,
            User.delete_flag == 0
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    protect_admin_target(
        db=db,
        current_user=current_user,
        target_user=user,
        action="deactivate"
    )

    # --------------------------------------------------------
    # Coordinator can deactivate only assigned users.
    # ADMIN can deactivate any user.
    # --------------------------------------------------------

    if not user_has_admin_role(
        db=db,
        n_user_id=current_user.n_user_id
    ):
        if not coordinator_has_user_mapping(
            db=db,
            coordinator_id=current_user.n_user_id,
            user_id=user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to deactivate this user"
            )

    if user.n_flag == 0:
        raise HTTPException(
            status_code=400,
            detail="User is already inactive"
        )

    user.n_flag = 0
    user.dt_updated_at = datetime.now()
    user.s_updated_by = current_user.s_email

    create_audit_log(
        db=db,
        s_action="DEACTIVATE",
        s_module="USER",
        n_user_id=current_user.n_user_id,
        s_entity_type="USER",
        s_entity_id=str(user.n_user_id),
        s_description=(
            f"User deactivated: {user.s_email} "
            f"by {current_user.s_email}"
        ),
        s_old_value="n_flag=1",
        s_new_value=(
            "n_flag=0; "
            f"Performed By={current_user.n_user_id}"
        )
    )

    db.commit()

    return {
        "status": "success",
        "message": "User deactivated successfully"
    }


# ============================================================
# ACTIVATE USER
# ============================================================

@router.patch("/{n_user_id}/activate")
def activate_user(
    n_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    user = (
        db.query(User)
        .filter(
            User.n_user_id == n_user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    protect_admin_target(
        db=db,
        current_user=current_user,
        target_user=user,
        action="activate"
    )

    # --------------------------------------------------------
    # Coordinator can activate only assigned users.
    # ADMIN can activate any user.
    # --------------------------------------------------------

    if not user_has_admin_role(
        db=db,
        n_user_id=current_user.n_user_id
    ):
        if not coordinator_has_user_mapping(
            db=db,
            coordinator_id=current_user.n_user_id,
            user_id=user.n_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to activate this user"
            )

    if user.n_flag == 1 and user.delete_flag == 0:
        raise HTTPException(
            status_code=400,
            detail="User is already active"
        )

    old_value = (
        f"n_flag={user.n_flag}; "
        f"delete_flag={user.delete_flag}"
    )

    user.n_flag = 1
    user.delete_flag = 0
    user.dt_updated_at = datetime.now()
    user.s_updated_by = current_user.s_email

    create_audit_log(
        db=db,
        s_action="ACTIVATE",
        s_module="USER",
        n_user_id=current_user.n_user_id,
        s_entity_type="USER",
        s_entity_id=str(user.n_user_id),
        s_description=(
            f"User activated: {user.s_email} "
            f"by {current_user.s_email}"
        ),
        s_old_value=old_value,

        s_new_value=(
            "n_flag=1; delete_flag=0; "
            f"Performed By={current_user.n_user_id}"
        )
    )

    db.commit()

    return {
        "status": "success",
        "message": "User activated successfully"
    }


# ============================================================
# EXCEL UPLOAD - PREVIEW
# ============================================================

@router.post("/upload/preview")
async def preview_user_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File is required"
        )

    allowed_extensions = [
        ".xlsx",
        ".xls"
    ]

    extension = file.filename.lower()

    if not any(
        extension.endswith(ext)
        for ext in allowed_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail="Only Excel files are allowed"
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    try:

        result = process_user_excel(
            file_content,
            db,
            None
            if user_has_admin_role(
                db=db,
                n_user_id=current_user.n_user_id
            )
            else current_user.n_user_id
        )

        return {
            "status": "success",
            "message": "Excel validated successfully",
            "filename": file.filename,
            "summary": {
                "total_rows": result["total_rows"],
                "valid_rows": result["valid_rows"],
                "duplicate_file_rows": result[
                    "duplicate_file_rows"
                ],
                "existing_user_rows": result[
                    "existing_user_rows"
                ],
                "invalid_rows": result["invalid_rows"]
            },
            "rows": result["rows"]
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to process Excel file: {str(exc)}"
        )


# ============================================================
# EXCEL UPLOAD - IMPORT
# ============================================================

@router.post("/upload/import")
async def import_users(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "COORDINATOR")
    )
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File is required"
        )

    allowed_extensions = [
        ".xlsx",
        ".xls"
    ]

    filename = file.filename.lower()

    if not any(
        filename.endswith(ext)
        for ext in allowed_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail="Only Excel files are allowed"
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    try:

        result = import_valid_users(
            file_content,
            db,
            current_user.s_email,
            None
            if user_has_admin_role(
                db=db,
                n_user_id=current_user.n_user_id
            )
            else current_user.n_user_id
        )

        create_audit_log(
            db=db,
            s_action="IMPORT",
            s_module="USER",
            n_user_id=current_user.n_user_id,
            s_entity_type="USER_IMPORT",
            s_entity_id=file.filename,
            s_description=(
                f"User Excel imported by "
                f"{current_user.s_email}"
            ),
            s_new_value=(
                f"Imported={result['imported_count']}; "
                f"Skipped={result['skipped_count']}; "
                f"Performed By={current_user.n_user_id}"
            )
        )

        db.commit()

        return {
            "status": "success",
            "message": "User import completed successfully",
            "filename": file.filename,
            "imported_count": result["imported_count"],
            "skipped_count": result["skipped_count"],
            "imported_users": result["imported_users"],
            "skipped_users": result["skipped_users"]
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Unable to import users: {str(exc)}"
        )