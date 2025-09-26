// services/authService.js
/**
 * Servicio de autenticación siguiendo principios SOLID
 * Responsabilidad única: Manejar toda la lógica de autenticación
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

class AuthService {
  /**
   * Realiza el login del usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @param {boolean} rememberMe - Si debe recordar la sesión
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async login(username, password, rememberMe = false) {
    try {
      // Crear FormData para enviar al backend
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        body: formData,
        headers: {
          // No agregar Content-Type para FormData, el browser lo hace automáticamente
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar diferentes tipos de errores del servidor
        const errorMessage = this._getErrorMessage(response.status, data);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Guardar token siempre en localStorage para consistencia
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user || {}));
        localStorage.setItem('token_type', data.token_type || 'Bearer');
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error de conexión. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Obtiene el token de acceso almacenado
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene los datos del usuario almacenados
   * @returns {Object|null}
   */
  getUserData() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Cierra la sesión del usuario
   */
  logout() {
    // Limpiar localStorage (y sessionStorage por precaución)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_type');
    
    // Limpiar sessionStorage por si hay datos residuales
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token_type');
  }

  /**
   * Obtiene mensaje de error apropiado según el status code
   * @private
   */
  _getErrorMessage(status, data) {
    switch (status) {
      case 401:
        return data.detail || 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
      case 422:
        return 'Datos inválidos. Por favor, verifica los campos.';
      case 429:
        return 'Demasiados intentos. Espera un momento antes de intentar nuevamente.';
      case 500:
        return 'Error interno del servidor. Intenta más tarde.';
      default:
        return data.detail || 'Error desconocido. Por favor, intenta nuevamente.';
    }
  }
}

// Exportar instancia única (Singleton)
export const authService = new AuthService();
export default authService;