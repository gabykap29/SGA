from services.users_services import UserService


def create_admin():
    user_model = UserService()
    try:
        users = user_model.get_users()
        if not users or len(users) == 0:
            user_model.create_admin_user()
            print("Usuario administrador creado")
        else:
            print("Usuario admin ya existente!")    
            
    except Exception as e:
        print("Error al crear el usuario administrador: ", e)