# Sistema de Archivos SGA - Documentación Completa

## Resumen del Sistema

El sistema de archivos SGA permite almacenar, gestionar y recuperar archivos de forma segura con encriptación automática. Los archivos están vinculados a personas y opcionalmente a records (antecedentes).

## Arquitectura del Sistema

### 1. Modelo de Datos (Files.py)

```python
class Files(Base):
    file_id: UUID              # ID único del archivo
    original_filename: str     # Nombre original del archivo
    encrypted_filename: str    # Nombre encriptado en el sistema
    file_type: str            # "pdf" o "image"
    file_size: int            # Tamaño en bytes
    mime_type: str            # Tipo MIME del archivo
    encryption_key_hash: str  # Hash de la clave de encriptación
    encryption_salt: str      # Salt para la encriptación
    description: str          # Descripción opcional
    is_active: bool           # Para eliminación lógica
    
    # Relaciones
    person_id: UUID           # ID de la persona (obligatorio)
    record_id: UUID           # ID del record (opcional)
    uploaded_by: UUID         # Usuario que subió el archivo
```

**Decisiones de diseño:**
- **Encriptación obligatoria**: Todos los archivos se almacenan encriptados
- **Nombres únicos**: Se genera un nombre UUID único para evitar conflictos
- **Metadatos separados**: La información del archivo se guarda en BD, el contenido encriptado en disco
- **Eliminación lógica**: Los archivos se marcan como inactivos en lugar de eliminarse

### 2. Relaciones de Base de Datos

```
Persons (1) --> (N) Files
Records (1) --> (N) Files  [Opcional]
Users (1) --> (N) Files   [Como uploader]
```

**Integridad referencial:**
- Un archivo DEBE pertenecer a una persona
- Un archivo PUEDE estar asociado a un record
- Un archivo DEBE tener un usuario que lo subió
- Si se elimina una persona, sus archivos se eliminan automáticamente (cascade)

### 3. Encriptación

**Algoritmo**: AES-256 mediante Fernet (cryptography library)

**Proceso de encriptación:**
1. Se genera un salt único por archivo
2. Se deriva una clave usando PBKDF2 con la clave maestra + salt
3. Se encripta el contenido del archivo
4. Se almacena el hash de la clave (no la clave real)

**Ventajas:**
- Cada archivo tiene su propia clave derivada
- No se almacena la clave real en la BD
- Salt único previene ataques de diccionario

### 4. Almacenamiento

**Estructura de directorios:**
```
/storage/
├── documents/     # Archivos PDF
├── images/        # Archivos de imagen
└── temp/          # Archivos temporales
```

**Configuración:**
- Ruta base configurable via variables de entorno
- Máximo 50MB por archivo
- Extensiones permitidas: .pdf, .jpg, .jpeg, .png, .gif, .bmp, .webp

## API Endpoints

### POST /files/upload
Sube un archivo al sistema
- **Input**: FormData con file, person_id, record_id (opcional), description
- **Output**: FileResponse con metadatos del archivo
- **Proceso**: Valida → Encripta → Almacena → Guarda en BD

### GET /files/{file_id}
Obtiene información de un archivo
- **Output**: Metadatos completos del archivo

### GET /files/{file_id}/download
Descarga un archivo
- **Output**: Stream del archivo desencriptado
- **Headers**: Content-Disposition con nombre original

### GET /files/person/{person_id}
Lista archivos de una persona
- **Output**: Lista de archivos de la persona

### GET /files/record/{record_id}
Lista archivos de un record
- **Output**: Lista de archivos del record

### PUT /files/{file_id}
Actualiza metadatos de un archivo
- **Input**: Descripción actualizada
- **Output**: Archivo actualizado

### DELETE /files/{file_id}
Eliminación lógica de un archivo
- **Resultado**: Marca is_active = False

### DELETE /files/{file_id}/permanent
Eliminación física del archivo
- **¡PRECAUCIÓN!**: Elimina el archivo del disco y BD permanentemente

## Seguridad

