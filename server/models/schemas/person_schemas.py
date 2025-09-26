from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from models.schemas.file_schemas import FileMinimalResponse

class PersonSchema(BaseModel): 
    identification: str
    identification_type: str
    names: str
    lastnames: str
    address: str
    province: str
    country: str
    

class RecordSchema(BaseModel):
    record_id: UUID
    title: str
    date: date
    content: str
    observations: Optional[str] = None
    create_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class RecordRelationshipSchema(BaseModel):
    id: UUID
    type_relationship: str
    record: RecordSchema
    
    class Config:
        orm_mode = True

class UserResponse(BaseModel):
    id: UUID
    username: str    
    
    class Config:
        orm_mode = True

class FileMinimalForPersonResponse(BaseModel):
    """Schema mínimo para archivos en respuesta de personas"""
    file_id: UUID
    original_filename: str
    file_type: str
    file_size: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class PersonResponse(BaseModel):
    person_id: UUID
    identification: str
    identification_type: str
    names: str
    lastnames: str
    address: str
    province: str
    country: str
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    users: UserResponse
    record_relationships: List[RecordRelationshipSchema] = []
    files: List[FileMinimalForPersonResponse] = []  # Lista opcional de archivos (puede estar vacía)
    
    class Config:
        orm_mode = True
        
        