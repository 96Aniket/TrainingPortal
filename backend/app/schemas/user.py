from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    s_employee_id: Optional[str] = None
    s_user_name: Optional[str] = None
    s_email: EmailStr


class UserUpdate(BaseModel):
    s_employee_id: Optional[str] = None
    s_user_name: Optional[str] = None
    s_email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    n_user_id: int
    s_employee_id: Optional[str]
    s_user_name: Optional[str]
    s_email: str
    n_flag: int
    delete_flag: int

    class Config:
        from_attributes = True