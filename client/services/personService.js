// Servicio para gestión de personas
class PersonService {
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

      const response = await fetch(`${this.baseURL}/persons/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(backendData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        if (response.status === 422) {
          return { 
            success: false, 
            error: data.detail || 'La persona ya existe en el sistema', 
            isDuplicate: true 
          };
        }
        return { success: false, error: data.detail || 'Error al crear persona' };
      }
    } catch (error) {
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
        const normalizedData = {
          ...data,
          files: Array.isArray(data.files) ? data.files : [],
          record_relationships: Array.isArray(data.record_relationships) ? data.record_relationships : [],
          connections: Array.isArray(data.connections) ? data.connections : []
        };
        return { success: true, data: normalizedData };
      } else {
        return { success: false, error: data.detail || 'Error al obtener persona' };
      }
    } catch (error) {
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Actualizar una persona
  async updatePerson(personId, personData) {
    try {
      const response = await fetch(`${this.baseURL}/persons/update/${personId}`, {
        method: 'PATCH',
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Eliminar una persona
  async deletePerson(personId) {
    try {
      const response = await fetch(`${this.baseURL}/persons/delete/${personId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error al eliminar la persona' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Vincular antecedentes a una persona
  async linkRecords(personId, recordIds, typeRelationship = 'Denunciado') {
    try {
      const results = [];
      const errors = [];

      for (const recordId of recordIds) {
        try {
          const response = await fetch(`${this.baseURL}/persons/${personId}/record/${recordId}?type_relationship=${encodeURIComponent(typeRelationship)}`, {
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Desvincular un antecedente de una persona
  async unlinkRecord(personId, recordId) {
    try {
      const response = await fetch(`${this.baseURL}/persons/${personId}/record/${recordId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error al desvincular antecedente' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Vincular personas con otras personas
  async linkPersons(personId, personsToLink, relationshipType) {
    try {
      const linkedPersons = [];
      const warnings = [];
      
      for (const personToLink of personsToLink) {
        const url = `${this.baseURL}/persons/linked-person/${personId}/${personToLink.person_id}?connection_type=${encodeURIComponent(relationshipType)}`;
        
        const response = await fetch(url, {
          method: 'PATCH',
          headers: this.getHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          linkedPersons.push({ ...personToLink, relationship: relationshipType });
        } else {
          let errorDetail = 'Error desconocido';
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || 'Error desconocido';
          } catch (e) {
            errorDetail = `Error ${response.status}: ${response.statusText}`;
          }
          warnings.push(`${personToLink.names} ${personToLink.lastnames}: ${errorDetail}`);
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
    try {
      const response = await fetch(`${this.baseURL}/persons/${personId}/connection/${linkedPersonId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error al desvincular persona' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }
  
  // Obtener personas vinculadas
  async getLinkedPersons(personId) {
    try {
      const response = await fetch(`${this.baseURL}/persons/${personId}/linked`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error al obtener personas vinculadas' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener antecedentes vinculados a una persona
  async getPersonRecords(personId) {
    try {
      const response = await fetch(`${this.baseURL}/persons/${personId}/records`, {
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener estadísticas de personas
  async getPersonStats() {
    try {
      const response = await fetch(`${this.baseURL}/persons/stats`, {
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
      return { success: false, error: 'Error de conexión' };
    }
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
        const url = `${this.baseURL}/persons/search/person/?${queryString}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders()
        });
        const data = await response.json();
        if (response.ok) {
          return { success: true, data };
        } else {
          return { success: false, error: data.detail || 'Error al buscar personas' };
        }
      }

      if (typeof searchTerm === 'string') {
        if (!searchTerm || !searchTerm.trim()) {
          return { success: false, error: 'Debe proporcionar un término de búsqueda' };
        }
        const url = `${this.baseURL}/persons/search/person/?query=${encodeURIComponent(searchTerm.trim())}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders()
        });
        const data = await response.json();
        if (response.ok) {
          return { success: true, data };
        } else {
          return { success: false, error: data.detail || 'Error al buscar personas' };
        }
      }

      return { success: false, error: 'Parámetro de búsqueda inválido' };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener personas recientes
  async getRecentPersons(limit = 5) {
    try {
      const response = await fetch(`${this.baseURL}/persons/recent?limit=${limit}`, {
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Cargar personas desde CSV (solo para administradores)
  async loadPersonsFromCSV() {
    try {
      const response = await fetch(`${this.baseURL}/persons/load-csv/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { 
          success: true, 
          data: {
            message: data.message,
            status: data.status
          }
        };
      } else {
        return { success: false, error: data.detail || 'Error al cargar personas desde CSV' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión al cargar personas desde CSV' };
    }
  }

  async searchPersonByDniForLinker(identification) {
    try {
      if (!identification || !identification.trim()) {
        return { success: false, error: 'Debe proporcionar un número de identificación' };
      }

      const url = `${this.baseURL}/persons/search-dni/${encodeURIComponent(identification.trim())}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data };
      } else {
        return { success: false, error: data.detail || 'Persona no encontrada' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Obtener estado de carga del padron
  async getLoadCsvStatus() {
    try {
      const response = await fetch(`${this.baseURL}/persons/load-csv/status/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.detail || 'Error al obtener estado de carga' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión al obtener estado de carga' };
    }
  }
}

export default new PersonService();