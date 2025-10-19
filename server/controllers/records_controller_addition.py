from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import JSONResponse
from services.records_services import RecordService
from database.db import SessionLocal
from typing import Dict
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_all
from utils.json_encoder import CustomJSONResponse
import logging

router = APIRouter(
    prefix="",)

# Endpoint para buscar antecedentes por término de búsqueda
@router.get("/search", status_code=status.HTTP_200_OK)
def search_records(
    query: str = Query(..., description="Término de búsqueda"),
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all)
):
    print(f"🔍 GET /records/search - Query: {query} - Usuario: {current_user.get('sub', 'unknown')}")
    
    if not is_authorized:
        print("❌ Usuario no autorizado para buscar antecedentes")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para buscar antecedentes"
        )
    
    db_session = SessionLocal()
    try:
        print(f"🔎 Buscando antecedentes que coincidan con: '{query}'")
        records = record_service.search_records(db=db_session, search_term=query)
        records_list = list(records)
        print(f"📊 Antecedentes encontrados: {len(records_list)}")
        
        # Registrar búsqueda en logs
        try:
            logs_service.create_logs(
                action=f"Búsqueda de antecedentes con término: '{query}'",
                user_id=current_user.get("user_id"),
                db=db_session
            )
        except Exception as log_error:
            print(f"Error al registrar log de búsqueda: {log_error}")
        
        # Retornar resultados
        print("✅ Enviando respuesta de búsqueda con CustomJSONResponse")
        return CustomJSONResponse(content=records_list)

    except Exception as e:
        print(f"Error interno al buscar antecedentes: {e}")
        return JSONResponse(
            content="Error interno al buscar antecedentes",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        db_session.close()