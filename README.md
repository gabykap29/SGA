# SGAP - Sistema de Gestión de Antecedentes de Personas

Sistema de gestión de antecedentes personales desarrollado con FastAPI y PostgreSQL para el registro y seguimiento de historiales de personas.

## 📋 Descripción

SGAP es una API REST para la gestión de antecedentes de personas que incluye:
- Registro y gestión de usuarios del sistema
- Sistema de roles y permisos (ADMIN, MODERATE, USERS)
- Gestión de antecedentes personales
- Control de acceso y seguridad
- Creación automática de usuario administrador
- Encriptación de contraseñas con bcrypt

## 🚀 Tecnologías

- **Backend**: FastAPI
- **Base de Datos**: PostgreSQL
- **ORM**: SQLAlchemy
- **Autenticación**: Passlib (bcrypt)
- **Validación**: Pydantic
- **Variables de Entorno**: python-dotenv

## 📁 Estructura del Proyecto

```
server/
├── config/              # Configuración de la aplicación
│   └── config.py
├── controllers/         # Controladores de rutas
│   └── user_controllers.py
├── database/           # Configuración de base de datos
│   └── db.py
├── models/             # Modelos de SQLAlchemy
│   ├── Users.py        # Usuarios del sistema
│   ├── Roles.py        # Roles y permisos
│   └── schemas/        # Esquemas de Pydantic
│       └── user_schema.py
├── services/           # Lógica de negocio
│   ├── users_services.py
│   └── roles_services.py
├── utils/              # Utilidades
│   ├── hash_pass.py
│   └── create_admin.py
├── .env               # Variables de entorno
└── main.py           # Punto de entrada de la aplicación
```

## ⚙️ Instalación

### Prerrequisitos

- Python 3.8+
- PostgreSQL
- pip

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd SGAP
```

### 2. Crear entorno virtual

```bash
cd server
python -m venv env
```

### 3. Activar entorno virtual

**Windows:**
```bash
env\Scripts\activate
```

**Linux/Mac:**
```bash
source env/bin/activate
```

### 4. Instalar dependencias

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary passlib[bcrypt] python-dotenv
```

### 5. Configurar variables de entorno

Crear archivo `.env` en la carpeta `server/`:

```env
DATABASE_URL="postgresql+psycopg2://usuario:password@localhost:5432/nombre_db"
PASS_ADMIN="admin1234"
```

### 6. Configurar Base de Datos

1. Crear base de datos PostgreSQL llamada "sgap"
2. Las tablas se crearán automáticamente al iniciar la aplicación
3. El sistema creará automáticamente los roles y usuario administrador

## 🏃‍♂️ Ejecución

### Modo Desarrollo

```bash
cd server
uvicorn main:app --reload
```

La API estará disponible en: `http://localhost:8000`

### Documentación Automática

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 📊 Modelos de Datos

### Usuario del Sistema (Users)
```python
{
    "id": "uuid",
    "names": "string",          # Nombres del usuario
    "lastname": "string",       # Apellidos del usuario
    "username": "string",       # Nombre de usuario único
    "passwd": "string",         # Contraseña encriptada
    "create_at": "datetime",    # Fecha de creación
    "update_at": "datetime",    # Fecha de actualización
    "last_login": "datetime",   # Último acceso
    "role_id": "uuid"          # Referencia al rol
}
```

### Rol (Roles)
```python
{
    "id": "uuid",
    "name": "string"           # ADMIN, MODERATE, USERS
}
```

## 🛠️ API Endpoints

### Gestión de Usuarios del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users` | Obtener todos los usuarios del sistema |
| GET | `/users/{id}` | Obtener usuario específico por ID |
| POST | `/users/create` | Crear nuevo usuario del sistema |
| PUT | `/users/{id}` | Actualizar datos de usuario |
| DELETE | `/users/{id}` | Eliminar usuario del sistema |

### Ejemplo de uso

**Crear Usuario del Sistema:**
```json
POST /users/create
{
    "names": "María",
    "lastname": "González",
    "username": "mgonzalez",
    "passwd": "password123",
    "confirm_passwd": "password123",
    "role_id": "1"
}
```

## 🔒 Características de Seguridad

- **Encriptación de contraseñas**: Utiliza bcrypt para hash seguro
- **Validación de contraseñas**: Confirmación de contraseña en registro
- **Usuarios únicos**: Username único por usuario
- **Control de acceso**: Sistema de permisos basado en roles
- **Auditoría**: Registro de timestamps de actividad

## 🎯 Funcionalidades del Sistema

### 1. Gestión de Usuarios del Sistema
- Registro de usuarios operadores
- Control de acceso y permisos
- Usuario administrador automático

### 2. Sistema de Roles y Permisos
- **ADMIN**: Acceso completo al sistema y gestión de antecedentes
- **MODERATE**: Permisos de moderación y consulta de antecedentes
- **USERS**: Consulta básica de antecedentes

### 3. Base para Gestión de Antecedentes
- Estructura preparada para registro de personas
- Sistema de auditoría integrado
- Control de modificaciones y accesos

## 🚧 Próximas Funcionalidades - Módulo de Antecedentes

- [ ] **Registro de Personas**: Datos personales, documentos de identidad
- [ ] **Antecedentes Penales**: Historial judicial y delitos
- [ ] **Antecedentes Laborales**: Historial de empleos y referencias
- [ ] **Antecedentes Académicos**: Títulos, certificaciones y estudios
- [ ] **Búsqueda Avanzada**: Filtros por tipo de antecedente, fechas, etc.
- [ ] **Reportes**: Generación de informes de antecedentes
- [ ] **Notificaciones**: Alertas de cambios en antecedentes

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/GestionAntecedentes`)
3. Commit tus cambios (`git commit -m 'Add: Módulo de antecedentes penales'`)
4. Push a la rama (`git push origin feature/GestionAntecedentes`)
5. Abre un Pull Request

## 📋 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Gabriel Acosta** - *Desarrollo inicial* - [GitHub](https://github.com/gabykap29)

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación automática en `/docs`
2. Crea un issue en GitHub
3. Verifica que todas las dependencias estén instaladas
4. Confirma que PostgreSQL esté ejecutándose correctamente

## 🔧 Configuración Adicional

### Usuario Administrador por Defecto
- **Usuario**: admin
- **Contraseña**: Configurada en variable de entorno `PASS_ADMIN`
- Se crea automáticamente al iniciar la aplicación por primera vez

### Base de Datos
- El sistema utiliza PostgreSQL como base de datos principal
- Las credenciales se configuran en el archivo `.env`
- Asegúrate de tener una base de datos llamada "sgap" creada

## 📈 Roadmap de Desarrollo

### Fase 1 - Completada ✅
- [x] Sistema de usuarios y roles
- [x] Autenticación básica
- [x] API REST básica

### Fase 2 - En Desarrollo 🚧
- [ ] Módulo de registro de personas
- [ ] Gestión de documentos de identidad
- [ ] Sistema de búsqueda básica

### Fase 3 - Planificada 📅
- [ ] Módulo de antecedentes penales
- [ ] Módulo de antecedentes laborales
- [ ] Sistema de reportes

### Fase 4 - Futuro 🔮
- [ ] Integración con APIs gubernamentales
- [ ] Panel web de administración
- [ ] Aplicación móvil de consulta