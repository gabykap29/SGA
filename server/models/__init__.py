# Importar todos los modelos para que SQLAlchemy pueda mapear las relaciones
from .Users import Users
from .Roles import Roles
from .Persons import Persons
from .Record import Records
from .Connection_Type import ConnectionType
from .Recortds_Persons import RecordsPersons
from .Files import Files

# Hacer que los modelos estén disponibles cuando se importe el paquete models
__all__ = [
    "Users",
    "Roles", 
    "Persons",
    "Records",
    "ConnectionType",
    "RecordsPersons",
    "Files"
]