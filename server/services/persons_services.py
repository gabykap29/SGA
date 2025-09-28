from models.Persons import Persons
from models.Record import Records
from models.Users import Users
from models.Recortds_Persons import RecordsPersons
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List, Dict
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

    def create_person(self, identification: str, identification_type: str, names: str, lastnames:str, address: str, province: str, country: str, user_id: str, db: Session, observations: Optional[str] = None):
        try:
            is_exist = db.query(self.personModel).filter(self.personModel.identification == identification).first()

            if is_exist:
                return "La persona ya existe!"


            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            user = db.query(self.userModel).filter(self.userModel.id == user_uuid).first()
            if not user:
                return False
            new_person = self.personModel(identification= identification, identification_type= identification_type, names= names, lastnames = lastnames, address= address, province=province, country=country, created_by=user.id, observations=observations)

            db.add(new_person)
            db.commit()
            db.refresh(new_person)
            
            # Cargar las relaciones necesarias para la respuesta
            person_with_relations = (
                db.query(self.personModel)
                .options(
                    joinedload(self.personModel.users),
                    joinedload(self.personModel.record_relationships).joinedload(RecordsPersons.record),
                    joinedload(self.personModel.files)
                )
                .filter(self.personModel.person_id == new_person.person_id)
                .first()
            )
            
            return person_with_relations
        
        except Exception as e:
            print("Error al crear el usuario!", e)
            return False
        finally:
            db.close()
    def search_person(self, query: str, db: Session):
        try: 
            print("contenido de query: ", query)
            if not query or query is None: 
                return []

            q = f"%{query}%"
            persons = db.query(self.personModel).filter(
                or_(
                    self.personModel.identification.ilike(q),
                    self.personModel.lastnames.ilike(q),
                    self.personModel.names.ilike(q),
                    self.personModel.address.ilike(q),
                )
            ).limit(limit=50).all()
            return persons

        except Exception as e:
            print("Error al buscar la persona: ",e)
            return "Error al obtener la persona, verifique la busqueda ingresada"
    def update_person(self, person_id: str, identification: str, identification_type: str, names: str, lastnames: str, address: str, province: str, country: str, db: Session, observations: Optional[str] = None):
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
            setattr(person, "observations", observations)
            
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
            # Convertir las cadenas de texto a objetos UUID para la consulta
            try:
                person_uuid = uuid.UUID(person_id)
                connect_uuid = uuid.UUID(person_to_connect)
            except ValueError as e:
                print(f"Error al convertir UUID: {e}")
                return False
                
            person = db.query(self.personModel).filter(self.personModel.person_id == person_uuid).first()
            if not person:
                print("LA persona no existe!")
                return False
            connection = db.query(self.personModel).filter(self.personModel.person_id == connect_uuid).first()
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


    def delete_person(self, person_id: str, db:Session):
        is_exist = db.query(self.personModel).filter(self.personModel.person_id == person_id).first()
        if not is_exist:
            return "La persona no existe!"
        db.delete(is_exist)
        db.commit()
        return True
        
    def get_linked_persons(self, person_id: str, db: Session):
        """
        Obtiene las personas vinculadas a una persona específica.
        Retorna las conexiones en ambas direcciones (donde la persona es origen o destino).
        """
        try:
            person_uuid = uuid.UUID(person_id)
            
            # Verificar que la persona existe
            person = db.query(self.personModel).filter(self.personModel.person_id == person_uuid).first()
            if not person:
                return "La persona no existe!"
            
            # Obtener conexiones donde la persona es el origen (person_id)
            outgoing_connections = db.query(self.connectionType).filter(
                self.connectionType.person_id == person_uuid
            ).all()
            
            # Obtener conexiones donde la persona es el destino (connection)
            incoming_connections = db.query(self.connectionType).filter(
                self.connectionType.connection == person_uuid
            ).all()
            
            # Combinar y formatear las conexiones
            connections = []
            
            # Procesar conexiones salientes
            for conn in outgoing_connections:
                connected_person = db.query(self.personModel).filter(
                    self.personModel.person_id == conn.connection
                ).first()
                
                if connected_person:
                    connections.append({
                        "connection_id": str(conn.connection_id),
                        "person_id": str(connected_person.person_id),
                        "names": connected_person.names,
                        "lastnames": connected_person.lastnames,
                        "identification": connected_person.identification,
                        "connection_type": conn.connection_type,
                        "direction": "outgoing"  # La persona es el origen
                    })
            
            # Procesar conexiones entrantes
            for conn in incoming_connections:
                connected_person = db.query(self.personModel).filter(
                    self.personModel.person_id == conn.person_id
                ).first()
                
                if connected_person:
                    connections.append({
                        "connection_id": str(conn.connection_id),
                        "person_id": str(connected_person.person_id),
                        "names": connected_person.names,
                        "lastnames": connected_person.lastnames,
                        "identification": connected_person.identification,
                        "connection_type": conn.connection_type,
                        "direction": "incoming"  # La persona es el destino
                    })
            
            return connections
            
        except Exception as e:
            print(f"Error al obtener personas vinculadas: {e}")
            raise e
            
    def get_person_records(self, person_id: str, db: Session):
        """
        Obtiene los antecedentes vinculados a una persona específica.
        """
        try:
            person_uuid = uuid.UUID(person_id)
            
            # Verificar que la persona existe
            person = db.query(self.personModel).filter(self.personModel.person_id == person_uuid).first()
            if not person:
                return "La persona no existe!"
            
            # Obtener los antecedentes vinculados a través de la relación intermedia
            from sqlalchemy.orm import joinedload
            
            # Obtener las relaciones de la persona con antecedentes
            records_relationships = db.query(RecordsPersons).filter(
                RecordsPersons.person_id == person_uuid
            ).options(
                joinedload(RecordsPersons.record)
            ).all()
            
            # Formatear los resultados
            results = []
            for relation in records_relationships:
                if relation.record:
                    record_data = {
                        "record_id": str(relation.record.record_id),
                        "title": relation.record.title,
                        "date": relation.record.date,
                        "content": relation.record.content,
                        "observations": relation.record.observations,
                        "type": relation.record.type,
                        "create_at": relation.record.create_at,
                        "updated_at": relation.record.updated_at,
                        "type_relationship": relation.type_relationship
                    }
                    results.append(record_data)
            
            return results
            
        except Exception as e:
            print(f"Error al obtener antecedentes de la persona: {e}")
            raise e