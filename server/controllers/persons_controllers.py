from fastapi import APIRouter, HTTPException, Query, status, Depends
from fastapi.responses import JSONResponse
from starlette.status import HTTP_200_OK
from services.persons_services import PersonsService
from models.schemas.person_schemas import PersonSchema, PersonResponse
from database.db import SessionLocal
from typing import List, Dict
from dependencies.is_auth import is_authenticated

router = APIRouter(tags=["Persons"], prefix="/persons")
person_service = PersonsService()


@router.get("", status_code=status.HTTP_200_OK, response_model=List[PersonResponse])
def get_persons(current_user: Dict = Depends(is_authenticated)):
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
def get_person(id: str, current_user: Dict = Depends(is_authenticated)):
    db_session = SessionLocal()
    try:
        person = person_service.get_person(person_id=id, db=db_session)
        
        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La persona no existe!"
            )
        
        return person
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
    current_user: Dict = Depends(is_authenticated)
):
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


@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=PersonResponse)
def create_person(body: PersonSchema, current_user: Dict = Depends(is_authenticated)):
    
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
def update_person(id: str, body: PersonSchema, current_user: Dict = Depends(is_authenticated)):
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
            db=db_session
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
def delete_person(id: str, current_user: Dict = Depends(is_authenticated)):
    db_session = SessionLocal()
    try:
        deleted = person_service.delete_person(person_id=id, db=db_session)
        if not deleted:
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
        
@router.patch("/{person_id}/{record_id}", status_code=HTTP_200_OK)
def add_person_to_record(person_id:str, record_id:str, type_relationship:str = Query(..., description="Por lo general autor o victima"), current_user: Dict = Depends(is_authenticated)):
    db_session = SessionLocal()
    try:
        if not person_id or not record_id:
            raise HTTPException(
                status_code= status.HTTP_400_BAD_REQUEST,
                detail= "Se requiere un ID de persona y un ID de antecedente!"
            )
        result = person_service.add_person_to_record(
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