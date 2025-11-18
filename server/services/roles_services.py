from models.Roles import Roles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger(__name__)

class RolesService:
    def __init__(self):
        self.roleModel = Roles 
    async def create_roles(self, db:AsyncSession):
        try:
            roles_list = [
                self.roleModel(name="ADMIN"),
                self.roleModel(name="MODERATE"),
                self.roleModel(name="USERS"),
                self.roleModel(name="VIEW")
            ]
            await db.add_all(roles_list)
            await db.commit()
            logger.info("Roles cargados con exito!")
            
        except Exception as e:
            logger.error("Error al crear los roles", e)
    async def get_roles(self, db: AsyncSession):
        try:
            stm = select(self.roleModel)
            result = await db.execute(stm)
            return result.scalars().all()
        
        except Exception as e:
            logger.error("Error al obtener los roles", e)
            return False
            
    async def findRoleByName(self, name: str, db:AsyncSession):
        try:
            smt =  select(self.roleModel).filter(self.roleModel.name == name)
            result = await db.execute(smt)
            return result.scalars().first()
        
        except Exception as e:
            logger.info("Error al obtener los roles", e)
            return False