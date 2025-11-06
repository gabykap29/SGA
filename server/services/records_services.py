from models.Record import Records
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from models.Recortds_Persons import RecordsPersons
import uuid
from typing import Optional
from models.Persons import Persons
from sqlalchemy import func, or_, and_

class RecordService:
    def __init__(self) -> None:
        self.recordModel = Records
        self.personModel = Persons

    def get_records(self, db: Session):
        records = db.query(self.recordModel).limit(50).options(
            joinedload(self.recordModel.person_relationships).joinedload(RecordsPersons.person)
        )
        if not records: 
            return []
        return records
    
    def get_record(self, record_id: str, db: Session):
        try:
            # Convertir el record_id a un objeto UUID
            record_uuid = uuid.UUID(record_id)
        except ValueError:
            print(f"Error: record_id mal formado: {record_id}")
            return None

        record = db.query(self.recordModel).filter(self.recordModel.record_id == record_uuid).first()
        if not record:
            return None

        return record

    def create_record(self, title: str, date: datetime, content: str, observations: str, db: Session, type_record: str = "PENAL"):
        is_exist = db.query(self.recordModel).filter(
            func.upper(self.recordModel.title) == func.upper(title)
        ).first()

        if is_exist is not None:
            return f"EL antecedente a cargar ya existe! {title}"

        new_record = self.recordModel(title=title, date=date, content=content, observations=observations, type_record=type_record)
        db.add(new_record)
        db.commit()
        db.refresh(new_record)  # Refrescamos para obtener el objeto con todos sus atributos

        return new_record
    
    def stats(self, db: Session):
        last_month = datetime.now() - timedelta(days=30)
        cant_person = db.query(self.personModel).count()
        cant_record = db.query(self.recordModel).count()
        cant_month = db.query(self.personModel).filter(self.personModel.created_at >= last_month).count()

        return {
            "stats": {
                "cant_person":cant_person,
                "cant_record": cant_record,
                "cant_month": cant_month                
            }   
        }



    def update_record(self, record_id: str,title: str, date: str, content:str, observations: str, db: Session):
        is_exist = db.query(self.recordModel).filter(self.recordModel.record_id == record_id).first()

        if not is_exist: 
            return False
        
        setattr(is_exist, "title", title)
        setattr(is_exist, "date", date)
        setattr(is_exist, "content", content)
        setattr(is_exist, "observations", observations)

        db.commit()
        return True

    def delete_record(self, record_id: str, db: Session): 
        is_exist = db.query(self.recordModel).filter(self.recordModel.record_id == record_id).first()
        if not is_exist:
            return False
        
        db.delete(is_exist)
        db.commit()

        return True
        
    def search_records(self, db: Session, search_term: Optional[str] = None, **filters):
        """
        Busca antecedentes por término genérico o por campos específicos.
        
        Args:
            db: Sesión de base de datos
            search_term: Término de búsqueda genérico (busca en título, contenido, observaciones, tipo)
            filters: Filtros específicos como:
                - title: Búsqueda en título
                - content: Búsqueda en contenido
                - observations: Búsqueda en observaciones
                - type_record: Tipo de registro
                - date_from: Fecha inicial (YYYY-MM-DD)
                - date_to: Fecha final (YYYY-MM-DD)
                - person_name: Nombre de la persona relacionada
        
        Returns:
            Lista de antecedentes que coinciden con los criterios de búsqueda
        """
        # Base query con eager loading
        query = db.query(self.recordModel).options(
            joinedload(self.recordModel.person_relationships).joinedload(RecordsPersons.person)
        )
        
        # Si hay un término de búsqueda genérico, buscar en múltiples campos
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    self.recordModel.title.ilike(search_pattern),
                    self.recordModel.content.ilike(search_pattern),
                    self.recordModel.observations.ilike(search_pattern),
                    self.recordModel.type_record.ilike(search_pattern)
                )
            )
        
        # Filtros específicos por campo
        if filters.get('title'):
            query = query.filter(self.recordModel.title.ilike(f"%{filters['title']}%"))
        
        if filters.get('content'):
            query = query.filter(self.recordModel.content.ilike(f"%{filters['content']}%"))
        
        if filters.get('observations'):
            query = query.filter(self.recordModel.observations.ilike(f"%{filters['observations']}%"))
        
        if filters.get('type_record'):
            query = query.filter(self.recordModel.type_record.ilike(f"%{filters['type_record']}%"))
        
        # Filtro por rango de fechas
        if filters.get('date_from'):
            try:
                date_from = datetime.fromisoformat(filters['date_from'])
                query = query.filter(self.recordModel.date >= date_from)
            except:
                pass
        
        if filters.get('date_to'):
            try:
                date_to = datetime.fromisoformat(filters['date_to'])
                # Agregar un día para incluir todos los registros de ese día
                date_to = date_to + timedelta(days=1)
                query = query.filter(self.recordModel.date <= date_to)
            except:
                pass
        
        # Filtro por nombre de persona relacionada
        if filters.get('person_name'):
            person_pattern = f"%{filters['person_name']}%"
            # Filtrar registros que tengan personas relacionadas con nombre coincidente
            # Usar una consulta separada para evitar conflictos de UUID
            matching_ids = db.query(self.recordModel.record_id).join(
                RecordsPersons, self.recordModel.record_id == RecordsPersons.record_id
            ).join(
                Persons, RecordsPersons.person_id == Persons.person_id
            ).filter(
                or_(
                    Persons.names.ilike(person_pattern),
                    Persons.lastnames.ilike(person_pattern)
                )
            ).distinct()
            
            query = query.filter(self.recordModel.record_id.in_(matching_ids))
        
        return query.all()