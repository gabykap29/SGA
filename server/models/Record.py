import uuid
from sqlalchemy import String, Column, Date, Text, DateTime
from database.db import Base
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


class Records(Base):
    __tablename__ = "records"
    record_id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    title = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    type_record = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    observations = Column(Text, nullable=True)
    create_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    person_relationships = relationship(
        "RecordsPersons", back_populates="record", cascade="all, delete-orphan"
    )
    files = relationship("Files", back_populates="record", cascade="all, delete-orphan")
