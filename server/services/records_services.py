from models.Record import Records
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from models.Recortds_Persons import RecordsPersons
import uuid
from typing import Optional
from models.Persons import Persons
from sqlalchemy import func, or_
import asyncio


class RecordService:
    def __init__(self) -> None:
        self.recordModel = Records
        self.personModel = Persons

    async def get_records(self, db: AsyncSession):
        records = (
            select(self.recordModel)
            .options(
                selectinload(self.recordModel.person_relationships)
                .joinedload(RecordsPersons.person)
                .joinedload(self.personModel.users),
                selectinload(self.recordModel.files),
            )
            .limit(50)
        )
        result = await db.execute(records)
        records = result.scalars().unique().all()
        if not records:
            return []
        return records

    async def get_record(self, record_id: str, db: AsyncSession):
        try:
            record_uuid = uuid.UUID(record_id)
        except ValueError:
            return None

        stm = (
            select(self.recordModel)
            .options(
                selectinload(self.recordModel.person_relationships)
                .joinedload(RecordsPersons.person)
                .joinedload(self.personModel.users),
                selectinload(self.recordModel.files),
            )
            .filter(self.recordModel.record_id == record_uuid)
        )
        result = await db.execute(stm)
        record = result.scalars().first()

        if not record:
            return None

        return record

    async def create_record(
        self,
        title: str,
        date: datetime,
        content: str,
        observations: str,
        db: AsyncSession,
        type_record: str = "PENAL",
    ):
        smt_is_exist = select(self.recordModel).filter(
            func.upper(self.recordModel.title) == func.upper(title)
        )
        result = await db.execute(smt_is_exist)
        is_exist = result.scalars().first()

        if is_exist is not None:
            return f"EL antecedente a cargar ya existe! {title}"

        new_record = self.recordModel(
            title=title,
            date=date,
            content=content,
            observations=observations,
            type_record=type_record,
        )
        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)

        return new_record

    async def stats(self, db: AsyncSession):
        last_month = datetime.now() - timedelta(days=30)
        stmt_person = select(func.count()).select_from(self.personModel)

        stmt_record = select(func.count()).select_from(self.recordModel)

        stmt_month = (
            select(func.count())
            .select_from(self.personModel)
            .filter(self.personModel.created_at >= last_month)
        )

        result_person, result_record, result_month = await asyncio.gather(
            db.execute(stmt_person), db.execute(stmt_record), db.execute(stmt_month)
        )

        # 3. Extraer el valor escalar (el número)
        return {
            "stats": {
                "cant_person": result_person.scalar(),
                "cant_record": result_record.scalar(),
                "cant_month": result_month.scalar(),
            }
        }

    async def update_record(
        self,
        record_id: str,
        title: str,
        date: str,
        content: str,
        observations: str,
        db: AsyncSession,
    ):
        stm_is_exist = select(self.recordModel).filter(
            self.recordModel.record_id == record_id
        )
        result = await db.execute(stm_is_exist)
        is_exist = result.scalars().first()

        if not is_exist:
            return False

        setattr(is_exist, "title", title)
        setattr(is_exist, "date", date)
        setattr(is_exist, "content", content)
        setattr(is_exist, "observations", observations)

        await db.commit()
        return True

    async def delete_record(self, record_id: str, db: AsyncSession):
        stm_is_exist = select(self.recordModel).filter(
            self.recordModel.record_id == record_id
        )
        result = await db.execute(stm_is_exist)
        is_exist = result.scalars().first()

        if not is_exist:
            return False

        db.delete(is_exist)
        await db.commit()

        return True

    async def search_records(
            self, db: AsyncSession, search_term: Optional[str] = None, **filters
        ):
            # 1. Definimos la consulta BASE CON LAS RELACIONES CARGADAS
            stmt = (
                select(self.recordModel)
                .options(
                    # --- Carga de la Cadena de Personas ---
                    selectinload(self.recordModel.person_relationships) # 1. Lista de relaciones
                    .joinedload(RecordsPersons.person)                  # 2. La Persona
                    .joinedload(self.personModel.users),                # 3. El Creador de la Persona (¡Vital!)

                    # --- Carga de Archivos ---
                    selectinload(self.recordModel.files),
                )
            )

            # 2. Si hay término de búsqueda genérico (usamos OR)
            if search_term and search_term.strip():
                term = f"%{search_term.strip().lower()}%"
                stmt = stmt.filter(
                    or_(
                        self.recordModel.title.ilike(term),
                        self.recordModel.content.ilike(term),
                        self.recordModel.observations.ilike(term),
                        self.recordModel.type_record.ilike(term),
                    )
                )

            # 3. Filtros específicos (vamos encadenando .filter)
            if filters.get("title"):
                stmt = stmt.filter(self.recordModel.title.ilike(f"%{filters['title']}%"))

            if filters.get("content"):
                stmt = stmt.filter(self.recordModel.content.ilike(f"%{filters['content']}%"))

            if filters.get("observations"):
                stmt = stmt.filter(
                    self.recordModel.observations.ilike(f"%{filters['observations']}%")
                )

            if filters.get("type_record"):
                stmt = stmt.filter(
                    self.recordModel.type_record.ilike(f"%{filters['type_record']}%")
                )

            # 4. Filtros de Fechas
            if filters.get("date_from"):
                try:
                    date_from = datetime.fromisoformat(filters["date_from"])
                    stmt = stmt.filter(self.recordModel.date >= date_from)
                except ValueError:
                    pass 

            if filters.get("date_to"):
                try:
                    date_to = datetime.fromisoformat(filters["date_to"])
                    # Agregamos un día para incluir el límite superior completo
                    stmt = stmt.filter(self.recordModel.date < date_to + timedelta(days=1))
                except ValueError:
                    pass

            # 5. Filtro complejo: Nombre de persona relacionada
            if filters.get("person_name"):
                person_pattern = f"%{filters['person_name']}%"

                # Creamos una SUBCONSULTA (Select) para obtener los IDs de records
                subquery_ids = (
                    select(self.recordModel.record_id)
                    .join(
                        RecordsPersons, self.recordModel.record_id == RecordsPersons.record_id
                    )
                    .join(Persons, RecordsPersons.person_id == Persons.person_id)
                    .filter(
                        or_(
                            Persons.names.ilike(person_pattern),
                            Persons.lastnames.ilike(person_pattern),
                        )
                    )
                )

                # Aplicamos el filtro usando la subconsulta
                stmt = stmt.filter(self.recordModel.record_id.in_(subquery_ids))

            # 6. FINALMENTE Ejecutamos
            try:
                result = await db.execute(stmt)
                # .unique() es OBLIGATORIO aquí porque usamos selectinload/joinedload mezclados
                records = result.scalars().unique().all()
                return records

            except Exception as e:
                print(f"Error en search_records: {e}") 
                return []