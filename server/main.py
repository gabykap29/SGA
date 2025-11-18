from fastapi import FastAPI
from controllers.user_controllers import user_routes
from controllers.roles_controllers import role_router
from fastapi.middleware.cors import CORSMiddleware
from utils.create_admin import create_admin
from utils.create_roles import create_roles
from database.db import init_database
from controllers.auth_controllers import auth_router
from controllers.persons_controllers import router as person_router
from controllers.records_controolers import router as record_router
from controllers.files_controllers import router as files_router
from controllers.logs_controllers import router as logs_router
import models
from sqlalchemy.orm import configure_mappers

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
app.include_router(record_router)
app.include_router(files_router)
app.include_router(logs_router)

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.on_event("startup")
async def startup_event():
    """Evento que se ejecuta al iniciar la aplicación"""
    print("🚀 Iniciando aplicación...")
    
    # 1. Primero configurar los mappers de SQLAlchemy
    try:
        configure_mappers()
        print("✅ Mappers de SQLAlchemy configurados")
    except Exception as e:
        print(f"⚠️  Advertencia al configurar mappers: {e}")
    
    # 2. Inicializar la base de datos (crear tablas)
    db = await init_database()
    if db:
        print("✅ Base de datos inicializada")
        
        # 3. Luego crear los roles
        print("📋 Creando roles...")
        await create_roles()
        
        # 4. Finalmente crear el usuario admin
        print("👤 Creando usuario administrador...")
        await create_admin()



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="", port=8000, reload=True)