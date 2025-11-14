// Servicio para gestión de personas
import BaseService from './BaseService';

class PersonService extends BaseService {
  constructor() {
    super(); // Usa BaseService con detección automática de errores de sesión
  }

  // Crear una nueva persona
  async createPerson(personData) {
    const backendData = {
      identification: personData.identification,
      identification_type: personData.identification_type,
      names: personData.names,
      lastnames: personData.lastnames,
      address: personData.address || '',
      province: personData.province,
      country: personData.country,
      observations: personData.observations || ''
    };

    const result = await this.post('/persons/create', backendData);
    
    // Manejar duplicados
    if (!result.success && result.status === 422) {
      return { 
        success: false, 
        error: result.error || 'La persona ya existe en el sistema', 
        isDuplicate: true 
      };
    }
    
    return result;
  }

  // Obtener una persona por ID
  async getPersonById(personId) {
    const result = await this.get(`/persons/${personId}`);
    
    if (result.success) {
      // Normalizar datos
      return {
        success: true,
        data: {
          ...result.data,
          files: Array.isArray(result.data.files) ? result.data.files : [],
          record_relationships: Array.isArray(result.data.record_relationships) ? result.data.record_relationships : [],
          connections: Array.isArray(result.data.connections) ? result.data.connections : []
        }
      };
    }
    
    return result;
  }

  // Obtener todas las personas
  async getPersons(filters = {}) {
    return this.get('/persons');
  }

  // Actualizar una persona
  async updatePerson(personId, personData) {
    return this.patch(`/persons/update/${personId}`, personData);
  }

  // Eliminar una persona
  async deletePerson(personId) {
    return this.delete(`/persons/delete/${personId}`);
  }

  // Subir archivos para una persona
  async uploadFiles(personId, filesWithDescriptions) {
    try {
      const uploadedFiles = [];
      const errors = [];

      for (const fileData of filesWithDescriptions) {
        try {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('person_id', personId);
          if (fileData.description) {
            formData.append('description', fileData.description);
          }

          const result = await this.postFormData('/files/upload', formData);

          if (result.success) {
            uploadedFiles.push(result.data);
          } else {
            errors.push(`${fileData.file.name}: ${result.error || 'Error al subir'}`);
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener archivos de una persona
  async getPersonFiles(personId) {
    return this.get(`/files/person/${personId}`);
  }

  // Eliminar un archivo de una persona
  async deleteFile(fileId) {
    return this.delete(`/files/${fileId}`);
  }

  // Vincular antecedentes a una persona
  async linkRecords(personId, recordIds, typeRelationship = 'Denunciado') {
    try {
      const results = [];
      const errors = [];

      for (const recordId of recordIds) {
        try {
          const result = await this.patch(
            `/persons/${personId}/record/${recordId}?type_relationship=${encodeURIComponent(typeRelationship)}`,
            {}
          );

          if (result.success) {
            results.push({ recordId, success: true });
          } else {
            errors.push(`Record ${recordId}: ${result.error || 'Error al vincular'}`);
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Desvincular un antecedente de una persona
  async unlinkRecord(personId, recordId) {
    return this.delete(`/persons/${personId}/record/${recordId}`);
  }

  // Vincular personas con otras personas
  async linkPersons(personId, personsToLink, relationshipType) {
    try {
      const linkedPersons = [];
      const warnings = [];
      
      for (const personToLink of personsToLink) {
        const result = await this.patch(
          `/persons/linked-person/${personId}/${personToLink.person_id}?connection_type=${encodeURIComponent(relationshipType)}`,
          {}
        );

        if (result.success) {
          linkedPersons.push({ ...personToLink, relationship: relationshipType });
        } else {
          warnings.push(`${personToLink.names} ${personToLink.lastnames}: ${result.error}`);
        }
      }

      return { 
        success: linkedPersons.length > 0, 
        data: linkedPersons,
        warnings: warnings.length > 0 ? warnings : null
      };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Desvincular personas
  async unlinkPerson(personId, linkedPersonId) {
    return this.delete(`/persons/${personId}/connection/${linkedPersonId}`);
  }
  
  // Obtener personas vinculadas
  async getLinkedPersons(personId) {
    const result = await this.get(`/persons/${personId}/linked`);
    
    // Si es 404, retornar lista vacía
    if (!result.success && result.status === 404) {
      return { success: true, data: [] };
    }
    
    return result;
  }

  // Obtener antecedentes vinculados a una persona
  async getPersonRecords(personId) {
    return this.get(`/persons/${personId}/records`);
  }

  // Obtener estadísticas de personas
  async getPersonStats() {
    return this.get('/persons/stats');
  }

  // Buscar personas por término
  async searchPersons(searchTerm) {
    try {
      if (typeof searchTerm === 'object' && searchTerm !== null) {
        const params = new URLSearchParams();
        for (const key in searchTerm) {
          if (searchTerm[key]) {
            params.append(key, searchTerm[key]);
          }
        }
        const queryString = params.toString();
        if (!queryString) {
          return { success: false, error: 'Debe proporcionar criterios de búsqueda' };
        }
        return this.get(`/persons/search/person/?${queryString}`);
      }

      if (typeof searchTerm === 'string') {
        if (!searchTerm || !searchTerm.trim()) {
          return { success: false, error: 'Debe proporcionar un término de búsqueda' };
        }
        return this.get(`/persons/search/person/?query=${encodeURIComponent(searchTerm.trim())}`);
      }

      return { success: false, error: 'Parámetro de búsqueda inválido' };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener personas recientes
  async getRecentPersons(limit = 5) {
    return this.get(`/persons/recent?limit=${limit}`);
  }

  // Cargar personas desde CSV (solo para administradores)
  async loadPersonsFromCSV() {
    return this.get('/persons/load-csv/');
  }

  async searchPersonByDniForLinker(identification) {
    try {
      if (!identification || !identification.trim()) {
        return { success: false, error: 'Debe proporcionar un número de identificación' };
      }

      return this.post(`/persons/search-dni/${encodeURIComponent(identification.trim())}`, {});
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener estado de carga del padron
  async getLoadCsvStatus() {
    return this.get('/persons/load-csv/status/');
  }
}

export default new PersonService();