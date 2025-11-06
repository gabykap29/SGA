# 📚 Documentación Técnica - Sistema de Gestión de Antecedentes (SGA)

## 📋 Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Backend - FastAPI](#backend-fastapi)
4. [Frontend - Next.js](#frontend-nextjs)
5. [Base de Datos](#base-de-datos)
6. [Sistema de Seguridad](#sistema-de-seguridad)
7. [API Endpoints](#api-endpoints)
8. [Guía de Desarrollo](#guía-de-desarrollo)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

### Descripción General
Sistema de Gestión de Antecedentes (SGA) es una aplicación full-stack diseñada para gestionar registros de personas, sus antecedentes y archivos asociados con un sistema robusto de seguridad y auditoría.

### Stack Tecnológico

**Backend:**
- FastAPI (Python 3.8+)
- SQLAlchemy (ORM)
- PostgreSQL/MySQL
- JWT para autenticación
- Bcrypt para encriptación de contraseñas
- Cryptography (Fernet) para encriptación de archivos

**Frontend:**
- Next.js 15.5.4 (React 19)
- React Bootstrap
- React Icons
- React Toastify

### Características Principales
- ✅ Sistema de autenticación con JWT
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Gestión de personas y antecedentes
- ✅ Sistema de archivos encriptados
- ✅ Auditoría completa (logs)
- ✅ Relaciones entre personas
- ✅ API REST completa

---

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto

```
SGA/
├── client/                      # Frontend Next.js
│   ├── src/
│   │   └── app/
│   │       ├── dashboard/       # Aplicación principal
│   │       ├── layout.js        # Layout principal
│   │       └── page.js          # Página de inicio/login
│   ├── services/                # Servicios API
│   │   ├── authService.js
│   │   ├── personService.js
│   │   ├── recordService.js
│   │   ├── userService.js
│   │   ├── roleService.js
│   │   ├── logsService.js
│   │   └── dashboardService.js
│   ├── components/              # Componentes reutilizables
│   └── package.json
│
├── server/                      # Backend FastAPI
│   ├── config/                  # Configuración
│   │   ├── config.py           # Variables de entorno
│   │   └── file_storage.py     # Configuración de archivos
│   ├── controllers/             # Controladores (Rutas)
│   │   ├── auth_controllers.py
│   │   ├── user_controllers.py
│   │   ├── persons_controllers.py
│   │   ├── records_controolers.py
│   │   ├── files_controllers.py
│   │   ├── logs_controllers.py
│   │   └── roles_controllers.py
│   ├── database/                # Base de datos
│   │   └── db.py               # Configuración SQLAlchemy
│   ├── dependencies/            # Dependencias de FastAPI
│   │   ├── checked_role.py     # Verificación de roles
│   │   └── is_auth.py          # Verificación de autenticación
│   ├── middlewares/             # Middlewares
│   │   └── auth_middlewares.py
│   ├── models/                  # Modelos SQLAlchemy
│   │   ├── Users.py
│   │   ├── Roles.py
│   │   ├── Persons.py
│   │   ├── Record.py
│   │   ├── Files.py
│   │   ├── Logs.py
│   │   ├── Recortds_Persons.py
│   │   ├── Connection_Type.py
│   │   └── schemas/            # Esquemas Pydantic
│   │       ├── user_schema.py
│   │       ├── person_schemas.py
│   │       ├── record_schema.py
│   │       ├── file_schemas.py
│   │       └── token_schemas.py
│   ├── services/                # Lógica de negocio
│   │   ├── users_services.py
│   │   ├── persons_services.py
│   │   ├── records_services.py
│   │   ├── files_services.py
│   │   ├── logs_services.py
│   │   └── roles_services.py
│   ├── utils/                   # Utilidades
│   │   ├── create_admin.py     # Crear usuario admin
│   │   ├── create_roles.py     # Crear roles iniciales
│   │   ├── hash_pass.py        # Encriptación de contraseñas
│   │   ├── jwt.py              # Manejo de JWT
│   │   ├── file_encryption.py  # Encriptación de archivos
│   │   └── json_encoder.py     # Codificador JSON
│   ├── storage/                 # Almacenamiento de archivos
│   │   ├── documents/          # PDFs encriptados
│   │   ├── images/             # Imágenes encriptadas
│   │   └── temp/               # Archivos temporales
│   ├── main.py                 # Punto de entrada
│   ├── requirements.txt        # Dependencias Python
│   └── .env                    # Variables de entorno
│
└── README.md
```

### Flujo de Datos

```
Cliente (Next.js) 
    ↓
    ↓ HTTP/REST
    ↓
Middleware CORS
    ↓
Auth Middleware (JWT)
    ↓
Role Verification
    ↓
Controllers (FastAPI)
    ↓
Services (Lógica de negocio)
    ↓
Models (SQLAlchemy)
    ↓
Base de Datos (PostgreSQL/MySQL)
```

---

## 🔧 Backend - FastAPI

### Configuración Inicial

#### 1. Variables de Entorno (.env)

```env
# Base de datos
DATABASE_URL="postgresql+psycopg2://usuario:password@localhost:5432/sgap"
# o para MySQL:
DATABASE_URL="mysql+pymysql://usuario:password@localhost:3306/sga_db"

# Seguridad
SECRET_KEY="tu_clave_secreta_aqui"
HASH_ALGORITHM="HS256"
TOKEN_EXPIRATION_MINUTES=2000

# Usuario Admin
PASS_ADMIN="admin1234"

# Encriptación de archivos
FILE_ENCRYPTION_KEY="SGA_DEFAULT_MASTER_KEY_2025"
```

#### 2. Inicialización de la Aplicación (main.py)

```python
# Evento de inicio
@app.on_event("startup")
async def startup_event():
    # 1. Configurar mappers de SQLAlchemy
    configure_mappers()
    
    # 2. Crear tablas en la base de datos
    init_database()
    
    # 3. Crear roles (ADMIN, MODERATE, USERS, VIEW)
    create_roles()
    
    # 4. Crear usuario administrador
    create_admin()
```

### Modelos de Base de Datos

#### Users (Usuarios del Sistema)

```python
class Users(Base):
    __tablename__ = "users"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    names = Column(String(100), nullable=False)
    lastname = Column(String(50), nullable=False)
    username = Column(String(50), nullable=False, unique=True)
    passwd = Column(String(100), nullable=False)  # Encriptada con bcrypt
    create_at = Column(DateTime, default=datetime.utcnow)
    update_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    role_id = Column(UUID, ForeignKey("roles.id"))
    
    # Relaciones
    roles = relationship("Roles", back_populates="users")
    persons = relationship("Persons", back_populates="users")
    logs = relationship("Logs", back_populates="user")
```

**Campos importantes:**
- `id`: UUID único del usuario
- `username`: Único, usado para login
- `passwd`: Contraseña hasheada con bcrypt
- `role_id`: Referencia al rol del usuario
- `last_login`: Timestamp del último inicio de sesión

#### Roles

```python
class Roles(Base):
    __tablename__ = "roles"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(10), nullable=False)
    
    users = relationship("Users", back_populates="roles")
```

**Roles disponibles:**
- `ADMIN`: Acceso total al sistema
- `MODERATE`: Puede moderar y consultar
- `USERS`: Puede crear y consultar
- `VIEW`: Solo visualización (read-only)

#### Persons (Personas)

```python
class Persons(Base):
    __tablename__ = "persons"
    
    person_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    identification = Column(String(50), unique=True)
    identification_type = Column(String(50), nullable=False)
    names = Column(String(50), nullable=False)
    lastnames = Column(String(50))
    address = Column(String(255))
    province = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)
    observations = Column(Text)
    created_by = Column(UUID, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    users = relationship("Users", back_populates="persons")
    record_relationships = relationship("RecordsPersons", back_populates="person")
    files = relationship("Files", back_populates="person")
    connections_as_person = relationship("ConnectionType", foreign_keys=[person_id])
    connections_as_connection = relationship("ConnectionType", foreign_keys=[connection])
```

**Características:**
- Identificación única opcional
- Soporte para conexiones entre personas
- Auditoría de creación y modificación
- Relación con archivos y antecedentes

#### Records (Antecedentes)

```python
class Records(Base):
    __tablename__ = "records"
    
    record_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    type_record = Column(String(55), nullable=False)
    content = Column(Text, nullable=False)
    observations = Column(Text)
    create_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    person_relationships = relationship("RecordsPersons", back_populates="record")
    files = relationship("Files", back_populates="record")
```

**Tipos de antecedentes:**
- Penales
- Laborales
- Académicos
- Otros (personalizable)

#### Files (Archivos Encriptados)

```python
class Files(Base):
    __tablename__ = "files"
    
    file_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    original_filename = Column(String(255), nullable=False)
    encrypted_filename = Column(String(255), nullable=False, unique=True)
    file_type = Column(String(10), nullable=False)  # pdf, image
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    # Metadatos de encriptación
    encryption_key_hash = Column(String(255), nullable=False)
    encryption_salt = Column(String(255), nullable=False)
    
    # Metadatos adicionales
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    person_id = Column(UUID, ForeignKey("persons.person_id"), nullable=False)
    record_id = Column(UUID, ForeignKey("records.record_id"))
    uploaded_by = Column(UUID, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
```

**Seguridad de archivos:**
- Encriptación con Fernet (AES-128)
- Salt único por archivo
- Hash de clave para verificación
- Nombres encriptados en disco
- Eliminación lógica (soft delete)

#### Logs (Auditoría)

```python
class Logs(Base):
    __tablename__ = "logs"
    
    log_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN
    entity_type = Column(String(50), nullable=False)  # USER, PERSON, RECORD
    entity_id = Column(String(36))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50))
    
    user = relationship("Users", back_populates="logs")
```

**Acciones registradas:**
- `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `CREATE` / `UPDATE` / `DELETE`
- Entidades: USER, PERSON, RECORD, FILE

#### RecordsPersons (Tabla de Relación)

```python
class RecordsPersons(Base):
    __tablename__ = "records_persons"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    person_id = Column(UUID, ForeignKey("persons.person_id"), nullable=False)
    record_id = Column(UUID, ForeignKey("records.record_id"), nullable=False)
    type_relationship = Column(String(50), nullable=False)  # autor, victima, testigo
    
    person = relationship("Persons", back_populates="record_relationships")
    record = relationship("Records", back_populates="person_relationships")
```

#### ConnectionType (Relaciones entre Personas)

```python
class ConnectionType(Base):
    __tablename__ = "connection_type"
    
    connection_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    person_id = Column(UUID, ForeignKey("persons.person_id"))
    connection = Column(UUID, ForeignKey("persons.person_id"))
    connection_type = Column(String(50), nullable=False)  # familiar, socio, conocido
    
    person = relationship("Persons", foreign_keys=[person_id])
    connection_person = relationship("Persons", foreign_keys=[connection])
```

### Sistema de Autenticación y Autorización

#### 1. Login (auth_controllers.py)

```python
@auth_router.post("/login")
async def login(request: Request, formdata: OAuth2PasswordRequestForm):
    # 1. Validar credenciales
    user = user_service.login(formdata.username, formdata.password, db)
    
    # 2. Generar JWT token
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": str(user.id),
        },
        expires_delta=timedelta(minutes=token_expires_minutes)
    )
    
    # 3. Registrar log de login
    # 4. Retornar token y datos de usuario
```

**Flujo de autenticación:**
1. Usuario envía credenciales (username, password)
2. Sistema verifica contraseña con bcrypt
3. Genera JWT token con datos del usuario
4. Actualiza `last_login`
5. Registra evento en logs
6. Retorna token + datos del usuario

#### 2. Verificación de Autenticación (is_auth.py)

```python
async def is_autenticate(token: str):
    # 1. Decodificar JWT token
    payload = jwt.decode(token, secret_key, algorithms=[hash_algorithm])
    
    # 2. Extraer username y user_id
    username = payload.get("sub")
    user_id = payload.get("user_id")
    
    # 3. Verificar que el usuario existe
    user = db.query(Users).filter(Users.username == username).first()
    
    # 4. Retornar datos del usuario
    return {
        "id": user.id,
        "username": user.username,
        "role": user.roles,
        "role_id": str(user.roles.id),
        "role_name": user.roles.name
    }
```

**Uso en endpoints:**
```python
@router.get("/persons")
def get_persons(current_user: Dict = Depends(is_authenticated)):
    # current_user contiene los datos del usuario autenticado
```

#### 3. Verificación de Roles (checked_role.py)

**Funciones disponibles:**

```python
# Solo ADMIN
check_rol_admin(token) -> bool

# ADMIN o MODERATE
check_rol_moderate_or_admin(token) -> bool

# ADMIN, MODERATE o USERS
check_rol_all(token) -> bool

# ADMIN, MODERATE, USERS o VIEW
check_rol_all_or_viewer(token) -> bool

# Solo VIEW
check_rol_viewer(token) -> bool
```

**Uso en endpoints:**
```python
@router.post("/users/create")
def create_user(
    body: UserSchema,
    current_user: Dict = Depends(is_authenticated),
    is_authorized: bool = Depends(check_rol_admin)
):
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Acceso denegado")
```

### Sistema de Encriptación de Archivos

#### FileEncryption (utils/file_encryption.py)

**Características:**
- Encriptación AES-128 mediante Fernet
- Salt único por archivo
- Derivación de clave con PBKDF2-HMAC-SHA256
- 100,000 iteraciones para mayor seguridad

**Métodos principales:**

```python
# Encriptar archivo
encrypted_data, encrypted_filename, salt, key_hash = FileEncryption.encrypt_file(
    file_data=bytes,
    original_filename=str
)

# Desencriptar archivo
decrypted_data = FileEncryption.decrypt_file(
    encrypted_data=bytes,
    salt=str,
    key_hash=str
)

# Desde disco
decrypted_data = FileEncryption.decrypt_file_from_disk(
    file_path=str,
    salt=str,
    key_hash=str
)
```

**Validación de archivos:**

```python
class FileValidator:
    ALLOWED_MIME_TYPES = {
        'pdf': ['application/pdf'],
        'image': ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
    }
    
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    @staticmethod
    def validate_file_type(filename: str, mime_type: str) -> str:
        # Retorna 'pdf' o 'image'
    
    @staticmethod
    def validate_file_size(file_size: int) -> bool:
        # Valida tamaño máximo
```

### Servicios (Lógica de Negocio)

#### UserService (services/users_services.py)

```python
class UserService:
    def login(self, username: str, password: str, db: Session):
        # Autenticar usuario
        
    def create_user(self, names, lastname, username, passwd, role, db):
        # Crear nuevo usuario
        
    def get_users(self, db: Session):
        # Obtener todos los usuarios
        
    def get_user(self, id: UUID, db: Session):
        # Obtener usuario por ID
        
    def edit_user(self, id, names, lastname, username, passwd, role, db):
        # Actualizar usuario
        
    def delete_user(self, id, db):
        # Eliminar usuario
```

#### PersonsService (services/persons_services.py)

```python
class PersonsService:
    def get_persons(self, db: Session):
        # Obtener personas (últimas 10)
        
    def get_person(self, person_id: str, db: Session):
        # Obtener persona por ID
        
    def create_person(self, identification, names, lastnames, ..., db):
        # Crear nueva persona
        
    def update_person(self, person_id, ..., db):
        # Actualizar persona
        
    def delete_person(self, person_id, db):
        # Eliminar persona
        
    def search_person(self, db, names=None, lastname=None, identification=None, ...):
        # Búsqueda avanzada
        
    def search_person_by_dni(self, dni, db):
        # Búsqueda por DNI
        
    def add_record(self, person_id, record_id, type_relationship, db):
        # Vincular antecedente
        
    def add_person_connection(self, person_id, person_to_connect, connection_type, db):
        # Vincular personas
        
    def get_linked_persons(self, person_id, db):
        # Obtener personas vinculadas
        
    def get_person_records(self, person_id, db):
        # Obtener antecedentes de una persona
```

#### FilesService (services/files_services.py)

```python
class FilesService:
    def upload_file(self, file_stream, original_filename, file_size, mime_type, 
                    person_id, uploaded_by, record_id=None, description=None, db):
        # Subir y encriptar archivo
        
    def download_file(self, file_id, db):
        # Descargar y desencriptar archivo
        
    def get_file_by_id(self, file_id, db):
        # Obtener información del archivo
        
    def get_files_by_person(self, person_id, db):
        # Archivos de una persona
        
    def get_files_by_record(self, record_id, db):
        # Archivos de un antecedente
        
    def update_file_metadata(self, file_id, description, db):
        # Actualizar metadatos
        
    def delete_file(self, file_id, db):
        # Eliminación lógica
        
    def permanently_delete_file(self, file_id, db):
        # Eliminación física
        
    def get_file_stats(self, db):
        # Estadísticas de archivos
```

---

## 🌐 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/login` | Iniciar sesión | Público |

**Request:**
```json
{
  "username": "admin",
  "password": "admin1234"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "admin",
    "names": "Administrador",
    "lastname": "Sistema",
    "role_name": "ADMIN"
  }
}
```

### Usuarios

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/users` | Listar usuarios | ADMIN, MODERATE |
| GET | `/users/{id}` | Obtener usuario | ADMIN, MODERATE |
| POST | `/users/create` | Crear usuario | ADMIN |
| PUT | `/users/{id}` | Actualizar usuario | ADMIN, MODERATE |
| DELETE | `/users/{id}` | Eliminar usuario | ADMIN |

**Crear usuario:**
```json
POST /users/create
{
  "names": "Juan",
  "lastname": "Pérez",
  "username": "jperez",
  "passwd": "password123",
  "confirm_passwd": "password123",
  "role_id": "uuid-del-rol"
}
```

### Roles

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/roles` | Listar roles | Todos autenticados |
| GET | `/roles/{id}` | Obtener rol | Todos autenticados |

### Personas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/persons` | Listar personas (últimas 10) | ADMIN, MODERATE, USERS |
| GET | `/persons/{id}` | Obtener persona | ADMIN, MODERATE, USERS, VIEW |
| POST | `/persons/create` | Crear persona | ADMIN |
| PATCH | `/persons/update/{id}` | Actualizar persona | ADMIN, MODERATE, USERS |
| DELETE | `/persons/delete/{id}` | Eliminar persona | ADMIN, MODERATE, USERS |
| GET | `/persons/search/person/` | Búsqueda avanzada | ADMIN, MODERATE, USERS, VIEW |
| POST | `/persons/search-dni/{identification}` | Buscar por DNI | ADMIN, MODERATE, USERS, VIEW |
| GET | `/persons/load-csv/` | Cargar desde CSV | ADMIN |

**Crear persona:**
```json
POST /persons/create
{
  "identification": "12345678",
  "identification_type": "DNI",
  "names": "María",
  "lastnames": "González",
  "address": "Calle Falsa 123",
  "province": "Buenos Aires",
  "country": "Argentina",
  "observations": "Notas adicionales"
}
```

**Búsqueda avanzada:**
```
GET /persons/search/person/?names=María&lastname=González&identification=12345678
```

### Antecedentes (Records)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/records` | Listar antecedentes | ADMIN, MODERATE, USERS, VIEW |
| GET | `/records/{id}` | Obtener antecedente | ADMIN, MODERATE, USERS, VIEW |
| POST | `/records/create` | Crear antecedente | ADMIN, MODERATE, USERS |
| PUT | `/records/{id}` | Actualizar antecedente | ADMIN, MODERATE, USERS |
| DELETE | `/records/{id}` | Eliminar antecedente | ADMIN |

**Crear antecedente:**
```json
POST /records/create
{
  "title": "Antecedente Penal",
  "date": "2024-01-15",
  "type_record": "Penal",
  "content": "Descripción detallada del antecedente",
  "observations": "Observaciones adicionales"
}
```

### Relaciones Persona-Antecedente

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| PATCH | `/persons/{person_id}/record/{record_id}` | Vincular antecedente | ADMIN, MODERATE, USERS |
| GET | `/persons/{person_id}/records` | Antecedentes de persona | ADMIN, MODERATE, USERS, VIEW |
| DELETE | `/persons/{person_id}/record/{record_id}` | Desvincular antecedente | ADMIN, MODERATE, USERS |

**Vincular antecedente:**
```
PATCH /persons/{person_id}/record/{record_id}?type_relationship=autor
```

Tipos de relación: `autor`, `victima`, `testigo`, `sospechoso`

### Conexiones entre Personas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| PATCH | `/persons/linked-person/{person_id}/{person_to_connect}` | Conectar personas | ADMIN, MODERATE, USERS |
| GET | `/persons/{person_id}/linked` | Personas vinculadas | ADMIN, MODERATE, USERS, VIEW |
| DELETE | `/persons/{person_id}/connection/{person_to_disconnect}` | Desconectar personas | ADMIN, MODERATE, USERS |

**Conectar personas:**
```
PATCH /persons/linked-person/{person_id}/{person_to_connect}?connection_type=familiar
```

Tipos de conexión: `familiar`, `socio`, `conocido`, `pareja`, `amigo`

### Archivos

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/files/upload` | Subir archivo | ADMIN, MODERATE, USERS |
| GET | `/files/{file_id}` | Info del archivo | ADMIN, MODERATE, USERS |
| GET | `/files/{file_id}/download` | Descargar archivo | ADMIN, MODERATE, USERS |
| GET | `/files/person/{person_id}` | Archivos de persona | ADMIN, MODERATE, USERS |
| GET | `/files/record/{record_id}` | Archivos de antecedente | ADMIN, MODERATE, USERS |
| PUT | `/files/{file_id}` | Actualizar metadatos | ADMIN, MODERATE, USERS |
| DELETE | `/files/{file_id}` | Eliminar (lógico) | ADMIN, MODERATE, USERS |
| DELETE | `/files/{file_id}/permanent` | Eliminar (físico) | ADMIN |
| GET | `/files/stats/summary` | Estadísticas | ADMIN, MODERATE, USERS |
| GET | `/files` | Listar archivos | Todos autenticados |

**Subir archivo (multipart/form-data):**
```
POST /files/upload
Content-Type: multipart/form-data

file: [archivo binario]
person_id: "uuid-persona"
record_id: "uuid-antecedente" (opcional)
description: "Descripción del archivo" (opcional)
```

### Logs (Auditoría)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/logs` | Listar logs | ADMIN |
| GET | `/logs/{id}` | Obtener log | ADMIN |
| GET | `/logs/user/{user_id}` | Logs de usuario | ADMIN |
| GET | `/logs/entity/{entity_type}/{entity_id}` | Logs de entidad | ADMIN |

---

## 💻 Frontend - Next.js

### Estructura de Servicios

#### authService.js
```javascript
export const authService = {
  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(credentials)
    });
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Verificar autenticación
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
```

#### personService.js
```javascript
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const personService = {
  // Obtener personas
  getPersons: async () => {
    const response = await fetch(`${API_URL}/persons`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
  
  // Buscar persona
  searchPerson: async (params) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_URL}/persons/search/person/?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
  
  // Crear persona
  createPerson: async (personData) => {
    const response = await fetch(`${API_URL}/persons/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(personData)
    });
    return response.json();
  }
};
```

#### fileService.js (ejemplo de implementación)
```javascript
export const fileService = {
  // Subir archivo
  uploadFile: async (file, personId, recordId = null, description = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('person_id', personId);
    if (recordId) formData.append('record_id', recordId);
    if (description) formData.append('description', description);
    
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    return response.json();
  },
  
  // Descargar archivo
  downloadFile: async (fileId) => {
    const response = await fetch(`${API_URL}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'archivo';
    a.click();
  }
};
```

### Configuración de Next.js

#### next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
};

export default nextConfig;
```

### Componentes Comunes

#### Protected Route (ejemplo)
```javascript
// components/ProtectedRoute.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function ProtectedRoute({ children, requiredRole }) {
  const router = useRouter();
  
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/');
    }
    
    // Verificar rol si es necesario
    if (requiredRole) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role_name !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, []);
  
  return children;
}
```

---

## 🗄️ Base de Datos

### Diagrama de Relaciones

```
Users ──┬──> Roles
        │
        ├──> Persons (created_by)
        │
        ├──> Files (uploaded_by)
        │
        └──> Logs

