from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    s_action: str,
    s_module: str,
    n_user_id: Optional[int] = None,
    s_entity_type: Optional[str] = None,
    s_entity_id: Optional[str] = None,
    s_description: Optional[str] = None,
    s_old_value: Optional[str] = None,
    s_new_value: Optional[str] = None,
    s_ip_address: Optional[str] = None
):
    audit_log = AuditLog(
        n_user_id=n_user_id,
        s_action=s_action,
        s_module=s_module,
        s_entity_type=s_entity_type,
        s_entity_id=s_entity_id,
        s_description=s_description,
        s_old_value=s_old_value,
        s_new_value=s_new_value,
        s_ip_address=s_ip_address
    )

    db.add(audit_log)

    return audit_log