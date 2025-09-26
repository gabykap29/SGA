// Servicio para gestión de personas
class PersonService {
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

  // Headers para archivos
  getFileHeaders() {
    const token = this.getAuthToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Crear una nueva persona
  async createPerson(personData) {
    try {
      // Los campos del frontend ahora coinciden exactamente con el backend
      const backendData = {
        identification: personData.identification,
        identification_type: personData.identification_type,
        names: personData.names,
        lastnames: personData.lastnames,
        address: personData.address || '',
        province: personData.province,
        country: personData.country
      };

      console.log('Sending to backend:', backendData); // Para debug

      const response = await fetch(`${this.baseURL}/persons/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(backendData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        console.error('Backend error:', data);
        return { success: false, error: data.detail || 'Error al crear persona' };
      }
    } catch (error) {
      console.error('PersonService.createPerson error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener una persona por ID
  async getPersonById(personId) {
    try {
      const response = await fetch(`${this.baseURL}/persons/${personId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener persona' };
      }
    } catch (error) {
      console.error('PersonService.getPersonById error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener todas las personas
  async getPersons(filters = {}) {
    try {
      const response = await fetch(`${this.baseURL}/persons`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener personas' };
      }
    } catch (error) {
      console.error('PersonService.getPersons error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Actualizar una persona
  async updatePerson(personId, personData) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/persons/${personId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(personData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al actualizar persona' };
      }
    } catch (error) {
      console.error('PersonService.updatePerson error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Eliminar una persona
  async deletePerson(personId) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/persons/${personId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.detail || 'Error al eliminar persona' };
      }
    } catch (error) {
      console.error('PersonService.deletePerson error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Subir archivos para una persona
  async uploadFiles(personId, filesWithDescriptions) {
    try {
      const uploadedFiles = [];
      const errors = [];

      // Subir cada archivo individualmente
      for (const fileData of filesWithDescriptions) {
        try {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('person_id', personId);
          if (fileData.description) {
            formData.append('description', fileData.description);
          }

          const response = await fetch(`${this.baseURL}/files/upload`, {
            method: 'POST',
            headers: this.getFileHeaders(),
            body: formData
          });

          const data = await response.json();

          if (response.ok) {
            uploadedFiles.push(data);
          } else {
            errors.push(`${fileData.file.name}: ${data.detail || 'Error al subir'}`);
          }
        } catch (fileError) {
          errors.push(`${fileData.file.name}: Error de conexión`);
        }
      }

      if (uploadedFiles.length === 0) {
        return { success: false, error: `No se pudieron subir archivos: ${errors.join(', ')}` };
      }

      if (errors.length > 0) {
        console.warn('Algunos archivos no se pudieron subir:', errors);
      }

      return { success: true, data: uploadedFiles, warnings: errors };
    } catch (error) {
      console.error('PersonService.uploadFiles error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener archivos de una persona
  async getPersonFiles(personId) {
    try {
      const response = await fetch(`${this.baseURL}/files/person/${personId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener archivos' };
      }
    } catch (error) {
      console.error('PersonService.getPersonFiles error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Eliminar un archivo de una persona
  async deleteFile(fileId) {
    try {
      const response = await fetch(`${this.baseURL}/files/${fileId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.detail || 'Error al eliminar archivo' };
      }
    } catch (error) {
      console.error('PersonService.deleteFile error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Vincular antecedentes a una persona
  async linkRecords(personId, recordIds, typeRelationship = 'Denunciado') {
    try {
      const results = [];
      const errors = [];

      // Vincular cada record individualmente
      for (const recordId of recordIds) {
        try {
          const response = await fetch(`${this.baseURL}/persons/${personId}/${recordId}?type_relationship=${typeRelationship}`, {
            method: 'PATCH',
            headers: this.getHeaders()
          });

          const data = await response.json();

          if (response.ok) {
            results.push({ recordId, success: true });
          } else {
            errors.push(`Record ${recordId}: ${data.detail || 'Error al vincular'}`);
          }
        } catch (recordError) {
          errors.push(`Record ${recordId}: Error de conexión`);
        }
      }

      if (results.length === 0) {
        return { success: false, error: `No se pudieron vincular antecedentes: ${errors.join(', ')}` };
      }

      if (errors.length > 0) {
        console.warn('Algunos antecedentes no se pudieron vincular:', errors);
      }

      return { success: true, data: results, warnings: errors };
    } catch (error) {
      console.error('PersonService.linkRecords error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Desvincular un antecedente de una persona
  async unlinkRecord(personId, recordId) {
    try {
      // Nota: Necesitaríamos un endpoint DELETE en el backend para desvincular
      // Por ahora, retornamos un error indicando que no está implementado
      return { 
        success: false, 
        error: 'La funcionalidad de desvincular antecedentes no está implementada en el backend' 
      };
    } catch (error) {
      console.error('PersonService.unlinkRecord error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener antecedentes vinculados a una persona
  async getPersonRecords(personId) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/persons/${personId}/records`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener antecedentes' };
      }
    } catch (error) {
      console.error('PersonService.getPersonRecords error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener estadísticas de personas
  async getPersonStats() {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/persons/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener estadísticas' };
      }
    } catch (error) {
      console.error('PersonService.getPersonStats error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Buscar personas por término
  async searchPersons(searchTerm, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/api/v1/persons/search?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al buscar personas' };
      }
    } catch (error) {
      console.error('PersonService.searchPersons error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener personas recientes
  async getRecentPersons(limit = 5) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/persons/recent?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener personas recientes' };
      }
    } catch (error) {
      console.error('PersonService.getRecentPersons error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
}

// Crear instancia única del servicio
const personService = new PersonService();

export default personService;