Persons ──┬──> RecordsPersons ──> Records
          │
          ├──> Files
          │
          └──> ConnectionType (self-referencing)

Records ──┬──> RecordsPersons
          │
          └──> Files
```

### Índices Recomendados

```sql
-- Usuarios
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_id ON users(role_id);

-- Personas
CREATE INDEX idx_persons_identification ON persons(identification);
CREATE INDEX idx_persons_names ON persons(names);
CREATE INDEX idx_persons_created_by ON persons(created_by);

-- Antecedentes
CREATE INDEX idx_records_date ON records(date);
CREATE INDEX idx_records_type ON records(type_record);

-- Archivos
CREATE INDEX idx_files_person_id ON files(person_id);
CREATE INDEX idx_files_record_id ON files(record_id);
CREATE INDEX idx_files_is_active ON files(is_active);

-- Logs
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_entity_type ON logs(entity_type);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

### Migraciones

Para crear la base de datos desde cero:

```bash
# PostgreSQL
createdb sgap
psql sgap < schema.sql

# MySQL
mysql -u root -p
CREATE DATABASE sga_db;
```

El sistema crea automáticamente las tablas al iniciar:
```python
# En main.py
init_database()  # Crea todas las tablas
```

---

## 🔐 Sistema de Seguridad

### Niveles de Seguridad

