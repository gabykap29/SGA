from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from typing import Dict, List, Optional
from database.db import get_db
from datetime import datetime, timedelta
from pydantic import BaseModel
from services.logs_services import logs_service
from middlewares.auth_middlewares import is_autenticate as is_authenticated

# Función auxiliar para verificar si el usuario es administrador
async def check_rol_admin(current_user: Dict = Depends(is_authenticated)):
    # Verificamos si el rol es de admin con una lógica más robusta
    is_admin = False
    
    try:
        # Intentar varias formas de verificar si es admin
        if current_user.get('role'):
            role = current_user['role']
            # Si role es un objeto con atributo name
            if hasattr(role, 'name') and role.name.upper() in ['ADMIN', 'ADMINISTRATOR']:
                is_admin = True
            # Si role es un diccionario con clave role_name
            elif isinstance(role, dict) and role.get('role_name', '').upper() in ['ADMIN', 'ADMINISTRATOR']:
                is_admin = True
        
        # Si current_user tiene role_name directamente
        if current_user.get('role_name', '').upper() in ['ADMIN', 'ADMINISTRATOR']:
            is_admin = True
        
        # Si current_user tiene role_id y es 1 (típicamente el ID de admin)
        if current_user.get('role_id') == '1':
            is_admin = True
    except Exception as e:
        print(f"ERROR en check_rol_admin: {e}")
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    return True

router = APIRouter(prefix="/logs", tags=["logs"])

class LogResponse(BaseModel):
    log_id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    ip_address: Optional[str] = None

class LogFilterParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    user_id: Optional[str] = None

@router.get("", response_model=List[LogResponse])
def get_logs(
    request: Request,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    current_user: Dict = Depends(is_authenticated),
    is_admin: bool = Depends(check_rol_admin)
):
    """
    Obtiene los registros de logs con filtros opcionales.
    Solo disponible para administradores.
    """
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a los logs"
        )
    
    db_session = get_db()
    
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
            
        logs = logs_service.get_logs(db_session, skip, limit, filters)
        
        # Enriquecer los resultados con información del usuario
        response_logs = []
        for log in logs:
            # Obtener username de manera segura
            username = None
            try:
                if log.user and hasattr(log.user, 'username'):
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
                "ip_address": log.ip_address
            }
            response_logs.append(log_dict)
            
        return response_logs
    except Exception as e:
        print(f"Error al obtener logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener los logs"
        )
@router.get("/summary")
def get_logs_summary(
    request: Request,
    days: int = Query(7, ge=1, le=30),
    current_user: Dict = Depends(is_authenticated),
    is_admin: bool = Depends(check_rol_admin)
):
    """
    Obtiene un resumen de los logs de los últimos días especificados.
    Solo disponible para administradores.
    """
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a los logs"
        )
    
    db_session = get_db()
    
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        filters = {"start_date": start_date}
        
        logs = logs_service.get_logs(db_session, 0, 1000, filters)
        
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
            user_key = str(log.user_id) if log.user_id is not None else 'anonymous'
            if user_key not in users_count:
                # Obtener username de manera segura
                username = "Anónimo"
                try:
                    if log.user and hasattr(log.user, 'username'):
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
                "days": days
            }
        }
        
        return summary
    except Exception as e:
        print(f"Error al obtener resumen de logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener el resumen de logs"
        )