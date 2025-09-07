from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
class UserSchema(BaseModel):
    names: str
    lastname: str
    username: str
    passwd: str
    confirm_passwd: str
    role_id: str
    
class UserResponses(BaseModel): 
    id : UUID
    names : str
    lastname : str
    username : str
    last_login : datetime | None
    role_name : str