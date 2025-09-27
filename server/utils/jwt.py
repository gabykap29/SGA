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
        token_data = {
            "username": payload.get("sub"),   # o "username" si lo guardaste así
            "user_id": payload.get("user_id")
        }
        return token_data
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
