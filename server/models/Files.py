import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from database.db import Base
from datetime import datetime, timezone
from enum import Enum

class FileType(str, Enum):
    PDF = "pdf"
    IMAGE = "image"

class Files(Base):
    __tablename__ = "files"
    
    # Identificador único del archivo
    file_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Información del archivo
    original_filename = Column(String(255), nullable=False, comment="Nombre original del archivo")
    encrypted_filename = Column(String(255), nullable=False, unique=True, comment="Nombre encriptado en el sistema de archivos")
    file_type = Column(String(10), nullable=False, comment="Tipo de archivo: pdf, image")
    file_size = Column(Integer, nullable=False, comment="Tamaño del archivo en bytes")
    mime_type = Column(String(100), nullable=False, comment="Tipo MIME del archivo")
    
    # Metadatos de encriptación
    encryption_key_hash = Column(String(255), nullable=False, comment="Hash de la clave de encriptación")
    encryption_salt = Column(String(255), nullable=False, comment="Salt usado para la encriptación")
    
    # Metadatos adicionales
    description = Column(Text, nullable=True, comment="Descripción opcional del archivo")
    is_active = Column(Boolean, default=True, comment="Si el archivo está activo o eliminado lógicamente")
    
    # Relaciones
    person_id = Column(UUID(as_uuid=True), ForeignKey("persons.person_id"), nullable=False, 
                      comment="ID de la persona propietaria del archivo")
    record_id = Column(UUID(as_uuid=True), ForeignKey("records.record_id"), nullable=True,
                      comment="ID del record asociado (opcional)")
    
    # Auditoría
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False,
                        comment="Usuario que subió el archivo")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc))
    
    # Relaciones SQLAlchemy
    person = relationship("Persons", back_populates="files")
    record = relationship("Records", back_populates="files")
    uploader = relationship("Users", foreign_keys=[uploaded_by])
    
    def __repr__(self):
        return f"<File(file_id={self.file_id}, original_filename='{self.original_filename}', type='{self.file_type}')>"
        
    def is_pdf(self):
        """Verifica si el archivo es PDF"""
        return self.file_type == FileType.PDF.value
    
    def is_image(self):
        """Verifica si el archivo es imagen"""
        return self.file_type == FileType.IMAGE.value