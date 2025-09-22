from services.users_services import UserService
from database.db import SessionLocal

def create_admin():
    db_session = SessionLocal()
    user_model = UserService()
    try:
        users = user_model.get_users(db=db_session)
        if not users or len(users) == 0:
            user_model.create_admin_user(db=db_session)
            print("Usuario administrador creado")
            
        else:
            print("Usuario admin ya existente!")    
        return True
    except Exception as e:
        print("Error al crear el usuario administrador: ", e)
        return False
        
    finally:
        db_session.close()