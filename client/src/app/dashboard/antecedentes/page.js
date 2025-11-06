'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Spinner } from 'react-bootstrap';
import { FiFileText, FiSearch, FiPlus, FiEye, FiEdit, FiCalendar, FiFilter, FiDownload } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import recordService from '../../../../services/recordService';
export default function RecordsList() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const result = await recordService.getRecords();
      
      if (result.success) {
        setRecords(Array.isArray(result.data) ? result.data : []);
      } else {
        toast.error(result.error || 'Error al cargar los antecedentes');
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error('Error inesperado al cargar los antecedentes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const result = await recordService.searchRecords(searchTerm, filters);
      
      if (result.success) {
        setRecords(Array.isArray(result.data) ? result.data : []);
      } else {
        toast.error(result.error || 'Error al buscar antecedentes');
      }
    } catch (error) {
      console.error('Error searching records:', error);
      toast.error('Error inesperado al buscar antecedentes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      dateFrom: '',
      dateTo: ''
    });
    loadRecords();
  };

  const handleCreateRecord = () => {
    router.push('/dashboard/antecedentes/crear');
  };

  const handleViewRecord = (id) => {
    router.push(`/dashboard/antecedentes/${id}`);
  };

  const handleEditRecord = (id) => {
    router.push(`/dashboard/antecedentes/${id}/editar`);
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
      return dateString;
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cuadro de título */}
        <div className="mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="display-8 fw-bold text-dark mb-0">Antecedentes</h2>
              <p className="lead text-muted mb-0"> ➜ Gestión de antecedentes del sistema</p>
            </div>
            <Button 
              variant="dark" 
              onClick={handleCreateRecord}
              className="d-flex align-items-center"
            >
              <FiPlus size={18} className="me-2" />
              Crear Antecedente
            </Button>
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <Card className="border-1 shadow-sm mb-4">
          <Card.Body className="p-3">
            <Form onSubmit={handleSearch}>
              <Row className="align-items-end">
                <Col md={6} lg={12}>
                  <Form.Group className="mb-md-0">
                    <Form.Label className="small text-muted">Buscar por título o contenido</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={searchTerm}
                        style={{ borderRadius: "20px" }}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar antecedentes..."
                      />
                      <Button variant="dark" type="submit">
                        <FiSearch size={16} />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6} lg={5} className="mt-3 mt-md-0">
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="outline-secondary" 
                      className="me-2"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <FiFilter size={16} className="me-1" />
                      Filtros
                    </Button>
                    
                    <Button 
                      variant="outline-secondary" 
                      className="me-2"
                      onClick={resetFilters}
                      disabled={!searchTerm && !filters.dateFrom && !filters.dateTo}
                    >
                      Limpiar
                    </Button>
                    
                    <Button 
                      variant="dark" 
                      type="submit"
                    >
                      <FiSearch size={16} className="me-2" />
                      Buscar
                    </Button>
                  </div>
                </Col>
              </Row>
              
              {showFilters && (
                <Row className="mt-3">
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="small text-muted">Fecha desde</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateFrom"
                        value={filters.dateFrom}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3} className="mt-3 mt-md-0">
                    <Form.Group>
                      <Form.Label className="small text-muted">Fecha hasta</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateTo"
                        value={filters.dateTo}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Form>
          </Card.Body>
        </Card>

        {/* Tabla de antecedentes */}
        <Card className="border-1 shadow-sm">
          <Card.Header className="bg-light border-1 py-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                  <FiFileText size={18} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-dark">Lista de Antecedentes</h5>
                  <div className="small text-muted">{records.length} antecedentes encontrados</div>
                </div>
              </div>
              {records.length > 0 && (
                <Button 
                  variant="outline-dark"
                  className="d-flex align-items-center"
                  onClick={() => toast.info('Funcionalidad de exportar en desarrollo')}
                >
                  <FiDownload className="me-2" size={16} />
                  Exportar
                </Button>
              )}
            </div>
          </Card.Header>
          
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="fw-bold py-3">Título</th>
                  <th className="fw-bold py-3">
                    <FiCalendar className="me-2" size={14} />
                    Fecha
                  </th>
                  <th className="fw-bold py-3">Contenido</th>
                  <th className="fw-bold py-3">Personas Vinculadas</th>
                  <th className="fw-bold py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <Spinner animation="border" variant="dark" className="mb-3" />
                      <div className="text-muted">Cargando antecedentes...</div>
                    </td>
                  </tr>
                ) : records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.record_id} style={{ cursor: 'pointer' }}>
                      <td 
                        className="py-3"
                        onClick={() => handleViewRecord(record.record_id)}
                      >
                        <div className="fw-bold text-dark">
                          {record.title}
                        </div>
                      </td>
                      <td 
                        className="py-3"
                        onClick={() => handleViewRecord(record.record_id)}
                      >
                        <Badge bg="dark" className="py-1 px-2">
                          {formatDate(record.date)}
                        </Badge>
                      </td>
                      <td 
                        className="py-3"
                        onClick={() => handleViewRecord(record.record_id)}
                      >
                        {truncateText(record.content)}
                      </td>
                      <td 
                        className="py-3"
                        onClick={() => handleViewRecord(record.record_id)}
                      >
                        <Badge bg="secondary" className="py-1 px-2">
                          {(record.person_relationships?.length || 
                            record.personRelationships?.length || 
                            record.relationships?.length || 0)} personas
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="dark"
                            size="sm"
                            onClick={() => handleViewRecord(record.record_id)}
                            title="Ver detalles"
                          >
                            <FiEye size={14} />
                          </Button>
                          <Button
                            variant="dark"
                            size="sm"
                            onClick={() => handleEditRecord(record.record_id)}
                            title="Editar"
                          >
                            <FiEdit size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="p-4 bg-light rounded">
                        <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                          <FiFileText size={24} className="text-white" />
                        </div>
                        <h5 className="text-dark mb-1">No se encontraron antecedentes</h5>
                        <p className="text-muted mb-3">No hay antecedentes registrados o que coincidan con la búsqueda</p>
                        <Button 
                          variant="dark" 
                          onClick={handleCreateRecord}
                          className="d-flex align-items-center mx-auto"
                        >
                          <FiPlus size={16} className="me-2" />
                          Crear Nuevo Antecedente
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </Container>
    </DashboardLayout>
  );
}