import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import UUID
from database.db import Base
from datetime import datetime

class Logs(Base):
    __tablename__ = "logs"
    
    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)  # Tipo de acción: CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type = Column(String(50), nullable=False)  # Tipo de entidad afectada: USER, PERSON, RECORD, etc.
    entity_id = Column(String(36), nullable=True)  # ID de la entidad afectada (como string para flexibilidad)
    description = Column(Text, nullable=True)  # Descripción detallada de la acción
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # Fecha y hora de la acción
    ip_address = Column(String(50), nullable=True)  # Dirección IP desde donde se realizó la acción
    
    # Relación con el usuario que realizó la acción (si está autenticado)
    user = relationship("Users", back_populates="logs")