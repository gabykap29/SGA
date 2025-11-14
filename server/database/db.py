from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config.config import database_url

if database_url is None:
    database_url = ""

engine = create_engine(database_url, echo=True)
SessionLocal = sessionmaker(bind = engine, autoflush= False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas")
        return True