#### 1. Autenticación
- **JWT Tokens**: Firma con HS256
- **Expiración configurable**: 2000 minutos por defecto
- **Bcrypt**: Hash de contraseñas con salt automático

#### 2. Autorización (RBAC)
- **ADMIN**: Acceso total
- **MODERATE**: Gestión y moderación
- **USERS**: Operaciones CRUD básicas
- **VIEW**: Solo lectura

#### 3. Encriptación de Datos
- **Contraseñas**: Bcrypt con salt
- **Archivos**: Fernet (AES-128) con salt único
- **JWT**: Firma HMAC-SHA256

#### 4. Auditoría
- Todos los eventos críticos se registran en `logs`
- IP del cliente
- Timestamp
- Usuario responsable
- Tipo de acción

### Mejores Prácticas Implementadas

✅ **Validación de entrada**: Pydantic schemas  
✅ **Prevención de SQL Injection**: SQLAlchemy ORM  
✅ **CORS configurado**: Middleware  
✅ **Tokens expirados**: Verificación automática  
✅ **Soft delete**: Eliminación lógica de archivos  
✅ **Sanitización**: Validación de tipos MIME  

### Configuración de Seguridad Recomendada

```env
# Producción
SECRET_KEY="clave-aleatoria-segura-de-32-caracteres-minimo"
TOKEN_EXPIRATION_MINUTES=60
FILE_ENCRYPTION_KEY="clave-maestra-aleatoria-segura"
HASH_ALGORITHM="HS256"

# Cambiar contraseña admin por defecto
PASS_ADMIN="contraseña-segura-personalizada"
```

