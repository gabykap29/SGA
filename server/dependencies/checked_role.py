from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from utils.jwt import decode_access_token
from services.users_services import UserService
from database.db import get_db
from models.schemas.user_schema import UserResponses
from services.logs_services import LogsService
import uuid
import traceback

user_service = UserService()
oauth_scheme = OAuth2PasswordBearer(tokenUrl="login")
logs_sevice = LogsService()


async def get_role(token: str, db_session: AsyncSession) -> str:
    """
    Helper function to decode a token, retrieve user data, and return the user's role.
    This function should not be used as a FastAPI dependency directly.
    """
    try:
        # Decodificar el token
        token_decode = decode_access_token(token=token)

        if not token_decode or "user_id" not in token_decode:
            await logs_sevice.create_log(
                db=db_session,
                user_id=None,
                action="Token no valido al obtener rol",
                entity_type="AUTHENTICATION",
                description="El token proporcionado no contiene un id de usuario válido!.",
                entity_id=None,
                ip_address=None,
            )
            raise HTTPException(
                detail="Token no valido!", status_code=status.HTTP_401_UNAUTHORIZED
            )

        # Obtener el ID del usuario desde el token y convertirlo a UUID
        user_id_str = token_decode["user_id"]
        try:
            user_id_obj = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                detail="El ID de usuario en el token es inválido.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        # Obtener los datos del usuario usando el objeto UUID
        user_data = await user_service.get_user(id=user_id_obj, db=db_session)

        if user_data is None:
            await logs_sevice.create_log(
                db=db_session,
                user_id=user_id_obj,
                action="Usuario no encontrado al obtener rol",
                entity_type="AUTHENTICATION",
                description=f"El usuario con ID {user_id_str} no fue encontrado en la base de datos.",
                entity_id=None,
                ip_address=None,
            )
            raise HTTPException(
                detail="Usuario no encontrado", status_code=status.HTTP_404_NOT_FOUND
            )

        if not isinstance(user_data, UserResponses):
            raise HTTPException(
                detail=f"Datos de usuario inválidos. Tipo: {type(user_data)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return user_data.role_name
    except HTTPException as http_ex:
        # Re-lanzar las excepciones HTTP tal como están
        raise http_ex
    except Exception as e:
        print(f"Error en get_role: {e}, tipo: {type(e)}")
        traceback.print_exc()
        raise HTTPException(
            detail=f"Error al obtener el rol de usuario: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


async def check_rol_admin(
    token: Annotated[str, Depends(oauth_scheme)],
    db_session: AsyncSession = Depends(get_db),
):
    try:
        role = await get_role(token=token, db_session=db_session)
        if role == "ADMIN":
            return True
        return False
    except HTTPException as http_ex:
        await logs_sevice.create_log(
            db=db_session,
            user_id=None,
            action="Error al verificar rol de admin",
            entity_type="AUTHORIZATION",
            description=f"Error HTTP al verificar rol de admin: {http_ex.detail}",
            entity_id=None,
            ip_address=None,
        )
        raise http_ex
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de administrador: {str(e)}",
        )


async def check_rol_moderate_or_admin(
    token: Annotated[str, Depends(oauth_scheme)], db_session: AsyncSession = Depends(get_db)
):
    try:
        role = await get_role(token=token, db_session=db_session)
        if role == "ADMIN" or role == "MODERATE":
            return True
        return False
    except HTTPException as http_ex:
        await logs_sevice.create_log(
            db=db_session,
            user_id=None,
            action="Error al verificar rol de moderador o admin",
            entity_type="AUTHORIZATION",
            description=f"Error HTTP al verificar rol de moderador o admin: {http_ex.detail}",
            entity_id=None,
            ip_address=None,
        )
        raise http_ex
    except Exception as e:
        print(f"Error en check_rol_moderate_or_admin: {e}, tipo: {type(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de moderador o administrador: {str(e)}",
        )


async def check_rol_all(
    token: Annotated[str, Depends(oauth_scheme)],
    db_session: AsyncSession = Depends(get_db),
):
    try:
        role = await get_role(token=token, db_session=db_session)
        if role in ["ADMIN", "MODERATE", "USERS", "USER"]:
            return True
        return False
    except HTTPException as http_ex:
        await logs_sevice.create_log(
            db=db_session,
            user_id=None,
            action="Error al verificar rol de todos los usuarios",
            entity_type="AUTHORIZATION",
            description=f"Error HTTP al verificar rol de todos los usuarios: {http_ex.detail}",
        )
        raise http_ex
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de usuario: {str(e)}",
        )


async def check_rol_viewer(
    token: Annotated[str, Depends(oauth_scheme)],
    db_session: AsyncSession = Depends(get_db),
):
    try:
        role = await get_role(token=token, db_session=db_session)
        if role == "VIEW":
            return True
        return False
    except HTTPException as http_ex:
        await logs_sevice.create_log(
            db=db_session,
            user_id=None,
            action="Error al verificar rol de viewer",
            entity_type="AUTHORIZATION",
            description=f"Error HTTP al verificar rol de viewer: {http_ex.detail}",
        )
        raise http_ex
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar el rol de viewer: {str(e)}",
        )


async def check_rol_all_or_viewer(
    token: Annotated[str, Depends(oauth_scheme)],
    db_session: AsyncSession = Depends(get_db),
):
    """
    Permite acceso a ADMIN, MODERATE, USERS y VIEW (visualizador)
    """
    try:
        role = await get_role(token=token, db_session=db_session)
        if role in ["ADMIN", "MODERATE", "USERS", "VIEW"]:
            return True
        await logs_sevice.create_log(
            db=db_session,
            user_id=None,
            action="Acceso denegado",
            entity_type="AUTHORIZATION",
            description=f"El rol '{role}' no tiene permisos suficientes.",
        )

        return False
    except HTTPException as http_ex:
        await logs_sevice.create_log(
            db=db_session,
            user_id=None,
            action="Error al verificar rol de todos o viewer",
            entity_type="AUTHORIZATION",
            description=f"Error HTTP al verificar rol de todos o viewer: {http_ex.detail}",
        )
        raise http_ex
    except Exception as e:
        await logs_sevice.create_log(
            db=db_session,
            user_id=None,
            action="Error al verificar rol de todos o viewer",
            entity_type="AUTHORIZATION",
            description=f"Error al verificar rol de todos o viewer: {str(e)}",
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar los roles: {str(e)}",
        )
