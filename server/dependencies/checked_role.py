from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from utils.jwt import decode_access_token
from services.users_services import UserService
from database.db import SessionLocal
from models.schemas.user_schema import UserResponses
import uuid

user_service = UserService()
oauth_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_role(token: Annotated[str, Depends(oauth_scheme)]):
    db_session = SessionLocal()
    try:
        # Decodificar el token
        token_decode = decode_access_token(token=token)
        
        if not token_decode or "user_id" not in token_decode:
            raise HTTPException(
                detail="Token no valido!",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
            
        # Obtener el ID del usuario desde el token y convertirlo a UUID
        user_id_str = token_decode["user_id"]
        try:
            user_id_obj = uuid.UUID(user_id_str)
            print(f"UUID convertido correctamente: {user_id_obj}")
        except ValueError as ve:
            print(f"Error al convertir user_id a UUID: {user_id_str}, error: {ve}")
            raise HTTPException(
                detail="El ID de usuario en el token es inválido.",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
        
        # Obtener los datos del usuario usando el objeto UUID
        user_data = user_service.get_user(id=user_id_obj, db=db_session)
        
        if user_data is None:
            print(f"Error al verificar el rol: Usuario no encontrado con ID: {user_id_str}")
            raise HTTPException(
                detail=f"Usuario no encontrado",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        if not isinstance(user_data, UserResponses):
            raise HTTPException(
                detail=f"Datos de usuario inválidos. Tipo: {type(user_data)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        print(f"Rol obtenido correctamente: {user_data.role_name}")
        return user_data.role_name
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e: 
        print(f"Error en get_role: {e}, tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            detail=f"Error al obtener el rol de usuario: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        db_session.close()

def check_rol_admin(token: Annotated[str, Depends(oauth_scheme)]):
    try:
        role = get_role(token=token)
        if role == "ADMIN":
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e:
        print(f"Error en check_rol_admin: {e}, tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de administrador: {str(e)}"
        )


def check_rol_moderate_or_admin(token: Annotated[str, Depends(oauth_scheme)]):
    try:
        role = get_role(token=token)
        if role == "ADMIN" or role == "MODERATE":
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e:
        print(f"Error en check_rol_moderate_or_admin: {e}, tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de moderador o administrador: {str(e)}"
        )

def check_rol_all(token: Annotated[str, Depends(oauth_scheme)]):
    try:
        role = get_role(token=token)
        if role == "ADMIN" or role == "MODERATE" or role == "USERS":
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e:
        print(f"Error en check_rol_all: {e}, tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de usuario: {str(e)}"
        )
        
        
def check_rol_viewer(token: Annotated[str, Depends(oauth_scheme)]):
    try:
        role = get_role(token=token)
        if role == "VIEW":
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e:
        print(f"Error en check_rol_viewer: {e}, tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de viewer: {str(e)}"
        )


def check_rol_all_or_viewer(token: Annotated[str, Depends(oauth_scheme)]):
    """
    Permite acceso a ADMIN, MODERATE, USERS y VIEW (visualizador)
    """
    try:
        role = get_role(token=token)
        if role == "ADMIN" or role == "MODERATE" or role == "USERS" or role == "VIEW":
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e:
        print(f"Error en check_rol_all_or_viewer: {e}, tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar los roles: {str(e)}"
        )