---

## 🛠️ Guía de Desarrollo

### Setup del Proyecto

#### Backend

```bash
# 1. Clonar repositorio
git clone <url-repositorio>
cd SGA/server

# 2. Crear entorno virtual
python -m venv .venv

# 3. Activar entorno
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Configurar .env
cp .ENVEXAMPLE .env
# Editar .env con tus credenciales

# 6. Ejecutar
uvicorn main:app --reload
```

#### Frontend

```bash
# 1. Ir al directorio del cliente
cd SGA/client

# 2. Instalar dependencias
npm install

# 3. Ejecutar en desarrollo
npm run dev

# 4. Build para producción
npm run build
npm start
```

### Agregar Nuevos Endpoints

#### 1. Crear Modelo (models/MiModelo.py)
```python
from sqlalchemy import Column, String
from database.db import Base
from sqlalchemy.types import UUID
import uuid

class MiModelo(Base):
    __tablename__ = "mi_tabla"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
```

#### 2. Crear Schema (models/schemas/mi_schema.py)
```python
from pydantic import BaseModel
from typing import Optional

class MiSchema(BaseModel):
    nombre: str
    
class MiResponse(BaseModel):
    id: str
    nombre: str
    
    class Config:
        from_attributes = True
```

#### 3. Crear Servicio (services/mi_service.py)
```python
from models.MiModelo import MiModelo
from sqlalchemy.orm import Session

class MiService:
    def __init__(self):
        self.modelo = MiModelo
    
    def crear(self, nombre: str, db: Session):
        nuevo = self.modelo(nombre=nombre)
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo
```

