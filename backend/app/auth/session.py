from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole


SESSION_USER_ID = "n_user_id"


def set_user_session(
    request: Request,
    user: User
) -> None:

    request.session[SESSION_USER_ID] = user.n_user_id


def clear_user_session(
    request: Request
) -> None:

    request.session.clear()


def get_current_user(
    request: Request,
    db: Session
) -> User:

    n_user_id = request.session.get(
        SESSION_USER_ID
    )

    if n_user_id is None:
        raise HTTPException(
            status_code=401,
            detail="User session not found"
        )

    user = (
        db.query(User)
        .filter(
            User.n_user_id == n_user_id,
            User.n_flag == 1,
            User.delete_flag == 0
        )
        .first()
    )

    if not user:

        request.session.clear()

        raise HTTPException(
            status_code=401,
            detail=(
                "Logged-in user is inactive "
                "or does not exist"
            )
        )

    return user


def get_current_user_role(
    request: Request,
    db: Session
) -> str | None:

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
            Role.delete_flag == 0
        )
        .order_by(
            Role.n_role_id
        )
        .first()
    )

    if not role:
        return None

    return role.s_role_name