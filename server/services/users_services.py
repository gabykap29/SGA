import uuid
from models.Users import Users
from utils.hash_pass import hash_pass
from config.config import pass_admin
from services.roles_services import RolesService
from sqlalchemy.ext.asyncio import AsyncSession
from models.Roles import Roles
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy import select
from models.schemas.user_schema import UserResponses
from passlib.context import CryptContext

# Instancia global (solo se crea una vez)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

class UserService:
    def __init__(self):
        self.userModel = Users
        self.roleModel = Roles

    async def login(self, username: str, password: str, db: AsyncSession):
        # 1. Buscar usuario
        stm = (
            select(self.userModel)
            .options(joinedload(self.userModel.roles))
            .filter(self.userModel.username == username)
        )
        result = await db.execute(stm)
        user = result.scalars().first()

        if not user:
            print("Usuario no encontrado!")
            return False # O mejor: return None

        # 2. Verificar contraseña usando la función global
        if not user.passwd:
            return False
            
        # Usamos la función global verify_password
        if not verify_password(password, user.passwd):
            return False

        # 3. Actualizar último login
        try:
            user.last_login = datetime.now()
            await db.commit() # Guardamos la fecha
            return user
        except Exception as e:
            await db.rollback() # Por seguridad
            print(f"Error actualizando login: {e}")
            return False

    async def create_user(
        self,
        names: str,
        lastname: str,
        username: str,
        passwd: str,
        role: uuid.UUID,
        db: AsyncSession,
    ):
        try:
            # 1. Verificar existencia
            stm_is_exist = select(self.userModel).filter(
                self.userModel.username == username
            )
            result = await db.execute(stm_is_exist)
            is_exist = result.scalars().first()

            if is_exist:
                print("El usuario ya existe!")
                return False

            # 2. Hashear contraseña (usando la función global)
            pass_encrypt = get_password_hash(passwd)
            
            new_user = self.userModel(
                names=names,
                lastname=lastname,
                username=username,
                passwd=pass_encrypt,
                role_id=role,
            )

            # 3. Añadir a sesión (SIN AWAIT) - ERROR CRÍTICO CORREGIDO
            db.add(new_user) 
            
            # 4. Guardar y Refrescar (CON AWAIT)
            await db.commit()
            await db.refresh(new_user)
            
            return new_user
            
        except Exception as e:
            # 5. Rollback en caso de error - ERROR CRÍTICO CORREGIDO
            await db.rollback() 
            print(f"Error al crear el usuario: {e}")
            return False
    async def create_admin_user(self, db: AsyncSession):
        roles_service = RolesService()
        role_admin = await roles_service.findRoleByName(name="ADMIN", db=db)

        if not role_admin or not hasattr(role_admin, "id"):
            raise ValueError("ADMIN role not found or invalid role object")

        global pass_admin
        if pass_admin is None:
            pass_admin = "admin"
        passwd = hash_pass(pass_admin)
        user_admin = Users(
            names="admin",
            lastname="admin",
            username="admin",
            passwd=passwd,
            role_id=role_admin.id,
        )
        try:
            db.add(user_admin)
            await db.commit()
            print("Usuario admin creado!")

        except Exception as e:
            print("Error al crear el usuario admin: ", e)

    async def get_users(self, db: AsyncSession):
        try:
            users = (
                select(
                    self.userModel.id,
                    self.userModel.names,
                    self.userModel.lastname,
                    self.userModel.username,
                    self.userModel.last_login,
                    self.roleModel.name.label("role_name"),
                )
                .join(self.roleModel)
                .options(joinedload(self.userModel.roles))
            )
            result = await db.execute(users)
            users = result.scalars().all()

            if not users:
                return []
            return users
        except Exception as e:
            print("Error al obtener los usuarios", e)
            return False

    async def get_user(self, id: uuid.UUID, db: AsyncSession):
        try:
            print(f"Getting user with ID: {id}, type: {type(id)}")

            # Usar joinedload para cargar la relación del rol - mismo patrón que get_user_by_username
            stm = (
                select(self.userModel)
                .options(joinedload(self.userModel.roles))
                .filter(self.userModel.id == id)
            )
            result = await db.execute(stm)
            user = result.scalars().first()

            if user is None:
                print(f"Usuario no encontrado con ID: {id}")
                return None

            print(
                f"Usuario encontrado: {user.username}, role: {user.roles.name if user.roles else 'N/A'}"
            )

            # Crear la respuesta ANTES de cerrar la sesión
            response = UserResponses(
                id=user.id,
                names=user.names,
                lastname=user.lastname,
                username=user.username,
                last_login=user.last_login,
                role_name=user.roles.name if user.roles else "UNKNOWN",
            )

            return response
        except Exception as e:
            print(f"Error al obtener el usuario: {e}")
            import traceback

            traceback.print_exc()
            return None

    async def get_user_by_username(self, username: str, db: AsyncSession):
        try:
            from sqlalchemy.orm import joinedload

            # Usar joinedload para cargar la relación roles en la misma consulta
            stm = (
                select(self.userModel)
                .options(joinedload(self.userModel.roles))
                .filter(self.userModel.username == username)
            )
            result = await db.execute(stm)
            user = result.scalars().first()

            if user is None:
                print("El usuario no existe!")
                return False

            return user

        except Exception as e:
            print("Error al obtener el usuario", e)
            return False

    async def edit_user(
        self,
        id: uuid.UUID,
        names: str,
        lastname: str,
        username: str,
        passwd: str,
        role: uuid.UUID,
        db: AsyncSession,
    ):
        try:
            stm = select(self.userModel).filter(self.userModel.id == id)
            result = await db.execute(stm)
            find = result.scalars().first()

            if not find:
                return None

            pass_encrypt = hash_pass(passwd)

            setattr(find, "names", names)
            setattr(find, "lastname", lastname)
            setattr(find, "username", username)
            setattr(find, "passwd", pass_encrypt)
            setattr(find, "role_id", role)
            await db.commit()
            await db.refresh(find)

            return True
        except Exception as e:
            print("Error al actualizar el usuario", e)
            return False

    async def delete_user(self, id: str, db: AsyncSession):
        try:
            stm = select(self.userModel).filter(self.userModel.id == id)
            result = await db.execute(stm)
            user = result.scalars().first()

            if not user:
                return False
            db.delete(user)
            await db.commit()
            return True
        except Exception as e:
            print("Error al eliminar el usuario", e)
            return False