#### 4. Crear Controller (controllers/mi_controller.py)
```python
from fastapi import APIRouter, Depends, HTTPException
from services.mi_service import MiService
from models.schemas.mi_schema import MiSchema, MiResponse
from database.db import SessionLocal
from dependencies.is_auth import is_authenticated
from dependencies.checked_role import check_rol_admin

router = APIRouter(tags=["MiRecurso"], prefix="/mi-recurso")
servicio = MiService()

@router.post("/crear", response_model=MiResponse)
def crear(
    body: MiSchema,
    current_user = Depends(is_authenticated),
    is_authorized = Depends(check_rol_admin)
):
    if not is_authorized:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    db = SessionLocal()
    try:
        resultado = servicio.crear(body.nombre, db)
        return resultado
    finally:
        db.close()
```

#### 5. Registrar en main.py
```python
from controllers.mi_controller import router as mi_router

app.include_router(mi_router)
```

### Testing

#### Pruebas Manuales con Swagger
1. Acceder a `http://localhost:8000/docs`
2. Probar endpoint `/login`
3. Copiar el token generado
4. Hacer clic en "Authorize" (arriba a la derecha)
5. Pegar token en formato: `Bearer <token>`
6. Probar los demás endpoints

#### Pruebas con Postman/Thunder Client

