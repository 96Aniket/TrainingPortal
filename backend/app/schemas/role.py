from typing import Optional

from pydantic import BaseModel


class RoleResponse(BaseModel):
    n_role_id: int
    s_role_name: str
    s_description: Optional[str] = None
    n_flag: int
    delete_flag: int


class AssignRoleRequest(BaseModel):
    n_user_id: int
    s_role_name: str