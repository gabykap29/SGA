from services.roles_services import RolesService
from database.db import SessionLocal
role_service = RolesService()

def create_roles():
    db_session = SessionLocal()
    try: 
        roles = role_service.get_roles(db=db_session)
        print("Roles cargados",roles)
        if roles and len(roles) > 0:
            print("Los roles ya se encuentran cargados!")
        else: 
            role_service.create_roles(db=db_session)
            print("Roles cargados con exito!")
    except Exception as e:
        print("Error al crear los roles: ", e)
    finally:
        db_session.close()