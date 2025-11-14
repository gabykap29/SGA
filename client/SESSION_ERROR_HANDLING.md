# Sistema de Manejo de Errores de Sesión Expirada

Este documento explica cómo usar el nuevo sistema de validación y manejo de errores de sesión expirada en el cliente.

## Características

✅ **Detección automática** de tokens inválidos o expirados (errores 401 y 403)
✅ **Modal intuitivo** que notifica al usuario de forma clara
✅ **Redirección automática** a login después de cerrar el modal
✅ **Limpieza de datos** de sesión almacenados
✅ **Integración fácil** con servicios existentes

## Cómo está implementado

### 1. Provider Global (SessionErrorProvider)

El `SessionErrorProvider` es un Context Provider que:
- Se renderiza en el layout raíz (`layout.js`)
- Escucha eventos de error de sesión
- Muestra un modal profesional al usuario
- Maneja la limpieza y redirección

**Ubicación:** `components/providers/SessionErrorProvider.jsx`

### 2. Servicio Base (BaseService)

`BaseService` es una clase base que proporciona métodos HTTP con manejo automático de errores de sesión:

- `get(endpoint, options)` - Petición GET
- `post(endpoint, body, options)` - Petición POST
- `patch(endpoint, body, options)` - Petición PATCH
- `delete(endpoint, options)` - Petición DELETE
- `postFormData(endpoint, formData, options)` - Petición POST con archivos

**Ubicación:** `services/BaseService.js`

### 3. Utilidades de Interceptor (apiInterceptor)

Utilidades adicionales para casos especiales:
- `fetchWithSessionErrorHandling(url, options)` - Fetch wrapper
- `apiGet(url, options)` - GET con manejo de errores
- `apiPost(url, body, options)` - POST con manejo de errores
- `apiPatch(url, body, options)` - PATCH con manejo de errores
- `apiDelete(url, options)` - DELETE con manejo de errores

**Ubicación:** `utils/apiInterceptor.js`

## Cómo usar en servicios existentes

### Opción 1: Heredar de BaseService (Recomendado)

```javascript
import BaseService from './BaseService';

class PersonService extends BaseService {
  constructor() {
    super(); // Usa la URL por defecto
  }

  async createPerson(personData) {
    return this.post('/persons/create', personData);
  }

  async getPersonById(personId) {
    return this.get(`/persons/${personId}`);
  }

  async updatePerson(personId, personData) {
    return this.patch(`/persons/update/${personId}`, personData);
  }

  async deletePerson(personId) {
    return this.delete(`/persons/delete/${personId}`);
  }
}

export default new PersonService();
```

### Opción 2: Usar funciones del interceptor

```javascript
import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiInterceptor';

async function createRecord(recordData) {
  return apiPost('/records/create', recordData);
}

async function getRecords() {
  return apiGet('/records');
}
```

### Opción 3: Usar fetchWithSessionErrorHandling

```javascript
import { fetchWithSessionErrorHandling } from '../utils/apiInterceptor';

async function myFunction() {
  const response = await fetchWithSessionErrorHandling('/some-endpoint', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}
```

## Flujo de manejo de errores

```
Usuario realiza acción (GET, POST, PATCH, DELETE)
    ↓
BaseService/apiInterceptor intercepta la respuesta
    ↓
¿Código 401 o 403 con token?
    ├─ SÍ → Dispara evento 'session-error'
    │         ↓
    │       SessionErrorProvider lo captura
    │         ↓
    │       Muestra modal amigable
    │         ↓
    │       Usuario hace click en "Iniciar Sesión de Nuevo"
    │         ↓
    │       Limpia localStorage y redirige a /login
    │
    └─ NO → Retorna respuesta normal
```

## Ejemplo de uso completo

### 1. Servicio actualizado (personService.js)

```javascript
import BaseService from './BaseService';

class PersonService extends BaseService {
  async createPerson(personData) {
    return this.post('/persons/create', personData);
  }

  async getPersonById(personId) {
    return this.get(`/persons/${personId}`);
  }
}

export default new PersonService();
```

### 2. Componente usando el servicio

```javascript
'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import personService from '@/services/personService';

export default function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleLoadPerson = async (personId) => {
    setLoading(true);
    try {
      const result = await personService.getPersonById(personId);
      
      if (result.success) {
        console.log('Persona:', result.data);
        toast.success('Persona cargada correctamente');
      } else {
        // Si el error es de sesión, el modal aparecerá automáticamente
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={() => handleLoadPerson('123')}>
      Cargar Persona
    </button>
  );
}
```

## Qué sucede cuando expira el token

1. **Usuario realiza una acción** que requiere autenticación
2. **Backend retorna 401** (token inválido) o 403 (token expirado)
3. **BaseService detecta el error** de sesión
4. **Modal aparece automáticamente** con:
   - Icono de alerta
   - Título "Sesión Expirada"
   - Mensaje personalizado (si existe)
   - Botón "Iniciar Sesión de Nuevo"
5. **Al hacer click:**
   - Se limpia: `token`, `user`, `token_type`
   - Se redirige a `/login`
   - Usuario debe iniciar sesión nuevamente

## Personalización

### Cambiar el mensaje del modal

En el BaseService, en el método `buildErrorMessage()`:

```javascript
buildErrorMessage(status, responseText) {
  if (status === 401) {
    return 'Mensaje personalizado aquí'; // ← Cambiar
  }
  // ...
}
```

### Agregar más lógica al cerrar modal

En el SessionErrorProvider, en `handleSessionModalClose()`:

```javascript
const handleSessionModalClose = useCallback(() => {
  setShowSessionModal(false);
  
  // Tu lógica personalizada aquí
  // Por ejemplo: limpiar caché, cancelar subscripciones, etc.
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_type');
  
  router.push('/login');
}, [router]);
```

## Pasos para actualizar servicios existentes

1. ✅ **Crear/actualizar el servicio** para heredar de BaseService
2. ✅ **Reemplazar fetch() con this.post(), this.get(), etc.**
3. ✅ **Verificar que los puntos de respuesta usen `result.success`**
4. ✅ **Probar con token expirado o inválido**
5. ✅ **Commit de cambios**

## Lista de servicios a actualizar

- [ ] `personService.js`
- [ ] `recordService.js`
- [ ] `userService.js`
- [ ] `roleService.js`
- [ ] `dashboardService.js`
- [ ] `logsService.js`
- [ ] `fileService.js`

## Pruebas

Para probar el sistema:

1. Iniciar sesión normalmente
2. En el navegador, ir a DevTools → Storage → Local Storage
3. Eliminar manualmente el token
4. Realizar cualquier acción que requiera autenticación
5. **Debería aparecer el modal de sesión expirada**

¡Sistema listo para usar! 🚀
