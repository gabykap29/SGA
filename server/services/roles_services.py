from models.Roles import Roles
from database.db import SessionLocal
from sqlalchemy.orm import Session

class RolesService:
    def __init__(self):
        self.roleModel = Roles 
    def create_roles(self, db:Session):
        try:
            roles_list = [
                self.roleModel(name="ADMIN"),
                self.roleModel(name="MODERATE"),
                self.roleModel(name="USERS")
            ]
            db.add_all(roles_list)
            db.commit()
            print("Roles cargados con exito!")
            
        except Exception as e:
            print("Error al crear los roles", e)
        finally:
            db.close()
    def get_roles(self, db: Session):
        try:
            return db.query(self.roleModel).all()
        except Exception as e:
            print("Error al obtener los roles", e)
            return False
        finally:
            db.close()
            
    def findRoleByName(self, name: str, db:Session):
        try:
            return db.query(self.roleModel).filter(self.roleModel.name == name).first()
        except Exception as e:
            print("Error al obtener los roles", e)
            return False
        finally:
            db.close()