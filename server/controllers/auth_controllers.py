from database.db import get_db
from services.users_services import UserService
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter
# from models.schemas.token_schemas import TokenData
from typing import Annotated
from config.config import token_expires_minutes
from datetime import timedelta
from utils.jwt import create_access_token

user_service = UserService()
auth_router = APIRouter()

@auth_router.post("/login")
async def login(request: Request, formdata: Annotated[OAuth2PasswordRequestForm, Depends()]):
    db_session = get_db()
    try:
        user = user_service.login(formdata.username, formdata.password, db=db_session)
        if not user:
            # Registrar intento fallido de inicio de sesión
            try:
                # Crear el log manualmente para evitar problemas con la sesión
                from models.Logs import Logs
                import uuid
                from datetime import datetime
                
                new_log = Logs(
                    log_id=uuid.uuid4(),
                    user_id=None,
                    action="LOGIN_FAILED",
                    entity_type="USER",
                    entity_id=None,
                    description=f"Intento fallido de inicio de sesión para el usuario: {formdata.username}",
                    ip_address=request.client.host if request.client else None,
                    created_at=datetime.utcnow()
                )
                
                db_session.add(new_log)
                db_session.commit()
                
            except Exception as log_error:
                print(f"Error al registrar log de intento fallido: {log_error}")
                db_session.rollback()
                
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
        
        # Registrar inicio de sesión exitoso - pero sin usar la relación de usuario
        try:
            # Crear el log manualmente para evitar problemas con la sesión
            from models.Logs import Logs
            import uuid
            from datetime import datetime
            
            new_log = Logs(
                log_id=uuid.uuid4(),
                user_id=uuid.UUID(user_id) if user_id else None,
                action="LOGIN_SUCCESS",
                entity_type="USER",
                entity_id=user_id,
                description=f"Inicio de sesión exitoso: {user.username}",
                ip_address=request.client.host if request.client else None,
                created_at=datetime.utcnow()
            )
            
            db_session.add(new_log)
            db_session.commit()
            
        except Exception as log_error:
            print(f"Error al registrar log: {log_error}")
            # Hacer rollback en caso de error pero continuar
            db_session.rollback()
        
        return response_data

    except HTTPException:
        # Re-lanzar HTTPException sin modificarla para que FastAPI la maneje correctamente
        raise
    except Exception as e:
        # Solo atrapar excepciones inesperadas (no HTTPException)
        print(f"Error inesperado en login: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al intentar iniciar sesión, comuníquese con el administrador!"
        )

