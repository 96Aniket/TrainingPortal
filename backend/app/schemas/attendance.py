from pydantic import BaseModel

class AttendanceUserResponse(BaseModel):
    n_user_id: int
    s_user_name: str
    s_email: str
    n_attendance_minutes: int
    s_attendance_status: str
    n_assessment_eligible: int

class AttendanceUploadResponse(BaseModel):
    status: str
    message: str
    n_training_id: int
    n_attendance_session_id: int | None
    total_users: int
    attended_users: int
    eligible_users: int
    not_eligible_users: int
    users: list[AttendanceUserResponse]
