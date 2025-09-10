from services.users_services import UserService
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter
from models.schemas.token_schemas import Token, TokenData
from typing import Annotated
from database.db import SessionLocal
from config.config import token_expires_minutes
from datetime import datetime, timedelta, timezone
from utils.jwt import create_access_token


user_service = UserService()
auth_router = APIRouter()

@auth_router.post("/login")
async def login(formdata: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    try:
        db_session = SessionLocal()
        user = user_service.login(formdata.username, formdata.password, db=db_session)
        if not user:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="IUsuario o contraseña incorrectos!",
            headers={"WWW-Authenticate": "Bearer"},
        )
        access_token_expires = timedelta(minutes=token_expires_minutes)
        access_token = create_access_token(data= { "sub": user.username}, expires_delta=access_token_expires)
        db_session.close()
        return Token(access_token=access_token, token_type="bearer")

    except Exception as e:
        raise HTTPException (
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail= "Error al intentar inciar sesion, comuniquese con el administrador!"
        )