### 1. Encriptación
- **AES-256**: Algoritmo criptográfico robusto
- **PBKDF2**: 100,000 iteraciones para derivación de claves
- **Salt único**: Previene ataques de diccionario

### 2. Validación
- **Tipos de archivo**: Solo PDF e imágenes permitidos
- **Tamaño máximo**: 50MB por archivo
- **MIME type**: Validación contra extensión de archivo

### 3. Acceso
- **Autenticación requerida**: JWT token para todas las operaciones
- **Autorización**: Solo usuarios autenticados pueden subir/descargar

### 4. Almacenamiento
- **Nombres únicos**: UUID previene acceso directo
- **Directorio protegido**: Archivos fuera del webroot
- **Permisos**: Solo la aplicación puede acceder a los archivos

## Manejo de Errores

### Errores Comunes
- **400 Bad Request**: Archivo inválido, tipo no permitido, tamaño excedido
- **401 Unauthorized**: Token JWT inválido o faltante
- **404 Not Found**: Archivo no encontrado
- **500 Internal Server Error**: Error de encriptación/desencriptación

### Recuperación
- **Rollback automático**: Si falla la subida, se limpia el archivo del disco
- **Validación previa**: Se valida antes de procesar para evitar errores

## Instalación y Configuración

### 1. Dependencias
```bash
pip install cryptography==41.0.7 python-magic==0.4.27 python-multipart==0.0.6
```

### 2. Variables de Entorno
```bash
export FILE_STORAGE_PATH="/path/to/storage"
export SGA_FILE_ENCRYPTION_KEY="your-secret-key-here"
```

### 3. Inicialización
- Los directorios de almacenamiento se crean automáticamente
- Se generan archivos .gitignore para excluir archivos encriptados

## Migración de Base de Datos

Para agregar el sistema de archivos a una BD existente:

```sql
-- Crear tabla files
CREATE TABLE files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename VARCHAR(255) NOT NULL,
    encrypted_filename VARCHAR(255) NOT NULL UNIQUE,
    file_type VARCHAR(10) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    encryption_key_hash VARCHAR(255) NOT NULL,
    encryption_salt VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    record_id UUID REFERENCES records(record_id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_files_person_id ON files(person_id);
CREATE INDEX idx_files_record_id ON files(record_id);
CREATE INDEX idx_files_active ON files(is_active);
```

## Monitoreo y Mantenimiento

### 1. Estadísticas
- **GET /files/stats/summary**: Obtiene estadísticas del sistema
- Métricas: Total archivos, por tipo, tamaño total

### 2. Limpieza
- **Archivos temporales**: Se limpian automáticamente después de 24h
- **Archivos huérfanos**: Implementar script para detectar archivos sin referencia en BD

### 3. Backup
- **Base de datos**: Incluir tabla files en backups regulares
- **Archivos**: Backup del directorio de storage (archivos encriptados)

## Consideraciones de Producción

### 1. Performance
- **Índices**: En person_id, record_id, is_active
- **CDN**: Para archivos grandes, considerar almacenamiento en nube
- **Cache**: Cache de metadatos frecuentemente accedidos

### 2. Escalabilidad
- **Particionamiento**: Por fecha o tipo de archivo
- **Almacenamiento distribuido**: Para volúmenes muy grandes

### 3. Disponibilidad
- **Replicación**: Del directorio de storage
- **Failover**: Múltiples nodos de almacenamiento

## Ejemplos de Uso

### Subir un archivo
```python
import requests

files = {'file': open('documento.pdf', 'rb')}
data = {
    'person_id': '123e4567-e89b-12d3-a456-426614174000',
    'description': 'Documento de identidad'
}
headers = {'Authorization': 'Bearer your-jwt-token'}

response = requests.post('/api/files/upload', files=files, data=data, headers=headers)
```

### Descargar un archivo
```python
response = requests.get('/api/files/123e4567-e89b-12d3-a456-426614174000/download')
with open('downloaded_file.pdf', 'wb') as f:
    f.write(response.content)
```

Este sistema proporciona una solución completa y segura para el manejo de archivos en el sistema SGA, con encriptación automática, integridad referencial y una API RESTful robusta.