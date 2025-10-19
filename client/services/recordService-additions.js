// Método para buscar antecedentes
async searchRecords(searchTerm) {
  try {
    const token = this.getAuthToken();
    const url = `${this.baseURL}/records/search?query=${encodeURIComponent(searchTerm)}`;
    const headers = this.getHeaders();
    
    console.log('RecordService.searchRecords: Making request to:', url);
    console.log('RecordService.searchRecords: Token present:', !!token);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log('RecordService.searchRecords: Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('RecordService.searchRecords: Response data count:', data.length);
      return { success: true, data };
    } else {
      // Si es 404, devolver array vacío
      if (response.status === 404) {
        console.log('RecordService.searchRecords: 404 response, returning empty array');
        return { success: true, data: [] };
      }
      
      const errorData = await response.json().catch(() => ({}));
      console.error('RecordService.searchRecords: Error response:', errorData);
      return { 
        success: false, 
        error: errorData.detail || `Error al buscar antecedentes: ${response.status}`
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