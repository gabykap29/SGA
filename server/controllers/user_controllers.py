from services.users_services import UserService
from fastapi import HTTPException, status, APIRouter
from models.schemas.user_schema import UserSchema

user_routes = APIRouter(tags=["Users"], prefix="/users")
user_model = UserService()


@user_routes.get("", status_code=status.HTTP_200_OK)
def get_users():
    users = user_model.get_users()
    if not users or len(users) == 0:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail="Aun no se han cargado usuarios o no tienes permisos para verlos!"
        )
    return {"users": users}

@user_routes.get("/{id}", status_code=status.HTTP_200_OK)
def get_user(id: str) -> dict[str, str]:
    user = user_model.get_user(id)
    if not user or len(user) == 0:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail="EL usuario no existe!"
        )
    return {"user": user}

@user_routes.post("/create", status_code=status.HTTP_201_CREATED)
def create_user(body: UserSchema) -> dict[str, str]:
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
        str(body.role_id)
    )
    if not new_user:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail= "Error al crear el usuario, verifique los campos!"
        )
    return {"msg": "Usuario creado correctamente!"}

@user_routes.put("/{id}", status_code=status.HTTP_200_OK)
def update(id: str, body: UserSchema) -> dict[str, str]:
    edit = user_model.edit_user(id, str(body.names),
        str(body.lastname),
        str(body.username),
        str(body.passwd),
        str(body.role_id))
    
    if not edit:
        raise HTTPException(
            status_code= 400,
            detail="Error al actualizar el usuario, verifique los campos!"
        )
    return {"msg": "Usuario actualizado correctamente"}

@user_routes.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_user(id: str) -> dict[str, str]:
    user = user_model.delete_user(id)
    if not user:
        HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail="Error al intentar eliminar el usuario!"
        )
    return {"msg": "Usuario eliminado con exito!"}