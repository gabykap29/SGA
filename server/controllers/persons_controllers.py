from fastapi import APIRouter, HTTPException, Query, status, Depends
from starlette.status import HTTP_200_OK
from services.persons_services import PersonsService
from models.schemas.person_schemas import PersonSchema, PersonResponse
from database.db import get_db
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies.is_auth import is_authenticated
import logging
from dependencies.checked_role import (
    check_rol_all,
    check_rol_admin,
    check_rol_all_or_viewer,
)
from services.logs_services import LogsService
import traceback

router = APIRouter(tags=["Persons"], prefix="/persons")
person_service = PersonsService()
logs_services = LogsService()


@router.get("", status_code=status.HTTP_200_OK, response_model=List[PersonResponse])
async def get_persons(
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para ver esta persona",
        )

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado"
        )
    try:
        persons = await person_service.get_persons(db=db)
        persons_list = list(persons)

        if not persons_list or len(persons_list) < 1:
            return []
        persons_response = [
            PersonResponse.model_validate(person) for person in persons_list
        ]
        return persons_response
    except Exception as e:
        logging.error(f"Error en el servidor al obtener las personas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor al obtener las personas: {e}",
        )


@router.get("/{id}", status_code=status.HTTP_200_OK, response_model=PersonResponse)
async def get_person(
    id: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para ver esta persona",
        )
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado"
        )
    try:
        person = await person_service.get_person(person_id=id, db=db)
        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="La persona no existe!"
            )
        # Serializar archivos con mime_type
        files = []
        for f in getattr(person, "files", []):
            files.append(
                {
                    "file_id": f.file_id,
                    "original_filename": f.original_filename,
                    "file_type": f.file_type,
                    "file_size": f.file_size,
                    "mime_type": getattr(f, "mime_type", None),
                    "created_at": f.created_at,
                }
            )
        # Construir respuesta serializada
        person_dict = person.__dict__.copy()
        person_dict["files"] = files
        return person_dict
    except Exception as e:
        print("Error critico al obtener la persona", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al obtener la persona",
        )


@router.get("/search/person/", response_model=List[PersonResponse])
async def search_person(
    names: Optional[str] = Query(None, description="Nombres de la persona"),
    lastname: Optional[str] = Query(None, description="Apellidos de la persona"),
    identification: Optional[str] = Query(
        None, description="Documento de identificación"
    ),
    gender: Optional[str] = Query(None, description="Género"),
    address: Optional[str] = Query(None, description="Dirección"),
    nationality: Optional[str] = Query(None, description="Nacionalidad"),
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db_session: AsyncSession = Depends(get_db),
):
    """
    Busca personas basado en criterios específicos.
    Requiere autenticación y rol autorizado (ADMIN, MODERATE, USERS, VIEW).
    """

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para realizar esta acción",
        )
    try:
        persons = await person_service.search_person(
            db=db_session,
            names=names,
            lastname=lastname,
            identification=identification,
            address=address,
            country=nationality,
        )
        if not persons:
            return []

        result = [PersonResponse.model_validate(p) for p in persons]
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor al buscar personas: {str(e)}",
        )


@router.post(
    "/create", status_code=status.HTTP_201_CREATED, response_model=PersonResponse
)
async def create_person(
    person_data: PersonSchema,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para crear personas",
        )
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado"
        )
    try:
        user_id = current_user.get("user_id")
        person = await person_service.create_person(
            db=db_session, user_id=user_id, **person_data.model_dump()
        )

        if isinstance(person, str) and person == "La persona ya existe!":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=person
            )

        if not person or not hasattr(person, "person_id"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear la persona o la persona no tiene ID",
            )
        await logs_services.create_log(
            user_id=user_id,
            action="CREATE",
            entity_type="PERSON",
            entity_id=person.person_id,
            db=db_session,
        )
        # La respuesta se valida automáticamente con response_model=PersonResponse
        return person

    except HTTPException as e:
        raise e  # Re-lanzar excepciones HTTP
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado en el servidor: {e}",
        )


