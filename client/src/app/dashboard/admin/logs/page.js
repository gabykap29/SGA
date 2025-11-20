'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Spinner, Alert, Badge, InputGroup, Accordion, ListGroup, Pagination } from 'react-bootstrap';
import { FiCalendar, FiFilter, FiSearch, FiRefreshCw, FiActivity, FiDatabase, FiUser, FiClock, FiInfo } from 'react-icons/fi';
import UserActivitySummary from '../../../../../components/dashboard/UserActivitySummary';
import LoadPersonsFromCSV from '../../../../../components/admin/LoadPersonsFromCSV';
import logsService from '../../../../../services/logsService';
import { toast } from 'react-toastify';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLogin } from '../../../../../hooks/useLogin';

// Función auxiliar para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Colores por tipo de acción
const actionColors = {
  'CREATE': 'success',
  'UPDATE': 'info',
  'DELETE': 'danger',
  'LOGIN_SUCCESS': 'primary',
  'LOGIN_FAILED': 'warning',
  'LOGOUT': 'secondary',
  'DOWNLOAD': 'dark',
  'UPLOAD': 'dark',
};

// Colores por tipo de entidad
const entityColors = {
  'USER': 'primary',
  'PERSON': 'success',
  'RECORD': 'warning',
  'FILE': 'dark',
  'ROLE': 'info',
};

