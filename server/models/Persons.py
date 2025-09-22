from sqlalchemy import Column, String, DateTime, ForeignKey
from database.db import Base
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

class Persons(Base):
    __tablename__= "persons"
    person_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    identification = Column(String(50), nullable=True, unique= True)
    identification_type = Column(String(50), nullable=False)
    names = Column(String(50), nullable=False)
    lastnames = Column(String(50))
    address = Column(String(255), nullable=True)
    province = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default= lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default= lambda: datetime.now(timezone.utc))
    
    users = relationship("Users", back_populates="persons")
    record_relationships = relationship("RecordsPersons", back_populates="person")
    
    connections_as_person = relationship(
        "ConnectionType",
        foreign_keys="[ConnectionType.person_id]",
        back_populates="person"
    )
    connections_as_connection = relationship(
        "ConnectionType",
        foreign_keys="[ConnectionType.connection]",
        back_populates="connection_person"
    )