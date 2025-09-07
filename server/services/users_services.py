from models.Users import Users
from database.db import SessionLocal
from utils.hash_pass import hash_pass
from config.config import pass_admin
from services.roles_services import RolesService
from utils.hash_pass import hash_pass
from sqlalchemy.orm import Session
from models.Roles import Roles

class UserService: 
    def __init__(self):
        self.userModel = Users
        self.roleModel = Roles
    
    def create_admin_user(self, db: Session):
        roles_service = RolesService()
        role_admin = roles_service.findRoleByName(name="ADMIN", db=db)
        
        if not role_admin or not hasattr(role_admin, "id"):
            raise ValueError("ADMIN role not found or invalid role object")
        
        global pass_admin
        if pass_admin is None:
            pass_admin = "admin"
        passwd = hash_pass(pass_admin)
        user_admin = Users(names="admin", lastname="admin", username="admin", passwd=passwd, role_id=role_admin.id)
        try:
            db.add(user_admin)
            db.commit()
            print("Usuario admin creado!")
            
        except Exception as e:
            print("Error al crear el usuario admin: ", e)
        finally:
            db.close()
            
    def get_users(self, db: Session):
        try:
            users = db.query(self.userModel.id,
                          self.userModel.names,
                          self.userModel.lastname,
                          self.userModel.username,
                          self.userModel.last_login,
                          self.roleModel.name.label("role_name"),
                        ).join(self.roleModel).all()
            return users
        except Exception as e:
            print("Error al obtener los usuarios", e)
            return False
        finally:
            db.close()
        
    def get_user(self, id: str, db: Session):
        try:
            user = db.query(self.userModel.id,
                          self.userModel.names,
                          self.userModel.lastname,
                          self.userModel.username,
                          self.userModel.last_login,
                          self.roleModel.name.label("role_name")).join(self.roleModel).filter(self.userModel.id == id).first()
            if user:
                return {
                    "id": user.id,
                    "names": user.names,
                    "lastname": user.lastname,
                    "username": user.username,
                    "last_login": user.last_login,
                    "role_name": user.role_name
                }
            else: 
                return None
        except Exception as e:
            print("Error al obtener los usuarios", e)
            return False
        finally:
            db.close()
            
    def create_user(self, names: str, lastname: str, username: str, passwd: str, role: str, db:Session):
        try:
            hashed_pass = hash_pass(passwd)
            new_user = self.userModel(names=names, lastname=lastname, username=username, passwd=hashed_pass, role_id=role)
            db.add(new_user)
            db.commit()
            return new_user
        except Exception as e:
            print("Error al crear el usuario", e)
            return False
        finally:
            db.close()
            
    def edit_user(self, id: str, names: str, lastname: str, username: str, passwd: str, role: str, db: Session) :
        try:
        
            find = db.query(self.userModel).filter(self.userModel.id == id).first()
            if not find:
                return None
            
            pass_encrypt = hash_pass(passwd)
            
            setattr(find, "names", names)
            setattr(find, "lastname", lastname)
            setattr(find, "username", username)
            setattr(find, "passwd", pass_encrypt)
            setattr(find, "role_id", role)
            db.commit()
            return True
        except Exception as e:
            print("Error al actualizar el usuario", e)
            return False
        finally:
            db.close()
    
    def delete_user(self, id: str, db: Session):
        try:
            user = db.query(self.userModel).filter(self.userModel.id == id).first()
            if not user:
                return False
            db.delete(user)
            db.commit()
            return True
        except Exception as e:
            print("Error al eliminar el usuario", e)
            return False
        finally:
            db.close()