@router.patch("/update/{id}", status_code=status.HTTP_200_OK)
async def update_person(
    id: str,
    body: PersonSchema,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para actualizar personas",
        )
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado"
        )
    try:
        person = await person_service.update_person(
            person_id=id,
            identification=body.identification,
            identification_type=body.identification_type,
            names=body.names,
            lastnames=body.lastnames,
            address=body.address,
            province=body.province,
            country=body.country,
            db=db_session,
            observations=body.observations,
        )

        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se pudo actualizar porque la persona no existe!",
            )
        await logs_services.create_log(
            user_id=current_user["user_id"],
            action="UPDATE",
            entity_type="PERSON",
            entity_id=id,
            db=db_session,
        )

        return {"status": "success", "mensaje": "Persona actualizada correctamente!"}
    except Exception as e:
        print("Error critico al actualizar la persona", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al actualizar la persona",
        )


@router.get("/load-csv/", status_code=status.HTTP_200_OK)
async def load_persons_from_csv(
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_admin),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para cargar personas desde CSV",
        )
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="ID de usuario no encontrado en el token",
            )
        result = await person_service.load_persons(db=db_session, user_id=user_id)
        return result
    except Exception as e:
        raise HTTPException(
            print("Error critico al cargar personas desde CSV", e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al cargar personas desde CSV",
        )


@router.delete("/delete/{id}", status_code=status.HTTP_200_OK)
async def delete_person(
    id: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para eliminar personas",
        )
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado"
        )
    try:
        deleted = await person_service.delete_person(person_id=id, db=db_session)
        await logs_services.create_log(
            user_id=current_user.get("user_id"),
            action="DELETE",
            entity_type="PERSON",
            entity_id=id,
            description=f"Se eliminó la persona con ID {id}",
            ip_address=current_user.get("ip_address"),
            db=db_session,
        )
        if type(deleted) is str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se pudo eliminar porque la persona no existe o tiene antecedentes vinculados!",
            )

        if deleted is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar la persona. Consulte los logs del servidor.",
            )

        return {"status": "success", "message": "Persona eliminada correctamente!"}
    except Exception as e:
        await logs_services.create_log(
            user_id=current_user.get("user_id"),
            action="DELETE",
            entity_type="PERSON",
            entity_id=id,
            description=f"Error al eliminar la persona con ID {id}: {str(e)}",
            ip_address=current_user.get("ip_address"),
            db=db_session,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al eliminar la persona",
        )


@router.patch("/{person_id}/record/{record_id}", status_code=HTTP_200_OK)
async def add_person_to_record(
    person_id: str,
    record_id: str,
    type_relationship: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para vincular personas con registros",
        )
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado"
        )
    try:
        if not person_id or not record_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere un ID de persona y un ID de antecedente!",
            )
        result = await person_service.add_record(
            person_id=person_id,
            record_id=record_id,
            type_relationship=type_relationship,
            db=db_session,
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo agregar a la persona al antecedente!",
            )

        return {
            "status": "success",
            "message": "Persona agregada al antecedente correctamente!",
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error interno en el servidor al agregar la persona al antecedente", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al agregar la persona al antecedente",
        )


@router.patch("/linked-person/{person_id}/{person_to_connect}")
async def add_person_connection(
    person_id: str,
    person_to_connect: str,
    connection_type: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para conectar personas",
        )

    try:
        res = await person_service.add_person_connection(
            person_id=person_id,
            person_to_connect=person_to_connect,
            connection_type=connection_type,
            db=db_session,
        )
        if not res:
            raise HTTPException(
                status_code=400,
                detail="Error al vincular la persona, verifique los campos.",
            )
        await logs_services.create_log(
            user_id=current_user.get("user_id"),
            action="UPDATE",
            entity_type="PERSON",
            entity_id=person_id,
            description=f"Se vinculo la persona con ID {person_to_connect} a la persona con ID {person_id}",
            ip_address=current_user.get("ip_address"),
            db=db_session,
        )
        return True
    except Exception as e:
        print(f"Error en add_person_connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al vincular personas. Por favor, verifica los IDs.",
        )


