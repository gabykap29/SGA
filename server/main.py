from fastapi import FastAPI
from controllers.user_controllers import user_routes
from controllers.roles_controllers import role_router
from fastapi.middleware.cors import CORSMiddleware
from utils.create_admin import create_admin
from utils.create_roles import create_roles
from database.db import init_database
from controllers.auth_controllers import auth_router
from controllers.persons_controllers import router as person_router

# Importar todos los modelos para que SQLAlchemy pueda mapear las relaciones
import models

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes)
app.include_router(role_router)
app.include_router(auth_router)
app.include_router(person_router)

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.on_event("startup")
async def startup_event():
    """Evento que se ejecuta al iniciar la aplicación"""
    print("🚀 Iniciando aplicación...")
    
    # 1. Primero inicializar la base de datos (crear tablas)
    if init_database():
        print("✅ Base de datos inicializada")
        
        # 2. Luego crear los roles
        print("📋 Creando roles...")
        create_roles()
        
        # 3. Finalmente crear el usuario admin
        print("👤 Creando usuario administrador...")
        create = create_admin()

    else:
        print("❌ Error al inicializar la base de datos")
