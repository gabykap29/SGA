from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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

    @staticmethod
    def _normalize_uuid(uuid_str: str) -> str:
        """
        Normaliza un UUID que puede venir sin guiones (32 caracteres) 
        o con guiones (36 caracteres)
        
        Args:
            uuid_str: UUID en formato 36e6b6e7de754811a91ec1426e80abc5 o 36e6b6e7-de75-4811-a91e-c1426e80abc5
            
        Returns:
            UUID en formato estándar con guiones
        """
        uuid_str = str(uuid_str).strip()
        
        # Si ya tiene guiones, retornar tal cual
        if '-' in uuid_str:
            return uuid_str
        
        # Si tiene 32 caracteres sin guiones, agregar guiones
        if len(uuid_str) == 32:
            return f"{uuid_str[0:8]}-{uuid_str[8:12]}-{uuid_str[12:16]}-{uuid_str[16:20]}-{uuid_str[20:32]}"
        
        # Si no es un formato válido, retornar tal cual y dejar que uuid.UUID lance el error
        return uuid_str

    async def upload_file(
        self,
        file_stream: BinaryIO,
        original_filename: str,
        file_size: int,
        mime_type: str,
        person_id: str,
        uploaded_by: str,
        db: AsyncSession,
        record_id: Optional[str] = None,
        description: Optional[str] = None,
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
            stm = select(self.personModel).filter(
                self.personModel.person_id == person_uuid
            )
            result = await db.execute(stm)
            person = result.scalars().first()
            if not person:
                raise ValueError("La persona especificada no existe")

            # Validar que el usuario que sube existe
            uploader_uuid = uuid.UUID(uploaded_by)
            stm_uploader = select(self.userModel).filter(
                self.userModel.id == uploader_uuid
            )
            result_uploader = await db.execute(stm_uploader)
            uploader = result_uploader.scalars().first()

            if not uploader:
                raise ValueError("El usuario especificado no existe")

            # Validar record si se proporciona
            record_uuid = None
            if record_id:
                record_uuid = uuid.UUID(record_id)
                smt = (select(self.recordModel).filter(
                    self.recordModel.record_id == record_uuid
                ))
                result = await db.execute(smt)
                record = result.scalars().first()

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
                uploaded_by=uploader_uuid,
            )

            db.add(new_file)
            await db.commit()
            await db.refresh(new_file)
            
            print("DEBUG upload_file: Archivo subido exitosamente")
            print(f"  - file_id: {new_file.file_id} (tipo: {type(new_file.file_id)})")
            print(f"  - original_filename: {new_file.original_filename}")
            print(f"  - encrypted_filename: {new_file.encrypted_filename}")

            return new_file

        except Exception as e:
            db.rollback()
            # Si hubo error, intentar limpiar archivo si se creó
            if "encrypted_filename" in locals():
                try:
                    file_path = FileStorageConfig.get_full_file_path(
                        file_type, encrypted_filename
                    )
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except:
                    pass
            raise e

    async def get_file_by_id(self, file_id: str, db: AsyncSession) -> Optional[Files]:
        """
        Obtiene un archivo por su ID
        """
        try:
            print(f"DEBUG get_file_by_id: file_id recibido = {file_id}, tipo = {type(file_id)}, longitud = {len(file_id)}")
            
            # Normalizar file_id
            normalized_id = self._normalize_uuid(file_id)
            print(f"DEBUG: ID normalizado a: {normalized_id}")
            
            file_uuid = uuid.UUID(normalized_id)
            print(f"DEBUG: UUID válido: {file_uuid}")
            
            # Primero, buscar SIN el filtro is_active para ver si existe
            stm_check = select(self.fileModel).filter(
                self.fileModel.file_id == file_uuid
            )
            result_check = await db.execute(stm_check)
            file_check = result_check.scalars().first()
            
            if file_check:
                print("DEBUG: Archivo encontrado en BD")
                print(f"  - file_id: {file_check.file_id}")
                print(f"  - is_active: {file_check.is_active}")
                print(f"  - original_filename: {file_check.original_filename}")
            else:
                print(f"DEBUG: Archivo NO encontrado en BD con file_id={file_uuid}")
            
            # Ahora buscar CON el filtro is_active
            stm = (
                select(self.fileModel)
                .filter(
                    self.fileModel.file_id == file_uuid,
                    self.fileModel.is_active,
                )
            )
            result = await db.execute(stm)
            file_record = result.scalars().first()
            
            if file_record:
                print("DEBUG: Archivo está activo y listo para usar")
                return file_record
            else:
                if file_check:
                    print(f"DEBUG: Archivo existe pero NO está activo (is_active={file_check.is_active})")
                else:
                    print("DEBUG: Archivo no existe en la BD")
                return None
                
        except ValueError as e:
            print(f"Error al convertir file_id a UUID: {file_id}, error: {str(e)}")
            return None

    async def get_files_by_person(self, person_id: str, db: AsyncSession) -> List[Files]:
        """
        Obtiene todos los archivos de una persona
        """
        try:
            person_uuid = uuid.UUID(person_id)
            stm =  (
                select(self.fileModel)
                .options(joinedload(self.fileModel.record))
                .filter(
                    self.fileModel.person_id == person_uuid,
                    self.fileModel.is_active,
                )
                .order_by(self.fileModel.created_at.desc())
            )
            result = await db.execute(stm)
            return result.scalars().all()
        except ValueError:
            return []

    async def get_files_by_record(self, record_id: str, db: AsyncSession) -> List[Files]:
        """
        Obtiene todos los archivos asociados a un record
        """
        try:
            record_uuid = uuid.UUID(record_id)
            # TEMPORALMENTE SIN JOINEDLOAD
            stm =  (
                select(self.fileModel)
                .filter(
                    self.fileModel.record_id == record_uuid,
                    self.fileModel.is_active,
                )
                .order_by(self.fileModel.created_at.desc())
            )
            result = await db.execute(stm)
            return result.scalars().all()
        except ValueError:
            return []

    async def download_file(self, file_id: str, db: AsyncSession) -> Tuple[bytes, str, str]:
        """
        Descarga y desencripta un archivo

        Returns:
            Tuple[bytes, str, str]: (datos_archivo, nombre_original, mime_type)

        Raises:
            FileNotFoundError: Si el archivo no existe
            ValueError: Si hay error en la desencriptación
        """
        print(f"DEBUG download_file: file_id recibido = {file_id}, tipo = {type(file_id)}")
        
        # Obtener información del archivo
        file_record = await self.get_file_by_id(file_id, db)
        
        if not file_record:
            print(f"DEBUG: get_file_by_id retornó None para file_id {file_id}")
            
            # Hacer una búsqueda manual para verificar qué archivos existen
            normalized_id = self._normalize_uuid(file_id)
            print(f"DEBUG: ID normalizado: {normalized_id}")
            
            stm_all = select(self.fileModel).filter(self.fileModel.is_active)
            result_all = await db.execute(stm_all)
            all_files = result_all.scalars().all()
            print(f"DEBUG: Total de archivos activos en BD: {len(all_files)}")
            for f in all_files:
                print(f"  - file_id en BD: {f.file_id} (tipo: {type(f.file_id)})")
            
            raise FileNotFoundError("Archivo no encontrado")
        
        print(f"DEBUG: Archivo encontrado - file_id: {file_record.file_id}, encrypted_filename: {file_record.encrypted_filename}")

        # Construir ruta del archivo encriptado
        file_path = FileStorageConfig.get_full_file_path(
            str(file_record.file_type), str(file_record.encrypted_filename)
        )
        
        print(f"DEBUG: Buscando archivo en ruta: {file_path}")

        # Desencriptar archivo
        decrypted_data = FileEncryption.decrypt_file_from_disk(
            file_path,
            str(file_record.encryption_salt),
            str(file_record.encryption_key_hash),
        )

        return (
            decrypted_data,
            str(file_record.original_filename),
            str(file_record.mime_type),
        )

    async def update_file_metadata(
        self, file_id: str, db: AsyncSession, description: Optional[str] = None
    ) -> Optional[Files]:
        """
        Actualiza los metadatos de un archivo
        """
        try:
            # Normalizar file_id
            normalized_id = self._normalize_uuid(file_id)
            file_uuid = uuid.UUID(normalized_id)
            
            stm = (
                select(self.fileModel)
                .filter(
                    self.fileModel.file_id == file_uuid,
                    self.fileModel.is_active,
                )
            )
            result = await db.execute(stm)
            file_record = result.scalars().first()

            if not file_record:
                return None

            if description is not None:
                setattr(file_record, "description", description)

            setattr(file_record, "updated_at", datetime.now(timezone.utc))

            await db.commit()
            await db.refresh(file_record)

            return file_record

        except ValueError:
            return None

    async def delete_file(self, file_id: str, db: AsyncSession) -> bool:
        """
        Elimina un archivo (eliminación lógica)
        """
        try:
            # Normalizar file_id
            normalized_id = self._normalize_uuid(file_id)
            file_uuid = uuid.UUID(normalized_id)
            
            stm = (
                select(self.fileModel)
                .filter(
                    self.fileModel.file_id == file_uuid,
                    self.fileModel.is_active,
                )
            )
            result = await db.execute(stm)
            file_record = result.scalars().first()

            if not file_record:
                return False

            # Eliminación lógica
            setattr(file_record, "is_active", False)
            setattr(file_record, "updated_at", datetime.now(timezone.utc))

            await db.commit()

            return True

        except ValueError:
            return False

    async def permanently_delete_file(self, file_id: str, db: AsyncSession) -> bool:
        """
        Elimina permanentemente un archivo del sistema y disco
        ¡USAR CON PRECAUCIÓN!
        """
        try:
            # Normalizar file_id
            normalized_id = self._normalize_uuid(file_id)
            file_uuid = uuid.UUID(normalized_id)
            
            stm = select(self.fileModel).filter(self.fileModel.file_id == file_uuid)
            result = await db.execute(stm)
            file_record = result.scalars().first()

            if not file_record:
                return False

            # Eliminar archivo del disco
            file_path = FileStorageConfig.get_full_file_path(
                str(file_record.file_type), str(file_record.encrypted_filename)
            )

            if os.path.exists(file_path):
                os.remove(file_path)

            # Eliminar registro de base de datos
            db.delete(file_record)
            await db.commit()

            return True

        except Exception as e:
            await db.rollback()
            raise e

    async def get_file_stats(self, db: AsyncSession) -> dict:
        """
        Obtiene estadísticas de archivos del sistema
        """
        from sqlalchemy import func
        stats = {}

        # Total de archivos activos
        stm_active = select(func.count()).select_from(self.fileModel).filter(self.fileModel.is_active)
        result_active = await db.execute(stm_active)
        stats["total_active_files"] = result_active.scalar() or 0

        # Archivos por tipo
        for file_type in ["pdf", "image"]:
            stm_type = select(func.count()).select_from(self.fileModel).filter(
                self.fileModel.file_type == file_type,
                self.fileModel.is_active,
            )
            result_type = await db.execute(stm_type)
            stats[f"total_{file_type}_files"] = result_type.scalar() or 0

        # Tamaño total (aproximado)
        stm_size = select(self.fileModel.file_size).filter(self.fileModel.is_active)
        result_size = await db.execute(stm_size)
        total_size = result_size.scalars().all()

        stats["total_size_bytes"] = sum(size for size in total_size if size)
        stats["total_size_mb"] = round(stats["total_size_bytes"] / (1024 * 1024), 2)

        return stats
