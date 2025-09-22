from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from database.db import Base
import uuid

class ConnectionType(Base):
    __tablename__ = "connection_type"
    connection_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    person_id = Column(UUID(as_uuid=True), ForeignKey("persons.person_id"), nullable=True)
    connection = Column(UUID(as_uuid=True), ForeignKey("persons.person_id"), nullable=True)
    connection_type = Column(String(50), nullable=False)
    
    person = relationship("Persons", foreign_keys=[person_id], back_populates="connections_as_person")
    connection_person = relationship("Persons", foreign_keys=[connection], back_populates="connections_as_connection")