// services/dashboardService.js
/**
 * Servicio para obtener datos del dashboard
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

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

      console.log('Solicitando estadísticas a:', `${API_BASE_URL}/records/stats/`);
      
      const response = await fetch(`${API_BASE_URL}/records/stats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error en la respuesta:', response.status, response.statusText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Datos recibidos de estadísticas:', data);
      
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
   * @deprecated Use getStats() instead
   */
  async getDashboardData() {
    console.warn('getDashboardData() está obsoleto. Utilice getStats() para obtener estadísticas.');
    
    try {
      // Obtenemos estadísticas reales del servidor
      const statsResult = await this.getStats();
      const personsResult = await this.getRecentPersons(5);
      
      console.log('getDashboardData - statsResult:', statsResult);
      
      if (statsResult.success && personsResult.success && statsResult.data && statsResult.data.stats) {
        const stats = statsResult.data.stats;
        console.log('getDashboardData - stats procesados:', stats);
        
        return {
          success: true,
          data: {
            stats: {
              totalPersonas: stats.cant_person || 0,
              totalAntecedentes: stats.cant_record || 0,
              registrosActivos: stats.cant_record || 0,
              nuevosEsteMes: stats.cant_month || 0
            },
            recentPersons: personsResult.data
          }
        };
      }
      
      // Fallback por si falla
      return {
        success: false,
        error: 'Error al obtener datos del dashboard'
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