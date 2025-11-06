'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Table, Badge, Pagination, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FiSearch, FiFilter, FiFileText, FiCalendar, FiUser, FiX, FiEye } from 'react-icons/fi';
import recordService from '../../services/recordService';
import { toast } from 'react-toastify';

const RecordsSearchView = () => {
  const [searchFields, setSearchFields] = useState({
    title: '',
    content: '',
    type_record: '',
    person_name: '',
    date_from: '',
    date_to: ''
  });
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
    const { name, value } = e.target;
    setSearchFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Verificar que al menos un campo esté completo
    const hasSearchCriteria = Object.values(searchFields).some(val => val.trim());
    if (!hasSearchCriteria) {
      toast.warning('Ingrese al menos un criterio de búsqueda');
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchPerformed(true);
      
      // Llamar al servicio de búsqueda con los campos específicos
      const result = await recordService.searchRecords(null, searchFields);
      
      console.log('handleSearch result:', result);
      console.log('handleSearch result.data:', result.data);
      console.log('handleSearch is array:', Array.isArray(result.data));
      
      if (result && result.success) {
        const dataToSet = result.data || [];
        console.log('Setting searchResults to:', dataToSet);
        setSearchResults(dataToSet);
        setCurrentPage(1); // Reset to first page on new search
        
        if (dataToSet.length === 0) {
          toast.info('No se encontraron resultados para tu búsqueda');
        } else {
          console.log(`Search completed: ${dataToSet.length} results found`);
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
    setSearchFields({
      title: '',
      content: '',
      type_record: '',
      person_name: '',
      date_from: '',
      date_to: ''
    });
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
  const resultsArray = Array.isArray(searchResults) ? searchResults : [];
  const totalPages = Math.ceil(resultsArray.length / resultsPerPage);
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = resultsArray.slice(indexOfFirstResult, indexOfLastResult);

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
              <Row className="g-3">
                {/* Campo Título */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiFileText className="me-2" size={16} />
                      Título
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      placeholder="Ingrese título..."
                      value={searchFields.title}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo Contenido */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiFileText className="me-2" size={16} />
                      Contenido
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="content"
                      placeholder="Ingrese contenido..."
                      value={searchFields.content}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo Tipo de Registro */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiFilter className="me-2" size={16} />
                      Tipo de Registro
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="type_record"
                      placeholder="Ej: Criminal, Civil, Penal..."
                      value={searchFields.type_record}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo Nombre de Persona */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiUser className="me-2" size={16} />
                      Nombre de Persona
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="person_name"
                      placeholder="Ingrese nombre de persona..."
                      value={searchFields.person_name}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo Fecha Desde */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiCalendar className="me-2" size={16} />
                      Fecha Desde
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="date_from"
                      value={searchFields.date_from}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo Fecha Hasta */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiCalendar className="me-2" size={16} />
                      Fecha Hasta
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="date_to"
                      value={searchFields.date_to}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Botones de acción */}
                <Col xs={12}>
                  <div className="d-flex gap-2 align-items-center">
                    <Button 
                      variant="dark" 
                      type="submit" 
                      disabled={isSearching || !Object.values(searchFields).some(val => val.trim())}
                      className="flex-grow-1"
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
                          <FiSearch className="me-2" />
                          Buscar
                        </>
                      )}
                    </Button>
                    {Object.values(searchFields).some(val => val.trim()) && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={handleClearSearch}
                        disabled={isSearching}
                        title="Limpiar criterios de búsqueda"
                      >
                        <FiX />
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
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
            ) : resultsArray.length === 0 ? (
              <Alert variant="info" className="text-center my-4">
                <FiFilter className="me-2" size={20} />
                No se encontraron resultados para los criterios especificados
              </Alert>
            ) : (
              <>
                {/* Resumen de resultados */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <p className="text-muted mb-0">
                    Se encontraron <strong>{resultsArray.length}</strong> resultados
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
                      {currentResults && currentResults.length > 0 ? (
                        currentResults.map((record) => {
                          console.log('Rendering record:', record);
                          return (
                            <tr key={record.record_id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className={`bg-${getRecordTypeColor(record.type_record)} text-white rounded-circle d-flex justify-content-center align-items-center me-3`} style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                                    <FiFileText />
                                  </div>
                                  <div>
                                    <div className="fw-bold">{record.title || 'Sin título'}</div>
                                    <small className="text-muted d-block">
                                      {record.content || 'Sin descripción'}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg={getRecordTypeColor(record.type_record)}>
                                  {record.type_record || 'N/A'}
                                </Badge>
                              </td>
                              {!isMobile && (
                                <td>
                                  <div className="d-flex align-items-center">
                                    <FiCalendar className="me-2 text-muted" size={14} />
                                    <span>{formatDate(record.date)}</span>
                                  </div>
                                </td>
                              )}
                              {!isMobile && (
                                <td>
                                  <div className="d-flex align-items-start">
                                    <FiUser className="me-2 mt-1 text-muted" size={14} />
                                    <span className="text-muted">
                                      {record.observations || 'No registrado'}
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
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            No hay registros para mostrar
                          </td>
                        </tr>
                      )}
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