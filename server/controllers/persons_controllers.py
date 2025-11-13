from fastapi import APIRouter, HTTPException, Query, status, Depends
from fastapi.responses import JSONResponse
from starlette.status import HTTP_200_OK
from services.persons_services import PersonsService
from services.users_services import UserService
from models.schemas.person_schemas import PersonSchema, PersonResponse
from database.db import SessionLocal
from typing import List, Dict, Optional
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_all, check_rol_admin, check_rol_all_or_viewer

router = APIRouter(tags=["Persons"], prefix="/persons")
person_service = PersonsService()

# Endpoint de prueba para verificar que el router funciona
@router.get("/test")
def test_endpoint():
    """Endpoint de prueba para verificar que el router está funcionando"""
    return {"message": "Router de personas funcionando correctamente", "prefix": "/persons"}

@router.get("", status_code=status.HTTP_200_OK, response_model=List[PersonResponse])
def get_persons(current_user: Dict = Depends(is_authenticated),is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta persona"
        )
    # Primero verificamos que el usuario esté autenticado
    if not current_user or "user_id" not in current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autenticado"
        )

    # Luego verificamos el rol directamente aquí
    db_session = SessionLocal()
    try:
        import uuid
        user_service = UserService()
        # Convertir user_id a UUID
        try:
            user_id_obj = uuid.UUID(current_user["user_id"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID de usuario inválido"
            )
        
        user_data = user_service.get_user(id=user_id_obj, db=db_session)

        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        # Verificar el rol directamente
        if user_data.role_name not in ["ADMIN", "MODERATE", "USER", "USERS"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol no autorizado: {user_data.role_name}"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al verificar el rol: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar permisos: {str(e)}"
        )
    finally:
        db_session.close()
    db_session = SessionLocal()
    try:
        persons = person_service.get_persons(db=db_session)
        persons_list = list(persons)

        if not persons_list or len(persons_list) < 1:
            return []

        # Convertir a esquemas Pydantic mientras la sesión está activa
        persons_response = [PersonResponse.model_validate(person) for person in persons_list]
        return persons_response
    except Exception as e:
        print("Error critico al obtener las personas", e)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al obtener las personas"
        )
    finally:
        db_session.close()

@router.get("/{id}", status_code=status.HTTP_200_OK, response_model=PersonResponse)
def get_person(id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all_or_viewer)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta persona"
        )
    db_session = SessionLocal()
    try:
        person = person_service.get_person(person_id=id, db=db_session)
        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La persona no existe!"
            )
        # Serializar archivos con mime_type
        files = []
        for f in getattr(person, 'files', []):
            files.append({
                'file_id': f.file_id,
                'original_filename': f.original_filename,
                'file_type': f.file_type,
                'file_size': f.file_size,
                'mime_type': getattr(f, 'mime_type', None),
                'created_at': f.created_at
            })
        # Construir respuesta serializada
        person_dict = person.__dict__.copy()
        person_dict['files'] = files
        return person_dict
    except Exception as e:
        print("Error critico al obtener la persona", e)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al obtener la persona"
        )
    finally:
        db_session.close()

@router.get("/search/person/", response_model=List[PersonResponse])
def search_person(
    names: Optional[str] = Query(None, description="Nombres de la persona"),
    lastname: Optional[str] = Query(None, description="Apellidos de la persona"),
    identification: Optional[str] = Query(None, description="Documento de identificación"),
    gender: Optional[str] = Query(None, description="Género"),
    address: Optional[str] = Query(None, description="Dirección"),
    nationality: Optional[str] = Query(None, description="Nacionalidad"),
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all_or_viewer)
):
    """
    Busca personas basado en criterios específicos.
    Requiere autenticación y rol autorizado (ADMIN, MODERATE, USERS, VIEW).
    """
    print(f"🔍 GET /persons/search/person/ - Parámetros recibidos:")
    print(f"   names={names}, lastname={lastname}, identification={identification}")
    print(f"   gender={gender}, address={address}, nationality={nationality}")
    print(f"   Usuario: {current_user.get('sub', 'unknown')}")
    
    if not is_authorized:
        print("❌ Usuario no autorizado")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para realizar esta acción")

    db_session = SessionLocal()
    try:
        print("📊 Llamando a person_service.search_person()")
        persons = person_service.search_person(
            db=db_session,
            names=names,
            lastname=lastname,
            identification=identification,
            gender=gender,
            address=address,
            nationality=nationality
        )

        print(f"✅ Búsqueda completada: {len(persons) if persons else 0} personas encontradas")
        
        if not persons:
            print("⚠️  Sin resultados")
            return []

        result = [PersonResponse.model_validate(p) for p in persons]
        print(f"✅ Retornando {len(result)} resultados")
        return result
    except HTTPException as e:
        # Re-lanzar excepciones HTTP para que FastAPI las maneje
        print(f"❌ HTTPException: {e.detail}")
        raise e
    except Exception as e:
        print(f"❌ Error en el controlador de búsqueda: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor al buscar personas: {str(e)}"
        )
    finally:
        db_session.close()


