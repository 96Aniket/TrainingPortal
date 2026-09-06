from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.session import (
    get_current_user,
    get_current_user_role
)

from app.database.dependencies import get_db
from app.models.user import User


def require_roles(
    *allowed_roles: str
):

    normalized_roles = {
        role.strip().upper()
        for role in allowed_roles
    }

    def dependency(
        request: Request,
        db: Session = Depends(get_db)
    ) -> User:

        user = get_current_user(
            request=request,
            db=db
        )

        role_name = get_current_user_role(
            request=request,
            db=db
        )

        if (
            role_name is None
            or role_name.upper()
            not in normalized_roles
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )

        return user

    return dependency