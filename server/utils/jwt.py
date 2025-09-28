from datetime import datetime, timedelta, timezone
import jwt
from fastapi import  HTTPException, status
from jwt.exceptions import PyJWTError
from config.config import secret_key, hash_algorithm


def create_access_token(data: dict, expires_delta:timedelta | None = None): 
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encode_jwt = jwt.encode(to_encode, secret_key, algorithm= hash_algorithm)
    return encode_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[hash_algorithm])
        
        # Verificar que los campos necesarios existan
        if "sub" not in payload:
            print("Error: 'sub' no está presente en el payload del token")
        if "user_id" not in payload:
            print("Error: 'user_id' no está presente en el payload del token")
            
        token_data = {
            "username": payload.get("sub"),
            "user_id": payload.get("user_id")
        }
        
        print(f"Token decodificado correctamente. Payload: {token_data}")
        return token_data
    except PyJWTError as jwt_err:
        print(f"Error al decodificar el token: {jwt_err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {str(jwt_err)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Error inesperado al decodificar el token: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al procesar el token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
