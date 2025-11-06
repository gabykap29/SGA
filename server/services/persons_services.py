from models.Persons import Persons
from models.Record import Records
from models.Users import Users
from models.Recortds_Persons import RecordsPersons
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional, List, Dict
from models.Connection_Type import ConnectionType
import uuid
import pandas
import logging
import sys

# Configurar logging para que sea más visible
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)
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
        ).order_by(self.personModel.created_at.desc()).limit(10).all()
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

    def search_person_by_dni(self, db:Session, dni: str):
        """
            buscar una persona solo por dni
        """
        try:
            person = db.query(self.personModel).filter(self.personModel.identification == dni).first()
            if not person:
                return False
            return person
        except Exception as e:
            print("Error al obtener la persona ", e)
            return False

    def search_person(self, db: Session, names: Optional[str] = None, lastname: Optional[str] = None, identification: Optional[str] = None, gender: Optional[str] = None, address: Optional[str] = None, nationality: Optional[str] = None):
        """
        Busca personas por campos específicos de forma dinámica.
        """
        print(f"🔎 search_person() llamado con: names={names}, lastname={lastname}, identification={identification}, gender={gender}, address={address}, nationality={nationality}")
        
        query = db.query(self.personModel)
        filters = []

        if names and names.strip():
            print(f"  ✓ Agregando filtro names: {names}")
            filters.append(self.personModel.names.ilike(f"%{names.strip()}%"))
        if lastname and lastname.strip():
            print(f"  ✓ Agregando filtro lastname: {lastname}")
            filters.append(self.personModel.lastnames.ilike(f"%{lastname.strip()}%"))
        if identification and identification.strip():
            print(f"  ✓ Agregando filtro identification: {identification}")
            filters.append(self.personModel.identification.ilike(f"%{identification.strip()}%"))
        if gender and gender.strip():
            print(f"  ✓ Agregando filtro gender: {gender}")
            filters.append(self.personModel.gender.ilike(f"%{gender.strip()}%"))
        if address and address.strip():
            print(f"  ✓ Agregando filtro address: {address}")
            filters.append(self.personModel.address.ilike(f"%{address.strip()}%"))
        if nationality and nationality.strip():
            print(f"  ✓ Agregando filtro nationality: {nationality}")
            filters.append(self.personModel.nationality.ilike(f"%{nationality.strip()}%"))

        if not filters:
            # Si no hay filtros, no devolvemos nada para evitar una carga masiva de datos.
            print(f"  ⚠️  Sin filtros especificados, devolviendo lista vacía")
            return []

        try:
            # Aplicar todos los filtros con un AND lógico
            persons = query.filter(and_(*filters)).limit(100).all()
            print(f"  ✅ Búsqueda completada: {len(persons)} personas encontradas")
            logger.info(f"Búsqueda por criterios específicos encontró {len(persons)} personas.")
            return persons
        except Exception as e:
            print(f"  ❌ Error durante la búsqueda: {e}")
            logger.error(f"Error durante la búsqueda en la base de datos: {e}", exc_info=True)
            raise e

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

    def remove_record(self, person_id: str, record_id: str, db:Session):
        """
        Desvincula un antecedente de una persona (elimina la relación de la tabla intermedia)
        """
        try:
            person = db.query(self.personModel).filter(self.personModel.person_id == uuid.UUID(person_id)).first()
            if not person:
                print("La persona no existe!")
                return False

            record = db.query(self.recordModel).filter(self.recordModel.record_id == uuid.UUID(record_id)).first()
            if not record:
                print("El antecedente no existe!")
                return False

            # Buscar y eliminar la relación en la tabla intermedia
            relationship = db.query(RecordsPersons).filter(
                RecordsPersons.person_id == person.person_id,
                RecordsPersons.record_id == record.record_id
            ).first()

            if not relationship:
                print("No existe vínculo entre la persona y el antecedente!")
                return False

            db.delete(relationship)
            db.commit()

            return True
        except Exception as e:
            print("Error al desvinculación una persona con el antecedente", e)
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

    def remove_person_connection(self, person_id: str, person_to_disconnect: str, db: Session):
        """
        Desvincula una persona de otra (elimina la conexión/relación)
        """
        try:
            # Convertir las cadenas de texto a objetos UUID para la consulta
            try:
                person_uuid = uuid.UUID(person_id)
                disconnect_uuid = uuid.UUID(person_to_disconnect)
            except ValueError as e:
                print(f"Error al convertir UUID: {e}")
                return False

            person = db.query(self.personModel).filter(self.personModel.person_id == person_uuid).first()
            if not person:
                print("La persona no existe!")
                return False
            
            connection = db.query(self.personModel).filter(self.personModel.person_id == disconnect_uuid).first()
            if not connection:
                print("La persona a desvinculación no existe!")
                return False

            # Buscar la conexión entre ambas personas (puede estar en ambas direcciones)
            rel = db.query(self.connectionType).filter(
                or_(
                    and_(
                        self.connectionType.person_id == person.person_id,
                        self.connectionType.connection == connection.person_id
                    ),
                    and_(
                        self.connectionType.person_id == connection.person_id,
                        self.connectionType.connection == person.person_id
                    )
                )
            ).first()

            if not rel:
                print("No existe vínculo entre las personas!")
                return False

            db.delete(rel)
            db.commit()
            return True
        except Exception as e:
            print("Error al intentar desvinculación la persona", e)
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
                        "record_number": getattr(relation.record, "title", None),
                        "record_date": getattr(relation.record, "date", None),
                        "description": getattr(relation.record, "content", None),
                        "observations": getattr(relation.record, "observations", None),
                        "record_type": getattr(relation.record, "type_record", None),
                        "create_at": getattr(relation.record, "create_at", None),
                        "updated_at": getattr(relation.record, "updated_at", None),
                        "type_relationship": relation.type_relationship
                    }
                    results.append(record_data)
            return results

        except Exception as e:
            print(f"Error al obtener antecedentes de la persona: {e}")
            raise e

    def load_persons(self, db: Session):
            try:
                count = db.query(self.personModel).count()
                print("Cantidad de personas en la base de datos:", count)
                if count < 5:
                    df = pandas.read_csv("padron_25_filtrado.csv", encoding='latin-1', sep=',')
                    processed_count = 0
                    for index, row in df.iterrows():
                        identification = str(row['identification']).strip()
                        type_identification = str(row["identification_type"]).strip()
                        names = str(row['names']).strip().title()
                        lastnames = str(row['lastnames']).strip().title()
                        address = str(row['address']).strip().title()
                        province = str(row['province']).strip().title()
                        country = "country"

                        existing_person = db.query(self.personModel).filter(self.personModel.identification == identification).first()
                        if existing_person:
                            print(f"La persona con DNI {identification} ya existe. Saltando...")
                            continue

                        new_person = self.personModel(
                            identification=identification,
                            identification_type=type_identification,
                            names=names,
                            lastnames=lastnames,
                            address=address,
                            province=province,
                            country=country,
                        )
                        db.add(new_person)
                        processed_count += 1

                        if processed_count % 100 == 0:
                            db.commit()
                            print(f"{processed_count} personas procesadas...")
                    db.commit()
                    print("Carga de personas completada.")
                    return True
                else:
                    print("Ya hay suficientes personas en la base de datos. No se cargaron nuevas personas.")
                    return False
            except Exception as e:
                print(f"Error al cargar personas desde CSV: {e}")
                db.rollback()
