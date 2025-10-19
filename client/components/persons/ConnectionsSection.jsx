'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { 
  FiSearch, 
  FiPlus, 
  FiLink, 
  FiXCircle, 
  FiEye,
  FiUsers,
  FiUser,
  FiFilter,
  FiRefreshCw,
  FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import personService from '../../services/personService';
import Link from 'next/link';

const ConnectionsSection = ({ personId, refreshKey, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [linkedPersons, setLinkedPersons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredPersons, setFilteredPersons] = useState([]);
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [relationshipType, setRelationshipType] = useState('GRUPO_CRIMINAL');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState({});

  // Cargar personas vinculadas al iniciar
  useEffect(() => {
    if (personId) {
      loadLinkedPersons();
    }
  }, [personId, refreshKey]);

  // Filtrar personas disponibles cuando cambien los resultados de búsqueda
  useEffect(() => {
    filterPersons();
  }, [searchResults, linkedPersons]);

  const loadLinkedPersons = async () => {
    setLoading(true);
    try {
      const result = await personService.getLinkedPersons(personId);
      if (result.success) {
        setLinkedPersons(result.data);
      } else {
        toast.error(result.error || 'Error al cargar personas vinculadas');
        setLinkedPersons([]);
      }
    } catch (error) {
      console.error('Error loading linked persons:', error);
      toast.error('Error al cargar personas vinculadas');
      setLinkedPersons([]);
    } finally {
      setLoading(false);
    }
  };

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

    // Filtrar personas ya vinculadas
    const linkedIds = linkedPersons.map(person => person.person_id);
    filtered = filtered.filter(person => !linkedIds.includes(person.person_id));
    
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

  const handleLinkPersons = async () => {
    if (selectedPersons.length === 0) {
      toast.warning('Seleccione al menos una persona para vincular');
      return;
    }

    setLoading(true);
    try {
      const result = await personService.linkPersons(personId, selectedPersons, relationshipType);
      
      if (result.success) {
        toast.success(`${result.data.length} personas vinculadas correctamente`);
        setSelectedPersons([]);
        loadLinkedPersons(); // Recargar la lista de personas vinculadas
        
        // Si hay advertencias, mostrarlas
        if (result.warnings && result.warnings.length > 0) {
          toast.warning(`Algunas personas no pudieron ser vinculadas: ${result.warnings.length}`);
        }
        
        // Ocultar el formulario de vinculación
        setShowLinkForm(false);
      } else {
        toast.error(result.error || 'Error al vincular personas');
      }
    } catch (error) {
      console.error('Error linking persons:', error);
      toast.error('Error de conexión al vincular personas');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkPerson = async (linkedPersonId) => {
    setUnlinkLoading(prev => ({ ...prev, [linkedPersonId]: true }));
    
    try {
      const result = await personService.unlinkPerson(personId, linkedPersonId);
      
      if (result.success) {
        toast.success('Persona desvinculada correctamente');
        loadLinkedPersons(); // Recargar la lista de personas vinculadas
        
        // Si existe una función de refresco externa, llamarla
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(result.error || 'Error al desvincular persona');
      }
    } catch (error) {
      console.error('Error unlinking person:', error);
      toast.error('Error de conexión al desvincular persona');
    } finally {
      setUnlinkLoading(prev => ({ ...prev, [linkedPersonId]: false }));
    }
  };

  const renderLinkedPersonsTable = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Cargando personas vinculadas...</p>
        </div>
      );
    }

    if (linkedPersons.length === 0) {
      return (
        <Alert variant="info" className="mb-0">
          <div className="d-flex align-items-center">
            <FiUsers size={20} className="me-2" />
            <div>
              <p className="mb-0">Esta persona no tiene conexiones con otras personas.</p>
              <p className="mb-0 small">Utilice el botón "Agregar conexión" para vincular a otras personas.</p>
            </div>
          </div>
        </Alert>
      );
    }

    return (
      <Table responsive hover className="align-middle">
        <thead className="bg-light">
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Relación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {linkedPersons.map(person => (
            <tr key={person.person_id}>
              <td>
                <div className="d-flex align-items-center">
                  <div className="bg-light rounded-circle p-2 me-2">
                    <FiUser className="text-secondary" size={16} />
                  </div>
                  <div>
                    <div className="fw-medium">{person.names} {person.lastnames}</div>
                    <div className="small text-muted">{person.province}, {person.country}</div>
                  </div>
                </div>
              </td>
              <td>
                <Badge bg="light" text="dark">
                  {person.identification_type} {person.identification}
                </Badge>
              </td>
              <td>
                <Badge 
                  bg={
                    // Relaciones personales
                    person.connection_type === 'FAMILIAR' ? 'info' : 
                    person.connection_type === 'AMIGO' ? 'success' : 
                    person.connection_type === 'COLEGA' ? 'primary' :
                    person.connection_type === 'SOCIO' ? 'secondary' :
                    // Relaciones criminales 
                    person.connection_type === 'GRUPO_CRIMINAL' ? 'danger' :
                    person.connection_type === 'JEFE_BANDA' ? 'danger' :
                    person.connection_type === 'MIEMBRO_ORGANIZACION' ? 'danger' :
                    person.connection_type === 'COMPLICE' ? 'dark' :
                    person.connection_type === 'LIDER_PANDILLA' ? 'danger' :
                    person.connection_type === 'VICTIMA' ? 'warning' :
                    person.connection_type === 'TESTIGO' ? 'info' :
                    'secondary'
                  }
                  className="text-white"
                >
                  {person.connection_type || 'No especificado'}
                </Badge>
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Link href={`/dashboard/personas/${person.person_id}`} passHref>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      title="Ver detalles"
                    >
                      <FiEye size={14} />
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline-danger"
                    size="sm"
                    title="Desvincular persona"
                    onClick={() => handleUnlinkPerson(person.person_id)}
                    disabled={unlinkLoading[person.person_id]}
                  >
                    {unlinkLoading[person.person_id] ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FiXCircle size={14} />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  const renderLinkForm = () => {
    if (!showLinkForm) return null;

    return (
      <Card className="mb-4 border shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Vincular Personas</h6>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowLinkForm(false)}
          >
            <FiXCircle size={16} />
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Buscador */}
          <Row className="mb-3">
            <Col md={7}>
              <Form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                <InputGroup>
                  <InputGroup.Text>
                    <FiSearch />
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
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                      setSearchPerformed(false);
                    }}
                    disabled={!searchTerm}
                  >
                    <FiXCircle />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={5}>
              <Form.Select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
              >
                <optgroup label="Relaciones Personales">
                  <option value="FAMILIAR">Familiar</option>
                  <option value="AMIGO">Amigo</option>
                  <option value="COLEGA">Colega</option>
                  <option value="SOCIO">Socio</option>
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
          </Row>

          {/* Lista de personas disponibles */}
          <div className="border rounded overflow-auto mb-3" style={{ maxHeight: '300px' }}>
            {isSearching ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2">Buscando personas...</p>
              </div>
            ) : !searchPerformed ? (
              <Alert variant="info" className="m-3">
                Ingrese un criterio de búsqueda para encontrar personas y vincularlas.
              </Alert>
            ) : filteredPersons.length === 0 ? (
              <Alert variant="warning" className="m-3">
                No se encontraron personas que coincidan con la búsqueda "{searchTerm}".
              </Alert>
            ) : (
              <Table hover className="mb-0">
                <tbody>
                  {filteredPersons.map(person => {
                    const isSelected = selectedPersons.some(p => p.person_id === person.person_id);
                    return (
                      <tr 
                        key={person.person_id}
                        className={isSelected ? 'table-primary' : ''}
                        onClick={() => handleSelectPerson(person)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="d-flex align-items-center">
                            <div className={`me-2 rounded-circle p-1 ${isSelected ? 'bg-primary text-white' : 'bg-light'}`}>
                              <FiUser size={16} />
                            </div>
                            <div>
                              <div className="fw-medium">{person.names} {person.lastnames}</div>
                              <div className="small text-muted">{person.identification_type} {person.identification}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-end">
                          <Badge bg={isSelected ? 'primary' : 'light'} text={isSelected ? 'white' : 'dark'}>
                            {isSelected ? 'Seleccionado' : 'Click para seleccionar'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
          
          {/* Acciones */}
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <Badge bg="primary" className="me-2">
                {selectedPersons.length} persona(s) seleccionada(s)
              </Badge>
              {selectedPersons.length > 0 && (
                <Button variant="link" size="sm" onClick={() => setSelectedPersons([])}>
                  Limpiar selección
                </Button>
              )}
            </div>
            <Button
              variant="success"
              disabled={selectedPersons.length === 0 || loading}
              onClick={handleLinkPersons}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Vinculando...
                </>
              ) : (
                <>
                  <FiLink className="me-2" /> Vincular Personas
                </>
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Conexiones con Otras Personas</h5>
        
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={loadLinkedPersons}
            disabled={loading}
            title="Actualizar"
          >
            <FiRefreshCw size={16} />
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center"
            onClick={() => setShowLinkForm(!showLinkForm)}
          >
            <FiPlus size={16} className="me-1" />
            Agregar Conexión
          </Button>
        </div>
      </div>

      {renderLinkForm()}
      {renderLinkedPersonsTable()}
    </div>
  );
};

export default ConnectionsSection;