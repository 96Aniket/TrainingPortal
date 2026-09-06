from fastapi import (
    APIRouter,
    Depends
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.services.email_service import (
    send_training_email
)


router = APIRouter(
    prefix="/api/emails",
    tags=["Emails"]
)


class EmailTestRequest(BaseModel):

    s_email_type: str

    s_to_email: str

    s_coordinator_email: str | None = None

    n_training_id: int | None = None

    n_user_id: int | None = None


@router.post("/test")
def test_email(
    request: EmailTestRequest,
    db: Session = Depends(get_db)
):

    result = send_training_email(

        db=db,

        email_type=request.s_email_type,

        to_email=request.s_to_email,

        training_id=request.n_training_id,

        user_id=request.n_user_id,

        coordinator_email=(
            request.s_coordinator_email
        ),

        template_variables={
            "UserName": "Test User",
            "TrainingName": "SQL Server Advanced Training",
            "TrainingDetails": (
                "Date: 15 September 2026<br>"
                "Time: 10:00 AM - 12:00 PM"
            ),
            "AssessmentLink": (
                "http://localhost:3000/assessment/test"
            ),
            "Result": "PASS",
            "Score": "88"
        },

        created_by="SYSTEM"
    )

    return result