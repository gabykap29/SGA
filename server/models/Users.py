from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from database.db import Base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm  import relationship
import uuid
from datetime import datetime, timezone

class Users(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key= True, default=uuid.uuid4, index=True)
    names = Column(String(100), nullable=False)
    lastname = Column(String(50), nullable=False)
    username = Column(String(50), nullable=False, unique=True)
    passwd = Column(String(100), nullable=False)
    create_at = Column(DateTime, default= lambda: datetime.now(timezone.utc) )
    update_at = Column(DateTime, default= lambda: datetime.now(timezone.utc) )
    last_login = Column(DateTime, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    roles = relationship("role", back_populates="users")