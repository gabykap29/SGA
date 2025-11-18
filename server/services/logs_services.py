from sqlalchemy.ext.asyncio import AsyncSession
from models.Logs import Logs
from datetime import datetime
from typing import Dict, Optional, List
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload


class LogsService:
    def __init__(self):
        self.model = Logs

    async def create_log(
        self,
        db: AsyncSession,
        user_id: UUID = None,
        action: str = "Sin acción",
        entity_type: str = "Desconocido",
        entity_id: str = "Desconocido",
        description: str = "Sin descripción",
        ip_address: str = "Desconocido",
    ) -> Logs:
        """
        Crea un nuevo registro de log en la base de datos
        """

        log = self.model(
            # log_id se genera automáticamente por el valor default
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,  # Puede ser string
            description=description,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def get_logs(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict] = None,
    ) -> List["Logs"]:  # Usa comillas si Logs no está definido antes, o Logs si sí
        """
        Obtiene los logs con filtros opcionales
        """

        # 1. Definir la consulta base (Statement)
        # NO EJECUTAR AÚN
        stmt = select(self.model).options(joinedload(self.model.user))

        # 2. Aplicar filtros sobre el 'statement'
        if filters:
            if filters.get("start_date") and filters.get("end_date"):
                stmt = stmt.filter(
                    self.model.created_at >= filters["start_date"],
                    self.model.created_at <= filters["end_date"],
                )

            if filters.get("action"):
                stmt = stmt.filter(self.model.action == filters["action"])

            if filters.get("entity_type"):
                stmt = stmt.filter(self.model.entity_type == filters["entity_type"])

            if filters.get("user_id"):
                stmt = stmt.filter(self.model.user_id == filters["user_id"])

        # 3. Aplicar orden y paginación sobre el 'statement'
        # Es importante que offset y limit se apliquen antes de ejecutar
        stmt = stmt.order_by(self.model.created_at.desc())
        stmt = stmt.offset(skip).limit(limit)

        # 4. AHORA SÍ: Ejecutar la consulta final
        try:
            result = await db.execute(stmt)
            return result.scalars().all()

        except Exception as e:
            print(f"Error al obtener logs: {e}")  # Usa tu logger mejor
            return []

    async def get_log_by_id(self, db: AsyncSession, log_id: str) -> Optional[Logs]:
        """
        Obtiene un log por su ID
        """
        stm = select(self.model).filter(self.model.log_id == log_id)
        result = await db.execute(stm)
        return result.scalars().first()

    
    async def delete_logs_older_than(self, db: AsyncSession, date: datetime) -> int:
        """
        Elimina logs más antiguos que la fecha especificada
        Retorna el número de logs eliminados
        """
        stm = delete(self.model).where(self.model.created_at < date)
        result = await db.execute(stm)
        await db.commit()
        return result.rowcount if hasattr(result, 'rowcount') else None


logs_service = LogsService()
