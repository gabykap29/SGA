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
        user_id = payload.get("user_id")
        if username is None:
            raise credential_exception
        token_data = TokenData(username=username, user_id=user_id)
    except InvalidTokenError:
        raise credential_exception
    db_session = SessionLocal()
    try:
        # Obtenemos el usuario pero sin cerrar la sesión automáticamente
        from sqlalchemy.orm import joinedload
        # En lugar de usar el servicio, hacemos la consulta directamente
        user = db_session.query(user_services.userModel).options(
            joinedload(user_services.userModel.roles)
        ).filter(user_services.userModel.username == username).first()
        
        if user is None or not user:
            raise credential_exception
        
        # Creamos el objeto de datos manteniendo la estructura original
        # pero asegurándonos de que el objeto roles esté completamente cargado
        data = {
            "id": user.id,
            "username": user.username,
            "role": user.roles,  # Mantenemos el objeto role completo como estaba antes
            # Agregamos estos campos adicionales por si se necesitan en el futuro
            "role_id": str(user.roles.id) if user.roles else None,
            "role_name": user.roles.name if user.roles else None
        }
        return data
    finally:
        # Siempre cerramos la sesión al terminar
        db_session.close()