# Endpoint de prueba sin autenticación para debug
@router.get("/search/person/debug")
def search_person_debug(query: str = Query(..., description="Término de búsqueda para identificación")):
    """
    Endpoint de búsqueda para depuración. No requiere autenticación.
    Busca principalmente por identificación.
    """
    print(f"Controlador search_person_debug recibido: query='{query}'")
    db_session = SessionLocal()
    try:
        # Llama al nuevo servicio, usando 'query' para el campo 'identification'
        persons = person_service.search_person(db=db_session, identification=query)

        if not persons:
            print("No se encontraron personas en el servicio.")
            return JSONResponse(status_code=HTTP_200_OK, content=[])

        # Serializar la respuesta usando el modelo Pydantic
        persons_response = [PersonResponse.model_validate(p) for p in persons]

        return persons_response
    except Exception as e:
        print(f"Error en el controlador de búsqueda de depuración: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor al buscar personas: {str(e)}"
        )
    finally:
        db_session.close()


@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=PersonResponse)
def create_person(person_data: PersonSchema, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear personas"
        )

    db_session = SessionLocal()
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID de usuario no encontrado en el token")

        person = person_service.create_person(
            db=db_session,
            user_id=user_id,
            **person_data.model_dump()
        )

        if isinstance(person, str) and person == "La persona ya existe!":
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=person)

        if not person or not hasattr(person, 'person_id'):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear la persona o la persona no tiene ID")

        # La respuesta se valida automáticamente con response_model=PersonResponse
        return person

    except HTTPException as e:
        raise e # Re-lanzar excepciones HTTP
    except Exception as e:
        print(f"Error en el controlador de creación: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado en el servidor: {e}")
    finally:
        db_session.close()


@router.patch("/update/{id}", status_code=status.HTTP_200_OK)
def update_person(id: str, body: PersonSchema, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar personas"
        )
    db_session = SessionLocal()
    try:
        person = person_service.update_person(
            person_id= id,
            identification= body.identification,
            identification_type= body.identification_type,
            names= body.names,
            lastnames=body.lastnames,
            address=body.address,
            province=body.province,
            country=body.country,
            db=db_session,
            observations=body.observations
            )

        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se pudo actualizar porque la persona no existe!"
            )

        return {"status": "success",
                "mensaje": "Persona actualizada correctamente!"}
    except Exception as e:
        print("Error critico al actualizar la persona", e)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al actualizar la persona"
        )
    finally:
        db_session.close()

@router.get("/load-csv/", status_code=status.HTTP_200_OK)
def load_persons_from_csv(current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_admin)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para cargar personas desde CSV"
        )
    db_session = SessionLocal()
    try:

        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="ID de usuario no encontrado en el token"
            )
        result = person_service.load_persons(db=db_session, user_id=user_id)
        return result
    except Exception as e:
        print("Error critico al cargar personas desde CSV", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al cargar personas desde CSV"
        )
    finally:
        db_session.close()


