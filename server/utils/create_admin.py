from services.users_services import UserService
from database.db import SessionLocal as AsyncSessionLocal

async def create_admin():
    # 2. Abre la sesión manualmente usando un contexto (async with)
    async with AsyncSessionLocal() as db_session:
        user_model = UserService()
        try:
            print("👤 Verificando existencia de administrador...")

            # Ahora 'db_session' SÍ es una sesión real de SQLAlchemy
            users = await user_model.get_users(db=db_session)

            # Nota: user_model.get_users devuelve una lista, verificamos si está vacía
            # Asumiendo que get_users devuelve [] si no hay nadie
            admin_exists = False
            if users:
                # Aquí deberías verificar si alguno es ADMIN realmente,
                # pero siguiendo tu lógica actual:
                pass

            # Tu lógica original revisada:
            # Si users es None o vacío, creamos el admin
            if not users:
                await user_model.create_admin_user(db=db_session)
                print("✅ Usuario administrador creado exitosamente")
            else:
                print("ℹ️  Usuarios ya existentes. Omitiendo creación de admin.")

            return True

        except Exception as e:
            # Usa f-string para evitar el error de formato del logger que tenías antes
            print(f"❌ Error al crear el usuario administrador: {e}")
            return False
