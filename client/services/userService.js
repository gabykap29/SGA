// services/userService.js
/**
 * Servicio para gestionar los usuarios
 * Responsabilidad única: Manejar toda la lógica de gestión de usuarios
 */

import authService from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class UserService {
  /**
   * Obtiene todos los usuarios
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getUsers() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No autorizado. Por favor inicie sesión.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = this._getErrorMessage(response.status, data);
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: 'Error de conexión. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Obtiene un usuario por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getUserById(id) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No autorizado. Por favor inicie sesión.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = this._getErrorMessage(response.status, data);
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: 'Error de conexión. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async createUser(userData) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No autorizado. Por favor inicie sesión.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = this._getErrorMessage(response.status, data);
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: 'Error de conexión. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Actualiza un usuario existente
   * @param {string} id - ID del usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async updateUser(id, userData) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No autorizado. Por favor inicie sesión.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = this._getErrorMessage(response.status, data);
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: 'Error de conexión. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Elimina un usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async deleteUser(id) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No autorizado. Por favor inicie sesión.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = this._getErrorMessage(response.status, data);
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: 'Error de conexión. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Obtiene mensaje de error apropiado según el status code
   * @private
   */
  _getErrorMessage(status, data) {
    switch (status) {
      case 401:
        return data.detail || 'No autorizado. Por favor inicie sesión.';
      case 404:
        return data.detail || 'Usuario no encontrado.';
      case 422:
        return data.detail || 'Datos inválidos. Por favor, verifica los campos.';
      case 429:
        return 'Demasiados intentos. Espera un momento antes de intentar nuevamente.';
      case 500:
        return data.detail || 'Error interno del servidor. Intenta más tarde.';
      default:
        return data.detail || 'Error desconocido. Por favor, intenta nuevamente.';
    }
  }
}

// Exportar instancia única (Singleton)
export const userService = new UserService();
export default userService;