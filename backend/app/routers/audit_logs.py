from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.auth.permissions import require_roles
from app.models.audit_log import AuditLog
from app.models.user import User


router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"]
)


@router.get("")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.n_audit_log_id.desc()
        )
        .limit(500)
        .all()
    )

    return {
        "status": "success",
        "count": len(logs),
        "logs": [
            {
                "n_audit_log_id": log.n_audit_log_id,
                "n_user_id": log.n_user_id,
                "s_action": log.s_action,
                "s_module": log.s_module,
                "s_entity_type": log.s_entity_type,
                "s_entity_id": log.s_entity_id,
                "s_description": log.s_description,
                "s_old_value": log.s_old_value,
                "s_new_value": log.s_new_value,
                "s_ip_address": log.s_ip_address,
                "dt_created_at": log.dt_created_at
            }
            for log in logs
        ]
    }