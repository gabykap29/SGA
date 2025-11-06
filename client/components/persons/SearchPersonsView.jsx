'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Table, Badge, Pagination, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FiSearch, FiFilter, FiUser, FiHome, FiCreditCard, FiMapPin, FiX, FiEye } from 'react-icons/fi';
import personService from '../../services/personService';
import { toast } from 'react-toastify';

const SearchPersonsView = () => {
  const [searchFields, setSearchFields] = useState({
    names: '',
    lastname: '',
    identification: '',
    address: ''
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
      const result = await personService.searchPersons(searchFields);
      
      if (result.success) {
        setSearchResults(result.data || []);
        setCurrentPage(1); // Reset to first page on new search
        
        if (result.data.length === 0) {
          toast.info('No se encontraron resultados para tu búsqueda');
        }
      } else {
        toast.error(result.error || 'Error al buscar personas');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching persons:', error);
      toast.error('Error inesperado al realizar la búsqueda');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchFields({
      names: '',
      lastname: '',
      identification: '',
      address: ''
    });
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const handleViewPerson = (personId) => {
    window.open(`/dashboard/personas/${personId}`, '_blank');
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
            <h5 className="card-title mb-3 fw-bold text-dark">
              <FiSearch className="me-2" />
              Buscar Personas
            </h5>
            
            {/* Descripción informativa */}
            <Alert variant="info" className="mb-4 py-2" style={{ fontSize: '0.9rem' }}>
              <FiFilter className="me-2" />
              <strong>Consejo:</strong> No es necesario completar todos los campos para hacer una búsqueda. 
              Ingresa al menos uno de los datos disponibles (nombre, apellido, DNI o dirección) y el sistema 
              te mostrará los resultados que coincidan.
            </Alert>
            
            <Form onSubmit={handleSearch}>
              <Row className="g-3">
                {/* Campo Nombre */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiUser className="me-2" size={16} />
                      Nombre
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="names"
                      placeholder="Ingrese nombre..."
                      value={searchFields.names}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo Apellido */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiUser className="me-2" size={16} />
                      Apellido
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="lastname"
                      placeholder="Ingrese apellido..."
                      value={searchFields.lastname}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo DNI/Identificación */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiCreditCard className="me-2" size={16} />
                      DNI/Identificación
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="identification"
                      placeholder="Ingrese número de documento..."
                      value={searchFields.identification}
                      onChange={handleInputChange}
                      disabled={isSearching}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>

                {/* Campo Domicilio */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-dark small">
                      <FiMapPin className="me-2" size={16} />
                      Domicilio
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      placeholder="Ingrese dirección..."
                      value={searchFields.address}
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
                <p className="mt-3 text-muted">Buscando personas...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <Alert variant="info" className="text-center my-4">
                <FiFilter className="me-2" size={20} />
                No se encontraron resultados para los criterios especificados
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
                        <th>Persona</th>
                        <th>Documento</th>
                        {!isMobile && <th>Domicilio</th>}
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResults.map((person) => (
                        <tr key={person.person_id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                                {person.names?.charAt(0)?.toUpperCase() || '?'}
                                {person.lastnames?.charAt(0)?.toUpperCase() || ''}
                              </div>
                              <div>
                                <div className="fw-bold">{person.names} {person.lastnames}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span>{person.identification_type ? `${person.identification_type}:` : ''} <strong>{person.identification || 'N/A'}</strong></span>
                            </div>
                          </td>
                          {!isMobile && (
                            <td>
                              <div className="d-flex align-items-start">
                                <FiMapPin className="me-2 mt-1 text-muted" size={14} />
                                <span className="text-muted">
                                  {person.address || 'Dirección no registrada'}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="text-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleViewPerson(person.person_id)}
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

export default SearchPersonsView;