'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Alert, Modal, Form, Table, InputGroup } from 'react-bootstrap';
import {
  FiFileText,
  FiPlus,
  FiEye,
  FiLink,
  FiX,
  FiCalendar,
  FiUser,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiXCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import recordService from '../../services/recordService';
import { useLogin } from '../../hooks/useLogin';

const RecordsSection = ({ personId, linkedRecords = [], onUpdate }) => {
  const { isView } = useLogin();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableRecords, setAvailableRecords] = useState([]);
  const [filteredAntecedents, setFilteredAntecedents] = useState([]);
  const [selectedAntecedents, setSelectedAntecedents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeRelationship, setTypeRelationship] = useState('Denunciado');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

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

  useEffect(() => {
    if (showLinkModal) {
      loadAvailableRecords();
    }
  }, [showLinkModal, personId]);

  const loadAvailableRecords = async () => {
    setLoading(true);
    try {
      const result = await recordService.getRecords();
      if (result.success) {
        setAvailableRecords(result.data);
      } else {
        toast.error(result.error || 'Error al cargar antecedentes');
        setAvailableRecords([]);
      }
    } catch (error) {
      console.error('Error loading available records:', error);
      toast.error('Error al cargar antecedentes disponibles');
      setAvailableRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const searchAntecedents = async () => {
    const hasFilters = Object.values(filterForm).some(v => v && v.toString().trim());
    if (!hasFilters) {
      toast.warning('Ingrese al menos un criterio de búsqueda');
      return;
    }
    setLoading(true);
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
          const linkedIds = linkedRecords.map(a => a.record_id || a.id);
          data = data.filter(a => !linkedIds.includes(a.record_id || a.id));
        }
        setFilteredAntecedents(data);
        if (data.length === 0) toast.info('No se encontraron antecedentes con los criterios especificados');
        else toast.success(`Se encontraron ${data.length} antecedente(s)`);
      } else {
        toast.error(result.error || 'Error al buscar antecedentes');
        setFilteredAntecedents([]);
      }
    } catch (error) {
      console.error('Error searching antecedents:', error);
      toast.error('Error al buscar antecedentes');
      setFilteredAntecedents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAntecedents = () => {
    let data = availableRecords;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.content?.toLowerCase().includes(term) ||
        a.observations?.toLowerCase().includes(term)
      );
    }
    if (showOnlyAvailable) {
      const linkedIds = linkedRecords.map(a => a.record_id || a.id);
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
    if (!typeRelationship.trim()) {
      toast.warning('Seleccione un tipo de vinculación');
      return;
    }
    try {
      setLoading(true);
      let success = 0;
      let error = 0;
      for (const ant of selectedAntecedents) {
        try {
          const recordId = ant.record_id || ant.id;
          await recordService.linkPersonToRecord(personId, recordId, typeRelationship);
          success++;
        } catch (e) {
          console.error('Error vinculando antecedente:', e);
          error++;
        }
      }
      setSelectedAntecedents([]);
      setShowLinkModal(false);
      if (success) toast.success(`${success} antecedente(s) vinculado(s) exitosamente`);
      if (error) toast.error(`Error al vincular ${error} antecedente(s)`);
      onUpdate?.();
    } catch (e) {
      console.error('Error general al vincular antecedentes:', e);
      toast.error('Error al vincular antecedentes');
    } finally {
      setLoading(false);
    }
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

  const getRecordTypeBorderColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'criminal': return '#e74c3c';
      case 'civil': return '#3498db';
      case 'administrativo': return '#f39c12';
      case 'penal': return '#2c3e50';
      case 'laboral': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const handleUnlinkRecord = async (record) => {
    if (window.confirm(`¿Está seguro de que desea desvincular el antecedente "${record.record_number}"?`)) {
      try {
        await recordService.unlinkPersonFromRecord(personId, record.record_id);
        toast.success('Antecedente desvinculado exitosamente');
        onUpdate?.();
      } catch (error) {
        console.error('Error unlinking record:', error);
        toast.error('Error al desvincular antecedente');
      }
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: '12px',
      padding: '24px'
    }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <div
              className="rounded-circle me-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
                color: 'white'
              }}
            >
              <FiFileText size={24} />
            </div>
            <div>
              <h5 className="mb-1 fw-bold text-dark">Antecedentes Vinculados</h5>
              <p className="text-muted mb-0">{linkedRecords.length} antecedente(s) vinculado(s)</p>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Badge
            bg="dark"
            pill
            className="px-3 py-2 shadow-sm"
            style={{ fontSize: '0.9rem' }}
          >
            {linkedRecords.length}
          </Badge>
          {!isView && (
            <>
              <Button
                variant="dark"
                size="sm"
                className="px-3 py-2"
                onClick={() => setShowLinkModal(true)}
                style={{
                  backgroundColor: '#212529',
                  border: '1px solid #000',
                  borderRadius: '4px',
                  color: 'white'
                }}
              >
                <FiLink className="me-2" size={16} />
                Vincular antecedente
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="px-3 py-2"
                onClick={() => window.location.href = '/dashboard/antecedentes/crear'}
                style={{
                  backgroundColor: '#007bff',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white'
                }}
              >
                <FiPlus className="me-2" size={16} />
                Crear antecedente
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lista de antecedentes vinculados */}
      {linkedRecords.length === 0 ? (
        <div className="text-center py-5 mx-3" style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <div
            className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#6c757d',
              color: 'white'
            }}
          >
            <FiFileText size={24} />
          </div>
          <h5 className="fw-bold text-dark mb-2">Sin antecedentes vinculados</h5>
          <p className="text-muted mb-4">Esta persona no tiene antecedentes vinculados.</p>
        </div>
      ) : (
        <Row>
          {linkedRecords.map((record) => (
            <Col md={6} lg={4} key={record.record_id} className="mb-4 px-3">
              <Card className="h-100" style={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                borderLeft: `3px solid ${getRecordTypeBorderColor(record.record_type)}`
              }}>
                <Card.Header className="border-0 bg-transparent pb-0">
                  <div className="d-flex justify-content-between align-items-start">
                    <Badge
                      bg="dark"
                      className="text-white px-3 py-2 shadow-sm"
                      style={{ fontSize: '0.8rem', borderRadius: '8px' }}
                    >
                      {record.title || 'Sin título'} - {record.type_record || 'N/A'} ({record.type_relationship || 'N/A'})
                    </Badge>
                    {!isView && (
                      <Button
                        variant="dark"
                        size="sm"
                        title="Desvincular"
                        onClick={() => handleUnlinkRecord(record)}
                        className="shadow-sm"
                        style={{
                          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                          border: 'none',
                          borderRadius: '6px'
                        }}
                      >
                        <FiX size={14} />
                      </Button>
                    )}
                  </div>
                </Card.Header>

                <Card.Body className="pt-2">
                  <div className="mb-3">
                    <h6 className="fw-bold mb-1 text-dark">
                      {record.record_number}
                    </h6>
                    <p className="text-muted small mb-0" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {record.observations || 'Sin descripción disponible'}
                    </p>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2 text-muted small">
                      <FiCalendar className="me-2" size={14} />
                      <span>Fecha: {formatDate(record.date)}</span>
                    </div>

                    {record.court && (
                      <div className="d-flex align-items-center mb-2 text-muted small">
                        <FiUser className="me-2" size={14} />
                        <span>Juzgado: {record.court}</span>
                      </div>
                    )}

                    {record.status && (
                      <div className="small">
                        <Badge
                          bg={record.status === 'active' ? 'success' : 'secondary'}
                          className="text-white px-2 py-1"
                          style={{ borderRadius: '6px' }}
                        >
                          {record.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card.Body>

                <Card.Footer className="border-0 bg-transparent pt-0">
                  <Button
                    variant="dark"
                    size="sm"
                    className="w-100 shadow-sm"
                    onClick={() => {
                      window.open(`/dashboard/antecedentes/${record.record_id}`, '_blank');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    <FiEye className="me-2" size={14} />
                    Ver detalles
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Resumen de antecedentes */}
      {linkedRecords.length > 0 && (
        <div className="mt-4">
          <Card className="border-0 shadow-sm" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }}>
            <Card.Body className="p-4">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="p-3 rounded shadow-sm" style={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                  }}>
                    <div className="fw-bold text-primary fs-3">
                      {linkedRecords.length}
                    </div>
                    <small className="text-dark fw-semibold">Total vinculados</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="p-3 rounded shadow-sm" style={{
                    background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
                  }}>
                    <div className="fw-bold text-danger fs-3">
                      {linkedRecords.filter(r => r.record_type === 'criminal').length}
                    </div>
                    <small className="text-dark fw-semibold">Criminales</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="p-3 rounded shadow-sm" style={{
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc82 100%)'
                  }}>
                    <div className="fw-bold text-warning fs-3">
                      {linkedRecords.filter(r => r.record_type === 'administrativo').length}
                    </div>
                    <small className="text-dark fw-semibold">Administrativos</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="p-3 rounded shadow-sm" style={{
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
                  }}>
                    <div className="fw-bold text-success fs-3">
                      {linkedRecords.filter(r => r.status === 'active').length}
                    </div>
                    <small className="text-dark fw-semibold">Activos</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Modal para vincular antecedente */}
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FiLink className="me-2" />
            Buscar y Vincular Antecedentes
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ background: '#f8f9fa', padding: '24px' }}>
          {/* Quick search */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small text-dark mb-2">
              <FiSearch className="me-1" /> Búsqueda Rápida
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Buscar por título, contenido, observaciones..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                disabled={loading}
                className="shadow-sm"
              />
              <Button variant="primary" onClick={filterAntecedents} disabled={loading}>
                <FiSearch className="me-1" /> Buscar
              </Button>
            </InputGroup>
          </Form.Group>

          {/* Detailed filter form */}
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark mb-2">
                    <FiFileText className="me-1" size={14} /> Título
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por título del antecedente"
                    value={filterForm.title}
                    onChange={e => setFilterForm({ ...filterForm, title: e.target.value })}
                    disabled={loading}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark mb-2">
                    <FiFileText className="me-1" size={14} /> Tipo de Antecedente
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por tipo de antecedente"
                    value={filterForm.type_record}
                    onChange={e => setFilterForm({ ...filterForm, type_record: e.target.value })}
                    disabled={loading}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark mb-2">
                    <FiSearch className="me-1" size={14} /> Observaciones
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por observaciones"
                    value={filterForm.observations}
                    onChange={e => setFilterForm({ ...filterForm, observations: e.target.value })}
                    disabled={loading}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark mb-2">
                    <FiSearch className="me-1" size={14} /> Contenido
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar en el contenido"
                    value={filterForm.content}
                    onChange={e => setFilterForm({ ...filterForm, content: e.target.value })}
                    disabled={loading}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark mb-2">
                    <FiCalendar className="me-1" size={14} /> Fecha Desde
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={filterForm.dateFrom}
                    onChange={e => setFilterForm({ ...filterForm, dateFrom: e.target.value })}
                    disabled={loading}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-dark mb-2">
                    <FiCalendar className="me-1" size={14} /> Fecha Hasta
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={filterForm.dateTo}
                    onChange={e => setFilterForm({ ...filterForm, dateTo: e.target.value })}
                    disabled={loading}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-2 mt-2">
              <Col>
                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={searchAntecedents} disabled={loading} className="shadow-sm">
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />Buscando...
                      </>
                    ) : (
                      <>
                        <FiSearch className="me-2" size={14} />Buscar Antecedentes
                      </>
                    )}
                  </Button>
                  <Button variant="outline-secondary" onClick={handleClearFilters} className="shadow-sm">
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
                      <th width="40">
                        <Form.Check
                          type="checkbox"
                          onChange={e => {
                            if (e.target.checked) setSelectedAntecedents(filteredAntecedents);
                            else setSelectedAntecedents([]);
                          }}
                          checked={selectedAntecedents.length === filteredAntecedents.length && filteredAntecedents.length > 0}
                        />
                      </th>
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
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedAntecedents.find(a => (a.record_id || a.id) === (ant.record_id || ant.id)) ? true : false}
                            onChange={() => handleSelectAntecedent(ant)}
                          />
                        </td>
                        <td><code className="small">{(ant.record_id || ant.id)?.toString().slice(0, 8)}...</code></td>
                        <td><div className="fw-medium">{ant.title}</div></td>
                        <td><Badge bg="secondary" className="text-white">{ant.type_record || 'N/A'}</Badge></td>
                        <td><small className="text-muted">{ant.content?.substring(0, 80)}{ant.content?.length > 80 ? '...' : ''}</small></td>
                        <td><FiCalendar size={14} className="me-1" />{new Date(ant.date).toLocaleDateString()}</td>
                        <td><small className="text-muted">{ant.observations?.substring(0, 50)}{ant.observations?.length > 50 ? '...' : 'Sin observaciones'}</small></td>
                        <td>
                          <Button variant="outline-primary" size="sm" title="Ver detalles" onClick={() => window.open(`/dashboard/antecedentes/${ant.record_id || ant.id}`, '_blank')}>
                            <FiEye size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* Link selected antecedents */}
          {selectedAntecedents.length > 0 && (
            <div className="mt-4 p-3 bg-light rounded border">
              <Row className="mb-3 g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small text-dark mb-2">
                      <FiUser className="me-1" size={14} /> Tipo de Vinculación
                    </Form.Label>
                    <Form.Select
                      value={typeRelationship}
                      onChange={e => setTypeRelationship(e.target.value)}
                      disabled={loading}
                      className="shadow-sm"
                    >
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
                  <Button variant="success" size="sm" onClick={handleLinkSelected} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />Vinculando...
                      </>
                    ) : (
                      <>
                        <FiLink className="me-2" />Vincular Seleccionados
                      </>
                    )}
                  </Button>
                </div>
              </Alert>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0" style={{ background: '#f8f9fa' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setShowLinkModal(false);
              setSelectedAntecedents([]);
              setFilteredAntecedents([]);
              handleClearFilters();
            }}
            className="shadow-sm"
            style={{ borderRadius: '8px' }}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RecordsSection;