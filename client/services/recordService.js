// Servicio para gestión de antecedentes
class RecordService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
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

  // Obtener todos los antecedentes
  async getRecords() {
    try {
      const response = await fetch(`${this.baseURL}/records`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        // Si es 404, devolver array vacío
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error al obtener antecedentes' };
      }
    } catch (error) {
      console.error('RecordService.getRecords error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener un antecedente por ID
  async getRecordById(recordId) {
    try {
      const response = await fetch(`${this.baseURL}/records/${recordId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener antecedente' };
      }
    } catch (error) {
      console.error('RecordService.getRecordById error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Crear un nuevo antecedente
  async createRecord(recordData) {
    try {
      const response = await fetch(`${this.baseURL}/records/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(recordData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al crear antecedente' };
      }
    } catch (error) {
      console.error('RecordService.createRecord error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Actualizar un antecedente
  async updateRecord(recordId, recordData) {
    try {
      const response = await fetch(`${this.baseURL}/records/update/${recordId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(recordData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al actualizar antecedente' };
      }
    } catch (error) {
      console.error('RecordService.updateRecord error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Eliminar un antecedente
  async deleteRecord(recordId) {
    try {
      const response = await fetch(`${this.baseURL}/records/delete/${recordId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.detail || 'Error al eliminar antecedente' };
      }
    } catch (error) {
      console.error('RecordService.deleteRecord error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Buscar antecedentes por término
  async searchRecords(searchTerm, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${this.baseURL}/records/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al buscar antecedentes' };
      }
    } catch (error) {
      console.error('RecordService.searchRecords error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
}

// Crear instancia única del servicio
const recordService = new RecordService();

export default recordService;