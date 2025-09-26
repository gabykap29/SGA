// services/dashboardService.js
/**
 * Servicio para obtener datos del dashboard
 */

const API_BASE_URL = 'http://localhost:8001';

class DashboardService {
  /**
   * Obtiene las estadísticas generales del sistema
   */
  async getStats() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      };
    }
  }

  /**
   * Obtiene las últimas personas registradas
   */
  async getRecentPersons(limit = 10) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_BASE_URL}/persons`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Procesar los datos: ordenar por fecha de creación y limitar
      let processedData = Array.isArray(data) ? data : [];
      
      // Ordenar por fecha de creación (más recientes primero)
      processedData.sort((a, b) => {
        const dateA = new Date(a.created_at || a.updated_at || 0);
        const dateB = new Date(b.created_at || b.updated_at || 0);
        return dateB - dateA;
      });
      
      // Limitar la cantidad
      processedData = processedData.slice(0, limit);
      
      return {
        success: true,
        data: processedData
      };
    } catch (error) {
      console.error('Error obteniendo personas recientes:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener personas recientes'
      };
    }
  }

  /**
   * Obtiene estadísticas específicas para el dashboard
   */
  async getDashboardData() {
    try {
      // Por ahora solo cargamos personas, las estadísticas las calculamos localmente
      const [personsResult] = await Promise.allSettled([
        this.getRecentPersons(5)
      ]);

      // Procesar estadísticas basadas en los datos de personas
      const personsData = personsResult.status === 'fulfilled' && personsResult.value.success 
        ? personsResult.value.data 
        : [];
      
      const stats = {
        totalPersonas: personsData.length || 0,
        totalAntecedentes: 0, // TODO: implementar cuando esté disponible
        registrosActivos: personsData.length || 0,
        nuevosEsteMes: personsData.length || 0 // Simplificado por ahora
      };

      // Procesar personas recientes
      let recentPersons = [];
      if (personsResult.status === 'fulfilled' && personsResult.value.success) {
        recentPersons = personsResult.value.data;
      }

      return {
        success: true,
        data: {
          stats,
          recentPersons
        }
      };
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener datos del dashboard'
      };
    }
  }
}

export const dashboardService = new DashboardService();