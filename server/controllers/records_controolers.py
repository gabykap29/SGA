from fastapi import APIRouter, HTTPException, status, Depends, Request, Query
from fastapi.responses import JSONResponse
from services.records_services import RecordService
from database.db import SessionLocal
from models.schemas.record_schema import RecordSchema
from typing import Dict
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_all, check_rol_all_or_viewer
from utils.json_encoder import CustomJSONResponse
from services.logs_services import logs_service

router = APIRouter(tags=["Records"], prefix="/records")
record_service = RecordService()

@router.get("", status_code=status.HTTP_200_OK)
def get_records(current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all_or_viewer)):
    print(f"🔍 GET /records - Usuario: {current_user.get('sub', 'unknown')}")
    print(f"🔍 Autorización: {is_authorized}")
    
    if not is_authorized:
        print("❌ Usuario no autorizado")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para listar registros"
        )
    db_session = SessionLocal()
    try: 
        print("📋 Obteniendo records de la base de datos...")
        records = record_service.get_records(db=db_session)
        records_list = list(records)
        print(f"📊 Records encontrados: {len(records_list)}")
        
        if len(records_list) == 0: 
            print("⚠️  No hay records, retornando 404")
            return JSONResponse(
                content="Aun no se han cargado antecedentes",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        print("✅ Enviando respuesta con CustomJSONResponse")
        # Usar nuestra respuesta personalizada para manejar la serialización de dates y UUIDs
        return CustomJSONResponse(content=records_list)

    except Exception as e:
        print("Error interno en el servidor al obtener los antecedentes",e)
        return JSONResponse(
            content="Error interno en el servidor al obtener los antecedentes",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        db_session.close()

@router.get("/search", status_code=status.HTTP_200_OK)
def search_records(
    query: str = Query(None, description="Término de búsqueda genérico"),
    title: str = Query(None, description="Buscar por título"),
    content: str = Query(None, description="Buscar por contenido"),
    observations: str = Query(None, description="Buscar por observaciones"),
    type_record: str = Query(None, description="Buscar por tipo de registro"),
    date_from: str = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Fecha final (YYYY-MM-DD)"),
    person_name: str = Query(None, description="Buscar por nombre de persona relacionada"),
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer)
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
        # Preparar filtros
        filters = {}
        if title:
            filters['title'] = title
        if content:
            filters['content'] = content
        if observations:
            filters['observations'] = observations
        if type_record:
            filters['type_record'] = type_record
        if date_from:
            filters['date_from'] = date_from
        if date_to:
            filters['date_to'] = date_to
        if person_name:
            filters['person_name'] = person_name
        
        print(f"🔎 Buscando antecedentes con filtros: query={query}, filters={filters}")
        records = record_service.search_records(db=db_session, search_term=query, **filters)
        records_list = list(records) if records else []
        print(f"📊 Antecedentes encontrados: {len(records_list)}")
        
        # Registrar búsqueda en logs
        try:
            search_desc = query or ', '.join([f"{k}:{v}" for k, v in filters.items() if v])
            logs_service.create_log(
                db=db_session,
                user_id=current_user.get("user_id"),
                action="SEARCH",
                entity_type="RECORD",
                entity_id=None,
                description=f"Búsqueda de antecedentes: {search_desc}"
            )
        except Exception as log_error:
            print(f"Error al registrar log de búsqueda: {log_error}")
        
        # Retornar resultados
        print("✅ Enviando respuesta de búsqueda con CustomJSONResponse")
        return CustomJSONResponse(content=records_list)

    except Exception as e:
        print(f"❌ Error interno al buscar antecedentes: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            content={"error": "Error interno al buscar antecedentes", "detail": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        db_session.close()

@router.get("/{id}")
def get_record_by_id(id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all_or_viewer)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este registro"
        )
    db_session = SessionLocal()
    try:
        record = record_service.get_record(record_id=id, db=db_session)
        if not record:
            return JSONResponse(
                content="El antecedente no existe!",
                status_code=status.HTTP_200_OK
            )
        # Serializar personas vinculadas
        # Serializar manualmente solo los campos necesarios para evitar referencias circulares
        record_dict = {
            'record_id': str(record.record_id),
            'record_number': getattr(record, 'title', None),
            'record_date': getattr(record, 'date', None),
            'description': getattr(record, 'content', None),
            'observations': getattr(record, 'observations', None),
            'type_record': getattr(record, 'type_record', None),
            'create_at': getattr(record, 'create_at', None),
            'updated_at': getattr(record, 'updated_at', None),
        }
        person_relationships = []
        for rel in getattr(record, 'person_relationships', []):
            person_obj = getattr(rel, 'person', None)
            person_data = None
            if person_obj:
                person_data = {
                    'person_id': str(person_obj.person_id),
                    'names': person_obj.names,
                    'lastnames': person_obj.lastnames,
                    'identification': person_obj.identification,
                    'identification_type': person_obj.identification_type,
                    'province': person_obj.province,
                    'country': person_obj.country
                }
            person_relationships.append({
                'id': str(rel.id),
                'person_id': str(rel.person_id),
                'type_relationship': rel.type_relationship,
                'person': person_data
            })
        record_dict['person_relationships'] = person_relationships
        return CustomJSONResponse(content=record_dict)
    except Exception as e:
        print("Error interno en el servidor al obtener el antecedente", e) 
        return JSONResponse(
            content="Error interno en el servidor al obtener el antecedente",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )       
    finally:
        db_session.close()

@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_record(record: RecordSchema, request: Request, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear registros"
        )
    db_session = SessionLocal()
    try:
        print("Datos recibidos para crear antecedente:", {
            "title": record.title,
            "date": record.date,
            "content_length": len(record.content) if record.content else 0,
            "observations_length": len(record.observations) if record.observations else 0,
            "type_record": record.type_record
        })
        
        if not record.title or not record.title.strip():
            return JSONResponse(
                content="El título es obligatorio",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
            
        if not record.content or not record.content.strip():
            return JSONResponse(
                content="El contenido es obligatorio",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
            
        new_record = record_service.create_record(
            record.title, record.date, record.content, record.observations, db=db_session, type_record=record.type_record
        )

        if isinstance(new_record, str):
            print("Error al crear el antecedente:", new_record)
            return JSONResponse(
                content=new_record,
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
            
        print("Antecedente creado correctamente")
        
        # Registrar log de creación de antecedente
        try:
            logs_service.create_log(
                db=db_session,
                user_id=str(current_user["id"]) if "id" in current_user else None,
                action="CREATE",
                entity_type="RECORD",
                entity_id=str(new_record.record_id),
                description=f"Antecedente creado: {new_record.title} (tipo: {new_record.type_record})",
                ip_address=request.client.host if request.client else None
            )
        except Exception as log_error:
            print(f"Error al registrar log de creación: {log_error}")
            # Continuar con la respuesta aunque el log falle
        
        # Creamos un diccionario con los datos del registro
        response_data = {
            "message": "Antecedente creado correctamente!",
            "record_id": str(new_record.record_id),
            "title": new_record.title,
            "date": new_record.date,
            "type_record": new_record.type_record,
            "content": new_record.content,
            "observations": new_record.observations
        }
        
        return CustomJSONResponse(
            content=response_data,
            status_code=status.HTTP_201_CREATED
        )

    except Exception as e:
        print("Error interno en el servidor al crear el antecedente", e)
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content=f"Error interno en el servidor al intentar crear el antecedente: {str(e)}"
        )
    finally:
        db_session.close()


@router.patch("/update/{id}", status_code=status.HTTP_200_OK)
def update_record(id: str, record: RecordSchema, request: Request, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar registros"
        )
    db_session = SessionLocal()
    try:
        result = record_service.update_record(
            record_id=id,
            title=record.title,
            date=record.date.strftime("%Y-%m-%d") if hasattr(record.date, "strftime") else str(record.date),
            content=record.content,
            observations=record.observations,
            db=db_session
        )
        if not result:
            return HTTPException(
                status_code=422,
                detail="Verifique los campos"
            )
        
        # Registrar log de actualización de antecedente
        try:
            logs_service.create_log(
                db=db_session,
                user_id=str(current_user["id"]) if "id" in current_user else None,
                action="UPDATE",
                entity_type="RECORD",
                entity_id=id,
                description=f"Antecedente actualizado: {record.title}",
                ip_address=request.client.host if request.client else None
            )
        except Exception as log_error:
            print(f"Error al registrar log de actualización: {log_error}")
            # Continuar con la respuesta aunque el log falle
        
        return JSONResponse(
            content="Antecedente actualizado con exito!",
            status_code=200
        )
    except Exception as e:
        print("Error interno en el servidor al intentar actualizar un antecedente", e)
        return HTTPException(
            status_code=500,
            detail="Error interno en el servidor al intentar actualizar un antecedente"
        )

    finally: 
        db_session.close()


@router.get("/stats/", status_code=status.HTTP_200_OK)
def stats(current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver estadísticas de registros"
        )
    db_session = SessionLocal()
    try: 
        stats = record_service.stats(db=db_session)
        return CustomJSONResponse(content=stats)
    except Exception as e:
        print("Error al obtener las estadisticas: ", e)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al obtener las estadisticas."
        )
    finally:
        db_session.close()

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_report(id: str, request: Request, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar registros"
        )
    db_session = SessionLocal()
    try: 
        # Primero obtenemos el antecedente para incluirlo en el log
        record_to_delete = record_service.get_record(record_id=id, db=db_session)
        # Verificar si es un objeto de tipo Records
        record_title = "Desconocido"
        if record_to_delete and not isinstance(record_to_delete, list):
            record_title = record_to_delete.title
        
        record = record_service.delete_record(record_id=id, db=db_session)
        if not record:
            return HTTPException(
                status_code=404,
                detail="El antecedente no existe!"
            )
            
        # Registrar log de eliminación de antecedente
        try:
            logs_service.create_log(
                db=db_session,
                user_id=str(current_user["id"]) if "id" in current_user else None,
                action="DELETE",
                entity_type="RECORD",
                entity_id=id,
                description=f"Antecedente eliminado: {record_title}",
                ip_address=request.client.host if request.client else None
            )
        except Exception as log_error:
            print(f"Error al registrar log de eliminación: {log_error}")
            # Continuar con la respuesta aunque el log falle
        
        return JSONResponse(
            content="Antecedente Eliminado!",
            status_code= status.HTTP_200_OK
        )

    except Exception as e: 
        print("Error al intentar eliminar un antecedente!", e)
        return HTTPException(
            status_code=500,
            detail="Error al intentar eliminar un antecedente!"
        )
    finally:
        db_session.close()
