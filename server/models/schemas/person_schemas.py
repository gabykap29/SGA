from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class PersonSchema(BaseModel): 
    identification: str
    identification_type: str
    names: str
    lastnames: str
    address: str
    province: str
    country: str
    
    
class UserResponse(BaseModel):
    id: UUID
    username: str    
    
    class Config:
        orm_mode = True

class PersonResponse(BaseModel):
    person_id: UUID
    identification: str
    identification_type: str
    names: str
    lastnames: str
    address: str
    province: str
    country: str
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    users: UserResponse
    
    class Config:
        orm_mode =  True
        
        