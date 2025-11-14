from services.users_services import UserService
from fastapi import HTTPException, status, APIRouter, Depends
from models.schemas.user_schema import UserSchema, UserResponses
from database.db import get_db
from typing import List, Dict
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_admin, check_rol_moderate_or_admin, check_rol_all
user_routes = APIRouter(tags=["Users"], prefix="/users")
user_model = UserService()


@user_routes.get("", status_code=status.HTTP_200_OK, response_model=List[UserResponses])
def get_users(current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_moderate_or_admin)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para listar usuarios"
        )
    db_session = get_db()
    try:
        users = user_model.get_users(db=db_session)
        if not users or len(users) == 0:
            raise HTTPException(
                status_code= status.HTTP_404_NOT_FOUND,
                detail="Aun no se han cargado usuarios o no tienes permisos para verlos!"
            )
        
        return users
    except Exception as e:
        print(f"Error al obtener usuarios: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener usuarios"
        )
@user_routes.get("/{id}", status_code=status.HTTP_200_OK, response_model=UserResponses)
def get_user(id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_moderate_or_admin)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este usuario"
        )
    db_session = get_db()
    user = user_model.get_user(id, db=db_session)
    if not user: 
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail="EL usuario no existe!"
        )
    db_session.close()
    return user

@user_routes.post("/create", status_code=status.HTTP_201_CREATED)
def create_user(body: UserSchema, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_admin)) -> dict[str, str]:
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden crear usuarios"
        )
    db_session = get_db()
    if body.passwd != body.confirm_passwd:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail= "Las contraseñas no coinciden!"
        )
    print("Creando usuario con datos:", body)
    
    import uuid
    # Convertir role_id a UUID si es string
    try:
        role_id = uuid.UUID(str(body.role_id)) if isinstance(body.role_id, str) else body.role_id
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El role_id proporcionado no es un UUID válido"
        )
    
    new_user = user_model.create_user(
        str(body.names),
        str(body.lastname),
        str(body.username),
        str(body.passwd),
        role_id,
        db=db_session
    )
    if not new_user:
        print("Esto trajo usuarios ", new_user)
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail= "Error al crear el usuario, verifique los campos!"
        )
    db_session.close()
    return {"msg": "Usuario creado correctamente!"}

@user_routes.put("/{id}", status_code=status.HTTP_200_OK)
def update(id: str, body: UserSchema, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_moderate_or_admin)) -> dict[str, str]:
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar usuarios"
        )
    db_session = get_db()
    
    import uuid
    # Convertir role_id a UUID si es string
    try:
        role_id = uuid.UUID(str(body.role_id)) if isinstance(body.role_id, str) else body.role_id
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El role_id proporcionado no es un UUID válido"
        )
    
    # Convertir id a UUID
    try:
        id_uuid = uuid.UUID(str(id)) if isinstance(id, str) else id
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El id proporcionado no es un UUID válido"
        )
    
    edit = user_model.edit_user(id_uuid, str(body.names),
        str(body.lastname),
        str(body.username),
        str(body.passwd),
        role_id,
        db=db_session
        )
    
    if not edit:
        raise HTTPException(
            status_code= 400,
            detail="Error al actualizar el usuario, verifique los campos!"
        )
    return {"msg": "Usuario actualizado correctamente"}

@user_routes.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_user(id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_admin)) -> dict[str, str]:
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden eliminar usuarios"
        )
    db_session = get_db()
    user = user_model.delete_user(id, db=db_session)
    if not user:
        HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail="Error al intentar eliminar el usuario!"
        )
    db_session.close()
    return {"msg": "Usuario eliminado con exito!"}