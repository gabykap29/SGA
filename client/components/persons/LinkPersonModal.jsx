'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert, Table, Badge, InputGroup, Row, Col } from 'react-bootstrap';
import { FiSearch, FiLink, FiX, FiUser, FiTag } from 'react-icons/fi';
import personService from '../../services/personService'; 
import recordService from '../../services/recordService'; 
import { toast } from 'react-toastify';

const LinkPersonModal = ({ show, onHide, recordId, onPersonLinked, currentLinkedPersons = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [persons, setPersons] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [linkingPerson, setLinkingPerson] = useState(null);
  const [typeRelationship, setTypeRelationship] = useState('Denunciado');

  // Limpiar el estado cuando se abre/cierra el modal
  useEffect(() => {
    if (show) {
      setSearchQuery('');
      setPersons([]);
      setSearchPerformed(false);
    }
  }, [show]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.warning('Ingrese un criterio de búsqueda');
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchPerformed(true);
      
      const result = await personService.searchPersons(searchQuery);
      
      if (result.success) {
        // Filtrar personas que ya están vinculadas al antecedente
        const linkedPersonIds = currentLinkedPersons.map(rel => rel.person_id);
        const filteredPersons = result.data.filter(person => !linkedPersonIds.includes(person.person_id));
        
        setPersons(filteredPersons);
        
        if (filteredPersons.length === 0 && result.data.length > 0) {
          toast.info('Todas las personas encontradas ya están vinculadas a este antecedente');
        }
      } else {
        toast.error(result.error || 'Error al buscar personas');
        setPersons([]);
      }
    } catch (error) {
      console.error('Error searching persons:', error);
      toast.error('Error inesperado al buscar personas');
      setPersons([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkPerson = async (personId) => {
    try {
      setLinkingPerson(personId);
      
      const result = await recordService.linkPersonToRecord(personId, recordId, typeRelationship);
      
      if (result.success) {
        toast.success('Persona vinculada exitosamente');
        // Actualizar la lista de personas
        setPersons(prev => prev.filter(p => p.id !== personId));
        // Notificar al componente padre
        if (onPersonLinked) {
          onPersonLinked();
        }
      } else {
        toast.error(result.error || 'Error al vincular la persona');
      }
    } catch (error) {
      console.error('Error linking person:', error);
      toast.error('Error inesperado al vincular la persona');
    } finally {
      setLinkingPerson(null);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      backdrop="static"
      size="lg"
      centered
    >
      <Modal.Header className="border-0 pb-0">
        <Modal.Title as="h5" className="fw-bold text-dark">
          Vincular Persona Existente
        </Modal.Title>
        <Button 
          variant="link" 
          onClick={onHide} 
          className="text-dark ms-auto p-0"
        >
          <FiX size={20} />
        </Button>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-4">
          Busque una persona existente para vincularla con este antecedente.
        </p>

        <Row className="mb-3">
          <Col md={12}>
            <Form.Group>
              <Form.Label className="fw-medium text-dark">
                Tipo de Relación <span className="text-danger">*</span>
              </Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiTag className="text-muted" />
                </InputGroup.Text>
                <Form.Select
                  value={typeRelationship}
                  onChange={(e) => setTypeRelationship(e.target.value)}
                  className="border-start-0"
                >
                  <option value="Denunciado">Denunciado</option>
                  <option value="Denunciante">Denunciante</option>
                  <option value="Testigo">Testigo</option>
                  <option value="Víctima">Víctima</option>
                  <option value="Otro">Otro</option>
                </Form.Select>
              </InputGroup>
              <Form.Text className="text-muted">
                Seleccione el tipo de relación que tiene la persona con este antecedente
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Form onSubmit={handleSearch}>
          <InputGroup className="mb-4">
            <InputGroup.Text className="bg-light border-end-0">
              <FiSearch className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre, apellido o número de documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-start-0 ps-0"
            />
            <Button 
              variant="dark" 
              type="submit" 
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Buscando...
                </>
              ) : (
                'Buscar'
              )}
            </Button>
          </InputGroup>
        </Form>
            
        <div>
          {isSearching ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="dark" />
              <p className="mt-3 text-muted">Buscando personas...</p>
            </div>
          ) : searchPerformed ? (
            persons.length > 0 ? (
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
                    {persons.map(person => (
                      <tr key={person.id}>
                        <td>{person.names} {person.lastnames}</td>
                        <td>
                          <Badge bg="dark" className="py-1 px-2">
                            {person.identification_type} {person.identification}
                          </Badge>
                        </td>
                        <td>{person.province || ''}, {person.country || ''}</td>
                        <td>
                          <Button
                            variant="dark"
                            size="sm"
                            onClick={() => handleLinkPerson(person.id)}
                            disabled={linkingPerson === person.id}
                          >
                            {linkingPerson === person.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <>
                                <FiLink className="me-1" />
                                Vincular
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <Alert variant="info">
                <div className="d-flex align-items-center">
                  <FiSearch className="me-3" size={24} />
                  <div>
                    <p className="mb-0 fw-bold">No se encontraron resultados</p>
                    <p className="mb-0 small">Intente con otro término de búsqueda o cree una nueva persona.</p>
                  </div>
                </div>
              </Alert>
            )
          ) : (
            <div className="text-center py-5 bg-light rounded">
              <div className="mb-3">
                <FiSearch size={40} className="text-muted" />
              </div>
              <h5 className="text-dark">Busque una persona para vincular</h5>
              <p className="text-muted mb-0">
                Ingrese un nombre, apellido o número de documento para comenzar la búsqueda
              </p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LinkPersonModal;