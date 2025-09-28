from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from utils.jwt import decode_access_token
from services.users_services import UserService
from database.db import SessionLocal
from models.schemas.user_schema import UserResponses

user_service = UserService()
oauth_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_role(token: Annotated[str, Depends(oauth_scheme)]):
    db_session = SessionLocal()
    try:
        # Decodificar el token
        token_decode = decode_access_token(token=token)
        print(f"Token decodificado: {token_decode}")
        
        if not token_decode or "user_id" not in token_decode:
            print(f"Token inválido o sin user_id: {token_decode}")
            raise HTTPException(
                detail="Token no valido!",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
            
        # Obtener el ID del usuario desde el token
        user_id = token_decode["user_id"]
        print(f"User ID del token: {user_id}, tipo: {type(user_id)}")
        
        # Obtener los datos del usuario
        user_data = user_service.get_user(id=user_id, db=db_session)
        print(f"Datos de usuario obtenidos: {user_data}, tipo: {type(user_data)}")
        
        if user_data is None:
            print(f"Usuario no encontrado con ID: {user_id}")
            raise HTTPException(
                detail=f"Usuario no encontrado con ID: {user_id}",
                status_code=status.HTTP_404_NOT_FOUND
            )
            
        if not isinstance(user_data, UserResponses):
            print(f"Tipo de user_data inesperado: {type(user_data)}")
            raise HTTPException(
                detail=f"Datos de usuario inválidos. Tipo: {type(user_data)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        print(f"Rol del usuario: {user_data.role_name}")
        return user_data.role_name
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        print(f"HTTPException en get_role: {http_ex}")
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
        print(f"Verificando rol ADMIN - Rol obtenido: {role}")
        if role == "ADMIN":
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        print(f"HTTPException en check_rol_admin: {http_ex}")
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
        print(f"Verificando rol MODERATE o ADMIN - Rol obtenido: {role}")
        if role == "ADMIN" or role == "MODERATE":
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        print(f"HTTPException en check_rol_moderate_or_admin: {http_ex}")
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
        print(f"Verificando rol ADMIN, MODERATE o USER - Rol obtenido: {role}")
        if role in ["ADMIN", "MODERATE", "USER"]:
            return True
        return False
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        print(f"HTTPException en check_rol_all: {http_ex}")
        raise http_ex
    except Exception as e:
        print(f"Error en check_rol_all: {e}, tipo: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de usuario: {str(e)}"
        )