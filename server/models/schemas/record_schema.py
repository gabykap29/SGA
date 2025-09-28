from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class RecordSchema(BaseModel):
    title: str
    date: datetime
    content: str
    observations: str
    type_record: str = 'PENAL'


class RecordResponse(BaseModel):
    record_id: UUID
    title: str
    date: datetime
    observations: str
    type_record: str

    class Config:
        orm_mode =  True
        