export default function LogsPage() {
  const { user, isAdmin } = useLogin();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    action: '',
    entity_type: '',
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  
  const [isPermissionError, setIsPermissionError] = useState(false);

  // Cargar logs al montar el componente
  useEffect(() => {
    let mounted = true;
    
    if (isAdmin && mounted) {
      setIsPermissionError(false);  // Establecer explícitamente a false cuando es admin
      loadLogs();
      loadSummary();
    } else if (mounted) {
      setIsPermissionError(true);
    }
    
    return () => {
      mounted = false;
    };
  }, [isAdmin, page, pageSize]);

  const loadLogs = async () => {
    setLoading(true);
    // Asegurarse de que no haya falsos positivos en errores de permisos
    setIsPermissionError(false);
    try {
      // Convertir fechas si están presentes
      const apiFilters = { ...filters, page, size: pageSize };
      
      if (filters.start_date) {
        apiFilters.start_date = new Date(filters.start_date);
      }
      
      if (filters.end_date) {
        // Establecer la hora al final del día para incluir todo el día seleccionado
        const endDate = new Date(filters.end_date);
        endDate.setHours(23, 59, 59, 999);
        apiFilters.end_date = endDate;
      }
      
      const result = await logsService.getLogs(apiFilters);
      
      if (result.success) {
        if (result.data.data) {
            setLogs(result.data.data);
            setTotalPages(result.data.pages);
            setTotalLogs(result.data.total);
        } else {
            setLogs(result.data);
            setTotalLogs(result.data.length);
        }
      } else {
        if (result.isPermissionError) {
          console.error('Error de permisos al cargar logs:', result.error);
          setIsPermissionError(true);
        } else {
          console.error('Error al cargar logs:', result.error);
          toast.error(result.error || 'Error al cargar los logs');
        }
      }
    } catch (error) {
      console.error('Excepción al cargar logs:', error);
      toast.error('Error inesperado al cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setLoadingSummary(true);
    // No establecer isPermissionError aquí para evitar conflictos con loadLogs
    try {
      const result = await logsService.getLogsSummary();
      
      if (result.success) {
        setSummary(result.data);
      } else {
        if (result.isPermissionError) {
          console.error('Error de permisos al cargar resumen:', result.error);
          // No establecemos isPermissionError aquí para evitar duplicar mensajes
        } else {
          console.error('Error al cargar resumen:', result.error);
          toast.error(result.error || 'Error al cargar el resumen de logs');
        }
      }
    } catch (error) {
      console.error('Excepción al cargar resumen:', error);
      toast.error('Error inesperado al cargar el resumen de logs');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitFilters = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      action: '',
      entity_type: '',
    });
    setPage(1);
    loadLogs();
  };

  // Si no es admin, mostrar mensaje de error
  if (isPermissionError) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <div className="text-danger mb-3">
          <FiInfo size={50} />
        </div>
        <h3>Acceso Restringido</h3>
        <p className="text-muted">No tiene permisos para acceder a esta sección.</p>
        <p className="text-muted">Esta funcionalidad está disponible solo para administradores.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Hero Section con estadísticas principales */}
      <div className="bg-gradient-primary text-white p-4 mb-4 rounded-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center mb-2">
              <div className="bg-opacity-20 rounded-3 p-2 me-3">
                <FiActivity size={24} />
              </div>
              <div>
                <h2 className="mb-0 fw-bold">📋 Registro de Actividades</h2>
                <p className="mb-0 opacity-75">🔍 Panel de monitoreo y auditoría del sistema</p>
              </div>
            </div>
          </div>
          <div className="text-end">

            <Button 
              variant="light" 
              size="sm"
              onClick={() => {
                loadLogs();
                loadSummary();
              }}
              disabled={loading || loadingSummary}
              className="d-flex align-items-center"
            >
              <FiRefreshCw className="me-1" size={14} />
              🔄 Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas principales en cards compactas */}
      {summary && (
        <Row className="g-3 mb-4">
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100 metric-card">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="rounded-2 bg-primary bg-opacity-10 p-2 me-3">
                    <FiActivity className="text-primary" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold text-dark">{summary?.total_logs || 0}</div>
                    <small className="text-muted">📊 Total Actividades</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100 metric-card">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="rounded-2 bg-success bg-opacity-10 p-2 me-3">
                    <FiUser className="text-success" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold text-dark">{summary?.users ? Object.keys(summary.users).length : 0}</div>
                    <small className="text-muted">👥 Usuarios Activos</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100 metric-card">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="rounded-2 bg-warning bg-opacity-10 p-2 me-3">
                    <FiDatabase className="text-warning" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold text-dark">{summary?.entities ? Object.keys(summary.entities).length : 0}</div>
                    <small className="text-muted">🗂️ Entidades</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100 metric-card">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="rounded-2 bg-info bg-opacity-10 p-2 me-3">
                    <FiClock className="text-info" size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold text-dark">{summary?.period?.days || 7}</div>
                    <small className="text-muted">📅 Días analizados</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="g-4">
        {/* Panel principal de logs */}
        <Col xl={9} lg={8}>
          {/* Filtros compactos */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="mb-0 fw-semibold text-dark">
                  <FiFilter className="me-2" size={16} />
                  Filtros de Búsqueda
                </h6>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="d-flex align-items-center"
                >
                  <FiRefreshCw size={12} className="me-1" />
                  Limpiar
                </Button>
              </div>
              
              <Form onSubmit={handleSubmitFilters}>
                <Row className="g-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted">Fecha Inicio</Form.Label>
                      <Form.Control
                        type="date"
                        name="start_date"
                        value={filters.start_date}
                        onChange={handleFilterChange}
                        size="sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted">Fecha Fin</Form.Label>
                      <Form.Control
                        type="date"
                        name="end_date"
                        value={filters.end_date}
                        onChange={handleFilterChange}
                        size="sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted">Acción</Form.Label>
                      <Form.Select
                        name="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                        size="sm"
                      >
                        <option value="">Todas</option>
                        <option value="CREATE">Crear</option>
                        <option value="UPDATE">Actualizar</option>
                        <option value="DELETE">Eliminar</option>
                        <option value="LOGIN_SUCCESS">Login Exitoso</option>
                        <option value="LOGIN_FAILED">Login Fallido</option>
                        <option value="LOGOUT">Logout</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-medium text-muted">Entidad</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          name="entity_type"
                          value={filters.entity_type}
                          onChange={handleFilterChange}
                          size="sm"
                        >
                          <option value="">Todas</option>
                          <option value="USER">Usuarios</option>
                          <option value="PERSON">Personas</option>
                          <option value="RECORD">Antecedentes</option>
                          <option value="FILE">Archivos</option>
                        </Form.Select>
                        <Button
                          variant="primary"
                          size="sm"
                          type="submit"
                          disabled={loading}
                          className="flex-shrink-0"
                        >
                          <FiSearch size={14} />
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* Tabla de logs moderna */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0 py-3">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0 fw-semibold text-dark">
                  <FiDatabase className="me-2" size={16} />
                  Registro de Actividades
                </h6>
                {logs.length > 0 && (
                  <Badge bg="primary" pill className="px-3">
                    {totalLogs} registros
                  </Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="d-inline-flex align-items-center">
                    <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                    <span className="text-muted">Cargando actividades...</span>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FiInfo size={48} className="opacity-50" />
                  </div>
                  <h6 className="text-muted">No se encontraron registros</h6>
                  <p className="text-muted small mb-0">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <>
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0 modern-logs-table">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted small">FECHA Y HORA</th>
                        <th className="border-0 fw-semibold text-muted small">USUARIO</th>
                        <th className="border-0 fw-semibold text-muted small">ACCIÓN</th>
                        <th className="border-0 fw-semibold text-muted small">ENTIDAD</th>
                        <th className="border-0 fw-semibold text-muted small">DESCRIPCIÓN</th>
                        <th className="border-0 fw-semibold text-muted small">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={log.log_id} className="log-row">
                          <td className="border-0 py-3">
                            <div className="d-flex align-items-center">
                              <div className="rounded-2 bg-light p-2 me-2">
                                <FiClock size={12} className="text-muted" />
                              </div>
                              <div>
                                <div className="fw-medium text-dark small">{formatDate(log.created_at)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-2" 
                                   style={{ width: '24px', height: '24px' }}>
                                <FiUser size={12} className="text-primary" />
                              </div>
                              <span className="fw-medium text-dark small">
                                {log.username || 'Anónimo'}
                              </span>
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            <Badge 
                              bg={actionColors[log.action] || 'secondary'} 
                              className="px-2 py-1 fw-normal"
                              style={{ fontSize: '0.75rem' }}
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="border-0 py-3">
                            <div>
                              <Badge 
                                bg={entityColors[log.entity_type] || 'light'} 
                                text={entityColors[log.entity_type] ? 'white' : 'dark'}
                                className="px-2 py-1 fw-normal mb-1"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {log.entity_type}
                              </Badge>
                              {log.entity_id && (
                                <div>
                                  <code className="small text-muted bg-light px-1 rounded">
                                    {log.entity_id.substring(0, 8)}...
                                  </code>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            <div className="text-truncate" style={{ maxWidth: '300px' }} title={log.description}>
                              <span className="text-dark small">{log.description}</span>
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            <code className="small text-muted bg-light px-2 py-1 rounded">
                              {log.ip_address || 'N/A'}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                
                <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light bg-opacity-10">
                  <div className="text-muted small">
                    Mostrando {logs.length} de {totalLogs} registros
                  </div>
                  <Pagination className="mb-0 shadow-sm">
                    <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                    <Pagination.Prev onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} />
                    
                    {page > 2 && <Pagination.Item onClick={() => setPage(1)}>1</Pagination.Item>}
                    {page > 3 && <Pagination.Ellipsis />}
                    
                    {page > 1 && <Pagination.Item onClick={() => setPage(page - 1)}>{page - 1}</Pagination.Item>}
                    <Pagination.Item active>{page}</Pagination.Item>
                    {page < totalPages && <Pagination.Item onClick={() => setPage(page + 1)}>{page + 1}</Pagination.Item>}
                    
                    {page < totalPages - 2 && <Pagination.Ellipsis />}
                    {page < totalPages - 1 && <Pagination.Item onClick={() => setPage(totalPages)}>{totalPages}</Pagination.Item>}
                    
                    <Pagination.Next onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} />
                    <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
                  </Pagination>
                </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Panel lateral con resumen y acciones */}
        <Col xl={3} lg={4}>
          <div className="sticky-top" style={{ top: '1rem' }}>
            {/* Resumen de actividad */}
            <UserActivitySummary summary={summary} loading={loadingSummary} />
            
            {/* Herramientas administrativas */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom-0 py-3">
                <h6 className="mb-0 fw-semibold text-dark">Herramientas</h6>
              </Card.Header>
              <Card.Body className="p-3">
                <LoadPersonsFromCSV onSuccess={() => {
                  loadLogs();
                  loadSummary();
                }} />
              </Card.Body>
            </Card>

            {/* Acciones rápidas */}
            {!loadingSummary && summary && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom-0 py-3">
                  <h6 className="mb-0 fw-semibold text-dark">Acciones Rápidas</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    <ListGroup.Item 
                      action 
                      className="border-0 py-3 d-flex align-items-center"
                      onClick={() => loadLogs()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="rounded-2 bg-primary bg-opacity-10 p-2 me-3">
                        <FiRefreshCw className="text-primary" size={16} />
                      </div>
                      <div>
                        <div className="fw-medium text-dark small">Actualizar Registros</div>
                        <small className="text-muted">Recargar datos más recientes</small>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}

// Estilos personalizados (se pueden mover a un archivo CSS separado)
const styles = `
  .bg-gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .metric-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
  }
  
  .modern-logs-table tbody tr {
    border-bottom: 1px solid #f8f9fa;
  }
  
  .modern-logs-table tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  .log-row {
    transition: background-color 0.2s ease;
  }
  
  .sticky-top {
    position: sticky;
    top: 1rem;
    z-index: 1020;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  if (!document.head.querySelector('style[data-logs-styles]')) {
    styleElement.setAttribute('data-logs-styles', 'true');
    document.head.appendChild(styleElement);
  }
}