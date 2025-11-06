'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Alert, InputGroup, Modal } from 'react-bootstrap';
import { 
  FiSearch, 
  FiPlus, 
  FiLink, 
  FiXCircle, 
  FiEye,
  FiCalendar,
  FiUser,
  FiFileText,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import recordService from '../../services/recordService';
import { useLogin } from '../../hooks/useLogin';

const AntecedentLinker = ({ personId, linkedAntecedents = [], onLink, onUnlink, loading = false }) => {
  const { isView } = useLogin();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableAntecedents, setAvailableAntecedents] = useState([]);
  const [filteredAntecedents, setFilteredAntecedents] = useState([]);
  const [selectedAntecedents, setSelectedAntecedents] = useState([]);
  const [loadingAntecedents, setLoadingAntecedents] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAntecedentDetail, setSelectedAntecedentDetail] = useState(null);



  useEffect(() => {
    loadAntecedents();
  }, []);

  useEffect(() => {
    filterAntecedents();
  }, [searchTerm, showOnlyAvailable, availableAntecedents, linkedAntecedents]);

  const loadAntecedents = async () => {
    setLoadingAntecedents(true);
    try {
      const result = await recordService.getRecords();
      if (result.success) {
        setAvailableAntecedents(result.data);
      } else {
        toast.error(result.error || 'Error al cargar antecedentes');
        setAvailableAntecedents([]);
      }
    } catch (error) {
      console.error('Error loading antecedents:', error);
      toast.error('Error al cargar antecedentes');
      setAvailableAntecedents([]);
    } finally {
      setLoadingAntecedents(false);
    }
  };

  const filterAntecedents = () => {
    let filtered = availableAntecedents;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(ant => 
        ant.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ant.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ant.observations?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Mostrar solo disponibles (no vinculados)
    if (showOnlyAvailable) {
      const linkedIds = linkedAntecedents.map(ant => ant.record_id || ant.id);
      filtered = filtered.filter(ant => !linkedIds.includes(ant.record_id || ant.id));
    }

    setFilteredAntecedents(filtered);
  };

  const handleSelectAntecedent = (antecedent) => {
    const antecedentId = antecedent.record_id || antecedent.id;
    setSelectedAntecedents(prev => {
      const isSelected = prev.find(ant => (ant.record_id || ant.id) === antecedentId);
      if (isSelected) {
        return prev.filter(ant => (ant.record_id || ant.id) !== antecedentId);
      } else {
        return [...prev, antecedent];
      }
    });
  };

  const handleLinkSelected = async () => {
    if (selectedAntecedents.length === 0) {
      toast.warning('Seleccione al menos un antecedente para vincular');
      return;
    }

    if (!personId) {
      toast.error('Debe crear la persona primero');
      return;
    }

    try {
      // Vincular cada antecedente uno por uno en lugar de enviar todos juntos
      let successCount = 0;
      let errorCount = 0;

      for (const antecedent of selectedAntecedents) {
        try {
          await onLink(antecedent);
          successCount++;
        } catch (error) {
          console.error('Error vinculando antecedente:', error);
          errorCount++;
        }
      }

      setSelectedAntecedents([]);
      
      if (successCount > 0) {
        toast.success(`${successCount} antecedente(s) vinculado(s) exitosamente`);
      }
      if (errorCount > 0) {
        toast.error(`Error al vincular ${errorCount} antecedente(s)`);
      }
    } catch (error) {
      console.error('Error general al vincular antecedentes:', error);
      toast.error('Error al vincular antecedentes');
    }
  };

  const handleUnlinkAntecedent = async (antecedent) => {
    try {
      await onUnlink(antecedent);
      toast.success('Antecedente desvinculado exitosamente');
    } catch (error) {
      toast.error('Error al desvincular antecedente');
    }
  };

  const handleViewDetails = (antecedent) => {
    setSelectedAntecedentDetail(antecedent);
    setShowDetailsModal(true);
  };



  return (
    <div>
      {!personId && (
        <Alert variant="warning" className="mb-4">
          <strong>⚠️ Atención:</strong> Debe completar el paso anterior (crear persona) antes de vincular antecedentes.
        </Alert>
      )}

      {/* Antecedentes ya vinculados */}
      {linkedAntecedents.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0 fw-bold">
              <FiLink className="me-2" />
              Antecedentes Vinculados ({linkedAntecedents.length})
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Contenido</th>
                  <th>Fecha</th>
                  <th width="120">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {linkedAntecedents.map((antecedent, index) => (
                  <tr key={antecedent.record_id || antecedent.id || index}>
                    <td>
                      <code className="small">{(antecedent.record_id || antecedent.id)?.toString().slice(0, 8)}...</code>
                    </td>
                    <td>
                      <div className="fw-medium">{antecedent.title}</div>
                      {antecedent.observations && (
                        <small className="text-muted">{antecedent.observations}</small>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        {antecedent.content?.substring(0, 100)}{antecedent.content?.length > 100 ? '...' : ''}
                      </small>
                    </td>
                    <td>
                      <FiCalendar size={14} className="me-1" />
                      {new Date(antecedent.date).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          title="Ver detalles"
                          onClick={() => handleViewDetails(antecedent)}
                        >
                          <FiEye size={14} />
                        </Button>
                        {!isView && (
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            title="Desvincular"
                            onClick={() => handleUnlinkAntecedent(antecedent)}
                            disabled={loading}
                          >
                            <FiXCircle size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      {!isView && (
        <Card className="mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0 fw-bold">
              <FiSearch className="me-2" />
              Vincular Nuevos Antecedentes
            </h6>
          </Card.Header>
          <Card.Body>
          <Row>
            <Col md={9}>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar antecedentes por título, contenido u observaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!personId}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <div className="d-flex gap-2">
                <Form.Check
                  type="switch"
                  id="show-available"
                  label="Solo disponibles"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  disabled={!personId}
                />
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={loadAntecedents}
                  disabled={loadingAntecedents || !personId}
                >
                  <FiRefreshCw size={14} />
                </Button>
              </div>
            </Col>
          </Row>

          {/* Botones de acción */}
          {selectedAntecedents.length > 0 && (
            <Alert variant="info" className="d-flex justify-content-between align-items-center">
              <span>
                <strong>{selectedAntecedents.length}</strong> antecedente(s) seleccionado(s)
              </span>
              <div>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="me-2"
                  onClick={() => setSelectedAntecedents([])}
                >
                  Limpiar Selección
                </Button>
                <Button 
                  variant="dark" 
                  size="sm"
                  onClick={handleLinkSelected}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Vinculando...
                    </>
                  ) : (
                    <>
                      <FiLink className="me-2" />
                      Vincular Seleccionados
                    </>
                  )}
                </Button>
              </div>
            </Alert>
          )}
        </Card.Body>
        </Card>
      )}

      {/* Lista de antecedentes disponibles */}
      {!isView && (
        <Card>
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">
              Antecedentes Disponibles
            </h6>
            {loadingAntecedents && (
              <div className="spinner-border spinner-border-sm" />
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {loadingAntecedents ? (
            <div className="text-center py-4">
              <div className="spinner-border mb-3" />
              <p>Cargando antecedentes...</p>
            </div>
          ) : filteredAntecedents.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th width="40">
                      <Form.Check
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAntecedents(filteredAntecedents);
                          } else {
                            setSelectedAntecedents([]);
                          }
                        }}
                        checked={selectedAntecedents.length === filteredAntecedents.length && filteredAntecedents.length > 0}
                        disabled={!personId}
                      />
                    </th>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Contenido</th>
                    <th>Fecha</th>
                    <th>Observaciones</th>
                    <th width="80">Acción</th>
                  </tr>
                </thead>
                <tbody>

                  {filteredAntecedents.map((antecedent) => (
                    <tr key={antecedent.record_id || antecedent.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedAntecedents.find(ant => (ant.record_id || ant.id) === (antecedent.record_id || antecedent.id)) ? true : false}
                          onChange={() => handleSelectAntecedent(antecedent)}
                          disabled={!personId}
                        />
                      </td>
                      <td>
                        <code className="small">{(antecedent.record_id || antecedent.id)?.toString().slice(0, 8)}...</code>
                      </td>
                      <td>
                        <div className="fw-medium">{antecedent.title}</div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {antecedent.content?.substring(0, 80)}{antecedent.content?.length > 80 ? '...' : ''}
                        </small>
                      </td>
                      <td>
                        <FiCalendar size={14} className="me-1" />
                        {new Date(antecedent.date).toLocaleDateString()}
                      </td>
                      <td>
                        <small className="text-muted">
                          {antecedent.observations?.substring(0, 50)}{antecedent.observations?.length > 50 ? '...' : 'Sin observaciones'}
                        </small>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          title="Ver detalles"
                        >
                          <FiEye size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              <FiFileText size={48} className="mb-3 text-muted" />
              <h6>No se encontraron antecedentes</h6>
              <p className="mb-0">
                {searchTerm ? 
                  'No hay antecedentes que coincidan con la búsqueda.' :
                  'No hay antecedentes disponibles para vincular.'
                }
              </p>
            </Alert>
          )}
        </Card.Body>
        </Card>
      )}

      {linkedAntecedents.length === 0 && personId && (
        <Alert variant="info" className="text-center mt-4">
          <FiFileText size={48} className="mb-3 text-muted" />
          <h6>Sin antecedentes vinculados</h6>
          <p className="mb-0">Los antecedentes vinculados a esta persona aparecerán aquí.</p>
        </Alert>
      )}

      {/* Modal de Detalles del Antecedente */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Antecedente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAntecedentDetail && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="mb-3">
                    <label className="fw-bold text-muted small">ID:</label>
                    <p>
                      <code>{selectedAntecedentDetail.record_id || selectedAntecedentDetail.id}</code>
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="fw-bold text-muted small">Fecha:</label>
                    <p>{new Date(selectedAntecedentDetail.date).toLocaleDateString()}</p>
                  </div>
                </Col>
              </Row>

              <div className="mb-3">
                <label className="fw-bold text-muted small">Título:</label>
                <p>{selectedAntecedentDetail.title}</p>
              </div>

              {selectedAntecedentDetail.observations && (
                <div className="mb-3">
                  <label className="fw-bold text-muted small">Observaciones:</label>
                  <p>{selectedAntecedentDetail.observations}</p>
                </div>
              )}

              <div className="mb-3">
                <label className="fw-bold text-muted small">Contenido:</label>
                <div className="p-3 bg-light rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <p className="mb-0">{selectedAntecedentDetail.content}</p>
                </div>
              </div>

              {selectedAntecedentDetail.source && (
                <div className="mb-3">
                  <label className="fw-bold text-muted small">Fuente:</label>
                  <p>{selectedAntecedentDetail.source}</p>
                </div>
              )}

              {selectedAntecedentDetail.severity && (
                <div className="mb-3">
                  <label className="fw-bold text-muted small">Severidad:</label>
                  <p>
                    <Badge 
                      bg={
                        selectedAntecedentDetail.severity === 'high' ? 'danger' : 
                        selectedAntecedentDetail.severity === 'medium' ? 'warning' : 
                        'info'
                      }
                    >
                      {selectedAntecedentDetail.severity}
                    </Badge>
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AntecedentLinker;