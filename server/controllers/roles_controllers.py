from services.roles_services import RolesService
from fastapi import HTTPException, status, APIRouter, Depends
from database.db import SessionLocal
from typing import Dict
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_moderate_or_admin
role_router = APIRouter(tags=["Roles"], prefix="/roles")
role_service = RolesService()


@role_router.get("")
def get_roles(current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_moderate_or_admin)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para listar roles"
        )
    db_session = SessionLocal()
    roles = role_service.get_roles(db=db_session)
    if not roles:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail= "Aun no hay roles cargados o no tienes permisos para verlos!"
        )
    return roles