**1. Login:**
```
POST http://localhost:8000/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin1234
```

**2. Usar token:**
```
GET http://localhost:8000/persons
Authorization: Bearer <token>
```

### Manejo de Errores

#### Errores Comunes y Soluciones

**Error: "could not translate host name"**
- Verificar DATABASE_URL en .env
- Comprobar que PostgreSQL/MySQL esté ejecutándose

**Error: "Token inválido o expirado"**
- Token expirado, hacer login nuevamente
- Verificar SECRET_KEY en .env

**Error: "No tienes permiso"**
- Verificar rol del usuario
- Comprobar dependencia de rol en el endpoint

**Error: "Archivo no encontrado"**
- Verificar que la carpeta `storage/` exista
- Comprobar permisos de escritura

### Logs y Debugging

```python
# Activar logs de SQLAlchemy
engine = create_engine(database_url, echo=True)

# Logging personalizado
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("Mensaje de debug")
```

---

## 🔍 Troubleshooting

### Problemas Comunes

#### Backend no inicia
```bash
# Verificar dependencias
pip list

# Reinstalar
pip install -r requirements.txt

# Verificar puerto
netstat -ano | findstr :8000
```

#### Error de base de datos
```bash
# PostgreSQL
sudo service postgresql status
sudo service postgresql start

# MySQL
sudo service mysql status
sudo service mysql start

# Verificar conexión
psql -U usuario -d sgap
mysql -u usuario -p
```