@router.post("/search-dni/{identification}", status_code=status.HTTP_200_OK)
async def get_person_by_dni(
    identification: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db_session: AsyncSession = Depends(get_db),
):
    """
    Busca una persona por su número de identificación (DNI).
    Permite acceso a ADMIN, MODERATE, USERS y VIEW (visualizador)
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para realizar esta acción",
        )
    try:
        person = await person_service.search_person_by_dni(
            dni=identification, db=db_session
        )

        if not person:
            return []

        # Retornar datos básicos de la persona sin intentar validar relaciones
        # RETORNAR COMO ARRAY para consistencia con el cliente
        return [
            {
                "person_id": person.person_id,
                "identification": person.identification,
                "identification_type": person.identification_type,
                "names": person.names,
                "lastnames": person.lastnames,
                "address": person.address,
                "province": person.province,
                "country": person.country,
                "observations": person.observations,
                "created_at": person.created_at,
                "updated_at": person.updated_at,
                "created_by": person.created_by,
            }
        ]
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al buscar persona por DNI: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al buscar persona por DNI",
        )


@router.get("/{person_id}/linked", status_code=status.HTTP_200_OK)
async def get_linked_persons(
    person_id: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db_session: AsyncSession = Depends(get_db),
):
    """
    Obtiene todas las personas vinculadas a una persona específica.
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para ver las conexiones de personas",
        )
    try:
        linked_persons = await person_service.get_linked_persons(
            person_id=person_id, db=db_session
        )

        if isinstance(linked_persons, str):
            # Si es un string, es un mensaje de error
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=linked_persons
            )

        return linked_persons
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al obtener personas vinculadas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al obtener personas vinculadas",
        )


@router.get("/{person_id}/records", status_code=status.HTTP_200_OK)
async def get_person_records(
    person_id: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer),
    db_session: AsyncSession = Depends(get_db),
):
    """
    Obtiene todos los antecedentes vinculados a una persona específica.
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para ver los antecedentes de personas",
        )

    try:
        records = await person_service.get_person_records(
            person_id=person_id, db=db_session
        )

        if isinstance(records, str):
            # Si es un string, es un mensaje de error
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=records)

        return records
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al obtener antecedentes de la persona: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al obtener antecedentes de la persona",
        )


@router.delete("/{person_id}/record/{record_id}", status_code=status.HTTP_200_OK)
async def remove_person_record(
    person_id: str,
    record_id: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    """
    Desvincula un antecedente de una persona (elimina la relación pero no los registros)
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para desvinculación antecedentes",
        )

    try:
        if not person_id or not record_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere un ID de persona y un ID de antecedente!",
            )

        result = await person_service.remove_record(
            person_id=person_id, record_id=record_id, db=db_session
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo desvinculación el antecedente de la persona!",
            )
        await logs_services.create_log(
            user_id=current_user["user_id"],
            action="DELETE",
            entity_type="PERSON",
            entity_id=person_id,
            description=f"Se desvinculo el antecedente con ID {record_id} de la persona con ID {person_id}",
            ip_address=current_user.get("ip_address"),
            db=db_session,
        )

        return {
            "status": "success",
            "message": "Antecedente desvinculado correctamente!",
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error interno en el servidor al desvinculación el antecedente", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al desvinculación el antecedente",
        )


@router.delete(
    "/{person_id}/connection/{person_to_disconnect}", status_code=status.HTTP_200_OK
)
async def remove_person_connection(
    person_id: str,
    person_to_disconnect: str,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all),
    db_session: AsyncSession = Depends(get_db),
):
    """
    Desvincula una persona de otra (elimina la conexión pero no los registros)
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No tienes permiso para desvinculación personas",
        )

    try:
        if not person_id or not person_to_disconnect:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere un ID de persona y un ID de persona a desvinculación!",
            )

        result = await person_service.remove_person_connection(
            person_id=person_id,
            person_to_disconnect=person_to_disconnect,
            db=db_session,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo desvinculación la persona!",
            )
        await logs_services.create_log(
            user_id=current_user["user_id"],
            action="DELETE",
            entity_type="PERSON",
            description=f"Se desvinculo la persona con ID {person_to_disconnect} de la persona con ID {person_id}",
            ip_address=current_user.get("ip_address"),
            entity_id=person_id,
            db=db_session,
        )

        return {"status": "success", "message": "Persona desvinculada correctamente!"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error interno en el servidor al desvinculación la persona", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al desvinculación la persona",
        )
