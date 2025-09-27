// services/roleService.js
/**
 * Servicio para gestionar los roles
 * Responsabilidad única: Manejar toda la lógica de gestión de roles
 */

import authService from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

class RoleService {
  /**
   * Obtiene todos los roles
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getRoles() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No autorizado. Por favor inicie sesión.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/roles`, {
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
      console.error('Error fetching roles:', error);
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
        return data.detail || 'Roles no encontrados.';
      case 500:
        return data.detail || 'Error interno del servidor. Intenta más tarde.';
      default:
        return data.detail || 'Error desconocido. Por favor, intenta nuevamente.';
    }
  }
}

// Exportar instancia única (Singleton)
export const roleService = new RoleService();
export default roleService;