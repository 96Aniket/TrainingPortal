from fastapi import (
    APIRouter,
    Depends,
    Query
)

from sqlalchemy.orm import Session

from app.auth.permissions import require_roles
from app.database.dependencies import get_db

from app.models.email_log import EmailLog
from app.models.training import Training
from app.models.user import User


router = APIRouter(
    prefix="/api/email-logs",
    tags=["Email Logs"]
)


# ============================================================
# GET EMAIL LOGS
# ADMIN ONLY
# ============================================================

@router.get("")
def get_email_logs(
    search: str | None = Query(
        default=None
    ),
    status: str | None = Query(
        default=None
    ),
    email_type: str | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    query = (
        db.query(
            EmailLog,
            Training,
            User
        )
        .outerjoin(
            Training,
            EmailLog.n_training_id
            == Training.n_training_id
        )
        .outerjoin(
            User,
            EmailLog.n_user_id
            == User.n_user_id
        )
        .filter(
            EmailLog.n_flag == 1,
            EmailLog.delete_flag == 0
        )
    )

    # --------------------------------------------------------
    # Search
    # --------------------------------------------------------

    if search:
        search_value = (
            search.strip()
        )

        if search_value:

            search_pattern = (
                f"%{search_value}%"
            )

            query = query.filter(
                (
                    EmailLog.s_to_email.ilike(
                        search_pattern
                    )
                )
                |
                (
                    EmailLog.s_subject.ilike(
                        search_pattern
                    )
                )
                |
                (
                    EmailLog.s_email_type.ilike(
                        search_pattern
                    )
                )
                |
                (
                    EmailLog.s_message_id.ilike(
                        search_pattern
                    )
                )
            )

    # --------------------------------------------------------
    # Status filter
    # --------------------------------------------------------

    if status:
        query = query.filter(
            EmailLog.s_status
            == status.strip().upper()
        )

    # --------------------------------------------------------
    # Email Type filter
    # --------------------------------------------------------

    if email_type:
        query = query.filter(
            EmailLog.s_email_type
            == email_type.strip()
        )

    # --------------------------------------------------------
    # Load newest first
    # --------------------------------------------------------

    rows = (
        query
        .order_by(
            EmailLog.n_email_log_id.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    total_count = len(rows)

    success_count = sum(
        1
        for email_log, _, _
        in rows
        if email_log.s_status == "SUCCESS"
    )

    failed_count = sum(
        1
        for email_log, _, _
        in rows
        if email_log.s_status == "FAILED"
    )

    pending_count = sum(
        1
        for email_log, _, _
        in rows
        if email_log.s_status
        in ("QUEUED", "SENDING")
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    logs = []

    for email_log, training, user in rows:

        logs.append(
            {
                "n_email_log_id":
                    email_log.n_email_log_id,

                "n_email_template_id":
                    email_log.n_email_template_id,

                "n_training_id":
                    email_log.n_training_id,

                "n_user_id":
                    email_log.n_user_id,

                "s_email_type":
                    email_log.s_email_type,

                "s_from_email":
                    email_log.s_from_email,

                "s_to_email":
                    email_log.s_to_email,

                "s_cc_email":
                    email_log.s_cc_email,

                "s_bcc_email":
                    email_log.s_bcc_email,

                "s_subject":
                    email_log.s_subject,

                "s_status":
                    email_log.s_status,

                "s_message_id":
                    email_log.s_message_id,

                "dt_queued_at":
                    email_log.dt_queued_at,

                "dt_sent_at":
                    email_log.dt_sent_at,

                "dt_failed_at":
                    email_log.dt_failed_at,

                "s_failure_reason":
                    email_log.s_failure_reason,

                "dt_created_at":
                    email_log.dt_created_at,

                "s_created_by":
                    email_log.s_created_by,

                "s_training_code":
                    (
                        training.s_training_code
                        if training
                        else None
                    ),

                "s_training_name":
                    (
                        training.s_training_name
                        if training
                        else None
                    ),

                "s_user_name":
                    (
                        user.s_user_name
                        if user
                        else None
                    ),

                "s_user_email":
                    (
                        user.s_email
                        if user
                        else None
                    )
            }
        )

    email_types = sorted(
        {
            log["s_email_type"]
            for log in logs
            if log["s_email_type"]
        }
    )

    return {
        "status": "success",
        "count": total_count,
        "summary": {
            "total": total_count,
            "success": success_count,
            "failed": failed_count,
            "pending": pending_count
        },
        "email_types": email_types,
        "logs": logs
    }