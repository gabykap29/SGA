from models.Persons import Persons
from models.Record import Records
from models.Users import Users
from models.Recortds_Persons import RecordsPersons
from sqlalchemy.orm import Session, joinedload
from models.Connection_Type import ConnectionType
import uuid
class PersonsService:
    def __init__(self):
        self.personModel = Persons
        self.recordModel = Records
        self.userModel = Users
        self.connectionType = ConnectionType
    def get_persons(self, db: Session):
        persons = db.query(self.personModel).options(
            joinedload(self.personModel.record_relationships).joinedload(RecordsPersons.record),
            joinedload(self.personModel.files)  # Cargar archivos (puede ser lista vacía)
        ).all()
        if not persons:
            return []
        return persons
    
    def get_person(self, person_id: str, db: Session):
        try:
            person_uuid = uuid.UUID(person_id)
        except ValueError:
            return False

        person = (
            db.query(self.personModel)
            .options(
                joinedload(self.personModel.users),
                joinedload(self.personModel.record_relationships).joinedload(RecordsPersons.record),
                joinedload(self.personModel.files)  # Cargar archivos (puede ser lista vacía)
            )
            .filter(self.personModel.person_id == person_uuid)
            .first()
        )
        return person

    def create_person(self, identification: str, identification_type: str, names: str, lastnames:str, address: str, province: str, country: str, user_id: str, db: Session):
        try:
            
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(self.userModel).filter(self.userModel.id == user_uuid).first()
            if not user:
                return False
            new_person = self.personModel(identification= identification, identification_type= identification_type, names= names, lastnames = lastnames, address= address, province=province, country=country, created_by=user.id)

            db.add(new_person)
            db.commit()
            return True
        
        except Exception as e:
            print("Error al crear el usuario!", e)
            return False
        finally:
            db.close()
            
    def update_person(self,person_id: str, identification: str, identification_type: str, names: str, lastnames:str, address: str, province: str, country: str, db: Session):
        try:
            person = db.query(self.personModel).filter(self.personModel.person_id == uuid.UUID(person_id)).first()
            if not person:
                print("La persona no existe!")
                return False
            setattr(person, "identification", identification)
            setattr(person, "identification_type", identification_type)
            setattr(person, "names", names)
            setattr(person, "lastnames", lastnames)
            setattr(person, "address", address)
            setattr(person, "province", province)
            setattr(person, "country", country)
            
            db.commit()
            return True
        except Exception as e:
            print("Error al intentar actualizar la persona: ",e)
            return False
        finally:
            db.close()
            
    def add_record(self, person_id: str, record_id: str, type_relationship: str, db:Session):
        try:
            person = db.query(self.personModel).filter(self.personModel.person_id == uuid.UUID(person_id)).first()
            if not person:
                print("La persona no existe!")
                return False
            record = db.query(self.recordModel).filter(self.recordModel.record_id == uuid.UUID(record_id)).first()
            if not record:
                print("El antecedente no existe!")
                return False 
            
            # Verificar si la relación ya existe
            existing_relationship = db.query(RecordsPersons).filter(
                RecordsPersons.person_id == person.person_id,
                RecordsPersons.record_id == record.record_id
            ).first()
            
            if existing_relationship:
                print("La relación entre la persona y el registro ya existe!")
                return False
            
            # Crear la relación en la tabla intermedia
            relationship = RecordsPersons(
                person_id=person.person_id,
                record_id=record.record_id,
                type_relationship=type_relationship
            )
            
            db.add(relationship)
            db.commit()
            
            return True
        except Exception as e:
            print("Error al vincular una persona con el antecedente", e)
            raise e
        
        finally:
            db.close()
            
    def add_person_connection(self, person_id: str, person_to_connect:str, connection_type:str, db:Session):
        try:
            person = db.query(self.personModel).filter(self.personModel.person_id == person_id).first()
            if not person:
                print("LA persona no existe!")
                return False
            connection = db.query(self.personModel).filter(self.personModel.person_id == person_to_connect).first()
            if not connection:
                print("La persona a vincular no existe!")
                return False
            
            rel = self.connectionType(
                person_id= person.person_id,
                connection = connection.person_id,
                connection_type = connection_type 
            )
            db.add(rel)
            db.commit()
            return True
        except Exception as e:
            print("Error al intentar vincular la persona", e)
            raise e
        finally:
            db.close()