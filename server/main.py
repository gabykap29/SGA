import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import configure_mappers

# Importación de controladores
from controllers.user_controllers import user_routes
from controllers.roles_controllers import role_router
from controllers.auth_controllers import auth_router
from controllers.persons_controllers import router as person_router
from controllers.records_controolers import router as record_router
from controllers.files_controllers import router as files_router
from controllers.logs_controllers import router as logs_router

# Importación de utilidades de BD
from utils.create_admin import create_admin
from utils.create_roles import create_roles
from database.db import init_database


# --- 1. CONFIGURACIÓN DE CICLO DE VIDA  ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Maneja el ciclo de vida de la aplicación (Startup y Shutdown).
    Reemplaza a @app.on_event("startup").
    """
    print("🚀 Iniciando secuencia de arranque para Producción...")

    # A. Configurar Mappers
    try:
        configure_mappers()
        print("✅ SQLAlchemy Mappers configurados.")
    except Exception as e:
        print(f"⚠️ Advertencia en mappers: {e}")

    # B. Inicializar Base de Datos y Semillas

    try:
        await init_database()
        await create_roles()  # Aseguramos await aquí

        # Crear admin solo si no existe
        admin_created = await create_admin()
        if admin_created:
            print("✅ Usuario administrador inicializado.")
        else:
            print("ℹ️ Admin ya existente o base de datos poblada.")

    except Exception as e:
        print(f"❌ Error crítico iniciando base de datos: {e}")
        raise e

    yield

    print("🛑 Aplicación deteniéndose. Limpiando recursos...")


# --- 2. DEFINICIÓN DE LA APP CON METADATOS ---
app = FastAPI(
    title="SGA API - Sistema de Gestión",
    description="API Backend para la gestión de personas, antecedentes y archivos.",
    version="1.0.0",
    lifespan=lifespan,
)

# --- 3. SEGURIDAD CORS (IMPORTANTE) ---
origins = os.getenv("ALLOWED_ORIGINS", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# --- 4. RUTAS ---
app.include_router(user_routes)
app.include_router(role_router)
app.include_router(auth_router)
app.include_router(person_router)
app.include_router(record_router)
app.include_router(files_router)
app.include_router(logs_router)


@app.get("/health")
def health_check():
    """Endpoint para que servicios de nube verifiquen si la app está viva"""
    return {"status": "ok", "environment": os.getenv("ENV", "development")}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
