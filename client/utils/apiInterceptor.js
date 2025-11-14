/**
 * Utilidad para manejar respuestas de fetch y detectar errores de sesión/token
 * Proporcionador global de interceptación de errores 401/403
 */

let sessionErrorCallback = null;

/**
 * Registra el callback para cuando se detecta un error de sesión
 * @param {Function} callback - Función a llamar cuando hay error de sesión
 */
export function registerSessionErrorCallback(callback) {
  sessionErrorCallback = callback;
}

/**
 * Verifica si la respuesta contiene un error de sesión/token
 * @param {Response} response - Respuesta del fetch
 * @param {string} responseText - Texto de la respuesta
 * @returns {boolean}
 */
function isSessionError(response, responseText) {
  // Error 401 - Unauthorized (Token inválido o expirado)
  if (response.status === 401) {
    return true;
  }

  // Error 403 - Forbidden (Token expirado o sin permisos)
  if (response.status === 403) {
    const lower = responseText.toLowerCase();
    if (
      lower.includes('token') ||
      lower.includes('expirado') ||
      lower.includes('expired') ||
      lower.includes('invalid') ||
      lower.includes('inválido') ||
      lower.includes('authentication') ||
      lower.includes('autenticación') ||
      lower.includes('unauthorized') ||
      lower.includes('no autorizado')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Construye un mensaje de error legible
 * @param {number} status - Código de estado HTTP
 * @param {string} responseText - Texto de respuesta
 * @returns {string}
 */
function buildErrorMessage(status, responseText) {
  if (status === 401) {
    return 'Tu token de autenticación es inválido o ha expirado. Por favor, inicia sesión nuevamente.';
  }

  if (status === 403) {
    if (responseText.toLowerCase().includes('token')) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    return 'No tienes permisos para realizar esta acción.';
  }

  return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
}

/**
 * Maneja respuestas de fetch con soporte para errores de sesión
 * Reemplaza a fetch() nativo
 * @param {string} url - URL de la solicitud
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<Response>}
 */
export async function fetchWithSessionErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);

    // Si la respuesta no es OK, verificar si es un error de sesión
    if (!response.ok) {
      let responseText = '';
      try {
        responseText = await response.clone().text();
      } catch (e) {
        responseText = '';
      }

      // Detectar error de sesión
      if (isSessionError(response, responseText)) {
        const errorMessage = buildErrorMessage(response.status, responseText);

        // Llamar al callback registrado si existe
        if (sessionErrorCallback) {
          sessionErrorCallback(errorMessage);
        }

        // Limpiar datos de sesión
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('token_type');
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Realiza un fetch con manejo de errores de sesión (versión GET)
 * @param {string} url - URL
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - {success, data, error}
 */
export async function apiGet(url, options = {}) {
  try {
    const response = await fetchWithSessionErrorHandling(url, {
      method: 'GET',
      ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || 'Error en la solicitud',
        status: response.status
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('API GET error:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión'
    };
  }
}

/**
 * Realiza un fetch con manejo de errores de sesión (versión POST)
 * @param {string} url - URL
 * @param {Object} body - Cuerpo de la solicitud
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - {success, data, error}
 */
export async function apiPost(url, body, options = {}) {
  try {
    const response = await fetchWithSessionErrorHandling(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body),
      ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || 'Error en la solicitud',
        status: response.status
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('API POST error:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión'
    };
  }
}

/**
 * Realiza un fetch con manejo de errores de sesión (versión PATCH)
 * @param {string} url - URL
 * @param {Object} body - Cuerpo de la solicitud
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - {success, data, error}
 */
export async function apiPatch(url, body, options = {}) {
  try {
    const response = await fetchWithSessionErrorHandling(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body),
      ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || 'Error en la solicitud',
        status: response.status
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('API PATCH error:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión'
    };
  }
}

/**
 * Realiza un fetch con manejo de errores de sesión (versión DELETE)
 * @param {string} url - URL
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - {success, data, error}
 */
export async function apiDelete(url, options = {}) {
  try {
    const response = await fetchWithSessionErrorHandling(url, {
      method: 'DELETE',
      ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.message || 'Error en la solicitud',
        status: response.status
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('API DELETE error:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión'
    };
  }
}
