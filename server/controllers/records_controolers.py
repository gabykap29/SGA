from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from services.records_services import RecordService
from database.db import SessionLocal
from models.schemas.record_schema import RecordSchema

router = APIRouter(tags=["Records"], prefix="/records")
record_service = RecordService()

@router.get("", status_code=status.HTTP_200_OK)
def get_records():
    db_session = SessionLocal()
    try: 
        records = record_service.get_records(db=db_session)
        records_list = list(records)
        if len(records_list) == 0: 
            return JSONResponse(
                content="Aun no se han cargado antecedentes",
                status_code=status.HTTP_404_NOT_FOUND
            )
        return records_list

    except Exception as e:
        print("Error interno en el servidor al obtener los antecedentes",e)
        return JSONResponse(
            content="Error interno en el servidor al obtener los antecedentes",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        db_session.close()

@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_record(id: str):
    db_session = SessionLocal()
    try:
        record = record_service.get_record(record_id=id, db=db_session)
        if not record : 
            return JSONResponse(
                content="El antecedente no existe!",
                status_code=status.HTTP_200_OK
            )
        return record
    except Exception as e:
        print("Error interno en el servidor al obtener el antecedente", e) 
        return JSONResponse(
            content="Error interno en el servidor al obtener el antecedente",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )       
    finally:
        db_session.close()

@router.post("", status_code=status.HTTP_201_CREATED)
def create_record(body: RecordSchema):
    db_session = SessionLocal()
    try:
        new_record = record_service.create_record(
            body.title, body.date, body.content, body.observations, db=db_session
        )
        if record_service is str:
            return JSONResponse(
                content= new_record,
                status_code= status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        return JSONResponse(
            content="Antecedente creado correctamente!",
            status_code=status.HTTP_201_CREATED
        )
    except Exception as e:
        print("Error interno en el servidor al crear el antecedente", e)
        return JSONResponse(
            status_code=500,
            content="Error interno en el servidor al intentar crear el antecedente."
        )
    finally:
        db_session.close()


@router.put("/{id}", status_code=status.HTTP_200_OK)
def update_record(id: str, body: RecordSchema):
    db_session = SessionLocal()
    try:
        record = record_service.update_record(
            record_id=id,
            title=body.title,
            date=body.date.strftime("%Y-%m-%d") if hasattr(body.date, "strftime") else str(body.date),
            content=body.content,
            observations=body.observations,
            db=db_session
        )
        if not record:
            return HTTPException(
                status_code=422,
                detail="Verifique los campos"
            )
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


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_report(id: str):
    db_session = SessionLocal()
    try: 
        record = record_service.delete_record(record_id=id, db=db_session)
        if not record:
            return HTTPException(
                status_code=404,
                detail="El antecedente no existe!"
            )
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