from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.auth.permissions import require_roles
from app.database.dependencies import get_db

from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole

from app.schemas.role import AssignRoleRequest

from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/roles",
    tags=["Roles"]
)


# ============================================================
# GET ALL ACTIVE ROLES
# ============================================================

@router.get("")
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    roles = (
        db.query(Role)
        .filter(
            Role.n_flag == 1,
            Role.delete_flag == 0
        )
        .order_by(
            Role.n_role_id
        )
        .all()
    )

    return {
        "status": "success",
        "count": len(roles),
        "roles": [
            {
                "n_role_id": role.n_role_id,
                "s_role_name": role.s_role_name,
                "s_description": role.s_description,
                "n_flag": role.n_flag,
                "delete_flag": role.delete_flag
            }
            for role in roles
        ]
    }


# ============================================================
# GET COORDINATORS
# ============================================================

@router.get("/coordinators")
def get_coordinators(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    coordinators = (
        db.query(
            User,
            UserRole,
            Role
        )
        .join(
            UserRole,
            User.n_user_id == UserRole.n_user_id
        )
        .join(
            Role,
            UserRole.n_role_id == Role.n_role_id
        )
        .filter(
            Role.s_role_name == "COORDINATOR",

            UserRole.n_flag == 1,
            UserRole.delete_flag == 0,

            User.n_flag == 1,
            User.delete_flag == 0,

            Role.n_flag == 1,
            Role.delete_flag == 0
        )
        .order_by(
            User.n_user_id
        )
        .all()
    )

    return {
        "status": "success",
        "count": len(coordinators),
        "coordinators": [
            {
                "n_user_id": user.n_user_id,
                "s_employee_id": user.s_employee_id,
                "s_user_name": user.s_user_name,
                "s_email": user.s_email,
                "n_role_id": role.n_role_id,
                "s_role_name": role.s_role_name
            }
            for user, user_role, role in coordinators
        ]
    }


# ============================================================
# GET ALL ACTIVE USERS WITH ROLES
# ============================================================

@router.get("/users")
def get_users_with_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    users = (
        db.query(User)
        .filter(
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .order_by(
            User.n_user_id
        )
        .all()
    )

    result = []

    for user in users:

        roles = (
            db.query(Role)
            .join(
                UserRole,
                UserRole.n_role_id == Role.n_role_id
            )
            .filter(
                UserRole.n_user_id == user.n_user_id,

                UserRole.n_flag == 1,
                UserRole.delete_flag == 0,

                Role.n_flag == 1,
                Role.delete_flag == 0
            )
            .order_by(
                Role.n_role_id
            )
            .all()
        )

        result.append(
            {
                "n_user_id": user.n_user_id,
                "s_employee_id": user.s_employee_id,
                "s_user_name": user.s_user_name,
                "s_email": user.s_email,
                "roles": [
                    {
                        "n_role_id": role.n_role_id,
                        "s_role_name": role.s_role_name
                    }
                    for role in roles
                ]
            }
        )

    return {
        "status": "success",
        "count": len(result),
        "users": result
    }


# ============================================================
# ASSIGN ROLE
# ============================================================

@router.post("/assign")
def assign_role(
    request: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    role_name = (
        request.s_role_name
        .strip()
        .upper()
    )

    # --------------------------------------------------------
    # Find target user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.n_user_id == request.n_user_id,
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found or inactive"
        )

    # --------------------------------------------------------
    # Find role
    # --------------------------------------------------------

    role = (
        db.query(Role)
        .filter(
            Role.s_role_name == role_name,
            Role.n_flag == 1,
            Role.delete_flag == 0
        )
        .first()
    )

    if not role:

        raise HTTPException(
            status_code=404,
            detail=f"Role '{role_name}' not found"
        )

    # --------------------------------------------------------
    # Find existing role assignment
    # --------------------------------------------------------

    existing_role = (
        db.query(UserRole)
        .filter(
            UserRole.n_user_id == user.n_user_id,
            UserRole.n_role_id == role.n_role_id
        )
        .first()
    )

    # --------------------------------------------------------
    # Already active
    # --------------------------------------------------------

    if existing_role:

        if (
            existing_role.n_flag == 1
            and existing_role.delete_flag == 0
        ):
            raise HTTPException(
                status_code=409,
                detail="User already has this role"
            )

        # ----------------------------------------------------
        # Reactivate existing assignment
        # ----------------------------------------------------

        existing_role.n_flag = 1
        existing_role.delete_flag = 0
        existing_role.dt_updated_at = datetime.now()
        existing_role.s_updated_by = str(
            current_user.n_user_id
        )

        create_audit_log(
            db=db,
            s_action="ASSIGN_ROLE",
            s_module="ROLE",
            n_user_id=current_user.n_user_id,
            s_entity_type="USER_ROLE",
            s_entity_id=str(
                existing_role.n_user_role_id
            ),
            s_description=(
                f"Role reactivated: "
                f"{role.s_role_name} "
                f"for user {user.n_user_id}"
            ),
            s_new_value=(
                f"User={user.n_user_id}; "
                f"Role={role.s_role_name}; "
                f"Status=ACTIVE"
            )
        )

        db.commit()

        return {
            "status": "success",
            "message": (
                f"{role.s_role_name} role assigned successfully"
            ),
            "n_user_role_id": (
                existing_role.n_user_role_id
            )
        }

    # --------------------------------------------------------
    # Assign role
    # --------------------------------------------------------

    user_role = UserRole(
        n_user_id=user.n_user_id,
        n_role_id=role.n_role_id,
        n_flag=1,
        delete_flag=0,
        s_created_by=str(
            current_user.n_user_id
        )
    )

    db.add(user_role)

    db.flush()

    # --------------------------------------------------------
    # Audit
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        s_action="ASSIGN_ROLE",
        s_module="ROLE",
        n_user_id=current_user.n_user_id,
        s_entity_type="USER_ROLE",
        s_entity_id=str(
            user_role.n_user_role_id
        ),
        s_description=(
            f"Role '{role.s_role_name}' assigned to "
            f"{user.s_email} by "
            f"{current_user.s_email}"
        ),
        s_new_value=(
            f"Target User ID={user.n_user_id}; "
            f"Role ID={role.n_role_id}; "
            f"Role={role.s_role_name}; "
            f"Performed By={current_user.n_user_id}"
        )
    )

    db.commit()

    db.refresh(user_role)

    return {
        "status": "success",
        "message": (
            f"Role '{role.s_role_name}' assigned successfully"
        ),
        "n_user_role_id": (
            user_role.n_user_role_id
        )
    }


# ============================================================
# REMOVE ROLE
# ============================================================

@router.delete("/remove")
def remove_role(
    request: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    role_name = (
        request.s_role_name
        .strip()
        .upper()
    )

    # --------------------------------------------------------
    # Find target user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.n_user_id == request.n_user_id,
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found or inactive"
        )

    # --------------------------------------------------------
    # Find role
    # --------------------------------------------------------

    role = (
        db.query(Role)
        .filter(
            Role.s_role_name == role_name,
            Role.n_flag == 1,
            Role.delete_flag == 0
        )
        .first()
    )

    if not role:

        raise HTTPException(
            status_code=404,
            detail=f"Role '{role_name}' not found"
        )

    # --------------------------------------------------------
    # Find active assignment
    # --------------------------------------------------------

    user_role = (
        db.query(UserRole)
        .filter(
            UserRole.n_user_id == user.n_user_id,
            UserRole.n_role_id == role.n_role_id,
            UserRole.n_flag == 1,
            UserRole.delete_flag == 0
        )
        .first()
    )

    if not user_role:

        raise HTTPException(
            status_code=404,
            detail="Active role assignment not found"
        )

    # --------------------------------------------------------
    # Prevent removal of last ADMIN
    # --------------------------------------------------------

    if role.s_role_name == "ADMIN":

        active_admin_count = (
            db.query(UserRole)
            .join(
                Role,
                UserRole.n_role_id == Role.n_role_id
            )
            .filter(
                UserRole.n_flag == 1,
                UserRole.delete_flag == 0,

                Role.s_role_name == "ADMIN",
                Role.n_flag == 1,
                Role.delete_flag == 0
            )
            .count()
        )

        if active_admin_count <= 1:

            raise HTTPException(
                status_code=400,
                detail=(
                    "The last active ADMIN role "
                    "cannot be removed."
                )
            )

    # --------------------------------------------------------
    # Old value
    # --------------------------------------------------------

    old_value = (
        f"Target User ID={user.n_user_id}; "
        f"Role ID={role.n_role_id}; "
        f"Role={role.s_role_name}"
    )

    # --------------------------------------------------------
    # Soft delete
    # --------------------------------------------------------

    user_role.delete_flag = 1
    user_role.n_flag = 0

    user_role.dt_updated_at = datetime.now()

    user_role.s_updated_by = str(
        current_user.n_user_id
    )

    # --------------------------------------------------------
    # Audit
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        s_action="REMOVE_ROLE",
        s_module="ROLE",
        n_user_id=current_user.n_user_id,
        s_entity_type="USER_ROLE",
        s_entity_id=str(
            user_role.n_user_role_id
        ),
        s_description=(
            f"Role '{role.s_role_name}' removed from "
            f"{user.s_email} by "
            f"{current_user.s_email}"
        ),
        s_old_value=old_value,
        s_new_value=(
            "delete_flag=1; "
            "n_flag=0; "
            f"Performed By={current_user.n_user_id}"
        )
    )

    db.commit()

    return {
        "status": "success",
        "message": (
            f"Role '{role.s_role_name}' removed successfully"
        )
    }