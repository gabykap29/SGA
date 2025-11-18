from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config.config import database_url

if database_url is None:
    database_url = ""

engine = create_async_engine(database_url, echo=True)
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_database():
    """Funcion para crear las tablas si no existen"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
