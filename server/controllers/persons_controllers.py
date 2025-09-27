from fastapi import APIRouter, HTTPException, Header, Query, status
from fastapi.responses import JSONResponse
from starlette.status import HTTP_200_OK
from services.persons_services import PersonsService
from models.schemas.person_schemas import PersonSchema, PersonResponse
from database.db import SessionLocal
from utils.jwt import decode_access_token
from typing import List

router = APIRouter(tags=["Persons"], prefix="/persons")
person_service = PersonsService()


@router.get("", status_code=status.HTTP_200_OK, response_model=List[PersonResponse])
def get_persons():
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
def get_person(id: str):
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
    query: str = Query(..., description="buscar a una persona por DNI, Apellido, NOmbre, domicilio")
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
def create_person(body: PersonSchema,
                  authorization: str = Header(None)
                  ):
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ")[1]
    token_decode = decode_access_token(token)
    user_id = token_decode["user_id"]
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
        
        if not person:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Error al crear la persona"
            )
        
        # Convertir el objeto SQLAlchemy usando el esquema Pydantic y devolver directamente
        person_response = PersonResponse.model_validate(person)
        return person_response
    except Exception as e:
        print("Error interno del servidor al intentar crear una persona ", e)
        error_message = str(e)
        
        # Verificar si es un error de duplicado
        if "Duplicate entry" in error_message and "identification" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una persona con esta identificación"
            )
        
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Error al crear la persona, verifique los campos"
        )
    finally:
        db_session.close()
        
@router.put("/update/{id}", status_code=status.HTTP_202_ACCEPTED)
def update_person(id: str, body: PersonSchema):
    db_session = SessionLocal()
    try:
        update = person_service.update_person(person_id=id, 
                                            identification=body.identification,
                                            identification_type= body.identification_type,
                                            names= body.names,
                                            lastnames = body.lastnames,
                                            address = body.address,
                                            province = body.province,
                                            country = body.country,
                                            db= db_session,
                                            )
        if not update:
            return HTTPException(
                status_code= status.HTTP_400_BAD_REQUEST,
                detail="Verfique los campos!"
            )
        return {
            "message": "Persona actualizada correctamente!"
        }
    except Exception as e:
        print("Error al actualizar la persona, ",e)
        return HTTPException(
                status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="ERROR INTERNO EN EL SERVIDOR AL INTENTAR ACTUALIZAR"
            )
    finally:
        db_session.close()


@router.patch("/{person_id}/{record_id}", status_code=HTTP_200_OK)
def add_record_to_person(person_id: str, record_id: str, type_relationship: str):
    db_session = SessionLocal()
    try:
        record = person_service.add_record(person_id=person_id, record_id= record_id,type_relationship=type_relationship ,db=db_session )
        if not record:
            return HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Error, no se pudo vincular la persona con el antecedente... intente nuevamente mas tarde."
            )
        return JSONResponse(
            status_code= status.HTTP_200_OK,
            content="Antecedente vinculado con exito!"
        )
    except Exception as e: 
        print("Error interno en el servidor la vincular la persona!", e)
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en el servidor al vincular la persona!"
        )
    finally:
        db_session.close()