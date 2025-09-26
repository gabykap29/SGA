from sqlalchemy.orm import Session, joinedload
from models.Files import Files
from models.Persons import Persons
from models.Record import Records
from models.Users import Users
from utils.file_encryption import FileEncryption, FileValidator
from config.file_storage import FileStorageConfig
from typing import List, Optional, BinaryIO, Tuple
import uuid
import os

from datetime import datetime, timezone

class FilesService:
    """
    Servicio para el manejo de archivos del sistema
    """
    
    def __init__(self):
        self.fileModel = Files
        self.personModel = Persons
        self.recordModel = Records
        self.userModel = Users
    
    def upload_file(
        self, 
        file_stream: BinaryIO, 
        original_filename: str, 
        file_size: int,
        mime_type: str,
        person_id: str, 
        uploaded_by: str,
        db: Session,
        record_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> Files:
        """
        Sube y encripta un archivo
        
        Args:
            file_stream: Stream del archivo a subir
            original_filename: Nombre original del archivo
            file_size: Tamaño del archivo en bytes
            mime_type: Tipo MIME del archivo
            person_id: ID de la persona propietaria
            uploaded_by: ID del usuario que sube el archivo
            record_id: ID del record asociado (opcional)
            description: Descripción del archivo (opcional)
            db: Sesión de base de datos
            
        Returns:
            Files: Instancia del archivo creado
            
        Raises:
            ValueError: Si la validación falla
            Exception: Si hay error en el procesamiento
        """
        try:
            # Validar tamaño del archivo
            FileValidator.validate_file_size(file_size)
            
            # Validar tipo de archivo
            file_type = FileValidator.validate_file_type(original_filename, mime_type)
            
            # Validar que la persona existe
            person_uuid = uuid.UUID(person_id)
            person = db.query(self.personModel).filter(
                self.personModel.person_id == person_uuid
            ).first()
            if not person:
                raise ValueError("La persona especificada no existe")
            
            # Validar que el usuario que sube existe
            uploader_uuid = uuid.UUID(uploaded_by)
            uploader = db.query(self.userModel).filter(
                self.userModel.id == uploader_uuid
            ).first()
            if not uploader:
                raise ValueError("El usuario especificado no existe")
            
            # Validar record si se proporciona
            record_uuid = None
            if record_id:
                record_uuid = uuid.UUID(record_id)
                record = db.query(self.recordModel).filter(
                    self.recordModel.record_id == record_uuid
                ).first()
                if not record:
                    raise ValueError("El record especificado no existe")
            
            # Obtener directorio de almacenamiento
            storage_path = FileStorageConfig.get_storage_path(file_type)
            
            # Encriptar y guardar archivo
            encrypted_filename, salt, key_hash = FileEncryption.encrypt_file_stream(
                file_stream, storage_path, original_filename
            )
            
            # Crear registro en base de datos
            new_file = self.fileModel(
                original_filename=original_filename,
                encrypted_filename=encrypted_filename,
                file_type=file_type,
                file_size=file_size,
                mime_type=mime_type,
                encryption_key_hash=key_hash,
                encryption_salt=salt,
                description=description,
                person_id=person_uuid,
                record_id=record_uuid,
                uploaded_by=uploader_uuid
            )
            
            db.add(new_file)
            db.commit()
            db.refresh(new_file)
            
            return new_file
            
        except Exception as e:
            db.rollback()
            # Si hubo error, intentar limpiar archivo si se creó
            if 'encrypted_filename' in locals():
                try:
                    file_path = FileStorageConfig.get_full_file_path(file_type, encrypted_filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except:
                    pass
            raise e
    
    def get_file_by_id(self, file_id: str, db: Session) -> Optional[Files]:
        """
        Obtiene un archivo por su ID
        """
        try:
            file_uuid = uuid.UUID(file_id)
            return db.query(self.fileModel).options(
                joinedload(self.fileModel.person),
                joinedload(self.fileModel.record),
                joinedload(self.fileModel.uploader)
            ).filter(
                self.fileModel.file_id == file_uuid,
                self.fileModel.is_active == True
            ).first()
        except ValueError:
            return None
    
    def get_files_by_person(self, person_id: str, db: Session) -> List[Files]:
        """
        Obtiene todos los archivos de una persona
        """
        try:
            person_uuid = uuid.UUID(person_id)
            return db.query(self.fileModel).options(
                joinedload(self.fileModel.record)
            ).filter(
                self.fileModel.person_id == person_uuid,
                self.fileModel.is_active == True
            ).order_by(self.fileModel.created_at.desc()).all()
        except ValueError:
            return []
    
    def get_files_by_record(self, record_id: str, db: Session) -> List[Files]:
        """
        Obtiene todos los archivos asociados a un record
        """
        try:
            record_uuid = uuid.UUID(record_id)
            # TEMPORALMENTE SIN JOINEDLOAD
            return db.query(self.fileModel).filter(
                self.fileModel.record_id == record_uuid,
                self.fileModel.is_active == True
            ).order_by(self.fileModel.created_at.desc()).all()
        except ValueError:
            return []
    
    def download_file(self, file_id: str, db: Session) -> Tuple[bytes, str, str]:
        """
        Descarga y desencripta un archivo
        
        Returns:
            Tuple[bytes, str, str]: (datos_archivo, nombre_original, mime_type)
            
        Raises:
            FileNotFoundError: Si el archivo no existe
            ValueError: Si hay error en la desencriptación
        """
        # Obtener información del archivo
        file_record = self.get_file_by_id(file_id, db)
        if not file_record:
            raise FileNotFoundError("Archivo no encontrado")
        
        # Construir ruta del archivo encriptado
        file_path = FileStorageConfig.get_full_file_path(
            str(file_record.file_type), 
            str(file_record.encrypted_filename)
        )
        
        # Desencriptar archivo
        decrypted_data = FileEncryption.decrypt_file_from_disk(
            file_path,
            str(file_record.encryption_salt),
            str(file_record.encryption_key_hash)
        )
        
        return decrypted_data, str(file_record.original_filename), str(file_record.mime_type)
    
    def update_file_metadata(
        self, 
        file_id: str, 
        db: Session,
        description: Optional[str] = None
    ) -> Optional[Files]:
        """
        Actualiza los metadatos de un archivo
        """
        try:
            file_uuid = uuid.UUID(file_id)
            file_record = db.query(self.fileModel).filter(
                self.fileModel.file_id == file_uuid,
                self.fileModel.is_active == True
            ).first()
            
            if not file_record:
                return None
            
            if description is not None:
                setattr(file_record, 'description', description)
            
            setattr(file_record, 'updated_at', datetime.now(timezone.utc))
            
            db.commit()
            db.refresh(file_record)
            
            return file_record
            
        except ValueError:
            return None
    
    def delete_file(self, file_id: str, db: Session) -> bool:
        """
        Elimina un archivo (eliminación lógica)
        """
        try:
            file_uuid = uuid.UUID(file_id)
            file_record = db.query(self.fileModel).filter(
                self.fileModel.file_id == file_uuid,
                self.fileModel.is_active == True
            ).first()
            
            if not file_record:
                return False
            
            # Eliminación lógica
            setattr(file_record, 'is_active', False)
            setattr(file_record, 'updated_at', datetime.now(timezone.utc))
            
            db.commit()
            
            return True
            
        except ValueError:
            return False
    
    def permanently_delete_file(self, file_id: str, db: Session) -> bool:
        """
        Elimina permanentemente un archivo del sistema y disco
        ¡USAR CON PRECAUCIÓN!
        """
        try:
            file_uuid = uuid.UUID(file_id)
            file_record = db.query(self.fileModel).filter(
                self.fileModel.file_id == file_uuid
            ).first()
            
            if not file_record:
                return False
            
            # Eliminar archivo del disco
            file_path = FileStorageConfig.get_full_file_path(
                str(file_record.file_type),
                str(file_record.encrypted_filename)
            )
            
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Eliminar registro de base de datos
            db.delete(file_record)
            db.commit()
            
            return True
            
        except Exception as e:
            db.rollback()
            raise e
    
    def get_file_stats(self, db: Session) -> dict:
        """
        Obtiene estadísticas de archivos del sistema
        """
        stats = {}
        
        # Total de archivos activos
        stats['total_active_files'] = db.query(self.fileModel).filter(
            self.fileModel.is_active == True
        ).count()
        
        # Archivos por tipo
        for file_type in ['pdf', 'image']:
            stats[f'total_{file_type}_files'] = db.query(self.fileModel).filter(
                self.fileModel.file_type == file_type,
                self.fileModel.is_active == True
            ).count()
        
        # Tamaño total (aproximado)
        total_size = db.query(self.fileModel).filter(
            self.fileModel.is_active == True
        ).with_entities(self.fileModel.file_size).all()
        
        stats['total_size_bytes'] = sum(size[0] for size in total_size if size[0])
        stats['total_size_mb'] = round(stats['total_size_bytes'] / (1024 * 1024), 2)
        
        return stats