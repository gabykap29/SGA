from fastapi import Depends, HTTPException, status
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
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e:
        print("Error en is_authenticated:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )
    