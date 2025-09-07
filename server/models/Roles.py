from sqlalchemy import UUID, String, Column
from database.db import Base
from sqlalchemy.orm import relationship
import uuid


class Roles(Base):
    __tablename__ = "roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    
    users = relationship("Users", back_populates="roles")