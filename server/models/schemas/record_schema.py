from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class RecordSchema(BaseModel):
    title: str
    date: datetime
    content: str
    observations: str


class RecordResponse(BaseModel):
    record_id: UUID
    title: str
    date: datetime
    observations: str

    class Config:
        orm_mode =  True
        