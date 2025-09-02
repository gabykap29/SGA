from models.Users import Users
from database.db import SessionLocal
from utils.hash_pass import hash_pass
from config.config import pass_admin
from services.roles_services import RolesService
from utils.hash_pass import hash_pass

class UserService: 
    def __init__(self):
        self.userModel = Users
        self.db = SessionLocal()
    
    def create_admin_user(self):
        roles_service = RolesService()
        role_admin = roles_service.findRoleByName(name="ADMIN")
        
        if not role_admin or not hasattr(role_admin, "id"):
            raise ValueError("ADMIN role not found or invalid role object")
        
        global pass_admin
        if pass_admin is None:
            pass_admin = "admin"
        passwd = hash_pass(pass_admin)
        user_admin = Users(names="admin", lastname="admin", username="admin", passwd=passwd, role=role_admin.id)
        try:
            self.db.add(user_admin)
            self.db.commit()
            print("Usuario admin creado!")
            
        except Exception as e:
            print("Error al crear el usuario admin: ", e)
        finally:
            self.db.close()
            
    def get_users(self):
        try:
            users = self.db.query(self.userModel.id,
                          self.userModel.names,
                          self.userModel.lastname,
                          self.userModel.username,
                          self.userModel.last_login,
                        ).all()
            return users
        except Exception as e:
            print("Error al obtener los usuarios", e)
            return False
        finally:
            self.db.close()
        
    def get_user(self, id: str):
        try:
            user = self.db.query(self.userModel).filter(self.userModel.id == id).first()
            return user
        except Exception as e:
            print("Error al obtener los usuarios", e)
            return False
        finally:
            self.db.close()
            
    def create_user(self, names: str, lastname: str, username: str, passwd: str, role: str):
        try:
            hashed_pass = hash_pass(passwd)
            new_user = self.userModel(names=names, lastname=lastname, username=username, passwd=hashed_pass, role=role)
            self.db.add(new_user)
            self.db.commit()
            return new_user
        except Exception as e:
            print("Error al crear el usuario", e)
            return False
        finally:
            self.db.close()
            
    def edit_user(self, id: str, names: str, lastname: str, username: str, passwd: str, role: str) :
        try:
        
            find = self.db.query(self.userModel).filter(self.userModel.id == id).first()
            if not find or len(find) == 0:
                return False
            
            pass_encrypt = hash_pass(passwd)
            
            setattr(find, "names", names)
            setattr(find, "lastname", lastname)
            setattr(find, "username", username)
            setattr(find, "passwd", pass_encrypt)
            self.db.commit()
            
        except Exception as e:
            print("Error al eliminar el usuario", e)
            return False
        finally:
            self.db.close()
    
    def delete_user(self, id: str):
        try:
            user = self.db.query(self.userModel).filter(self.userModel.id == id).first()
            if not user:
                return False
            self.db.delete(user)
            self.db.commit()
            return True
        except Exception as e:
            print("Error al eliminar el usuario", e)
            return False
        finally:
            self.db.close()