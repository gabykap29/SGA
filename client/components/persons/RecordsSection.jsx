'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Alert, Modal, Form, Table } from 'react-bootstrap';
import { 
  FiFileText, 
  FiPlus, 
  FiEye, 
  FiLink, 
  FiX,
  FiCalendar,
  FiUser,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import recordService from '../../services/recordService';
import { useLogin } from '../../hooks/useLogin';

const RecordsSection = ({ personId, linkedRecords = [], onUpdate }) => {
  const { isView } = useLogin();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableRecords, setAvailableRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (showLinkModal) {
      loadAvailableRecords();
    }
  }, [showLinkModal, personId]);

  const loadAvailableRecords = async () => {
    setLoading(true);
    try {
      // Obtener todos los antecedentes disponibles
      const result = await recordService.getRecords();
      const allRecords = result && result.success ? result.data : [];
      // Filtrar los que ya están vinculados
      const linkedIds = linkedRecords.map(r => r.record_id);
      const available = allRecords.filter(record => !linkedIds.includes(record.record_id));
      setAvailableRecords(available);
    } catch (error) {
      console.error('Error loading available records:', error);
      toast.error('Error al cargar antecedentes disponibles');
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

  const getRecordTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'criminal': return 'danger';
      case 'civil': return 'primary';
      case 'administrativo': return 'warning';
      case 'penal': return 'dark';
      case 'laboral': return 'success';
      default: return 'secondary';
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

  const handleLinkRecord = async () => {
    if (!selectedRecord) {
      toast.warning('Seleccione un antecedente para vincular');
      return;
    }

    try {
      // Aquí deberías implementar la vinculación en el backend
      await recordService.linkPersonToRecord(personId, selectedRecord.record_id);
      
      toast.success('Antecedente vinculado exitosamente');
      setShowLinkModal(false);
      setSelectedRecord(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error linking record:', error);
      toast.error('Error al vincular antecedente');
    }
  };

  const handleUnlinkRecord = async (record) => {
    if (window.confirm(`¿Está seguro de que desea desvincular el antecedente "${record.record_number}"?`)) {
      try {
        // Aquí deberías implementar la desvinculación en el backend
        await recordService.unlinkPersonFromRecord(personId, record.record_id);
        
        toast.success('Antecedente desvinculado exitosamente');
        onUpdate?.();
      } catch (error) {
        console.error('Error unlinking record:', error);
        toast.error('Error al desvincular antecedente');
      }
    }
  };

  const filteredRecords = availableRecords.filter(record => 
    record.record_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.record_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      {record.title || 'Sin tipo'} ({record.type_relationship  || 'N/A'}) 
                    </Badge>
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
                      // Navegar a la vista del antecedente
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
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} size="lg">

        <Modal.Body style={{ background: '#f8f9fa', padding: '24px' }}>
          <div className="mb-4">
            <h5 className="fw-bold text-dark mb-2">
              <FiLink className="me-2" />
              Vincular Antecedente
            </h5>
            <small className="text-muted">Seleccione un antecedente para vincular a esta persona</small>
          </div>
          {/* Buscador */}
          <div className="mb-3">
            <Form.Control
              type="text"
              placeholder="Buscar por número, descripción o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3 shadow-sm"
              style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
            />
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-4" style={{
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
              borderRadius: '8px',
              border: '2px dashed #f39c12'
            }}>
              <FiFilter size={32} className="mb-2 text-warning" />
              <p className="mb-0 text-dark fw-semibold">No se encontraron antecedentes disponibles para vincular.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table responsive hover className="bg-white rounded shadow-sm">
                <thead style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', color: '#2c3e50' }}>
                  <tr>
                    <th className="border-0">Seleccionar</th>
                    <th className="border-0">Número</th>
                    <th className="border-0">Tipo</th>
                    <th className="border-0">Descripción</th>
                    <th className="border-0">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr 
                      key={record.record_id}
                      className={selectedRecord?.record_id === record.record_id ? 'table-primary' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td>
                        <Form.Check
                          type="radio"
                          name="selectedRecord"
                          checked={selectedRecord?.record_id === record.record_id}
                          onChange={() => setSelectedRecord(record)}
                        />
                      </td>
                      <td className="fw-semibold">{record.record_number}</td>
                      <td>
                        <Badge 
                          bg="dark"
                          className="text-white"
                          style={{ borderRadius: '6px' }}
                        >
                          {record.record_type || 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        <span 
                          className="text-truncate d-block" 
                          style={{ maxWidth: '200px' }}
                          title={record.description}
                        >
                          {record.description || 'Sin descripción'}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {formatDate(record.record_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer className="border-0" style={{ background: '#f8f9fa' }}>
          <Button 
            variant="secondary" 
            onClick={() => setShowLinkModal(false)}
            className="shadow-sm"
            style={{ borderRadius: '8px' }}
          >
            Cancelar
          </Button>
          <Button 
            variant="dark" 
            onClick={handleLinkRecord}
            disabled={!selectedRecord}
            className="shadow-sm"
            style={{
              backgroundColor: '#212529',
              border: '1px solid #000',
              borderRadius: '4px',
              color: 'white'
            }}
          >
            <FiLink className="me-2" size={16} />
            Vincular Antecedente
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RecordsSection;