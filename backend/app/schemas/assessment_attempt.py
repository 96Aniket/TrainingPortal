from pydantic import BaseModel
from typing import List

# ============================================================
# ASSESSMENT START
# ============================================================

class AssessmentStartRequest(BaseModel):
    registration_token: str

# ============================================================
# ASSESSMENT ANSWER
# ============================================================

class AssessmentSubmitAnswer(BaseModel):
    n_question_id: int
    n_selected_option_id: int

# ============================================================
# ASSESSMENT SUBMIT
# ============================================================

class AssessmentSubmitRequest(BaseModel):
    n_attempt_id: int
    registration_token: str
    answers: List[AssessmentSubmitAnswer]
