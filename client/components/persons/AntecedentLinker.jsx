'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Table, Badge, Alert, InputGroup, Modal } from 'react-bootstrap';
import {
  FiSearch,
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
  
  // Estado para el modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAntecedentDetail, setSelectedAntecedentDetail] = useState(null);
  
  const [typeRelationship, setTypeRelationship] = useState('Denunciado');

  // Filter form state
  const [filterForm, setFilterForm] = useState({
    title: '',
    type_record: '',
    dateFrom: '',
    dateTo: '',
    observations: '',
    content: ''
  });

  const relationshipTypes = [
    { value: 'Denunciado', label: 'Denunciado' },
    { value: 'Denunciante', label: 'Denunciante' },
    { value: 'Testigo', label: 'Testigo' },
    { value: 'Autor', label: 'Autor' },
    { value: 'Victima', label: 'Víctima' },
    { value: 'Sospechoso', label: 'Sospechoso' },
    { value: 'Implicado', label: 'Implicado' },
    { value: 'Querellante', label: 'Querellante' }
  ];

  // Load all antecedents on component mount for quick search
  useEffect(() => {
    loadAntecedents();
  }, []);

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
    } catch (e) {
      console.error('Error loading antecedents:', e);
      toast.error('Error al cargar antecedentes');
      setAvailableAntecedents([]);
    } finally {
      setLoadingAntecedents(false);
    }
  };

  const searchAntecedents = async () => {
    const hasFilters = Object.values(filterForm).some(v => v && v.toString().trim());
    if (!hasFilters) {
      toast.warning('Ingrese al menos un criterio de búsqueda');
      return;
    }
    setLoadingAntecedents(true);
    try {
      const filters = {};
      if (filterForm.title?.trim()) filters.title = filterForm.title.trim();
      if (filterForm.type_record?.trim()) filters.type_record = filterForm.type_record.trim();
      if (filterForm.observations?.trim()) filters.observations = filterForm.observations.trim();
      if (filterForm.content?.trim()) filters.content = filterForm.content.trim();
      if (filterForm.dateFrom) filters.date_from = filterForm.dateFrom;
      if (filterForm.dateTo) filters.date_to = filterForm.dateTo;
      const result = await recordService.searchRecords(null, filters);
      if (result.success) {
        let data = result.data || [];
        if (showOnlyAvailable) {
          const linkedIds = linkedAntecedents.map(a => a.record_id || a.id);
          data = data.filter(a => !linkedIds.includes(a.record_id || a.id));
        }
        setFilteredAntecedents(data);
        if (data.length === 0) toast.info('No se encontraron antecedentes con los criterios especificados');
        else toast.success(`Se encontraron ${data.length} antecedente(s)`);
      } else {
        toast.error(result.error || 'Error al buscar antecedentes');
        setFilteredAntecedents([]);
      }
    } catch (e) {
      console.error('Error searching antecedents:', e);
      toast.error('Error al buscar antecedentes');
      setFilteredAntecedents([]);
    } finally {
      setLoadingAntecedents(false);
    }
  };

  const filterAntecedents = () => {
    let data = availableAntecedents;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.content?.toLowerCase().includes(term) ||
        a.observations?.toLowerCase().includes(term)
      );
    }
    if (showOnlyAvailable) {
      const linkedIds = linkedAntecedents.map(a => a.record_id || a.id);
      data = data.filter(a => !linkedIds.includes(a.record_id || a.id));
    }
    setFilteredAntecedents(data);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      filterAntecedents();
    }
  };

  const handleClearFilters = () => {
    setFilterForm({ title: '', type_record: '', dateFrom: '', dateTo: '', observations: '', content: '' });
    setFilteredAntecedents([]);
    setSelectedAntecedents([]);
    setSearchTerm('');
  };

  const handleSelectAntecedent = (antecedent) => {
    const id = antecedent.record_id || antecedent.id;
    setSelectedAntecedents(prev => {
      const exists = prev.find(a => (a.record_id || a.id) === id);
      if (exists) return prev.filter(a => (a.record_id || a.id) !== id);
      return [...prev, antecedent];
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
    if (!typeRelationship.trim()) {
      toast.warning('Seleccione un tipo de vinculación');
      return;
    }
    try {
      let success = 0;
      let error = 0;
      for (const ant of selectedAntecedents) {
        try {
          await onLink(ant, typeRelationship);
          success++;
        } catch (e) {
          console.error('Error vinculando antecedente:', e);
          error++;
        }
      }
      setSelectedAntecedents([]);
      if (success) toast.success(`${success} antecedente(s) vinculado(s) exitosamente`);
      if (error) toast.error(`Error al vincular ${error} antecedente(s)`);
    } catch (e) {
      console.error('Error general al vincular antecedentes:', e);
      toast.error('Error al vincular antecedentes');
    }
  };

  const handleUnlinkAntecedent = async (antecedent) => {
    try {
      await onUnlink(antecedent);
      toast.success('Antecedente desvinculado exitosamente');
    } catch (e) {
      toast.error('Error al desvincular antecedente');
    }
  };

  const handleViewDetails = (antecedent) => {
    setSelectedAntecedentDetail(antecedent);
    setShowDetailsModal(true);
  };

  return (
    <div>
      {/* Warning if person not created */}
      {!personId && (
        <Alert variant="warning" className="mb-4">
          <strong>⚠️ Atención:</strong> Debe completar el paso anterior (crear persona) antes de vincular antecedentes.
        </Alert>
      )}

      {/* Linked antecedents list */}
      {linkedAntecedents.length > 0 && (
        <Card className="mb-4 border-success">
          <Card.Header className="bg-success bg-opacity-10 border-success">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0 fw-bold text-success">
                <FiLink className="me-2" />✓ Antecedentes Vinculados ({linkedAntecedents.length})
              </h5>
              <span className="badge bg-success">{linkedAntecedents.length}</span>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Contenido</th>
                  <th>Fecha</th>
                  <th>Tipo de Vinculación</th>
                  <th width="120">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {linkedAntecedents.map((ant, idx) => (
                  <tr key={ant.record_id || ant.id || idx}>
                    <td><code className="small">{(ant.record_id || ant.id)?.toString().slice(0, 8)}...</code></td>
                    <td>
                      <div className="fw-medium">{ant.title}</div>
                      {ant.observations && <small className="text-muted">{ant.observations}</small>}
                    </td>
                    <td><Badge bg="secondary" className="text-white">{ant.type_record || 'N/A'}</Badge></td>
                    <td><small className="text-muted">{ant.content?.substring(0, 100)}{ant.content?.length > 100 ? '...' : ''}</small></td>
                    <td><FiCalendar size={14} className="me-1" />{new Date(ant.date).toLocaleDateString()}</td>
                    <td><Badge bg="info">{ant.type_relationship || 'N/A'}</Badge></td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="outline-primary" size="sm" title="Ver detalles" onClick={() => handleViewDetails(ant)}>
                          <FiEye size={14} />
                        </Button>
                        {!isView && (
                          <Button variant="outline-danger" size="sm" title="Desvincular" onClick={() => handleUnlinkAntecedent(ant)} disabled={loading}>
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

      {/* Search and filter section */}
      {!isView && (
        <Card className="mb-4">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold"><FiFilter className="me-2" />Buscar y Vincular Antecedentes</h6>
              <Form.Check type="switch" id="show-available" label="Solo disponibles" checked={showOnlyAvailable} onChange={e => setShowOnlyAvailable(e.target.checked)} disabled={!personId} />
            </div>
          </Card.Header>
          <Card.Body>
            {/* Quick search */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-dark mb-2"><FiSearch className="me-1" /> Búsqueda Rápida</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Buscar por título, contenido, observaciones..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  disabled={!personId || loadingAntecedents}
                  className="shadow-sm"
                />
                <Button variant="primary" onClick={filterAntecedents} disabled={!personId || loadingAntecedents}>
                  <FiSearch className="me-1" /> Buscar
                </Button>
              </InputGroup>
            </Form.Group>
            {/* Detailed filter form */}
            <Form>
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-dark mb-2"><FiFileText className="me-1" size={14} /> Título</Form.Label>
                    <Form.Control type="text" placeholder="Buscar por título del antecedente" value={filterForm.title} onChange={e => setFilterForm({ ...filterForm, title: e.target.value })} disabled={!personId || loadingAntecedents} className="shadow-sm" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-dark mb-2"><FiFileText className="me-1" size={14} /> Tipo de Antecedente</Form.Label>
                    <Form.Select value={filterForm.type_record} onChange={e => setFilterForm({ ...filterForm, type_record: e.target.value })} disabled={!personId || loadingAntecedents} className="shadow-sm">
                      <option value="">-- Seleccionar tipo --</option>
                      <option value="PENAL">Penal</option>
                      <option value="CIVIL">Civil</option>
                      <option value="CRIMINAL">Criminal</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="LABORAL">Laboral</option>
                      <option value="OTRO">Otro</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-dark mb-2"><FiSearch className="me-1" size={14} /> Observaciones</Form.Label>
                    <Form.Control type="text" placeholder="Buscar por observaciones" value={filterForm.observations} onChange={e => setFilterForm({ ...filterForm, observations: e.target.value })} disabled={!personId || loadingAntecedents} className="shadow-sm" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-dark mb-2"><FiSearch className="me-1" size={14} /> Contenido</Form.Label>
                    <Form.Control type="text" placeholder="Buscar en el contenido" value={filterForm.content} onChange={e => setFilterForm({ ...filterForm, content: e.target.value })} disabled={!personId || loadingAntecedents} className="shadow-sm" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-dark mb-2"><FiCalendar className="me-1" size={14} /> Fecha Desde</Form.Label>
                    <Form.Control type="date" value={filterForm.dateFrom} onChange={e => setFilterForm({ ...filterForm, dateFrom: e.target.value })} disabled={!personId || loadingAntecedents} className="shadow-sm" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-dark mb-2"><FiCalendar className="me-1" size={14} /> Fecha Hasta</Form.Label>
                    <Form.Control type="date" value={filterForm.dateTo} onChange={e => setFilterForm({ ...filterForm, dateTo: e.target.value })} disabled={!personId || loadingAntecedents} className="shadow-sm" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-2 mt-2">
                <Col>
                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={searchAntecedents} disabled={loadingAntecedents || !personId} className="shadow-sm">
                      {loadingAntecedents ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />Buscando...
                        </>
                      ) : (
                        <>
                          <FiSearch className="me-2" size={14} />Buscar Antecedentes
                        </>
                      )}
                    </Button>
                    <Button variant="outline-secondary" onClick={handleClearFilters} disabled={!personId} className="shadow-sm">
                      <FiRefreshCw className="me-2" size={14} />Limpiar Filtros
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
            {/* Search results */}
            {filteredAntecedents.length > 0 && (
              <div className="mt-4 mb-4">
                <h6 className="fw-bold mb-3">Antecedentes Encontrados ({filteredAntecedents.length})</h6>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th width="40"><Form.Check type="checkbox" onChange={e => {
                          if (e.target.checked) setSelectedAntecedents(filteredAntecedents);
                          else setSelectedAntecedents([]);
                        }} checked={selectedAntecedents.length === filteredAntecedents.length && filteredAntecedents.length > 0} disabled={!personId} /></th>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Contenido</th>
                        <th>Fecha</th>
                        <th>Observaciones</th>
                        <th width="80">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAntecedents.map(ant => (
                        <tr key={ant.record_id || ant.id}>
                          <td><Form.Check type="checkbox" checked={selectedAntecedents.find(a => (a.record_id || a.id) === (ant.record_id || ant.id)) ? true : false} onChange={() => handleSelectAntecedent(ant)} disabled={!personId} /></td>
                          <td><code className="small">{(ant.record_id || ant.id)?.toString().slice(0, 8)}...</code></td>
                          <td><div className="fw-medium">{ant.title}</div></td>
                          <td><Badge bg="secondary" className="text-white">{ant.type_record || 'N/A'}</Badge></td>
                          <td><small className="text-muted">{ant.content?.substring(0, 80)}{ant.content?.length > 80 ? '...' : ''}</small></td>
                          <td><FiCalendar size={14} className="me-1" />{new Date(ant.date).toLocaleDateString()}</td>
                          <td><small className="text-muted">{ant.observations?.substring(0, 50)}{ant.observations?.length > 50 ? '...' : 'Sin observaciones'}</small></td>
                          <td><Button variant="outline-primary" size="sm" title="Ver detalles" onClick={() => handleViewDetails(ant)}><FiEye size={14} /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Link selected antecedents */}
      {selectedAntecedents.length > 0 && (
        <div className="mt-4 p-3 bg-light rounded border">
          <Row className="mb-3 g-2">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small text-dark mb-2"><FiUser className="me-1" size={14} /> Tipo de Vinculación</Form.Label>
                <Form.Select value={typeRelationship} onChange={e => setTypeRelationship(e.target.value)} disabled={loading} className="shadow-sm">
                  {relationshipTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Form.Select>
                <small className="text-muted d-block mt-1">Selecciona cómo se relaciona la persona con el(los) antecedente(s)</small>
              </Form.Group>
            </Col>
          </Row>
          <Alert variant="info" className="d-flex justify-content-between align-items-center mb-0">
            <span><strong>{selectedAntecedents.length}</strong> antecedente(s) seleccionado(s) para vincular</span>
            <div>
              <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => setSelectedAntecedents([])}>Cancelar</Button>
              {/* Corrección: se removió setShowConfirmLinkModal ya que no existe, se llama directamente a la función de guardado */}
              <Button variant="success" size="sm" onClick={handleLinkSelected} disabled={loading}>
                {loading ? (<><span className="spinner-border spinner-border-sm me-2" />Vinculando...</>) : (<><FiLink className="me-2" />Vincular Seleccionados</>)}
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* No linked antecedents info */}
      {linkedAntecedents.length === 0 && personId && (
        <Alert variant="info" className="text-center mt-4">
          <FiFileText size={48} className="mb-3 text-muted" />
          <p className="mb-0">No hay antecedentes vinculados aún.</p>
        </Alert>
      )}

      {/* Corrección: Se agrega la estructura correcta del Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Antecedente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAntecedentDetail && (
            <div>
              <Row className="mb-3">
                <Col md={6}><div className="mb-3"><label className="fw-bold text-muted small">ID:</label><p><code>{selectedAntecedentDetail.record_id || selectedAntecedentDetail.id}</code></p></div></Col>
                <Col md={6}><div className="mb-3"><label className="fw-bold text-muted small">Fecha:</label><p>{new Date(selectedAntecedentDetail.date).toLocaleDateString()}</p></div></Col>
              </Row>
              <div className="mb-3"><label className="fw-bold text-muted small">Título:</label><p>{selectedAntecedentDetail.title}</p></div>
              {selectedAntecedentDetail.observations && (<div className="mb-3"><label className="fw-bold text-muted small">Observaciones:</label><p>{selectedAntecedentDetail.observations}</p></div>)}
              <div className="mb-3"><label className="fw-bold text-muted small">Contenido:</label><div className="p-3 bg-light rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}><p className="mb-0">{selectedAntecedentDetail.content}</p></div></div>
              {selectedAntecedentDetail.source && (<div className="mb-3"><label className="fw-bold text-muted small">Fuente:</label><p>{selectedAntecedentDetail.source}</p></div>)}
              {selectedAntecedentDetail.severity && (<div className="mb-3"><label className="fw-bold text-muted small">Severidad:</label><p><Badge bg={selectedAntecedentDetail.severity === 'high' ? 'danger' : selectedAntecedentDetail.severity === 'medium' ? 'warning' : 'info'}>{selectedAntecedentDetail.severity}</Badge></p></div>)}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AntecedentLinker;