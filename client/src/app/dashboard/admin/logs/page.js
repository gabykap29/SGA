'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Spinner, Alert, Badge, InputGroup, Accordion, ListGroup } from 'react-bootstrap';
import { FiCalendar, FiFilter, FiSearch, FiRefreshCw, FiActivity, FiDatabase, FiUser, FiClock, FiInfo, FiDownload } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserActivitySummary from '@/components/dashboard/UserActivitySummary';
import logsService from '@/services/logsService';
import { toast } from 'react-toastify';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import useLogin from '@/hooks/useLogin';

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
  const [isPermissionError, setIsPermissionError] = useState(false);

  // Cargar logs al montar el componente
  useEffect(() => {
    if (isAdmin) {
      loadLogs();
      loadSummary();
    } else {
      setIsPermissionError(true);
    }
  }, [isAdmin]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Convertir fechas si están presentes
      const apiFilters = { ...filters };
      
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
        setLogs(result.data);
      } else {
        if (result.isPermissionError) {
          setIsPermissionError(true);
        } else {
          toast.error(result.error || 'Error al cargar los logs');
        }
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Error inesperado al cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const result = await logsService.getLogsSummary();
      
      if (result.success) {
        setSummary(result.data);
      } else {
        if (!result.isPermissionError) {
          toast.error(result.error || 'Error al cargar el resumen de logs');
        }
      }
    } catch (error) {
      console.error('Error loading summary:', error);
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
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      action: '',
      entity_type: '',
    });
  };

  // Si no es admin, mostrar mensaje de error
  if (isPermissionError) {
    return (
      <DashboardLayout>
        <div className="d-flex flex-column justify-content-center align-items-center py-5">
          <div className="text-danger mb-3">
            <FiInfo size={50} />
          </div>
          <h3>Acceso Restringido</h3>
          <p className="text-muted">No tiene permisos para acceder a esta sección.</p>
          <p className="text-muted">Esta funcionalidad está disponible solo para administradores.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Registro de Actividades del Sistema</h3>
          <p className="text-muted mb-0">Panel de monitoreo y auditoría de actividades</p>
        </div>
        <Button 
          variant="outline-primary"
          onClick={() => {
            loadLogs();
            loadSummary();
          }}
          disabled={loading || loadingSummary}
        >
          <FiRefreshCw className="me-2" />
          Actualizar Todo
        </Button>
      </div>

      <Row className="mb-4">
        <Col lg={9}>
          {summary && (
            <Row>
              <Col lg={4} md={6} className="mb-3">
                <Card className="h-100 border-0 shadow-sm summary-card">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                        <FiActivity className="text-primary" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Total de Actividades</h6>
                        <h4 className="mb-0">{summary?.total_logs || 0}</h4>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} md={6} className="mb-3">
                <Card className="h-100 border-0 shadow-sm summary-card">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                        <FiUser className="text-success" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Usuarios Activos</h6>
                        <h4 className="mb-0">{summary?.users ? Object.keys(summary.users).length : 0}</h4>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} md={6} className="mb-3">
                <Card className="h-100 border-0 shadow-sm summary-card">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                        <FiDatabase className="text-warning" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Entidades Afectadas</h6>
                        <h4 className="mb-0">{summary?.entities ? Object.keys(summary.entities).length : 0}</h4>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} md={6} className="mb-3">
                <Card className="h-100 border-0 shadow-sm summary-card">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                        <FiClock className="text-info" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Período Analizado</h6>
                        <h4 className="mb-0">{summary?.period?.days || 7} días</h4>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Filtrar Registros</h5>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => {
                  setFilters({
                    start_date: '',
                    end_date: '',
                    action: '',
                    entity_type: '',
                  });
                  loadLogs();
                }}
              >
                <FiRefreshCw className="me-2" />
                Limpiar Filtros
              </Button>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmitFilters} className="filter-form">
                <Row>
                  <Col lg={6} md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Fecha Inicio</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FiCalendar className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="date"
                          name="start_date"
                          value={filters.start_date}
                          onChange={handleFilterChange}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col lg={6} md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Fecha Fin</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FiCalendar className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="date"
                          name="end_date"
                          value={filters.end_date}
                          onChange={handleFilterChange}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col lg={6} md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Tipo de Acción</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FiActivity className="text-muted" />
                        </InputGroup.Text>
                        <Form.Select
                          name="action"
                          value={filters.action}
                          onChange={handleFilterChange}
                        >
                          <option value="">Todas las acciones</option>
                          <option value="CREATE">Crear</option>
                          <option value="UPDATE">Actualizar</option>
                          <option value="DELETE">Eliminar</option>
                          <option value="LOGIN_SUCCESS">Inicio de sesión exitoso</option>
                          <option value="LOGIN_FAILED">Inicio de sesión fallido</option>
                          <option value="LOGOUT">Cierre de sesión</option>
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col lg={6} md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Tipo de Entidad</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FiDatabase className="text-muted" />
                        </InputGroup.Text>
                        <Form.Select
                          name="entity_type"
                          value={filters.entity_type}
                          onChange={handleFilterChange}
                        >
                          <option value="">Todas las entidades</option>
                          <option value="USER">Usuarios</option>
                          <option value="PERSON">Personas</option>
                          <option value="RECORD">Antecedentes</option>
                          <option value="FILE">Archivos</option>
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end mt-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                  >
                    <FiFilter className="me-2" />
                    Aplicar Filtros
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3}>
          <UserActivitySummary summary={summary} loading={loadingSummary} />
          
          {!loadingSummary && summary && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3">
                <h5 className="mb-0">Acciones Rápidas</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  <ListGroup.Item action className="py-3 d-flex align-items-center" onClick={() => loadLogs()}>
                    <FiRefreshCw className="me-3 text-primary" />
                    Actualizar Registros
                  </ListGroup.Item>
                  <ListGroup.Item action className="py-3 d-flex align-items-center">
                    <FiDownload className="me-3 text-success" />
                    Exportar a Excel
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Esta sección fue reemplazada */}

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h5 className="mb-0 me-3">Registro de Actividades</h5>
            <Badge bg="primary" pill className="me-2">
              {logs.length} registros
            </Badge>
          </div>
          <div className="d-flex">
            <Button 
              variant="outline-success" 
              size="sm"
              className="me-2"
              title="Exportar a Excel"
            >
              <FiDownload className="me-1" /> Excel
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando registros de actividad...</p>
            </div>
          ) : logs.length === 0 ? (
            <Alert variant="info" className="m-4">
              <FiInfo className="me-2" />
              No se encontraron registros con los filtros aplicados
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0 table-logs">
                <thead className="bg-light">
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>Descripción</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.log_id}>
                      <td nowrap className="log-timestamp">
                        {formatDate(log.created_at)}
                      </td>
                      <td>
                        {log.username ? (
                          <Badge bg="light" text="dark">
                            {log.username}
                          </Badge>
                        ) : (
                          <Badge bg="secondary" text="light">
                            Anónimo
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg={actionColors[log.action] || 'secondary'} pill className="badge-lg">
                          {log.action}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={entityColors[log.entity_type] || 'light'} text={entityColors[log.entity_type] ? 'white' : 'dark'}>
                          {log.entity_type}
                        </Badge>
                        {log.entity_id && (
                          <div>
                            <small className="text-muted">{log.entity_id.substring(0, 8)}...</small>
                          </div>
                        )}
                      </td>
                      <td className="log-description">
                        <span title={log.description}>{log.description}</span>
                      </td>
                      <td>
                        <small className="text-muted">{log.ip_address || '-'}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </DashboardLayout>
  );
}