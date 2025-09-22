import uuid
from sqlalchemy import ForeignKey, String, Column
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from database.db import Base
import uuid

class RecordsPersons(Base):
    __tablename__ = "records_persons"
    id = Column(UUID(as_uuid= True), primary_key= True, default=uuid.uuid4, index= True)
    person_id = Column(UUID(as_uuid= True), ForeignKey("persons.person_id"), nullable=False)
    record_id = Column(UUID(as_uuid= True), ForeignKey("records.record_id"), nullable=False)
    type_relationship = Column(String(50), nullable= False)
    
    person = relationship("Persons", back_populates="record_relationships")
    record = relationship("Records", back_populates="person_relationships")
    
    

