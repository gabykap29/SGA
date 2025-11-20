from fastapi import Depends, HTTPException, status
import jwt
from typing import Annotated
from config.config import secret_key, hash_algorithm
from fastapi.security import OAuth2PasswordBearer
from models.schemas.token_schemas import TokenData
from jwt.exceptions import InvalidTokenError
from services.users_services import UserService
from database.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload


user_services = UserService()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def is_autenticate(
    token: Annotated[str, Depends(oauth2_scheme)],
    db_session: AsyncSession = Depends(get_db),
):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autentificado!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, secret_key, algorithms=[hash_algorithm])
        username = payload.get("sub")
        user_id = payload.get("user_id")
        if username is None:
            raise credential_exception
        token_data = TokenData(username=username, user_id=user_id)
    except InvalidTokenError:
        raise credential_exception

    try:
        stm = (
            select(user_services.userModel)
            .options(joinedload(user_services.userModel.roles))
            .filter(user_services.userModel.username == username)
        )
        result = await db_session.execute(stm)
        user = result.scalars().first()

        if user is None or not user:
            raise credential_exception

        data = {
            "id": user.id,
            "username": user.username,
            "role": user.roles,
            # Agregamos estos campos adicionales por si se necesitan en el futuro
            "role_id": str(user.roles.id) if user.roles else None,
            "role_name": user.roles.name if user.roles else None,
        }
        return data
    finally:
        # Siempre cerramos la sesión al terminar
        db_session.close()
