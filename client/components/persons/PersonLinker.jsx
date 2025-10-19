'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Alert, InputGroup } from 'react-bootstrap';
import { 
  FiSearch, 
  FiPlus, 
  FiLink, 
  FiXCircle, 
  FiEye,
  FiUsers,
  FiUser,
  FiInfo,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import personService from '../../services/personService';

const PersonLinker = ({ personId, linkedPersons = [], onLink, onUnlink, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [relationshipType, setRelationshipType] = useState('GRUPO_CRIMINAL');

  useEffect(() => {
    filterPersons();
  }, [searchResults, showOnlyAvailable, linkedPersons]);

  const handleSearch = async (searchQuery = searchTerm) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    setIsSearching(true);
    setSearchPerformed(true);
    
    try {
      const result = await personService.searchPersons(searchQuery);
      if (result.success) {
        // Filtrar la propia persona
        const filtered = result.data.filter(person => 
          person.person_id !== personId
        );
        setSearchResults(filtered);
        
        if (filtered.length === 0) {
          toast.info('No se encontraron personas con ese criterio de búsqueda');
        }
      } else {
        toast.error(result.error || 'Error al buscar personas');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching persons:', error);
      toast.error('Error al buscar personas');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filterPersons = () => {
    let filtered = searchResults;

    // Mostrar solo disponibles (no vinculados)
    if (showOnlyAvailable) {
      const linkedIds = linkedPersons.map(person => person.person_id);
      filtered = filtered.filter(person => !linkedIds.includes(person.person_id));
    }

    setFilteredPersons(filtered);
  };

  const handleSelectPerson = (person) => {
    setSelectedPersons(prev => {
      const isSelected = prev.find(p => p.person_id === person.person_id);
      if (isSelected) {
        return prev.filter(p => p.person_id !== person.person_id);
      } else {
        return [...prev, person];
      }
    });
  };

  const handleLinkSelected = async () => {
    if (selectedPersons.length === 0) {
      toast.warning('Seleccione al menos una persona para vincular');
      return;
    }

    onLink(selectedPersons, relationshipType);
    setSelectedPersons([]);
  };

  const formatIdentification = (person) => {
    return `${person.identification_type} ${person.identification}`;
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-1">Vincular con Otras Personas</h5>
            <p className="text-muted small mb-0">
              Establezca vínculos con otras personas registradas en el sistema
            </p>
          </div>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => handleSearch()}
            disabled={isSearching}
          >
            <FiRefreshCw className="me-1" /> {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        <Row className="mb-4 g-3">
          <Col lg={6}>
            <Form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nombre, apellido o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button 
                  variant="dark" 
                  type="submit" 
                  disabled={isSearching}
                >
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </Button>
              </InputGroup>
            </Form>
          </Col>
          <Col lg={3}>
            <Form.Select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
            >
              <optgroup label="Relaciones Personales">
                <option value="FAMILIAR">Familiar</option>
                <option value="AMIGO">Amigo</option>
                <option value="CONOCIDO">Conocido</option>
                <option value="COLEGA">Colega</option>
              </optgroup>
              <optgroup label="Relaciones Criminales">
                <option value="GRUPO_CRIMINAL">Grupo Criminal</option>
                <option value="JEFE_BANDA">Jefe de Banda</option>
                <option value="MIEMBRO_ORGANIZACION">Miembro de Organización</option>
                <option value="COMPLICE">Cómplice</option>
                <option value="LIDER_PANDILLA">Líder de Pandilla</option>
                <option value="VICTIMA">Víctima</option>
                <option value="TESTIGO">Testigo</option>
              </optgroup>
              <option value="OTRO">Otro</option>
            </Form.Select>
          </Col>
          <Col lg={3}>
            <Form.Check
              type="switch"
              id="showOnlyAvailable"
              label="Solo mostrar no vinculadas"
              checked={showOnlyAvailable}
              onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className="mt-2"
            />
          </Col>
        </Row>

        {isSearching ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Buscando...</span>
            </div>
            <p className="mt-3 text-muted">Buscando personas...</p>
          </div>
        ) : !searchPerformed ? (
          <Alert variant="info" className="mb-0">
            <FiInfo className="me-2" /> 
            Ingrese un criterio de búsqueda para encontrar personas y vincularlas.
          </Alert>
        ) : filteredPersons.length === 0 ? (
          <Alert variant="warning" className="mb-0">
            <FiInfo className="me-2" /> 
            No se encontraron personas que coincidan con la búsqueda "{searchTerm}".
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th width="50">
                    <Form.Check type="checkbox" onChange={() => {}} />
                  </th>
                  <th>Nombre</th>
                  <th>Identificación</th>
                  <th>Ubicación</th>
                  <th width="100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersons.map(person => {
                  const isSelected = selectedPersons.some(p => p.person_id === person.person_id);
                  const isLinked = linkedPersons.some(p => p.person_id === person.person_id);
                  
                  return (
                    <tr 
                      key={person.person_id} 
                      className={isSelected ? 'table-primary' : isLinked ? 'table-light' : ''}
                    >
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !isLinked && handleSelectPerson(person)}
                          disabled={isLinked}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2"
                            style={{ width: '40px', height: '40px' }}
                          >
                            <FiUser className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-medium">
                              {person.names} {person.lastnames}
                            </div>
                            {isLinked && (
                              <Badge bg="success" pill className="mt-1">Vinculado</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{formatIdentification(person)}</td>
                      <td>
                        <small className="text-muted">
                          {person.province}, {person.country}
                        </small>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="text-primary btn-sm p-0 me-2"
                          onClick={() => window.open(`/dashboard/personas/${person.person_id}`, '_blank')}
                        >
                          <FiEye />
                        </Button>
                        {isLinked ? (
                          <Button
                            variant="link"
                            className="text-danger btn-sm p-0"
                            onClick={() => onUnlink(person)}
                            disabled={loading}
                          >
                            <FiXCircle />
                          </Button>
                        ) : (
                          <Button
                            variant="link"
                            className="text-success btn-sm p-0"
                            onClick={() => handleSelectPerson(person)}
                            disabled={loading}
                          >
                            <FiPlus />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

        {linkedPersons.length > 0 && (
          <div className="mt-4">
            <h6 className="fw-bold mb-3">
              <FiUsers className="me-2" /> Personas Vinculadas ({linkedPersons.length})
            </h6>
            <div className="table-responsive">
              <Table bordered hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Identificación</th>
                    <th>Tipo de Vínculo</th>
                    <th width="100">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedPersons.map(person => (
                    <tr key={person.person_id}>
                      <td>
                        <div className="fw-medium">{person.names} {person.lastnames}</div>
                      </td>
                      <td>{formatIdentification(person)}</td>
                      <td>
                        <Badge 
                          bg={
                            // Relaciones personales
                            person.relationship === 'FAMILIAR' ? 'info' : 
                            person.relationship === 'AMIGO' ? 'success' : 
                            person.relationship === 'CONOCIDO' ? 'warning' :
                            person.relationship === 'COLEGA' ? 'primary' :
                            // Relaciones criminales 
                            person.relationship === 'GRUPO_CRIMINAL' ? 'danger' :
                            person.relationship === 'JEFE_BANDA' ? 'danger' :
                            person.relationship === 'MIEMBRO_ORGANIZACION' ? 'danger' :
                            person.relationship === 'COMPLICE' ? 'dark' :
                            person.relationship === 'LIDER_PANDILLA' ? 'danger' :
                            person.relationship === 'VICTIMA' ? 'warning' :
                            person.relationship === 'TESTIGO' ? 'info' :
                            'secondary'
                          }
                          pill
                        >
                          {person.relationship || 'No especificado'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="link"
                          className="text-danger btn-sm p-0"
                          onClick={() => onUnlink(person)}
                          disabled={loading}
                        >
                          <FiXCircle />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {selectedPersons.length > 0 && (
          <div className="mt-4 d-flex justify-content-end">
            <Button
              variant="success"
              className="d-flex align-items-center"
              onClick={handleLinkSelected}
              disabled={loading}
            >
              <FiLink className="me-2" />
              Vincular {selectedPersons.length} persona{selectedPersons.length !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PersonLinker;