from sqlalchemy.orm import Session
from models.Logs import Logs
from datetime import datetime
from typing import Dict, Optional, List

class LogsService:
    def __init__(self):
        self.model = Logs

    def create_log(self, db: Session, user_id: Optional[str], action: str, entity_type: str, 
                  entity_id: Optional[str], description: str, ip_address: Optional[str] = None) -> Logs:
        """
        Crea un nuevo registro de log en la base de datos
        """
        from uuid import UUID
        
        # Convertir user_id a UUID si no es None
        user_uuid = None
        if user_id:
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                # Si no es un UUID válido, dejarlo como None
                print(f"Warning: user_id '{user_id}' no es un UUID válido")
                
        log = self.model(
            # log_id se genera automáticamente por el valor default
            user_id=user_uuid,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,  # Puede ser string
            description=description,
            ip_address=ip_address,
            created_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_logs(self, db: Session, skip: int = 0, limit: int = 100, 
                filters: Optional[Dict] = None) -> List[Logs]:
        """
        Obtiene los logs con filtros opcionales
        """
        from sqlalchemy.orm import joinedload
        
        # Usar joinedload para cargar la relación con usuarios de manera eficiente
        query = db.query(self.model).options(joinedload(self.model.user))
        
        if filters:
            if filters.get("start_date") and filters.get("end_date"):
                query = query.filter(
                    self.model.created_at >= filters["start_date"],
                    self.model.created_at <= filters["end_date"]
                )
            
            if filters.get("action"):
                query = query.filter(self.model.action == filters["action"])
                
            if filters.get("entity_type"):
                query = query.filter(self.model.entity_type == filters["entity_type"])
                
            if filters.get("user_id"):
                query = query.filter(self.model.user_id == filters["user_id"])
        
        # Ordenar por fecha descendente (más reciente primero)
        query = query.order_by(self.model.created_at.desc())
        
        # Ejecutar la consulta dentro de un try/except para manejar errores
        try:
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            print(f"Error al obtener logs: {e}")
            return []

    def get_log_by_id(self, db: Session, log_id: str) -> Optional[Logs]:
        """
        Obtiene un log por su ID
        """
        return db.query(self.model).filter(self.model.log_id == log_id).first()

    def delete_logs_older_than(self, db: Session, date: datetime) -> int:
        """
        Elimina logs más antiguos que la fecha especificada
        Retorna el número de logs eliminados
        """
        result = db.query(self.model).filter(self.model.created_at < date).delete()
        db.commit()
        return result

logs_service = LogsService()