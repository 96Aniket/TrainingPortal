from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request
)
from sqlalchemy.orm import Session
from app.auth.session import (
    clear_user_session,
    get_current_user,
    get_current_user_role,
    set_user_session
)
from app.database.dependencies import get_db
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# ============================================================
# LOGIN
# ============================================================

# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    request: Request,
    s_email: str,
    db: Session = Depends(get_db)
):

    email = s_email.strip().lower()

    # --------------------------------------------------------
    # Find active user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.s_email == email,
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or inactive user"
        )

    # --------------------------------------------------------
    # Portal access is only for ADMIN / COORDINATOR
    # --------------------------------------------------------

    portal_role = (
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
            Role.delete_flag == 0,

            Role.s_role_name.in_([
                "ADMIN",
                "COORDINATOR"
            ])
        )
        .order_by(
            Role.n_role_id
        )
        .first()
    )

    if not portal_role:
        raise HTTPException(
            status_code=403,
            detail=(
                "Portal access is restricted to "
                "ADMIN and COORDINATOR users."
            )
        )

    # --------------------------------------------------------
    # Create session only after authorization succeeds
    # --------------------------------------------------------

    set_user_session(
        request=request,
        user=user
    )

    return {
        "status": "success",
        "message": "Login successful",
        "user": {
            "n_user_id": user.n_user_id,
            "s_employee_id": user.s_employee_id,
            "s_user_name": user.s_user_name,
            "s_email": user.s_email,
            "s_role_name": portal_role.s_role_name
        }
    }

# ============================================================
# CURRENT USER
# ============================================================

# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def get_me(
    request: Request,
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request=request,
        db=db
    )

    role = (
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
            Role.delete_flag == 0,

            Role.s_role_name.in_([
                "ADMIN",
                "COORDINATOR"
            ])
        )
        .order_by(
            Role.n_role_id
        )
        .first()
    )

    if not role:

        clear_user_session(
            request=request
        )

        raise HTTPException(
            status_code=403,
            detail=(
                "Portal access is restricted to "
                "ADMIN and COORDINATOR users."
            )
        )

    return {
        "status": "success",
        "user": {
            "n_user_id": user.n_user_id,
            "s_employee_id": user.s_employee_id,
            "s_user_name": user.s_user_name,
            "s_email": user.s_email,
            "s_role_name": role.s_role_name
        }
    }

# ============================================================
# LOGOUT
# ============================================================

@router.post("/logout")
def logout(
    request: Request
):

    clear_user_session(
        request=request
    )

    return {
        "status": "success",
        "message": "Logout successful"
    }