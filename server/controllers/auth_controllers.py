from services.logs_services import LogsService
from database.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from services.users_services import UserService
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter
from typing import Annotated
from config.config import token_expires_minutes
from datetime import timedelta
from utils.jwt import create_access_token

user_service = UserService()
auth_router = APIRouter()
logging_service = LogsService()

@auth_router.post("/login")
async def login(request: Request, formdata: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(get_db)):
    try:
        
        user = await user_service.login(formdata.username, formdata.password, db)
        if not user:
            await logging_service.create_log(
                user_id=None,
                action="LOGIN_FAILED",
                entity_type="USER",
                entity_id=None,
                description=f"Intento de inicio de sesión fallido para usuario: {formdata.username}",
                ip_address=request.client.host if request.client else None,
                db=db
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos!",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=token_expires_minutes)
        # Asegurarse de que el ID sea un string válido
        try:
            user_id = str(user.id)
        except Exception as e:
            print(f"Error al convertir ID a string: {e}, id={user.id}, type={type(user.id)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al procesar el ID de usuario",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = create_access_token(
            data={
                "sub": user.username,
                "user_id": user_id,     
            },
            expires_delta=access_token_expires
        )
        # Crear la respuesta antes de cerrar la sesión
        response_data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "names": user.names,
                "lastname": user.lastname,
                "role_name": user.roles.name if user.roles else None
            }
        }
        await logging_service.create_log(
            user_id=user.id,
            action="LOGIN_SUCCESS",
            entity_type="USER",
            entity_id=str(user.id),
            description=f"Inicio de sesión exitoso para usuario: {user.username}",
            ip_address=request.client.host if request.client else None,
            db=db
        )
        return response_data

    except Exception as e:
        # Solo atrapar excepciones inesperadas (no HTTPException)
        print(f"Error inesperado en login: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al intentar iniciar sesión, comuníquese con el administrador!"
        )