@router.get("/load-csv/status/", status_code=status.HTTP_200_OK)
def get_load_csv_status(current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_admin)):
    """
    Retorna el estado actual de la carga del padrón electoral.
    Permite monitorear el progreso de la operación.
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para consultar el estado de carga"
        )
    try:
        status_info = person_service.get_load_status()
        return status_info
    except Exception as e:
        print("Error al obtener estado de carga:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener estado de carga"
        )


@router.delete("/delete/{id}", status_code=status.HTTP_200_OK)
def delete_person(id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar personas"
        )
    db_session = SessionLocal()
    try:
        deleted = person_service.delete_person(person_id=id, db=db_session)
        if type(deleted) is str:
            raise HTTPException(
                status_code= status.HTTP_404_NOT_FOUND,
                detail= "No se pudo eliminar porque la persona no existe o tiene antecedentes vinculados!"
            )
        return {
            "status": "success",
            "message": "Persona eliminada correctamente!"
        }
    except Exception as e:
        print("Error critico al eliminar la persona", e)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al eliminar la persona"
        )
    finally:
        db_session.close()

@router.patch("/{person_id}/record/{record_id}", status_code=HTTP_200_OK)
def add_person_to_record(person_id:str, record_id:str, type_relationship:str = Query(default="Denunciado", description="Tipo de vinculación: Denunciado, Denunciante, Testigo, Autor, Víctima, Sospechoso, Implicado, Querellante"), current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para vincular personas con registros"
        )
    
    # Debug: verificar qué se está recibiendo
    print(f"DEBUG: type_relationship recibido = '{type_relationship}'")
    
    db_session = SessionLocal()
    try:
        if not person_id or not record_id:
            raise HTTPException(
                status_code= status.HTTP_400_BAD_REQUEST,
                detail= "Se requiere un ID de persona y un ID de antecedente!"
            )
        result = person_service.add_record(
            person_id=person_id,
            record_id= record_id,
            type_relationship=type_relationship,
            db=db_session
        )
        if not result:
            raise HTTPException(
                status_code= status.HTTP_400_BAD_REQUEST,
                detail="No se pudo agregar a la persona al antecedente!"
            )

        return {
            "status": "success",
            "message":"Persona agregada al antecedente correctamente!"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error interno en el servidor al agregar la persona al antecedente", e)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail= "Error interno en el servidor al agregar la persona al antecedente"
        )
    finally:
        db_session.close()

@router.patch("/linked-person/{person_id}/{person_to_connect}")
def add_person_connection(person_id: str, person_to_connect: str, connection_type: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para conectar personas"
        )
    db_session = SessionLocal()

    try:
        res = person_service.add_person_connection(person_id=person_id, person_to_connect=person_to_connect,connection_type=connection_type , db= db_session)
        if not res:
            raise HTTPException(
                status_code=400,
                detail="Error al vincular la persona, verifique los campos."
            )
        return True
    except Exception as e:
        print(f"Error en add_person_connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al vincular personas. Por favor, verifica los IDs."
        )
    finally:
        db_session.close()
@router.post("/search-dni/{identification}", status_code=status.HTTP_200_OK)
def get_person_by_dni(identification: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all_or_viewer)):
    """
    Busca una persona por su número de identificación (DNI).
    Permite acceso a ADMIN, MODERATE, USERS y VIEW (visualizador)
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para realizar esta acción"
        )
    
    db_session = SessionLocal()
    try:
        person = person_service.search_person_by_dni(dni=identification, db=db_session)

        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona no encontrada con el DNI proporcionado"
            )

        return PersonResponse.model_validate(person)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al buscar persona por DNI: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al buscar persona por DNI"
        )
    finally:
        db_session.close()
@router.get("/{person_id}/linked", status_code=status.HTTP_200_OK)
def get_linked_persons(person_id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all_or_viewer)):
    """
    Obtiene todas las personas vinculadas a una persona específica.
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver las conexiones de personas"
        )

    db_session = SessionLocal()
    try:
        linked_persons = person_service.get_linked_persons(person_id=person_id, db=db_session)

        if isinstance(linked_persons, str):
            # Si es un string, es un mensaje de error
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=linked_persons
            )

        return linked_persons
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al obtener personas vinculadas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al obtener personas vinculadas"
        )
    finally:
        db_session.close()

@router.get("/{person_id}/records", status_code=status.HTTP_200_OK)
def get_person_records(person_id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all_or_viewer)):
    """
    Obtiene todos los antecedentes vinculados a una persona específica.
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver los antecedentes de personas"
        )

    db_session = SessionLocal()
    try:
        records = person_service.get_person_records(person_id=person_id, db=db_session)

        if isinstance(records, str):
            # Si es un string, es un mensaje de error
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=records
            )

        return records
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al obtener antecedentes de la persona: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al obtener antecedentes de la persona"
        )
    finally:
        db_session.close()

@router.delete("/{person_id}/record/{record_id}", status_code=status.HTTP_200_OK)
def remove_person_record(person_id: str, record_id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    """
    Desvincula un antecedente de una persona (elimina la relación pero no los registros)
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para desvinculación antecedentes"
        )

    db_session = SessionLocal()
    try:
        if not person_id or not record_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere un ID de persona y un ID de antecedente!"
            )

        result = person_service.remove_record(
            person_id=person_id,
            record_id=record_id,
            db=db_session
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo desvinculación el antecedente de la persona!"
            )

        return {
            "status": "success",
            "message": "Antecedente desvinculado correctamente!"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error interno en el servidor al desvinculación el antecedente", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al desvinculación el antecedente"
        )
    finally:
        db_session.close()

@router.delete("/{person_id}/connection/{person_to_disconnect}", status_code=status.HTTP_200_OK)
def remove_person_connection(person_id: str, person_to_disconnect: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    """
    Desvincula una persona de otra (elimina la conexión pero no los registros)
    """
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para desvinculación personas"
        )
    
    db_session = SessionLocal()
    try:
        if not person_id or not person_to_disconnect:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere un ID de persona y un ID de persona a desvinculación!"
            )
        
        result = person_service.remove_person_connection(
            person_id=person_id,
            person_to_disconnect=person_to_disconnect,
            db=db_session
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo desvinculación la persona!"
            )
        
        return {
            "status": "success",
            "message": "Persona desvinculada correctamente!"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error interno en el servidor al desvinculación la persona", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al desvinculación la persona"
        )
    finally:
        db_session.close()
