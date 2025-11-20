from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class LogResponse(BaseModel):
    log_id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    ip_address: Optional[str] = None


class LogFilterParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    user_id: Optional[str] = None


class PaginatedLogResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int
    data: List[LogResponse]
