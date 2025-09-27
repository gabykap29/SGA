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
  const resultsPerPage = 10;

  // Comprobar autenticación
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
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
      console.log('Resultado de búsqueda:', result);
      
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
    
    // Page numbers
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
    
    // Next button
    pageItems.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
      />
    );

    return <Pagination className="justify-content-center mt-4">{pageItems}</Pagination>;
  };

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cuadro de título */}
        <div className="mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <h2 className="fw-bold text-dark mb-2">Buscar Personas</h2>
          <p className="text-muted lead mb-0">
            ➜ Encuentra personas por nombre, DNI o domicilio
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <Card className="mb-4 border-1 shadow-sm">
          <Card.Body className="p-4">
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
                <Alert variant="info" className="mb-3">
                  <h6 className="fw-bold">Cómo buscar</h6>
                  <p className="mb-1 small">Puedes buscar personas usando:</p>
                  <ul className="mb-0 small">
                    <li>Nombre o apellido (ej: "Juan Pérez")</li>
                    <li>Número de documento (ej: "38654321")</li>
                    <li>Tipo de documento (ej: "DNI")</li>
                    <li>Domicilio o parte del mismo (ej: "San Martin")</li>
                  </ul>
                </Alert>
              )}

              <div className="d-flex">
                <Button 
                  type="submit" 
                  variant="dark"
                  className="px-4"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <FiSearch className="me-2" />
                      Buscar
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="light" 
                  className="ms-2"
                  onClick={handleClearSearch}
                  disabled={isSearching || (!searchQuery && !searchPerformed)}
                >
                  <FiX className="me-1" />
                  Limpiar
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Resultados de búsqueda */}
        {searchPerformed && (
          <Card className="border-1 shadow-sm">
            <Card.Header className="bg-light border-1 py-3 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">Resultados de Búsqueda</h5>
                <Badge bg="dark" pill className="px-3 py-2">
                  {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
                </Badge>
              </div>
            </Card.Header>
            
            {isSearching ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="dark" />
                <p className="mt-3 text-muted">Buscando personas...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Nombre Completo</th>
                        <th>Documento</th>
                        <th>Ubicación</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResults.map(person => (
                        <tr key={person.person_id}>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-light p-2 me-2">
                                <FiUser size={18} className="text-muted" />
                              </div>
                              <div>
                                <div className="fw-medium text-dark">{person.names} {person.lastnames}</div>
                                <div className="small text-muted">ID: {person.person_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="align-middle">
                            <Badge bg="dark" className="py-1 px-2">
                              {person.identification_type} {person.identification}
                            </Badge>
                          </td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <FiHome className="text-muted me-2" />
                              <span>
                                {person.address ? person.address + ', ' : ''} 
                                {person.province}, {person.country}
                              </span>
                            </div>
                          </td>
                          <td className="align-middle">
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => handleViewPerson(person.person_id)}
                                title="Ver detalles"
                              >
                                <FiEye size={14} />
                              </Button>
                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => handleEditPerson(person.person_id)}
                                title="Editar"
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
              <Alert variant="info" className="m-4">
                <div className="d-flex align-items-center">
                  <FiSearch className="me-3" size={24} />
                  <div>
                    <p className="mb-0 fw-bold">No se encontraron resultados</p>
                    <p className="mb-0 small">Intenta con otros términos de búsqueda como nombre, apellido, DNI o domicilio.</p>
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