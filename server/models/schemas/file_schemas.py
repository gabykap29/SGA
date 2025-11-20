from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class FileTypeEnum(str, Enum):
    PDF = "pdf"
    IMAGE = "image"


class FileUploadRequest(BaseModel):
    """Schema para la subida de archivos"""

    person_id: UUID = Field(..., description="ID de la persona propietaria del archivo")
    record_id: Optional[UUID] = Field(
        None, description="ID del record asociado (opcional)"
    )
    description: Optional[str] = Field(
        None, max_length=500, description="Descripción del archivo"
    )

    class Config:
        schema_extra = {
            "example": {
                "person_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "record_id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
                "description": "Documento de identificación de la persona",
            }
        }


class FileResponse(BaseModel):
    """Schema para la respuesta de archivos"""

    file_id: UUID
    original_filename: str
    file_type: FileTypeEnum
    file_size: int
    mime_type: str
    description: Optional[str] = None
    is_active: bool
    person_id: UUID
    record_id: Optional[UUID] = None
    uploaded_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "file_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "original_filename": "documento_identidad.pdf",
                "file_type": "pdf",
                "file_size": 1024000,
                "mime_type": "application/pdf",
                "description": "Documento de identificación",
                "is_active": True,
                "person_id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
                "record_id": None,
                "uploaded_by": "3fa85f64-5717-4562-b3fc-2c963f66afa8",
                "created_at": "2025-09-26T00:15:12.536Z",
                "updated_at": "2025-09-26T00:15:12.536Z",
            }
        }


class FileListResponse(BaseModel):
    """Schema para listar archivos con información básica"""

    file_id: UUID
    original_filename: str
    file_type: FileTypeEnum
    file_size: int
    description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class FilesByPersonResponse(BaseModel):
    """Schema para obtener archivos de una persona específica"""

    person_id: UUID
    person_name: str
    files: List[FileListResponse]
    total_files: int
    description: Optional[str] = None

    class Config:
        orm_mode = True


class FileUpdateRequest(BaseModel):
    """Schema para actualizar metadatos de un archivo"""

    description: Optional[str] = Field(None, max_length=500)

    class Config:
        schema_extra = {"example": {"description": "Nueva descripción del archivo"}}


class FileDownloadResponse(BaseModel):
    """Schema para información de descarga de archivos"""

    file_id: UUID
    original_filename: str
    file_type: FileTypeEnum
    file_size: int
    mime_type: str
    download_url: str
    expires_at: datetime
    description: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "file_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "original_filename": "documento.pdf",
                "file_type": "pdf",
                "file_size": 1024000,
                "mime_type": "application/pdf",
                "download_url": "/api/files/3fa85f64-5717-4562-b3fc-2c963f66afa6/download",
                "expires_at": "2025-09-26T01:15:12.536Z",
            }
        }


# Schema para incluir archivos en las respuestas de personas y records
class FileMinimalResponse(BaseModel):
    """Schema mínimo para incluir en otras respuestas"""

    file_id: UUID
    original_filename: str
    file_type: FileTypeEnum
    file_size: int
    created_at: datetime
    description: Optional[str] = None

    class Config:
        orm_mode = True
