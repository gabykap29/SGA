'use client';

class LogsService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // Obtener token del localStorage
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Headers por defecto con autenticación
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Obtener logs con filtros opcionales
  async getLogs(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.start_date) {
        queryParams.append('start_date', filters.start_date.toISOString());
      }
      
      if (filters.end_date) {
        queryParams.append('end_date', filters.end_date.toISOString());
      }
      
      if (filters.action) {
        queryParams.append('action', filters.action);
      }
      
      if (filters.entity_type) {
        queryParams.append('entity_type', filters.entity_type);
      }
      
      if (filters.user_id) {
        queryParams.append('user_id', filters.user_id);
      }
      
      if (filters.skip) {
        queryParams.append('skip', filters.skip.toString());
      }
      
      if (filters.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      
      const url = `${this.baseURL}/logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        
        // Si es un error 403, probablemente el usuario no es admin
        if (response.status === 403) {
          return { 
            success: false, 
            error: 'No tiene permisos para ver los logs', 
            isPermissionError: true 
          };
        }
        
        return { success: false, error: errorData.detail || 'Error al obtener logs' };
      }
    } catch (error) {
      console.error('LogsService.getLogs error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener resumen de logs
  async getLogsSummary(days = 7) {
    try {
      const response = await fetch(`${this.baseURL}/logs/summary?days=${days}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        
        // Si es un error 403, probablemente el usuario no es admin
        if (response.status === 403) {
          return { 
            success: false, 
            error: 'No tiene permisos para ver el resumen de logs', 
            isPermissionError: true 
          };
        }
        
        return { success: false, error: errorData.detail || 'Error al obtener resumen de logs' };
      }
    } catch (error) {
      console.error('LogsService.getLogsSummary error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
}

// Crear instancia única del servicio
const logsService = new LogsService();

export default logsService;