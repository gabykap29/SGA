// services/dashboardService.js
/**
 * Servicio para obtener datos del dashboard
 */

const API_BASE_URL = 'http://localhost:8000';

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

      const response = await fetch(`${API_BASE_URL}/persons?limit=${limit}&recent=true`, {
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
      const [statsResult, personsResult] = await Promise.allSettled([
        this.getStats(),
        this.getRecentPersons(5)
      ]);

      // Procesar estadísticas
      let stats = null;
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        stats = statsResult.value.data;
      } else {
        // Datos de fallback si no hay endpoint de stats
        const personsData = personsResult.status === 'fulfilled' && personsResult.value.success 
          ? personsResult.value.data 
          : [];
        
        stats = {
          totalPersonas: personsData.length || 0,
          totalAntecedentes: 0, // TODO: implementar cuando esté disponible
          registrosActivos: personsData.filter(p => p.active).length || 0,
          nuevosEsteMes: personsData.length || 0 // Simplificado por ahora
        };
      }

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