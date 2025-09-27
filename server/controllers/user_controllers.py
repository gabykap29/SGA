from services.users_services import UserService
from fastapi import HTTPException, status, APIRouter, Depends
from models.schemas.user_schema import UserSchema, UserResponses
from database.db import SessionLocal
from typing import List, Dict
from dependencies.is_auth import is_authenticated
user_routes = APIRouter(tags=["Users"], prefix="/users")
user_model = UserService()


@user_routes.get("", status_code=status.HTTP_200_OK, response_model=List[UserResponses])
def get_users(current_user: Dict = Depends(is_authenticated)):
    db_session = SessionLocal()
    try:
        users = user_model.get_users(db=db_session)
        if not users or len(users) == 0:
            raise HTTPException(
                status_code= status.HTTP_404_NOT_FOUND,
                detail="Aun no se han cargado usuarios o no tienes permisos para verlos!"
            )
        
        return users
    finally:
        db_session.close()

@user_routes.get("/{id}", status_code=status.HTTP_200_OK, response_model=UserResponses)
def get_user(id: str, current_user: Dict = Depends(is_authenticated)):
    db_session = SessionLocal()
    user = user_model.get_user(id, db=db_session)
    if not user: 
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail="EL usuario no existe!"
        )
    db_session.close()
    return user

@user_routes.post("/create", status_code=status.HTTP_201_CREATED)
def create_user(body: UserSchema, current_user: Dict = Depends(is_authenticated)) -> dict[str, str]:
    db_session = SessionLocal()
    if body.passwd != body.confirm_passwd:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail= "Las contraseñas no coinciden!"
        )
    new_user = user_model.create_user(
        str(body.names),
        str(body.lastname),
        str(body.username),
        str(body.passwd),
        str(body.role_id),
        db=db_session
    )
    if not new_user:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail= "Error al crear el usuario, verifique los campos!"
        )
    db_session.close()
    return {"msg": "Usuario creado correctamente!"}

@user_routes.put("/{id}", status_code=status.HTTP_200_OK)
def update(id: str, body: UserSchema, current_user: Dict = Depends(is_authenticated)) -> dict[str, str]:
    db_session = SessionLocal()
    edit = user_model.edit_user(id, str(body.names),
        str(body.lastname),
        str(body.username),
        str(body.passwd),
        str(body.role_id),
        db=db_session
        )
    
    if not edit:
        raise HTTPException(
            status_code= 400,
            detail="Error al actualizar el usuario, verifique los campos!"
        )
    return {"msg": "Usuario actualizado correctamente"}

@user_routes.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_user(id: str, current_user: Dict = Depends(is_authenticated)) -> dict[str, str]:
    db_session = SessionLocal()
    user = user_model.delete_user(id, db=db_session)
    if not user:
        HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail="Error al intentar eliminar el usuario!"
        )
    db_session.close()
    return {"msg": "Usuario eliminado con exito!"}