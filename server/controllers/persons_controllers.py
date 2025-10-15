from fastapi import APIRouter, HTTPException, Query, status, Depends
from fastapi.responses import JSONResponse
from starlette.status import HTTP_200_OK
from services.persons_services import PersonsService
from services.users_services import UserService
from models.schemas.person_schemas import PersonSchema, PersonResponse
from database.db import SessionLocal
from typing import List, Dict
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_all

router = APIRouter(tags=["Persons"], prefix="/persons")
person_service = PersonsService()


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
        user_service = UserService()
        user_data = user_service.get_user(id=current_user["user_id"], db=db_session)
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
            
        # Verificar el rol directamente
        if user_data.role_name not in ["ADMIN", "MODERATE", "USER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol no autorizado: {user_data.role_name}"
            )
    except Exception as e:
        print(f"Error al verificar el rol: {e}")
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
def get_person(id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
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

@router.get("/search/")
def search_person(
    query: str = Query(..., description="buscar a una persona por DNI, Apellido, NOmbre, domicilio"),
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_all)
):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para buscar personas"
        )
    print(query)
    db_session = SessionLocal()
    try:
        persons = person_service.search_person(query=query, db=db_session)
        if len(persons) == 0:
            raise HTTPException(
                detail="No se encontraron personas que coincidan con la busqueda!",
                status_code=status.HTTP_404_NOT_FOUND,            
            )
        return persons
    except Exception as e:
        print("Error interno en el servidor al buscar las personas: ",e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al buscar las personas!"
        )
    finally:
        db_session.close()


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_person(body: PersonSchema, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear personas"
        )
    
    user_id = current_user["user_id"]
    db_session = SessionLocal()
    try:
        person = person_service.create_person(body.identification,
                                    body.identification_type,
                                    body.names,
                                    body.lastnames,
                                    body.address,
                                    body.province,
                                    body.country,
                                    user_id=user_id,
                                    db= db_session,
                                    observations=body.observations
                                    )
        if type(person) is str:
            return HTTPException(
                status_code=422,
                detail="La persona ya existe!"
            )
        return person
    except Exception as e:
        print("Error critico al crear la persona", e)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en el servidor al crear la persona"
        )
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
def add_person_to_record(person_id:str, record_id:str, type_relationship:str = Query(..., description="Por lo general autor o victima"), current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para vincular personas con registros"
        )
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

@router.get("/{person_id}/linked", status_code=status.HTTP_200_OK)
def get_linked_persons(person_id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
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
def get_person_records(person_id: str, current_user: Dict = Depends(is_authenticated), is_authorized: bool = Depends(check_rol_all)):
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