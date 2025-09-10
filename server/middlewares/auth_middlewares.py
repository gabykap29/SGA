from fastapi import Depends, HTTPException, status
import jwt 
from typing import Annotated
from config.config import secret_key, hash_algorithm
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models.schemas.token_schemas import TokenData
from jwt.exceptions import InvalidTokenError
from services.users_services import UserService
from database.db import SessionLocal
from models.schemas.user_schema import UserResponses

user_services = UserService()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def is_autenticate(token: Annotated[str, Depends(oauth2_scheme)]):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autentificado!",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try: 
        payload = jwt.decode(token, secret_key, algorithms=[hash_algorithm])
        username = payload.get("sub")
        if username is None:
            raise credential_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credential_exception
    db_session = SessionLocal()
    user = user_services.get_user_username(username=username, db=db_session)
    if user is None or not user:
        raise credential_exception
    data = {"id": user.id, "username": user.username, "role": user.roles}
    return data