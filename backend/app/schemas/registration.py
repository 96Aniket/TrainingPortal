from pydantic import BaseModel, Field


class MultipleTrainingRegistrationRequest(BaseModel):
    training_ids: list[int] = Field(
        ...,
        min_length=1
    )