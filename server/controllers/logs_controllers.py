from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from typing import Dict, Optional
from database.db import get_db
from datetime import datetime, timedelta
from models.schemas.logs_schemas import PaginatedLogResponse
from services.logs_services import logs_service
from middlewares.auth_middlewares import is_autenticate as is_authenticated
from dependencies.checked_role import check_rol_admin


router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=PaginatedLogResponse)
async def get_logs(
    request: Request,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    current_user: Dict = Depends(is_authenticated),
    is_admin: bool = Depends(check_rol_admin),
    db_session=Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    """
    Obtiene los registros de logs con filtros opcionales.
    Solo disponible para administradores.
    """
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tiene permisos para acceder a los logs",
        )
    try:
        filters = {}
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            # Asegurar que incluya todo el día final
            filters["end_date"] = end_date.replace(hour=23, minute=59, second=59)
        if action:
            filters["action"] = action
        if entity_type:
            filters["entity_type"] = entity_type
        if user_id:
            filters["user_id"] = user_id

        # Calcular skip
        skip = (page - 1) * size

        # Obtener total de registros
        total = await logs_service.count_logs(db_session, filters)

        # Obtener logs paginados
        logs = await logs_service.get_logs(db_session, skip, size, filters)

        # Enriquecer los resultados con información del usuario
        response_logs = []
        for log in logs:
            # Obtener username de manera segura
            username = None
            try:
                if log.user and hasattr(log.user, "username"):
                    username = log.user.username
            except Exception as e:
                print(f"Error al obtener username: {e}")

            log_dict = {
                "log_id": str(log.log_id),
                "user_id": str(log.user_id) if log.user_id is not None else None,
                "username": username,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "description": log.description,
                "created_at": log.created_at,
                "ip_address": log.ip_address,
            }
            response_logs.append(log_dict)

        # Calcular total de páginas
        pages = (total + size - 1) // size if size > 0 else 0

        return {
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
            "data": response_logs,
        }
    except Exception as e:
        print(f"Error al obtener logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener los logs",
        )


@router.get("/summary")
async def get_logs_summary(
    request: Request,
    days: int = Query(7, ge=1, le=30),
    current_user: Dict = Depends(is_authenticated),
    is_admin: bool = Depends(check_rol_admin),
    db_session=Depends(get_db),
):
    """
    Obtiene un resumen de los logs de los últimos días especificados.
    Solo disponible para administradores.
    """
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tiene permisos para acceder a los logs",
        )
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        filters = {"start_date": start_date}

        logs = await logs_service.get_logs(db_session, 0, 1000, filters)

        # Preparar resumen
        actions_count = {}
        entities_count = {}
        users_count = {}
        daily_activity = {}

        for log in logs:
            # Contar por tipo de acción
            if log.action not in actions_count:
                actions_count[log.action] = 0
            actions_count[log.action] += 1

            # Contar por tipo de entidad
            if log.entity_type not in entities_count:
                entities_count[log.entity_type] = 0
            entities_count[log.entity_type] += 1

            # Contar por usuario
            user_key = str(log.user_id) if log.user_id is not None else "anonymous"
            if user_key not in users_count:
                # Obtener username de manera segura
                username = "Anónimo"
                try:
                    if log.user and hasattr(log.user, "username"):
                        username = log.user.username
                except Exception as e:
                    print(f"Error al obtener username en resumen: {e}")

                users_count[user_key] = {"count": 0, "username": username}
            users_count[user_key]["count"] += 1

            # Actividad diaria
            day_key = log.created_at.strftime("%Y-%m-%d")
            if day_key not in daily_activity:
                daily_activity[day_key] = 0
            daily_activity[day_key] += 1

        summary = {
            "total_logs": len(logs),
            "actions": actions_count,
            "entities": entities_count,
            "users": users_count,
            "daily_activity": daily_activity,
            "period": {
                "start_date": start_date,
                "end_date": datetime.utcnow(),
                "days": days,
            },
        }

        return summary
    except Exception as e:
        print(f"Error al obtener resumen de logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener el resumen de logs",
        )
