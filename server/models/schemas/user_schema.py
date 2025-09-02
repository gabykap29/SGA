from pydantic import BaseModel

class UserSchema(BaseModel):
    names: str
    lastname: str
    username: str
    passwd: str
    confirm_passwd: str
    role_id: str