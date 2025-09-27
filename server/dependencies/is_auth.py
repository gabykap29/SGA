from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from utils.jwt import decode_access_token

oatth_scheme = OAuth2PasswordBearer(tokenUrl="login")

def is_authenticated(token: Annotated[str, Depends(oatth_scheme)]) -> dict:
    
    """
    Dependencia de FastAPI: Verifica la validez del token y decodifica su payload.
    
    Retorna el payload del token o lanza HTTPException 401.
    """
    try:
        return decode_access_token(token=token)
    except Exception as e:
        raise e
    