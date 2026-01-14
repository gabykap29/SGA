from fastapi import APIRouter, HTTPException, status, Depends, Request, Query
from fastapi.responses import JSONResponse
from services.records_services import RecordService
from database.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from models.schemas.record_schema import RecordSchema
from typing import Dict
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_all, check_rol_all_or_viewer
import uuid
from utils.json_encoder import CustomJSONResponse
from services.logs_services import logs_service
import traceback

router = APIRouter(tags=["Records"], prefix="/records")
record_service = RecordService()


@router.get("", status_code=status.HTTP_200_OK)
async def get_records(
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db_session=Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para listar registros",
        )
    try:
        records = await record_service.get_records(db=db_session)
        records_list = list(records)
        if len(records_list) == 0:
            return JSONResponse(
                content="Aun no se han cargado antecedentes",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return CustomJSONResponse(content=records_list)

    except Exception as e:
        return JSONResponse(
            content=f"Error interno en el servidor al obtener los antecedentes, {e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_records(
    query: str = Query(None, description="Término de búsqueda genérico"),
    title: str = Query(None, description="Buscar por título"),
    content: str = Query(None, description="Buscar por contenido"),
    observations: str = Query(None, description="Buscar por observaciones"),
    type_record: str = Query(None, description="Buscar por tipo de registro"),
    date_from: str = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Fecha final (YYYY-MM-DD)"),
    person_name: str = Query(
        None, description="Buscar por nombre de persona relacionada"
    ),
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db_session=Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para buscar antecedentes",
        )
    try:
        # Preparar filtros
        filters = {}
        if title:
            filters["title"] = title
        if content:
            filters["content"] = content
        if observations:
            filters["observations"] = observations
        if type_record:
            filters["type_record"] = type_record
        if date_from:
            filters["date_from"] = date_from
        if date_to:
            filters["date_to"] = date_to
        if person_name:
            filters["person_name"] = person_name
        records = await record_service.search_records(
            db=db_session, search_term=query, **filters
        )
        records_list = list(records) if records else []

        try:
            search_desc = query or ", ".join(
                [f"{k}:{v}" for k, v in filters.items() if v]
            )
            await logs_service.create_log(
                db=db_session,
                user_id=uuid.UUID(current_user.get("user_id")),
                action="SEARCH",
                entity_type="RECORD",
                entity_id=None,
                description=f"Búsqueda de antecedentes: {search_desc}",
            )
        except Exception as log_error:
            print(f"Error al registrar log de búsqueda: {log_error}")

        return CustomJSONResponse(content=records_list)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            content={"error": "Error interno al buscar antecedentes", "detail": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/{id}")
async def get_record_by_id(
    id: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db_session=Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para ver este registro",
        )
    try:
        record = await record_service.get_record(record_id=id, db=db_session)
        if not record:
            return JSONResponse(
                content="El antecedente no existe!", status_code=status.HTTP_200_OK
            )
        # Serializar personas vinculadas
        # Serializar manualmente solo los campos necesarios para evitar referencias circulares
        record_dict = {
            "record_id": str(record.record_id),
            "record_number": getattr(record, "title", None),
            "record_date": getattr(record, "date", None),
            "description": getattr(record, "content", None),
            "observations": getattr(record, "observations", None),
            "type_record": getattr(record, "type_record", None),
            "create_at": getattr(record, "create_at", None),
            "updated_at": getattr(record, "updated_at", None),
        }
        person_relationships = []
        for rel in getattr(record, "person_relationships", []):
            person_obj = getattr(rel, "person", None)
            person_data = None
            if person_obj:
                person_data = {
                    "person_id": str(person_obj.person_id),
                    "names": person_obj.names,
                    "lastnames": person_obj.lastnames,
                    "identification": person_obj.identification,
                    "identification_type": person_obj.identification_type,
                    "province": person_obj.province,
                    "country": person_obj.country,
                }
            person_relationships.append(
                {
                    "id": str(rel.id),
                    "person_id": str(rel.person_id),
                    "type_relationship": rel.type_relationship,
                    "person": person_data,
                }
            )
        record_dict["person_relationships"] = person_relationships
        return CustomJSONResponse(content=record_dict)
    except Exception as e:
        print("Error interno en el servidor al obtener el antecedente", e)
        return JSONResponse(
            content="Error interno en el servidor al obtener el antecedente",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_record(
    record: RecordSchema,
    request: Request,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para crear registros",
        )
    try:
        if not record.title or not record.title.strip():
            return JSONResponse(
                content="El título es obligatorio",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        if not record.content or not record.content.strip():
            return JSONResponse(
                content="El contenido es obligatorio",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        new_record = await record_service.create_record(
            record.title,
            record.date,
            record.content,
            record.observations,
            db=db_session,
            type_record=record.type_record,
        )

        if isinstance(new_record, str):
            print("Error al crear el antecedente:", new_record)
            return JSONResponse(
                content=new_record, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        # Registrar log de creación de antecedente
        try:
            await logs_service.create_log(
                db=db_session,
                user_id=str(current_user["id"]) if "id" in current_user else None,
                action="CREATE",
                entity_type="RECORD",
                entity_id=str(new_record.record_id),
                description=f"Antecedente creado: {new_record.title} (tipo: {new_record.type_record})",
                ip_address=request.client.host if request.client else None,
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
            "observations": new_record.observations,
        }

        return CustomJSONResponse(
            content=response_data, status_code=status.HTTP_201_CREATED
        )

    except Exception as e:
        print("Error interno en el servidor al crear el antecedente", e)
        import traceback

        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content=f"Error interno en el servidor al intentar crear el antecedente: {str(e)}",
        )


@router.patch("/update/{id}", status_code=status.HTTP_200_OK)
async def update_record(
    id: str,
    record: RecordSchema,
    request: Request,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para actualizar registros",
        )
    try:
        result = await record_service.update_record(
            record_id=id,
            title=record.title,
            date=record.date.strftime("%Y-%m-%d")
            if hasattr(record.date, "strftime")
            else str(record.date),
            content=record.content,
            observations=record.observations,
            type_record=record.type_record,
            db=db_session,
        )
        if not result:
            return HTTPException(status_code=422, detail="Verifique los campos")

        # Registrar log de actualización de antecedente
        try:
            await logs_service.create_log(
                db=db_session,
                user_id=str(current_user["id"]) if "id" in current_user else None,
                action="UPDATE",
                entity_type="RECORD",
                entity_id=id,
                description=f"Antecedente actualizado: {record.title}",
                ip_address=request.client.host if request.client else None,
            )
        except Exception as log_error:
            print(f"Error al registrar log de actualización: {log_error}")
            # Continuar con la respuesta aunque el log falle

        return JSONResponse(
            content="Antecedente actualizado con exito!", status_code=200
        )
    except Exception as e:
        print("Error interno en el servidor al intentar actualizar un antecedente", e)
        return HTTPException(
            status_code=500,
            detail="Error interno en el servidor al intentar actualizar un antecedente",
        )

    finally:
        await db_session.close()


@router.get("/stats/", status_code=status.HTTP_200_OK)
async def stats(
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session=Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para ver estadísticas de registros",
        )
    try:
        stats = await record_service.stats(db=db_session)
        return CustomJSONResponse(content=stats)
    except Exception as e:
        print("Error al obtener las estadisticas: ", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al obtener las estadisticas.",
        )


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_report(
    id: str,
    request: Request,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session=Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para eliminar registros",
        )
    try:
        # Primero obtenemos el antecedente para incluirlo en el log
        record_to_delete = await record_service.get_record(record_id=id, db=db_session)
        # Verificar si es un objeto de tipo Records
        record_title = "Desconocido"
        if record_to_delete and not isinstance(record_to_delete, list):
            record_title = record_to_delete.title

        record = record_service.delete_record(record_id=id, db=db_session)
        if not record:
            return HTTPException(status_code=404, detail="El antecedente no existe!")

        # Registrar log de eliminación de antecedente
        try:
            await logs_service.create_log(
                db=db_session,
                user_id=str(current_user["id"]) if "id" in current_user else None,
                action="DELETE",
                entity_type="RECORD",
                entity_id=id,
                description=f"Antecedente eliminado: {record_title}",
                ip_address=request.client.host if request.client else None,
            )
        except Exception as log_error:
            print(f"Error al registrar log de eliminación: {log_error}")
            # Continuar con la respuesta aunque el log falle

        return JSONResponse(
            content="Antecedente Eliminado!", status_code=status.HTTP_200_OK
        )

    except Exception as e:
        print("Error al intentar eliminar un antecedente!", e)
        return HTTPException(
            status_code=500, detail="Error al intentar eliminar un antecedente!"
        )
