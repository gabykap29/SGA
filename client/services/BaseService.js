/**
 * Servicio base para todas las llamadas API
 * Maneja autenticación, errores de sesión y respuestas
 */

import { registerSessionErrorCallback } from '../utils/apiInterceptor';

class BaseService {
  constructor(baseURL = null) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Registrar el callback para errores de sesión
    if (typeof window !== 'undefined') {
      import('../components/providers/SessionErrorProvider').then(module => {
        const { useSessionError } = module;
        // Este será llamado desde el interceptor
      });
    }
  }

  /**
   * Obtener token del localStorage
   */
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Headers por defecto con autenticación
   */
  getHeaders(additionalHeaders = {}) {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...additionalHeaders
    };
  }

  /**
   * Headers para archivos (sin Content-Type para que el navegador lo establezca)
   */
  getFileHeaders(additionalHeaders = {}) {
    const token = this.getAuthToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...additionalHeaders
    };
  }

  /**
   * Verifica si la respuesta contiene un error de sesión/token
   */
  isSessionError(response, responseText = '') {
    // Error 401 - Unauthorized
    if (response.status === 401) {
      return true;
    }

    // Error 403 - Forbidden (posible token expirado)
    if (response.status === 403) {
      const lower = responseText.toLowerCase();
      if (
        lower.includes('token') ||
        lower.includes('expirado') ||
        lower.includes('expired') ||
        lower.includes('invalid') ||
        lower.includes('inválido') ||
        lower.includes('authentication') ||
        lower.includes('autenticación')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Construye un mensaje de error legible
   */
  buildErrorMessage(status, responseText) {
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
   * Realiza una petición fetch con manejo de errores de sesión
   */
  async fetch(url, options = {}) {
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

        // Detectar error de sesión y mostrar modal
        if (this.isSessionError(response, responseText)) {
          const errorMessage = this.buildErrorMessage(response.status, responseText);
          
          // Mostrar el modal de sesión expirada
          if (typeof window !== 'undefined') {
            // Esperar a que el DOM esté listo
            const showModal = () => {
              const event = new CustomEvent('session-error', {
                detail: { message: errorMessage }
              });
              document.dispatchEvent(event);
            };

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', showModal);
            } else {
              showModal();
            }

            // Limpiar datos de sesión
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
   * Realiza una petición GET
   */
  async get(endpoint, options = {}) {
    try {
      const response = await this.fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(options.headers),
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

      return { success: true, data };
    } catch (error) {
      console.error('GET error:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  /**
   * Realiza una petición POST
   */
  async post(endpoint, body, options = {}) {
    try {
      const response = await this.fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(options.headers),
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

      return { success: true, data };
    } catch (error) {
      console.error('POST error:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  /**
   * Realiza una petición PATCH
   */
  async patch(endpoint, body, options = {}) {
    try {
      const response = await this.fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(options.headers),
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

      return { success: true, data };
    } catch (error) {
      console.error('PATCH error:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  /**
   * Realiza una petición DELETE
   */
  async delete(endpoint, options = {}) {
    try {
      const response = await this.fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(options.headers),
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

      return { success: true, data };
    } catch (error) {
      console.error('DELETE error:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }

  /**
   * Realiza una petición POST con FormData (para archivos)
   */
  async postFormData(endpoint, formData, options = {}) {
    try {
      const response = await this.fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getFileHeaders(options.headers),
        body: formData,
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

      return { success: true, data };
    } catch (error) {
      console.error('POST FormData error:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión'
      };
    }
  }
}

export default BaseService;