#### CORS Error en Frontend
```python
# En main.py, verificar:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Archivos no se encriptan/desencriptan
```bash
# Verificar variable de entorno
echo $FILE_ENCRYPTION_KEY

# Verificar permisos de carpeta
ls -la storage/
chmod -R 755 storage/
```

### Comandos Útiles

```bash
# Ver logs del servidor
uvicorn main:app --reload --log-level debug

# Limpiar __pycache__
find . -type d -name __pycache__ -exec rm -r {} +

# Resetear base de datos
python
>>> from database.db import engine, Base
>>> Base.metadata.drop_all(bind=engine)
>>> Base.metadata.create_all(bind=engine)

# Crear usuario admin manualmente
python
>>> from utils.create_admin import create_admin
>>> create_admin()
```

---

## 📊 Estadísticas del Proyecto

### Tecnologías Utilizadas

**Backend:**
- FastAPI (Framework web)
- SQLAlchemy (ORM)
- Pydantic (Validación)
- Passlib + Bcrypt (Seguridad)
- PyJWT (Autenticación)
- Cryptography (Encriptación)
- Uvicorn (Servidor ASGI)

**Frontend:**
- Next.js 15.5.4
- React 19.1.0
- React Bootstrap
- React Icons
- React Toastify

### Líneas de Código (Aproximado)

- Backend: ~3000 líneas
- Frontend: ~1500 líneas
- Total: ~4500 líneas

### Modelos de Datos: 7
- Users
- Roles
- Persons
- Records
- Files
- Logs
- RecordsPersons
- ConnectionType

### Endpoints API: 50+

---

## 🚀 Roadmap Futuro

### Funcionalidades Pendientes
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Reportes en PDF
- [ ] Exportación de datos (CSV, Excel)
- [ ] Dashboard con gráficos
- [ ] Búsqueda avanzada con filtros combinados
- [ ] Historial de cambios (versionado)
- [ ] API de integración con servicios externos
- [ ] App móvil (React Native)
- [ ] Sistema de backup automático
- [ ] Recuperación de contraseña por email

### Mejoras de Seguridad
- [ ] 2FA (Autenticación de dos factores)
- [ ] Rate limiting
- [ ] Blacklist de tokens
- [ ] Encriptación de base de datos (TDE)
- [ ] Certificados SSL/TLS

---

## 📝 Notas para Desarrolladores

### Convenciones de Código

**Python (Backend):**
- PEP 8 para estilo de código
- Snake_case para variables y funciones
- PascalCase para clases
- Docstrings en funciones importantes

**JavaScript (Frontend):**
- CamelCase para variables y funciones
- PascalCase para componentes
- Comentarios para lógica compleja

### Git Workflow

```bash
# Crear rama para feature
git checkout -b feature/nombre-feature

# Commits descriptivos
git commit -m "Add: Endpoint para búsqueda de personas"
git commit -m "Fix: Error en encriptación de archivos"
git commit -m "Update: Mejorar validación de roles"

# Push y pull request
git push origin feature/nombre-feature
```

### Estructura de Commits

- `Add:` Nueva funcionalidad
- `Fix:` Corrección de bugs
- `Update:` Mejora de funcionalidad existente
- `Refactor:` Refactorización de código
- `Docs:` Cambios en documentación

---

## 📞 Soporte y Contacto

### Recursos

- **Documentación FastAPI**: https://fastapi.tiangolo.com/
- **Documentación Next.js**: https://nextjs.org/docs
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **React Bootstrap**: https://react-bootstrap.github.io/

### Autor

**Gabriel Acosta**
- GitHub: [gabykap29](https://github.com/gabykap29)

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0
