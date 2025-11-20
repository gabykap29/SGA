from models.Persons import Persons
from models.Record import Records
from models.Files import Files
from models.Users import Users
from models.Recortds_Persons import RecordsPersons
from sqlalchemy.orm import joinedload, selectinload, with_loader_criteria
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, and_, select, func
from typing import Optional
from models.Connection_Type import ConnectionType
from database.db import SessionLocal as async_session
import asyncio
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

    async def get_person(self, person_id: str, db: AsyncSession):
        try:
            person_uuid = uuid.UUID(person_id)
        except ValueError:
            return False

        smt = (
            select(self.personModel)
            .options(
                joinedload(self.personModel.users),
                joinedload(self.personModel.record_relationships).joinedload(
                    RecordsPersons.record
                ),
                selectinload(
                    self.personModel.files
                ),  # Solo dile que cargue los archivos
                # 2. CORRECCIÓN AQUÍ:
                # Usa la CLASE "Files", no "self.personModel.files"
                with_loader_criteria(Files, Files.is_active),
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
        address: Optional[str] = None,
        country: Optional[str] = None,
    ):
        """
        Busca personas por campos específicos de forma dinámica.
        """
        try:
            query = select(self.personModel).options(
                selectinload(self.personModel.record_relationships).joinedload(
                    RecordsPersons.record
                ),
                selectinload(self.personModel.files),
                joinedload(self.personModel.users),
            )

            filters = []

            if identification and identification.strip():
                filters.append(
                    self.personModel.identification.like(f"{identification.strip()}%")
                )
            text_fields = {
                names: self.personModel.names,
                lastname: self.personModel.lastnames,
                address: self.personModel.address,
                country: self.personModel.country,
            }

            for value, column in text_fields.items():
                if value and value.strip():
                    filters.append(column.ilike(f"%{value.strip()}%"))

            if not filters:
                return []

            stmt = query.filter(and_(*filters)).limit(100)
            result = await db.execute(stmt)

            # .unique() es importante cuando usas joinedload para evitar duplicados en el resultado ORM
            persons = result.scalars().unique().all()

            if persons:
                logger.info(f"Búsqueda específica encontró {len(persons)} personas.")

            return persons

        except Exception as e:
            logger.error(f"Error en search_person: {e}", exc_info=True)
            raise e  # Re-lanzar la excepción para que el controlador la maneje (HTTP 500)

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
            relationship = result.scalars().first()
            if not relationship:
                logger.error("La relación entre la persona y el registro no existe!")
                return False
            db.delete(relationship)
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
            try:
                person_uuid = uuid.UUID(person_id)
                connect_uuid = uuid.UUID(person_to_connect)
            except ValueError as e:
                logger.error(f"Error al convertir UUID: {e}")
                print(f"ERROR: Error al convertir UUID: {e}")
                return False

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
        Desvincula una persona de otra (elimina la conexión/relación).
        Elimina vínculos en ambas direcciones si existen.
        """
        try:
            try:
                person_uuid = uuid.UUID(person_id)
                disconnect_uuid = uuid.UUID(person_to_disconnect)
            except ValueError as e:
                logger.error(f"Error al convertir UUID: {e}")
                return False

            stmt = select(self.connectionType).filter(
                or_(
                    and_(
                        self.connectionType.person_id == person_uuid,
                        # Asegúrate que .connection sea la columna UUID, si es relationship usa .connection_id
                        self.connectionType.connection == disconnect_uuid,
                    ),
                    and_(
                        self.connectionType.person_id == disconnect_uuid,
                        self.connectionType.connection == person_uuid,
                    ),
                )
            )

            result = await db.execute(stmt)
            relationships = result.scalars().all()

            if not relationships:
                return False

            for rel in relationships:
                await db.delete(rel)
            await db.commit()
            return True

        except Exception as e:
            logger.error(f"Error crítico desvinculando: {e}")
            await db.rollback()
            return False

    async def delete_person(self, person_id: str, db: AsyncSession):
        try:
            person_uuid = uuid.UUID(person_id)
            smt = select(self.personModel).filter(
                self.personModel.person_id == person_uuid
            )
            result = await db.execute(smt)
            person_to_delete = result.scalars().first()
            if not person_to_delete:
                return "La persona no existe!"
            await db.delete(person_to_delete)
            await db.commit()
            return True
        except Exception as e:
            logger.error(f"Error al eliminar la persona: {e}", exc_info=True)
            await db.rollback()
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
        global _load_status, _load_lock
        self.user_id = user_id

        try:
            with _load_lock:
                if _load_status["is_loading"]:
                    return {
                        "status": "loading",
                        "message": "Ya hay una carga en progreso",
                        # ...
                    }

                # CORRECCIÓN PREVIA: Count seguro
                smt = select(func.count()).select_from(self.personModel)
                result = await db.execute(smt)
                count = result.scalar() or 0  # Protegemos contra None

                if count >= 5:
                    return {
                        "status": "skipped",
                        "message": "Ya hay suficientes personas",
                        "is_loading": False,
                    }

                # Configurar estado inicial
                _load_status["is_loading"] = True
                _load_status["status"] = "loading"
                _load_status["progress"] = 0
                _load_status["start_time"] = datetime.now()

            # CORRECCIÓN CRÍTICA:
            # 1. No usamos threading.Thread
            # 2. Usamos asyncio.create_task para que corra en el loop asíncrono
            # 3. NO pasamos 'db', la tarea creará su propia sesión
            asyncio.create_task(self._load_persons_background())

            return {
                "status": "started",
                "message": "Carga iniciada en segundo plano.",
                "is_loading": True,
            }

        except Exception as e:
            # ... manejo de error ...
            return {"status": "error", "message": str(e)}

    async def _load_persons_background(self):
        """
        Esta función corre en background. Debe gestionar SU PROPIA sesión.
        """
        global _load_status, _load_lock

        # IMPORTANTE: Creamos un nuevo scope de base de datos
        # porque la sesión del request original ya murió.
        async with async_session() as db:
            try:
                # OPTIMIZACIÓN: Pandas es bloqueante (síncrono).
                # Leer un CSV grande bloqueará todo tu servidor FastAPI.
                # Lo ejecutamos en un thread pool para no congelar la API.
                loop = asyncio.get_running_loop()
                # Ejecutamos la lectura del CSV en un hilo aparte
                data_to_json = await loop.run_in_executor(None, self._read_csv_sync)

                if not data_to_json:
                    raise Exception("El CSV está vacío o no se pudo leer")

                # Insertar en la BD (esto sí es async y rápido)
                # Nota: bulk_save_objects es legacy, mejor usar add_all o insert core
                # pero para este ejemplo lo mantengo si te funciona.
                objects_to_save = [
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

                db.add_all(
                    objects_to_save
                )  # add_all es más moderno que bulk_save_objects en ORM
                await db.commit()

                with _load_lock:
                    _load_status["is_loading"] = False
                    _load_status["status"] = "completed"
                    _load_status["progress"] = 100

                logger.info("Carga background finalizada exitosamente")

            except Exception as e:
                logger.error(f"Error background: {e}")
                with _load_lock:
                    _load_status["is_loading"] = False
                    _load_status["status"] = "failed"
                    _load_status["message"] = str(e)

    def _read_csv_sync(self):
        """Helper síncrono para leer CSV con pandas sin bloquear el loop"""
        try:
            persons = pandas.read_csv("padron.csv", encoding="latin-1")
            return json.loads(persons.to_json(orient="records"))
        except Exception as e:
            logger.error(f"Error leyendo CSV: {e}")
            return []
