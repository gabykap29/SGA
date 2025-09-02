from models.Roles import Roles
from database.db import SessionLocal

class RolesService:
    def __init__(self):
        self.roleModel = Roles 
        self.db = SessionLocal()
    def create_roles(self):
        try:
            roles_list = [
                self.roleModel(name="ADMIN"),
                self.roleModel(name="MODERATE"),
                self.roleModel(name="USERS")
            ]
            self.db.add_all(roles_list)
            self.db.commit()
            print("Roles cargados con exito!")
            
        except Exception as e:
            print("Error al crear los roles", e)
        finally:
            self.db.close()
    def get_roles(self):
        try:
            return self.db.query(self.roleModel).all()
        except Exception as e:
            print("Error al obtener los roles", e)
            return False
        finally:
            self.db.close()
            
    def findRoleByName(self, name: str):
        try:
            return self.db.query(self.roleModel).filter(self.roleModel.name == name).first()
        except Exception as e:
            print("Error al obtener los roles", e)
            return False
        finally:
            self.db.close()