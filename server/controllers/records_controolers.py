from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import JSONResponse
from services.records_services import RecordService
from database.db import SessionLocal
from models.schemas.record_schema import RecordSchema
from typing import Dict
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_all
from utils.json_encoder import CustomJSONResponse
from services.logs_services import logs_service

router = APIRouter(tags=["Records"], prefix="/records")
record_service = RecordService()

@router.get("", status_code=status.HTTP_200_OK)
def get_records(current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para listar registros"
        )
    db_session = SessionLocal()
    try: 
        records = record_service.get_records(db=db_session)
        records_list = list(records)
        if len(records_list) == 0: 
            return JSONResponse(
                content="Aun no se han cargado antecedentes",
                status_code=status.HTTP_404_NOT_FOUND
            )
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

@router.get("/{id}")
def get_record_by_id(id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este registro"
        )
    db_session = SessionLocal()
    try:
        record = record_service.get_record(record_id=id, db=db_session)
        if not record : 
            return JSONResponse(
                content="El antecedente no existe!",
                status_code=status.HTTP_200_OK
            )
        # Usar nuestra respuesta personalizada para manejar la serialización de dates y UUIDs
        return CustomJSONResponse(content=record)
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