// Servicio para gestión de antecedentes
class RecordService {
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

  // Obtener todos los antecedentes
  async getRecords() {
    try {
      const token = this.getAuthToken();
      const url = `${this.baseURL}/records`;
      const headers = this.getHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
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
      // Extraemos solo los campos que el backend espera
      const { title, date, content, observations, type_record, category, type_relationship } = recordData;
      const recordDataToSend = { 
        title, 
        date, 
        content, 
        observations, 
        type_record: type_record.toUpperCase(), 
        category, 
        type_relationship 
      };
      
      const response = await fetch(`${this.baseURL}/records/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(recordDataToSend)
      });
      
      // Manejo especial de errores HTTP
      if (!response.ok) {
        console.error('Error en la respuesta:', response.status, response.statusText);
        
        try {
          const errorData = await response.json();
          
          // Manejar específicamente el error 422 (antecedente ya existe)
          if (response.status === 422) {
            return { 
              success: false, 
              error: errorData.detail || 'Este antecedente ya existe en el sistema', 
              isDuplicate: true 
            };
          }
          
          return { success: false, error: errorData.detail || 'Error al crear antecedente' };
        } catch (parseError) {
          console.error('Error al parsear respuesta de error:', parseError);
          return { success: false, error: `Error al crear antecedente (${response.status}: ${response.statusText})` };
        }
      }
      
      try {
        const data = await response.json();
        return { success: true, data };
      } catch (parseError) {
        console.error('Error al parsear respuesta:', parseError);
        return { success: false, error: 'Error al procesar la respuesta del servidor' };
      }
    } catch (error) {
      console.error('RecordService.createRecord error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Actualizar un antecedente
  async updateRecord(recordId, recordData) {
    try {
      
      const response = await fetch(`${this.baseURL}/records/${recordId}`, {
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
      
      const response = await fetch(`${this.baseURL}/records/${recordId}`, {
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

      // Usamos la ruta principal con parámetros de búsqueda
      const url = `${this.baseURL}/records${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
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

  // Vincular una persona a un antecedente
  async linkPersonToRecord(personId, recordId, typeRelationship = "Denunciado") {
    try {
      // Usar la URL y método correctos según el controlador del backend
      const response = await fetch(`${this.baseURL}/persons/${personId}/record/${recordId}?type_relationship=${typeRelationship}`, {
        method: 'PATCH',  // Este es el método correcto según el controlador
        headers: this.getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        console.error('Error en la vinculación:', errorData);
        return { success: false, error: errorData.detail || 'Error al vincular antecedente' };
      }
    } catch (error) {
      console.error('RecordService.linkPersonToRecord error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Desvincular una persona de un antecedente
  async unlinkPersonFromRecord(personId, recordId) {
    try {
      const response = await fetch(`${this.baseURL}/records/${recordId}/unlink-person`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ person_id: personId })
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error al desvincular antecedente' };
      }
    } catch (error) {
      console.error('RecordService.unlinkPersonFromRecord error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
  
  // Método para buscar antecedentes
  async searchRecords(searchTerm = null, filters = {}) {
    try {
      const token = this.getAuthToken();
      
      // Construir parámetros de búsqueda
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('query', searchTerm);
      }
      
      // Agregar filtros específicos
      if (filters.title) params.append('title', filters.title);
      if (filters.content) params.append('content', filters.content);
      if (filters.observations) params.append('observations', filters.observations);
      if (filters.type_record) params.append('type_record', filters.type_record);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.person_name) params.append('person_name', filters.person_name);
      
      const url = `${this.baseURL}/records/search?${params.toString()}`;
      const headers = this.getHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        
        // Si la respuesta es directamente un array, devolverla como data
        if (Array.isArray(data)) {
          return { success: true, data: data };
        }
        
        // Si es un objeto, devolver tal como está
        return { success: true, data: data };
      } else {
        // Si es 404, devolver array vacío
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        
        const errorData = await response.json().catch(() => ({}));
        console.error('RecordService.searchRecords: Error response:', errorData);
        return { 
          success: false, 
          error: errorData.detail || errorData.error || `Error al buscar antecedentes: ${response.status}`
        };
      }
    } catch (error) {
      console.error('RecordService.searchRecords error:', error);
      return { 
        success: false, 
        error: `Error de conexión al buscar antecedentes: ${error.message}` 
      };
    }
  }
}

// Crear instancia única del servicio
const recordService = new RecordService();

export default recordService;