from pydantic import BaseModel


class UserUploadSummary(BaseModel):
    total_rows: int
    valid_rows: int
    duplicate_file_rows: int
    existing_user_rows: int
    invalid_rows: int