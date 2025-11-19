from models.Persons import Persons
from models.Record import Records
from models.Users import Users
from models.Recortds_Persons import RecordsPersons
from sqlalchemy.orm import joinedload, selectinload, with_loader_criteria
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, and_, select
from typing import Optional
from models.Connection_Type import ConnectionType
import json
import uuid
import pandas
import logging
import threading
from datetime import datetime

# Configurar logging para que sea más visible
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger(__name__)

# Variable global para rastrear el estado de la carga del padrón
_load_status = {
    "is_loading": False,
    "progress": 0,
    "total": 0,
    "message": "",
    "start_time": None,
    "status": "idle",  # idle, loading, completed, failed
}
_load_lock = threading.Lock()


class PersonsService:
    def __init__(self):
        self.personModel = Persons
        self.recordModel = Records
        self.userModel = Users
        self.user_id = None
        self.connectionType = ConnectionType

    async def get_persons(self, db: AsyncSession):
        smt = (
            select(self.personModel)
            .options(
                selectinload(self.personModel.users),
                selectinload(self.personModel.record_relationships).joinedload(
                    RecordsPersons.record
                ),
                selectinload(
                    self.personModel.files
                ),  # Cargar archivos (puede ser lista vacía)
            )
            .order_by(self.personModel.created_at.desc())
            .limit(10)
        )
        results = await db.execute(smt)
        persons = results.scalars().unique().all()
        if not persons:
            return []
        return persons

    # Asegúrate de importar tu modelo de archivos, asumiremos que se llama FileModel
    # O si es genérico, obtén la clase del mapper como estabas intentando

    async def get_person(self, person_id: str, db: AsyncSession):
        try:
            person_uuid = uuid.UUID(person_id)
        except ValueError:
            return False

        # Obtenemos la clase del modelo de archivos dinámicamente si es necesario
        # (Aunque es mejor importar la clase FileModel directamente si puedes)
        FileClass = self.personModel.files.property.mapper.class_

        smt = (
            select(self.personModel)
            .options(
                selectinload(self.personModel.users),
                # Aquí combinamos selectinload con joinedload
                selectinload(self.personModel.record_relationships).joinedload(
                    RecordsPersons.record
                ),
                # OPCIÓN A: Cargar todos los archivos y filtrar en Python (más seguro/fácil)
                selectinload(self.personModel.files),
                # OPCIÓN B: Filtrar en la query (Requiere SQLAlchemy 1.4+)
                # Esto aplica el filtro a la carga de 'files' definida arriba
                with_loader_criteria(FileClass, FileClass.is_active),
            )
            .filter(self.personModel.person_id == person_uuid)
        )

        result = await db.execute(smt)
        person = result.scalars().first()

        if not person:
            return False

        return person

    async def create_person(
        self,
        identification: str,
        identification_type: str,
        names: str,
        lastnames: str,
        address: str,
        province: str,
        country: str,
        user_id: str,
        db: AsyncSession,
        observations: Optional[str] = None,
    ):
        try:
            smt_is_exist = select(self.personModel).filter(
                self.personModel.identification == identification
            )
            result = await db.execute(smt_is_exist)
            is_exist = result.scalars().first()

            if is_exist:
                return "La persona ya existe!"

            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            smt_user_id = select(self.userModel).filter(self.userModel.id == user_uuid)
            result = await db.execute(smt_user_id)
            user = result.scalars().first()

            if not user:
                return False
            new_person = self.personModel(
                identification=identification,
                identification_type=identification_type,
                names=names,
                lastnames=lastnames,
                address=address,
                province=province,
                country=country,
                created_by=user.id,
                observations=observations,
            )

            db.add(new_person)
            await db.commit()

            # Cargar las relaciones necesarias para la respuesta
            smt_with_relations = (
                select(self.personModel)
                .options(
                    joinedload(self.personModel.users),
                    joinedload(self.personModel.record_relationships).joinedload(
                        RecordsPersons.record
                    ),
                    joinedload(self.personModel.files),
                )
                .filter(self.personModel.person_id == new_person.person_id)
            )
            result_with_relations = await db.execute(smt_with_relations)
            person_with_relations = result_with_relations.scalars().first()

            return person_with_relations

        except Exception as e:
            print("Error al crear el usuario!", e)
            return False

    async def search_person_by_dni(self, db: AsyncSession, dni: str):
        """
        Buscar una persona solo por DNI con todas sus relaciones cargadas.
        """
        try:
            stm = (
                select(self.personModel)
                .options(
                    joinedload(self.personModel.users),  # El creador (Objeto)
                    selectinload(self.personModel.files),  # Los archivos (Lista)
                    selectinload(self.personModel.record_relationships).joinedload(
                        RecordsPersons.record
                    ),  # Los antecedentes (Lista)
                )
                .filter(self.personModel.identification == dni)
            )

            result = await db.execute(stm)

            # Recomendado: Agrega .unique() antes de .first() cuando hay cargas de relaciones
            person = result.scalars().unique().first()

            if not person:
                return (
                    None  # Es más estandar devolver None que False para "No encontrado"
                )

            return person

        except Exception as e:
            # Usa tu logger si puedes, es mejor que print
            print(f"Error al buscar persona por DNI: {e}")
            return None

    async def search_person(
        self,
        db: AsyncSession,
        names: Optional[str] = None,
        lastname: Optional[str] = None,
        identification: Optional[str] = None,
        gender: Optional[str] = None,
        address: Optional[str] = None,
        nationality: Optional[str] = None,
    ):
        """
        Busca personas por campos específicos de forma dinámica.
        """

        query = select(self.personModel).options(
            joinedload(self.personModel.users),
            joinedload(self.personModel.record_relationships).joinedload(
                RecordsPersons.record
            ),
            joinedload(self.personModel.files),
        )
        filters = []

        if names and names.strip():
            filters.append(self.personModel.names.ilike(f"%{names.strip()}%"))
        if lastname and lastname.strip():
            filters.append(self.personModel.lastnames.ilike(f"%{lastname.strip()}%"))
        if identification and identification.strip():
            filters.append(
                self.personModel.identification.ilike(f"%{identification.strip()}%")
            )
        if gender and gender.strip():
            filters.append(self.personModel.gender.ilike(f"%{gender.strip()}%"))
        if address and address.strip():
            filters.append(self.personModel.address.ilike(f"%{address.strip()}%"))
        if nationality and nationality.strip():
            filters.append(
                self.personModel.nationality.ilike(f"%{nationality.strip()}%")
            )

        if not filters:
            return []

        try:
            smt = query.filter(and_(*filters)).limit(30)
            result = await db.execute(smt)
            persons = result.scalars().unique().all()
            if not persons:
                return []
            logger.info(
                f"Búsqueda por criterios específicos encontró {len(persons)} personas."
            )
            return persons
        except Exception as e:
            logger.error(
                f"Error durante la búsqueda en la base de datos: {e}", exc_info=True
            )
            raise e

    async def update_person(
        self,
        person_id: str,
        identification: str,
        identification_type: str,
        names: str,
        lastnames: str,
        address: str,
        province: str,
        country: str,
        db: AsyncSession,
        observations: Optional[str] = None,
    ):
        try:
            smt = select(self.personModel).filter(
                self.personModel.person_id == uuid.UUID(person_id)
            )
            result = await db.execute(smt)
            person = result.scalars().first()
            if not person:
                logger.error(f"La persona con ID {person_id} no existe.")
                return False
            setattr(person, "identification", identification)
            setattr(person, "identification_type", identification_type)
            setattr(person, "names", names)
            setattr(person, "lastnames", lastnames)
            setattr(person, "address", address)
            setattr(person, "province", province)
            setattr(person, "country", country)
            setattr(person, "observations", observations)

            await db.commit()
            return True
        except Exception as e:
            logger.error(f"Error al actualizar la persona: {e}", exc_info=True)
            return False

    async def add_record(
        self, person_id: str, record_id: str, type_relationship: str, db: AsyncSession
    ):
        try:
            smt = select(self.personModel).filter(
                self.personModel.person_id == uuid.UUID(person_id)
            )
            result = await db.execute(smt)
            person = result.scalars().first()
            if not person:
                logger.error(f"La persona con ID {person_id} no existe.")
                return False
            smt = select(self.recordModel).filter(
                self.recordModel.record_id == uuid.UUID(record_id)
            )
            result = await db.execute(smt)
            record = result.scalars().first()
            if not record:
                logger.error(f"El antecedente con ID {record_id} no existe.")
                return False

            smt_relationship = select(RecordsPersons).filter(
                RecordsPersons.person_id == person.person_id,
                RecordsPersons.record_id == record.record_id,
            )
            result = await db.execute(smt_relationship)
            existing_relationship = result.scalars().first()

            if existing_relationship:
                logger.info("La relación entre la persona y el registro ya existe!")
                return False

            # Crear la relación en la tabla intermedia
            relationship = RecordsPersons(
                person_id=person.person_id,
                record_id=record.record_id,
                type_relationship=type_relationship,
            )

            db.add(relationship)
            await db.commit()

            return True
        except Exception as e:
            logger.error("Error al vincular una persona con el antecedente", e)
            raise e

    async def remove_record(self, person_id: str, record_id: str, db: AsyncSession):
        """
        Desvincula un antecedente de una persona (elimina la relación de la tabla intermedia)
        """
        try:
            smt = select(
                RecordsPersons,
            ).filter(
                RecordsPersons.person_id == uuid.UUID(person_id),
                RecordsPersons.record_id == uuid.UUID(record_id),
            )
            result = await db.execute(smt)
            relationships = result.scalars().all()

            if not relationships:
                logger.error("La relación entre la persona y el registro no existe!")
                return False

            for relationship in relationships:
                await db.delete(relationship)

            await db.commit()
            return True
        except Exception as e:
            logger.error("Error al desvinculación una persona con el antecedente", e)
            await db.rollback()
            raise e

    async def add_person_connection(
        self,
        person_id: str,
        person_to_connect: str,
        connection_type: str,
        db: AsyncSession,
    ):
        try:
            print(
                f"DEBUG add_person_connection: person_id={person_id}, person_to_connect={person_to_connect}, connection_type={connection_type}"
            )

            # Convertir las cadenas de texto a objetos UUID para la consulta
            try:
                person_uuid = uuid.UUID(person_id)
                connect_uuid = uuid.UUID(person_to_connect)
            except ValueError as e:
                logger.error(f"Error al convertir UUID: {e}")
                print(f"ERROR: Error al convertir UUID: {e}")
                return False

            print(
                f"DEBUG: UUIDs convertidos exitosamente: {person_uuid}, {connect_uuid}"
            )

            smt = select(self.personModel).filter(
                self.personModel.person_id == person_uuid
            )
            result = await db.execute(smt)
            person = result.scalars().first()
            if not person:
                logger.error("LA persona no existe!")
                print(f"ERROR: Persona {person_uuid} no existe")
                return False

            print(f"DEBUG: Persona 1 encontrada: {person.names}")

            smt_connection = select(self.personModel).filter(
                self.personModel.person_id == connect_uuid
            )
            result = await db.execute(smt_connection)
            connection = result.scalars().first()
            if not connection:
                logger.error("La persona a vincular no existe!")
                print(f"ERROR: Persona a vincular {connect_uuid} no existe")
                return False

            print(f"DEBUG: Persona 2 encontrada: {connection.names}")

            rel = self.connectionType(
                person_id=person.person_id,
                connection=connection.person_id,
                connection_type=connection_type,
            )

            print(
                f"DEBUG: Creando vínculo: {rel.person_id} <-> {rel.connection} (tipo: {rel.connection_type})"
            )

            db.add(rel)
            await db.commit()

            print("DEBUG: Vínculo creado y guardado exitosamente")
            return True
        except Exception as e:
            print(f"ERROR al intentar vincular la persona: {str(e)}")
            logger.error(f"Error al intentar vincular la persona: {str(e)}")
            raise e

    async def remove_person_connection(
        self, person_id: str, person_to_disconnect: str, db: AsyncSession
    ):
        """
        Desvincula una persona de otra (elimina la conexión/relación)
        """
        try:
            # Convertir las cadenas de texto a objetos UUID para la consulta
            try:
                person_uuid = uuid.UUID(person_id)
                disconnect_uuid = uuid.UUID(person_to_disconnect)
            except ValueError as e:
                logger.error(f"Error al convertir UUID: {e}")
                print(f"Error al convertir UUID: {e}")
                return False

            print(f"DEBUG: Buscando vínculo entre {person_uuid} y {disconnect_uuid}")

            smt = select(self.personModel).filter(
                self.personModel.person_id == person_uuid
            )
            result = await db.execute(smt)
            person = result.scalars().first()
            if not person:
                logger.error("La persona no existe!")
                print(f"DEBUG: Persona {person_uuid} no existe")
                return False

            connection = select(self.personModel).filter(
                self.personModel.person_id == disconnect_uuid
            )
            result = await db.execute(connection)
            connection = result.scalars().first()
            if not connection:
                logger.error("La persona a desvinculación no existe!")
                print(f"DEBUG: Persona a desvinculación {disconnect_uuid} no existe")
                return False

            # Buscar TODOS los vínculos específicos
            rel = select(self.connectionType).filter(
                or_(
                    and_(
                        self.connectionType.person_id == person.person_id,
                        self.connectionType.connection == connection.person_id,
                    ),
                    and_(
                        self.connectionType.person_id == connection.person_id,
                        self.connectionType.connection == person.person_id,
                    ),
                )
            )
            result = await db.execute(rel)
            rels = result.scalars().all()

            if not rels:
                print(
                    f"DEBUG: No existe vínculo entre {person_uuid} y {disconnect_uuid}"
                )
                return False

            print(f"DEBUG: {len(rels)} vínculos encontrados, eliminando...")

            for r in rels:
                await db.delete(r)

            await db.commit()
            print("DEBUG: Vínculos eliminados exitosamente")
            return True
        except Exception as e:
            logger.error("Error al intentar desvinculación la persona", e)
            print(f"ERROR: {str(e)}")
            raise e

    async def delete_person(self, person_id: str, db: AsyncSession):
        try:
            is_exist = select(self.personModel).filter(
                self.personModel.person_id == uuid.UUID(person_id)
            )
            result = await db.execute(is_exist)
            is_exist = result.scalars().first()
            if not is_exist:
                return "La persona no existe!"
            db.delete(is_exist)
            await db.commit()
            return True
        except Exception as e:
            logger.error(f"Error al eliminar la persona: {e}")
            return False

    async def get_linked_persons(self, person_id: str, db: AsyncSession):
        """
        Obtiene las personas vinculadas a una persona específica.
        Retorna las conexiones en ambas direcciones (donde la persona es origen o destino).
        """
        try:
            person_uuid = uuid.UUID(person_id)

            # Verificar que la persona existe
            smt = select(self.personModel).filter(
                self.personModel.person_id == person_uuid
            )
            result = await db.execute(smt)
            person = result.scalars().first()
            if not person:
                return "La persona no existe!"

            # Obtener conexiones donde la persona es el origen (person_id)
            outgoing_connections = select(self.connectionType).filter(
                self.connectionType.person_id == person_uuid
            )

            # Obtener conexiones donde la persona es el destino (connection)
            incoming_connections = select(self.connectionType).filter(
                self.connectionType.connection == person_uuid
            )
            result_outgoing = await db.execute(outgoing_connections)
            result_incoming = await db.execute(incoming_connections)
            outgoing_connections = result_outgoing.scalars().all()
            incoming_connections = result_incoming.scalars().all()

            # Combinar y formatear las conexiones
            connections = []

            # Procesar conexiones salientes
            for conn in outgoing_connections:
                connected_person = select(self.personModel).filter(
                    self.personModel.person_id == conn.connection
                )
                result = await db.execute(connected_person)
                connected_person = result.scalars().first()

                if connected_person:
                    connections.append(
                        {
                            "connection_id": str(conn.connection_id),
                            "person_id": str(connected_person.person_id),
                            "names": connected_person.names,
                            "lastnames": connected_person.lastnames,
                            "identification": connected_person.identification,
                            "connection_type": conn.connection_type,
                            "direction": "outgoing",  # La persona es el origen
                        }
                    )

            # Procesar conexiones entrantes
            for conn in incoming_connections:
                smt = select(self.personModel).filter(
                    self.personModel.person_id == conn.person_id
                )
                result = await db.execute(smt)
                connected_person = result.scalars().first()

                if connected_person:
                    connections.append(
                        {
                            "connection_id": str(conn.connection_id),
                            "person_id": str(connected_person.person_id),
                            "names": connected_person.names,
                            "lastnames": connected_person.lastnames,
                            "identification": connected_person.identification,
                            "connection_type": conn.connection_type,
                            "direction": "incoming",  # La persona es el destino
                        }
                    )

            return connections

        except Exception as e:
            logger.error(f"Error al obtener personas vinculadas: {e}")
            raise e

    async def get_person_records(self, person_id: str, db: AsyncSession):
        """
        Obtiene los antecedentes vinculados a una persona específica.
        """
        try:
            person_uuid = uuid.UUID(person_id)

            # Verificar que la persona existe
            smt = select(self.personModel).filter(
                self.personModel.person_id == person_uuid
            )
            result = await db.execute(smt)
            person = result.scalars().first()
            if not person:
                return "La persona no existe!"

            # Obtener las relaciones de la persona con antecedentes
            records_relationships = (
                select(RecordsPersons)
                .filter(RecordsPersons.person_id == person_uuid)
                .options(joinedload(RecordsPersons.record))
            )
            result = await db.execute(records_relationships)
            records_relationships = result.scalars().all()

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
                        "type_relationship": relation.type_relationship,
                    }
                    results.append(record_data)
            return results

        except Exception as e:
            logger.error(f"Error al obtener antecedentes de la persona: {e}")
            raise e

    async def load_persons(self, db: AsyncSession, user_id: str):
        """
        Inicia la carga de personas desde CSV en un thread separado.
        Retorna inmediatamente el estado de la solicitud.
        """
        global _load_status, _load_lock
        self.user_id = user_id
        try:
            with _load_lock:
                if _load_status["is_loading"]:
                    return {
                        "status": "loading",
                        "message": "Ya hay una carga en progreso",
                        "progress": _load_status["progress"],
                        "is_loading": True,
                    }

                # Verificar si ya hay suficientes personas
                smt = select(self.personModel).count()
                result = await db.execute(smt)
                count = result.scalar()
                if count >= 5:
                    return {
                        "status": "skipped",
                        "message": "Ya hay suficientes personas en la base de datos",
                        "is_loading": False,
                    }

                # Iniciar la carga en un thread separado
                _load_status["is_loading"] = True
                _load_status["status"] = "loading"
                _load_status["progress"] = 0
                _load_status["start_time"] = datetime.now()
                _load_status["message"] = "Iniciando carga del padrón..."

            # Iniciar thread de carga
            thread = threading.Thread(
                target=self._load_persons_background, args=(db,), daemon=True
            )
            thread.start()

            return {
                "status": "started",
                "message": "Carga iniciada. Por favor, espera...",
                "is_loading": True,
            }
        except Exception as e:
            logger.error(f"Error al iniciar carga de personas: {e}")
            with _load_lock:
                _load_status["is_loading"] = False
                _load_status["status"] = "failed"
            return {
                "status": "error",
                "message": f"Error al iniciar la carga: {str(e)}",
                "is_loading": False,
            }

    async def _load_persons_background(self, db: AsyncSession):
        """
        Función que se ejecuta en un thread separado para cargar personas desde CSV.
        """
        global _load_status, _load_lock
        try:
            persons = pandas.read_csv("padron.csv", encoding="latin-1")
            data_to_json = json.loads(persons.to_json(orient="records"))

            await db.bulk_save_objects(
                [
                    self.personModel(
                        identification=str(item["identification"]),
                        identification_type="DNI",
                        names=item["names"],
                        lastnames=item["lastnames"],
                        address=item["address"],
                        province=item["province"],
                        country="ARGENTINA",
                        created_by=uuid.UUID(self.user_id),
                    )
                    for item in data_to_json
                ]
            )
            await db.commit()
            with _load_lock:
                _load_status["is_loading"] = False
                _load_status["progress"] = 100
                _load_status["status"] = "completed"
                _load_status["message"] = "Carga completada exitosamente."
            logger.warning("Carga de personas completada exitosamente.")
            return True
        except Exception as e:
            logger.error(f"Error durante la carga de personas: {e}", exc_info=True)
            with _load_lock:
                _load_status["is_loading"] = False
                _load_status["status"] = "failed"
                _load_status["message"] = f"Error durante la carga: {str(e)}"
