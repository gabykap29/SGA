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
    observations: str = None


class RecordSchema(BaseModel):
    record_id: UUID
    title: str
    date: date
    type_record: str
    content: str
    observations: Optional[str] = None
    create_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecordRelationshipSchema(BaseModel):
    id: UUID
    type_relationship: str
    record: RecordSchema

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: UUID
    username: str

    model_config = {"from_attributes": True}


class FileMinimalForPersonResponse(BaseModel):
    """Schema mínimo para archivos en respuesta de personas"""

    file_id: UUID
    original_filename: str
    file_type: str
    file_size: int
    mime_type: str  # Campo agregado para que el frontend pueda filtrar imágenes
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PersonResponse(BaseModel):
    person_id: UUID
    identification: str
    identification_type: str
    names: str
    lastnames: str
    address: str
    province: str
    country: str
    observations: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    users: UserResponse | None = None  # Información del usuario que creó la persona
    record_relationships: List[RecordRelationshipSchema] = []
    files: List[
        FileMinimalForPersonResponse
    ] = []  # Lista opcional de archivos (puede estar vacía)

    model_config = {"from_attributes": True}
