'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, InputGroup, Table, Badge, Pagination, Alert, Spinner } from 'react-bootstrap';
import { FiSearch, FiFilter, FiUser, FiHome, FiCreditCard, FiMapPin, FiX, FiEye, FiEdit, FiLink } from 'react-icons/fi';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import personService from '../../../../../services/personService';
import { toast } from 'react-toastify';

export default function SearchPersons() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const resultsPerPage = 10;

  // Comprobar autenticación y detectar dispositivo móvil
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
    
    // Detectar si estamos en dispositivo móvil
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Comprobar al cargar
    checkIsMobile();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile);
    
    // Limpiar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [router]);

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
      
      // Llamar al servicio de búsqueda usando solo el término de búsqueda
      const result = await personService.searchPersons(searchQuery);
      
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
    setSearchQuery('');
    setShowDescription(false);
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const handleViewPerson = (personId) => {
    router.push(`/dashboard/personas/${personId}`);
  };

  const handleEditPerson = (personId) => {
    router.push(`/dashboard/personas/${personId}/editar`);
  };

  // Paginación
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = searchResults.slice(indexOfFirstResult, indexOfLastResult);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageItems = [];
    
    // Previous button
    pageItems.push(
      <Pagination.Prev 
        key="prev"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      />
    );
    
    // Para dispositivos móviles, mostrar un paginador más compacto
    if (isMobile) {
      // Siempre mostrar la primera página
      if (1 !== currentPage) {
        pageItems.push(
          <Pagination.Item
            key={1}
            onClick={() => setCurrentPage(1)}
          >
            {1}
          </Pagination.Item>
        );
      }
      
      // Agregar ellipsis si hay más de 3 páginas y no estamos en las primeras páginas
      if (currentPage > 2) {
        pageItems.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
      }
      
      // Página actual
      pageItems.push(
        <Pagination.Item
          key={currentPage}
          active={true}
        >
          {currentPage}
        </Pagination.Item>
      );
      
      // Agregar ellipsis si hay más de 3 páginas y no estamos en las últimas páginas
      if (currentPage < totalPages - 1) {
        pageItems.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }
      
      // Siempre mostrar la última página
      if (totalPages !== currentPage) {
        pageItems.push(
          <Pagination.Item
            key={totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    } else {
      // En dispositivos de escritorio, mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pageItems.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    }
    
    // Next button
    pageItems.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      />
    );

    return <Pagination size={isMobile ? "sm" : "md"} className="justify-content-center mt-3 mt-md-4">{pageItems}</Pagination>;
  };

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cuadro de título */}
        <div className="mb-3 mb-md-4 p-3 p-md-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <h2 className="fw-bold text-dark mb-2 fs-3 fs-md-2">Buscar Personas</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            ➜ Encuentra personas por nombre, DNI o domicilio
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <Card className="mb-3 mb-md-4 border-1 shadow-sm">
          <Card.Body className="p-3 p-md-4">
            <Form onSubmit={handleSearch}>
              <Row className="align-items-end mb-3">
                <Col>
                  <Form.Label className="fw-medium text-dark">Término de búsqueda</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <FiSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Buscar por nombre, apellido, DNI o domicilio..."
                      value={searchQuery}
                      onChange={handleInputChange}
                      className="border-start-0 ps-0"
                    />
                  </InputGroup>
                </Col>
              </Row>

              <div className="d-flex align-items-center mb-3">
                <Button 
                  type="button"
                  variant="link"
                  className="p-0 text-decoration-none"
                  onClick={() => setShowDescription(!showDescription)}
                >
                  <FiFilter className="me-1" /> 
                  {showDescription ? 'Ocultar información' : 'Mostrar información de búsqueda'}
                </Button>
              </div>

              {showDescription && (
                <Alert variant="info" className="mb-3 p-2 p-md-3">
                  <h6 className="fw-bold mb-2 mb-md-2">Cómo buscar</h6>
                  <p className="mb-1 small">Puedes buscar personas usando:</p>
                  <ul className="mb-0 small ps-3 ps-md-4">
                    <li>Nombre o apellido</li>
                    <li>Número de documento</li>
                    <li>Tipo de documento</li>
                    <li>Domicilio</li>
                  </ul>
                </Alert>
              )}

              <div className="d-flex">
                <Button 
                  type="submit" 
                  variant="dark"
                  className="px-3 px-md-4"
                  size="sm"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-1 me-md-2" />
                      <span className="d-none d-sm-inline">Buscando...</span>
                      <span className="d-inline d-sm-none">...</span>
                    </>
                  ) : (
                    <>
                      <FiSearch className="me-1 me-md-2" />
                      <span className="d-none d-sm-inline">Buscar</span>
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="light" 
                  size="sm"
                  className="ms-2"
                  onClick={handleClearSearch}
                  disabled={isSearching || (!searchQuery && !searchPerformed)}
                >
                  <FiX className="me-1" />
                  <span className="d-none d-sm-inline">Limpiar</span>
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

            {/* Resultados de búsqueda */}
        {searchPerformed && (
          <Card className="border-1 shadow-sm">
            <Card.Header className="bg-light border-1 py-2 py-md-3 px-3 px-md-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark fs-6 fs-md-5">Resultados de Búsqueda</h5>
                <Badge bg="dark" pill className="px-2 px-md-3 py-1 py-md-2" style={{ fontSize: '0.7rem' }}>
                  {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
                </Badge>
              </div>
            </Card.Header>            {isSearching ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="dark" />
                <p className="mt-3 text-muted">Buscando personas...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="table-responsive">
                  <Table hover responsive className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Nombre Completo</th>
                        <th className="d-none d-md-table-cell">Documento</th>
                        <th className="d-none d-md-table-cell">Ubicación</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResults.map(person => (
                        <tr key={person.person_id}>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-light p-1 p-md-2 me-2">
                                <FiUser size={16} className="text-muted" />
                              </div>
                              <div>
                                <div className="fw-medium text-dark">{person.names} {person.lastnames}</div>
                                <div className="small text-muted d-none d-md-block">ID: {person.person_id}</div>
                                <div className="small text-muted d-block d-md-none">
                                  {person.identification_type} {person.identification}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="align-middle d-none d-md-table-cell">
                            <Badge bg="dark" className="py-1 px-2">
                              {person.identification_type} {person.identification}
                            </Badge>
                          </td>
                          <td className="align-middle d-none d-md-table-cell">
                            <div className="d-flex align-items-center">
                              <FiHome className="text-muted me-2" />
                              <span>
                                {person.address ? person.address + ', ' : ''} 
                                {person.province}, {person.country}
                              </span>
                            </div>
                          </td>
                          <td className="align-middle">
                            <div className="d-flex gap-1 gap-md-2">
                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => handleViewPerson(person.person_id)}
                                title="Ver detalles"
                                className="p-1 p-md-2 d-flex align-items-center justify-content-center"
                                style={{ width: '28px', height: '28px' }}
                              >
                                <FiEye size={14} />
                              </Button>
                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => handleEditPerson(person.person_id)}
                                title="Editar"
                                className="p-1 p-md-2 d-flex align-items-center justify-content-center"
                                style={{ width: '28px', height: '28px' }}
                              >
                                <FiEdit size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {renderPagination()}
              </>
            ) : (
              <Alert variant="info" className="m-2 m-md-4">
                <div className="d-flex align-items-center">
                  <FiSearch className="me-2 me-md-3" size={isMobile ? 20 : 24} />
                  <div>
                    <p className="mb-0 fw-bold">No se encontraron resultados</p>
                    <p className="mb-0 small">Intenta con otros términos de búsqueda.</p>
                  </div>
                </div>
              </Alert>
            )}
          </Card>
        )}
      </Container>
    </DashboardLayout>
  );
}