  // Vincular personas con otras personas
  async linkPersons(personId, personsToLink, relationshipType) {
    try {
      const linkedPersons = [];
      const warnings = [];
      
      for (const personToLink of personsToLink) {
        const response = await fetch(`${this.baseURL}/persons/${personId}/link/${personToLink.person_id}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ relationship_type: relationshipType })
        });

        if (response.ok) {
          const data = await response.json();
          // Añadir el tipo de relación a la persona vinculada
          linkedPersons.push({ ...personToLink, relationship: relationshipType });
        } else {
          const errorData = await response.json();
          warnings.push(`${personToLink.names} ${personToLink.lastnames}: ${errorData.detail || 'Error desconocido'}`);
        }
      }

      return { 
        success: linkedPersons.length > 0, 
        data: linkedPersons,
        warnings: warnings.length > 0 ? warnings : null
      };
    } catch (error) {
      console.error('PersonService.linkPersons error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Desvincular personas
  async unlinkPerson(personId, linkedPersonId) {
    try {
      const response = await fetch(`${this.baseURL}/persons/${personId}/unlink/${linkedPersonId}`, {
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
      console.error('PersonService.unlinkPerson error:', error);
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
        // Si es 404, devolver array vacío
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Error al obtener personas vinculadas' };
      }
    } catch (error) {
      console.error('PersonService.getLinkedPersons error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }