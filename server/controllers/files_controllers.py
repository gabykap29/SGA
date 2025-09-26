from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status, Header
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from database.db import SessionLocal
from services.files_services import FilesService
from models.schemas.file_schemas import (
    FileUploadRequest, FileResponse, FileListResponse, 
    FilesByPersonResponse, FileUpdateRequest, FileDownloadResponse
)
from utils.jwt import decode_access_token
from typing import List, Optional
import io

router = APIRouter(tags=["Files"], prefix="/files")
files_service = FilesService()

def get_db():
    """Dependency para obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_id(authorization: str = Header(None)):
    """Dependency para obtener el ID del usuario actual desde el header Authorization"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autorización requerido en el header"
        )
    
    # Extraer el token del formato "Bearer <token>"
    try:
        token = authorization.split(" ")[1]
        token_decode = decode_access_token(token)
        return token_decode["user_id"]
    except (IndexError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autorización inválido"
        )

@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    person_id: str = Form(...),
    record_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Sube un archivo al sistema
    """
    try:
        # Validar que el archivo no esté vacío
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionó ningún archivo"
            )
        
        # Leer contenido del archivo
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo está vacío"
            )
        
        # Crear stream de memoria
        file_stream = io.BytesIO(file_content)
        
        # Subir archivo usando el servicio
        uploaded_file = files_service.upload_file(
            file_stream=file_stream,
            original_filename=file.filename,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            person_id=person_id,
            uploaded_by=current_user,
            record_id=record_id,
            description=description,
            db=db
        )
        
        return uploaded_file
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/{file_id}", response_model=FileResponse)
def get_file_info(
    file_id: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene información de un archivo por su ID
    """
    file_record = files_service.get_file_by_id(file_id, db)
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado"
        )
    
    return file_record

@router.get("/{file_id}/download")
def download_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """
    Descarga un archivo del sistema
    """
    try:
        file_data, original_filename, mime_type = files_service.download_file(file_id, db)
        
        # Crear stream de respuesta
        file_stream = io.BytesIO(file_data)
        
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type=mime_type,
            headers={
                "Content-Disposition": f"attachment; filename=\"{original_filename}\"",
                "Content-Length": str(len(file_data))
            }
        )
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al descargar el archivo"
        )

@router.get("/person/{person_id}", response_model=List[FileListResponse])
def get_files_by_person(
    person_id: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los archivos de una persona específica
    """
    files = files_service.get_files_by_person(person_id, db)
    return files

@router.get("/record/{record_id}", response_model=List[FileListResponse])
def get_files_by_record(
    record_id: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los archivos asociados a un record específico
    """
    files = files_service.get_files_by_record(record_id, db)
    return files

@router.put("/{file_id}", response_model=FileResponse)
def update_file_metadata(
    file_id: str,
    update_data: FileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """
    Actualiza los metadatos de un archivo
    """
    updated_file = files_service.update_file_metadata(
        file_id=file_id,
        description=update_data.description,
        db=db
    )
    
    if not updated_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado"
        )
    
    return updated_file

@router.delete("/{file_id}", status_code=status.HTTP_200_OK)
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """
    Elimina lógicamente un archivo del sistema
    """
    success = files_service.delete_file(file_id, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado"
        )
    
    return JSONResponse(
        content={"message": "Archivo eliminado exitosamente"},
        status_code=status.HTTP_200_OK
    )

@router.delete("/{file_id}/permanent", status_code=status.HTTP_200_OK)
def permanently_delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """
    Elimina permanentemente un archivo del sistema
    ¡USAR CON PRECAUCIÓN! Esta acción no se puede deshacer.
    """
    try:
        success = files_service.permanently_delete_file(file_id, db)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo no encontrado"
            )
        
        return JSONResponse(
            content={"message": "Archivo eliminado permanentemente"},
            status_code=status.HTTP_200_OK
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar archivo: {str(e)}"
        )

@router.get("/stats/summary")
def get_file_stats(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """
    Obtiene estadísticas generales de archivos del sistema
    """
    stats = files_service.get_file_stats(db)
    return stats

@router.get("", response_model=List[FileListResponse])
def list_all_files(
    skip: int = 0,
    limit: int = 100,
    file_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lista todos los archivos del sistema con paginación
    """
    try:
        # Construir query base
        query = db.query(files_service.fileModel).filter(
            files_service.fileModel.is_active == True
        )
        
        # Filtrar por tipo si se especifica
        if file_type:
            query = query.filter(files_service.fileModel.file_type == file_type)
        
        # Aplicar paginación
        files = query.offset(skip).limit(limit).all()
        
        return files
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener archivos: {str(e)}"
        )