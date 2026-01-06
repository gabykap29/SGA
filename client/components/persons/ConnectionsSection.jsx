'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Form, Table, Badge, Alert, InputGroup, Spinner } from 'react-bootstrap';
import {
  FiSearch,
  FiPlus,
  FiLink,
  FiXCircle,
  FiEye,
  FiUsers,
  FiUser,
  FiRefreshCw,
  FiMapPin,
  FiCreditCard,
  FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import personService from '../../services/personService';
import { useLogin } from '../../hooks/useLogin';
import Link from 'next/link';

const ConnectionsSection = ({ personId, refreshKey, onRefresh }) => {
  const { isView } = useLogin();
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
      // Buscar por DNI/Identificación específicamente
      const result = await personService.searchPersonByDniForLinker(searchQuery);
      if (result.success) {
        // Filtrar la propia persona
        const data = result.data;
        const person = Array.isArray(data) ? data[0] : data;

        if (person) {
          if (person.person_id !== personId) {
            setSearchResults([person]);
          } else {
            setSearchResults([]);
            toast.info('No puede vincularse a sí mismo');
          }
        } else {
          setSearchResults([]);
          toast.warning('No se encontraron datos válidos');
        }
      } else {
        toast.error(result.error || 'Persona no encontrada con ese DNI');
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
            <tr key={person.connection_id || person.person_id}>
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
                    person.connection_type === 'FAMILIAR' ? 'info' :
                      person.connection_type === 'AMIGO' ? 'success' :
                        person.connection_type === 'COLEGA' ? 'primary' :
                          person.connection_type === 'SOCIO' ? 'secondary' :
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
                    <Button variant="outline-primary" size="sm" title="Ver detalles">
                      <FiEye size={14} />
                    </Button>
                  </Link>

                  {!isView && (
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
                  )}
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
      <Card className="border shadow-sm h-100">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Buscar y Vincular</h6>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowLinkForm(false)}
          >
            <FiXCircle size={16} />
          </Button>
        </Card.Header>
        <Card.Body className="d-flex flex-column" style={{ height: '100%' }}>
          {/* Tipo de relación */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium small">Tipo de Relación</Form.Label>
            <Form.Select
              size="sm"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
            >
              <optgroup label="Relaciones Familiares">
                <option value="PADRE/MADRE">Padre/Madre</option>
                <option value="HERMANO">Hermano</option>
                <option value="HERMANA">Hermana</option>
                <option value="HIJO">Hijo</option>
                <option value="HIJA">Hija</option>
                <option value="ABUELO">Abuelo</option>
                <option value="ABUELA">Abuela</option>
                <option value="NIETO">Nieto</option>
                <option value="NIETA">Nieta</option>
                <option value="TIO">Tío</option>
                <option value="TIA">Tía</option>
                <option value="SOBRINO">Sobrino</option>
                <option value="SOBRINA">Sobrina</option>
                <option value="PRIMO">Primo</option>
                <option value="PRIMA">Prima</option>
                <option value="ESPOSO">Esposo</option>
                <option value="ESPOSA">Esposa</option>
                <option value="SUEGRO">Suegro</option>
                <option value="SUEGRA">Suegra</option>
                <option value="CUÑADO">Cuñado</option>
                <option value="CUÑADA">Cuñada</option>
                <option value="PADRINO">Padrino</option>
                <option value="MADRINA">Madrina</option>
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
              <optgroup label="Relaciones Personales">
                <option value="AMIGO">Amigo</option>
                <option value="AMIGA">Amiga</option>
                <option value="CONOCIDO">Conocido</option>
                <option value="CONOCIDA">Conocida</option>
                <option value="COLEGA">Colega</option>
                <option value="COMPAÑERO">Compañero</option>
                <option value="COMPAÑERA">Compañera</option>
              </optgroup>
              <option value="OTRO">Otro</option>
            </Form.Select>
          </Form.Group>

          {/* Buscador */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium small">DNI/Identificación</Form.Label>
            <Form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <InputGroup size="sm">
                <InputGroup.Text className="ps-2">
                  <FiSearch size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Ingrese DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
                <Button
                  variant="dark"
                  type="submit"
                  disabled={isSearching}
                  className="px-2"
                >
                  {isSearching ? <Spinner animation="border" size="sm" /> : 'Buscar'}
                </Button>
              </InputGroup>
            </Form>
          </Form.Group>

          {/* Resultados */}
          <Form.Group className="flex-grow-1 mb-3">
            <Form.Label className="fw-medium small">Resultados</Form.Label>
            <div className="border rounded overflow-auto" style={{ maxHeight: '300px', minHeight: '200px' }}>
              {isSearching ? (
                <div className="text-center py-5">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <p className="text-muted mt-2 small">Buscando...</p>
                </div>
              ) : !searchPerformed ? (
                <div className="text-center py-5 text-muted">
                  <FiSearch size={24} className="mb-2 d-block" />
                  <p className="mb-0 small">Busque una persona por DNI</p>
                </div>
              ) : filteredPersons.length === 0 ? (
                <div className="text-center py-3 text-muted">
                  <p className="mb-0 small">No se encontraron personas</p>
                </div>
              ) : (
                <Table hover className="mb-0 small">
                  <tbody>
                    {filteredPersons.map(person => {
                      const isSelected = selectedPersons.some(p => p.person_id === person.person_id);
                      return (
                        <tr
                          key={person.person_id}
                          onClick={() => handleSelectPerson(person)}
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          className={isSelected ? 'bg-primary bg-opacity-10 border-start border-4 border-primary' : 'hover-shadow'}
                        >
                          <td style={{ width: '50px' }} className="align-middle text-center ps-3">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center ${isSelected ? 'bg-primary text-white' : 'bg-light text-secondary'}`}
                              style={{ width: '40px', height: '40px' }}
                            >
                              {isSelected ? <FiCheckCircle size={20} /> : <FiUser size={20} />}
                            </div>
                          </td>
                          <td className="align-middle py-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <h6 className="mb-0 fw-bold text-dark">
                                {person.lastnames}, {person.names}
                              </h6>
                              <Badge bg="light" text="dark" className="border text-muted fw-normal">
                                <FiCreditCard size={12} className="me-1" />
                                {person.identification}
                              </Badge>
                            </div>
                            <div className="text-muted small d-flex align-items-center text-truncate">
                              <FiMapPin size={12} className="me-1 text-secondary" />
                              <span className="me-1">{person.address}</span>
                              {person.province && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="fst-italic">{person.province}</span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </div>
          </Form.Group>

          {/* Selección y acciones */}
          <div className="pt-3 border-top">
            <div className="mb-2">
              {selectedPersons.length > 0 && (
                <div className="mb-2 small">
                  <Badge bg="primary">
                    {selectedPersons.length} seleccionada(s)
                  </Badge>
                </div>
              )}
            </div>
            <Button
              variant="success"
              size="sm"
              className="w-100 mb-2"
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
                  <FiLink className="me-1" /> Vincular
                </>
              )}
            </Button>
            {selectedPersons.length > 0 && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100"
                onClick={() => setSelectedPersons([])}
              >
                Limpiar
              </Button>
            )}
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

          {!isView && (
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center"
              onClick={() => setShowLinkForm(!showLinkForm)}
            >
              <FiPlus size={16} className="me-1" />
              Agregar Conexión
            </Button>
          )}
        </div>
      </div>

      <div className="row">
        <div className={showLinkForm ? 'col-md-6' : 'col-12'}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <FiUsers className="me-2" />
                Personas Vinculadas
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              {renderLinkedPersonsTable()}
            </Card.Body>
          </Card>
        </div>

        {showLinkForm && (
          <div className="col-md-6">
            {renderLinkForm()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsSection;