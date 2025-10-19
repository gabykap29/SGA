'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Table, Badge, Pagination, Alert, Spinner } from 'react-bootstrap';
import { FiSearch, FiFilter, FiFileText, FiCalendar, FiUser, FiX, FiEye } from 'react-icons/fi';
import recordService from '../../services/recordService';
import { toast } from 'react-toastify';

const RecordsSearchView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const resultsPerPage = 10;

  // Detectar si estamos en dispositivo móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Comprobar al cargar
    checkIsMobile();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile);
    
    // Limpiar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.warning('Ingrese un término de búsqueda');
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchPerformed(true);
      
      // Llamar al servicio de búsqueda
      const result = await recordService.searchRecords(searchQuery);
      
      if (result && result.success) {
        setSearchResults(result.data || []);
        setCurrentPage(1); // Reset to first page on new search
        
        if (result.data.length === 0) {
          toast.info('No se encontraron resultados para tu búsqueda');
        }
      } else {
        toast.error((result && result.error) || 'Error al buscar antecedentes');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching records:', error);
      toast.error('Error inesperado al realizar la búsqueda');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const handleViewRecord = (recordId) => {
    window.open(`/dashboard/antecedentes/${recordId}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRecordTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'criminal': return 'danger';
      case 'civil': return 'primary';
      case 'administrativo': return 'warning';
      case 'penal': return 'dark';
      case 'laboral': return 'success';
      default: return 'secondary';
    }
  };

  // Paginación
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = searchResults.slice(indexOfFirstResult, indexOfLastResult);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    let items = [];
    
    // Siempre mostrar primera página
    items.push(
      <Pagination.Item 
        key={1} 
        active={1 === currentPage}
        onClick={() => paginate(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Mostrar puntos suspensivos si la página actual es mayor a 3
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis-1" />);
    }
    
    // Mostrar páginas alrededor de la página actual
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => paginate(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Mostrar puntos suspensivos si la página actual es menor que el total de páginas - 2
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis-2" />);
    }
    
    // Siempre mostrar última página si hay más de una página
    if (totalPages > 1) {
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPage}
          onClick={() => paginate(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="justify-content-center">
        <Pagination.Prev 
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next 
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        {/* Formulario de búsqueda */}
        <Card className="mb-4 border-0 bg-light shadow-sm">
          <Card.Body className="p-4">
            <h5 className="card-title mb-4 fw-bold text-dark">
              <FiSearch className="me-2" />
              Buscar Antecedentes
            </h5>
            
            <Form onSubmit={handleSearch}>
              <InputGroup className="mb-3 shadow-sm">
                <Form.Control
                  placeholder="Buscar por número, descripción, tipo de antecedente..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  disabled={isSearching}
                />
                {searchQuery && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleClearSearch}
                    title="Limpiar búsqueda"
                  >
                    <FiX />
                  </Button>
                )}
                <Button 
                  variant="dark" 
                  type="submit" 
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <FiSearch className="me-2" /> Buscar
                    </>
                  )}
                </Button>
              </InputGroup>
            </Form>
          </Card.Body>
        </Card>

        {/* Resultados de búsqueda */}
        {searchPerformed && (
          <div className="results-container">
            {isSearching ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </Spinner>
                <p className="mt-3 text-muted">Buscando antecedentes...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <Alert variant="info" className="text-center my-4">
                <FiFilter className="me-2" size={20} />
                No se encontraron resultados para <strong>"{searchQuery}"</strong>
              </Alert>
            ) : (
              <>
                {/* Resumen de resultados */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <p className="text-muted mb-0">
                    Se encontraron <strong>{searchResults.length}</strong> resultados
                  </p>
                </div>

                {/* Tabla de resultados */}
                <div className="table-responsive">
                  <Table hover className="border-top">
                    <thead className="bg-light">
                      <tr>
                        <th>Antecedente</th>
                        <th>Tipo</th>
                        {!isMobile && <th>Fecha</th>}
                        {!isMobile && <th>Juzgado/Autoridad</th>}
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResults.map((record) => (
                        <tr key={record.record_id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`bg-${getRecordTypeColor(record.record_type)} text-white rounded-circle d-flex justify-content-center align-items-center me-3`} style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                                <FiFileText />
                              </div>
                              <div>
                                <div className="fw-bold">{record.record_number}</div>
                                <small className="text-muted d-block">
                                  {record.description || 'Sin descripción'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg={getRecordTypeColor(record.record_type)}>
                              {record.record_type || 'N/A'}
                            </Badge>
                          </td>
                          {!isMobile && (
                            <td>
                              <div className="d-flex align-items-center">
                                <FiCalendar className="me-2 text-muted" size={14} />
                                <span>{formatDate(record.record_date)}</span>
                              </div>
                            </td>
                          )}
                          {!isMobile && (
                            <td>
                              <div className="d-flex align-items-start">
                                <FiUser className="me-2 mt-1 text-muted" size={14} />
                                <span className="text-muted">
                                  {record.court || record.authority || 'No registrado'}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="text-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleViewRecord(record.record_id)}
                              title="Ver detalles"
                            >
                              <FiEye /> Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Paginación */}
                {renderPagination()}
              </>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecordsSearchView;