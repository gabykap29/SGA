from queue import Empty
from models.Record import Records
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from models.Recortds_Persons import RecordsPersons
import uuid
from models.Persons import Persons
from sqlalchemy import func

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
        record = db.query(self.recordModel).filter(self.recordModel.record_id == uuid.UUID(record_id)).first()
        if not record:
            return []
        
        return record

    def create_record(self,title: str, date: datetime, content:str, observations: str, db: Session):
        is_exist = db.query(self.recordModel).filter(
            func.upper(self.recordModel.title) == func.upper(title)
        ).first()

        if is_exist is Empty:
            return "EL antecedente a cargar ya existe! {title}"

        new_record = self.recordModel(title=title, date= date, content= content, observations= observations)
        db.add(new_record)
        db.commit()

        return True
    
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