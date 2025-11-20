from services.users_services import UserService
from database.db import (
    SessionLocal as async_session,
)  # Importa tu sessionmaker, NO get_db


async def create_admin():
    """
    Esta función gestiona su propia sesión de base de datos
    """
    async with async_session() as db:
        user_model = UserService()
        users = await user_model.get_users(db=db)

        if not users:
            print("Base de datos vacía. Creando admin...")
            await user_model.create_admin_user(db=db)
            return True

        print("Ya existen usuarios. Omitiendo creación de admin.")
        return False
