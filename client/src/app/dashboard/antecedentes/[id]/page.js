'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Tab, Nav } from 'react-bootstrap';
import { FiFileText, FiArrowLeft, FiEdit, FiCalendar, FiUser, FiLink2, FiUserPlus, FiTrash2 } from 'react-icons/fi';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import recordService from '../../../../../services/recordService';
import CreatePersonModal from '../../../../../components/persons/CreatePersonModal';
import LinkPersonModal from '../../../../../components/persons/LinkPersonModal';

export default function RecordDetail() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id;

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showCreatePersonModal, setShowCreatePersonModal] = useState(false);
  const [showLinkPersonModal, setShowLinkPersonModal] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    if (recordId) {
      loadRecordData();
    }
  }, [recordId]);

  const loadRecordData = async () => {
    try {
      setLoading(true);
      const result = await recordService.getRecordById(recordId);

      if (result.success) {
        setRecord(result.data);
      } else {
        toast.error(result.error || 'Error al cargar los datos del antecedente');
        if (result.error?.includes('404') || result.error?.includes('not found')) {
          router.push('/dashboard/antecedentes');
        }
      }
    } catch (error) {
      console.error('Error loading record:', error);
      toast.error('Error inesperado al cargar el antecedente');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/antecedentes/${recordId}/editar`);
  };

  const handleCreateAndLinkPerson = async (personData) => {
    try {
      setLinkLoading(true);

      // Extraer el ID de la persona de la respuesta con más opciones
      const personId = personData.person_id || personData.id || personData.personId;

      if (!personId) {
        toast.error('No se pudo obtener el ID de la persona creada');
        return;
      }

      // La persona ya fue creada en el modal, solo necesitamos vincularla
      const result = await recordService.linkPersonToRecord(personId, recordId, personData.type_relationship || 'Denunciado');

      if (result.success) {
        toast.success('Persona creada y vinculada exitosamente');
        // Recargar los datos para mostrar la nueva persona vinculada
        loadRecordData();
        // Cambiar a la pestaña de personas vinculadas
        setActiveTab('persons');
      } else {
        toast.error(result.error || 'Error al vincular la persona con el antecedente');
      }
    } catch (error) {
      console.error('Error al vincular persona:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkPerson = async (personId, personName) => {
    if (window.confirm(`¿Está seguro de que desea desvincular a "${personName}" de este antecedente?`)) {
      try {
        // No activamos loading global para evitar parpadeo completo, o sí si preferimos feedback visual fuerte
        // Usaremos loading global ya que recargaremos datos después
        setLoading(true);
        const result = await recordService.unlinkPersonFromRecord(personId, recordId);

        if (result.success) {
          toast.success('Persona desvinculada exitosamente');
          await loadRecordData(); // Recargar datos
        } else {
          toast.error(result.error || 'Error al desvincular la persona');
          setLoading(false); // Solo desactivar si hubo error y no recargamos
        }
      } catch (error) {
        console.error('Error unlinking person:', error);
        toast.error('Ocurrió un error inesperado');
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    console.log("fecha ", dateString)
    if (!dateString) return 'N/A';
    try {
      // Extraer solo la fecha sin parsear para evitar problemas de zona horaria
      const datePart = dateString.split('T')[0]; // "2026-01-01"
      const [year, month, day] = datePart.split('-');

      // Mapeo de meses en español
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];

      const monthName = meses[parseInt(month) - 1];
      return `${parseInt(day)} de ${monthName} de ${year}`;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="dark" className="mb-3" />
            <div className="text-muted">Cargando datos del antecedente...</div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  if (!record) {
    return (
      <DashboardLayout>
        <Container>
          <Alert variant="danger" className="text-center">
            <h5>Antecedente no encontrado</h5>
            <p>No se pudo encontrar el antecedente solicitado.</p>
            <Button variant="dark" onClick={() => router.push('/dashboard/antecedentes')}>
              <FiArrowLeft className="me-2" />
              Volver a la lista
            </Button>
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cuadro de título */}
        <div className="mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Button
                variant="link"
                onClick={() => router.push('/dashboard/antecedentes')}
                className="p-0 me-3 text-decoration-none text-muted"
              >
                <FiArrowLeft size={20} />
              </Button>
              <div>
                <h2 className="display-6 fw-bold text-dark mb-0">{record.record_number}</h2>
                <p className="lead text-muted mb-0">
                  <FiCalendar className="me-2" />
                  {formatDate(record.record_date)}
                </p>
              </div>
            </div>
            <Button
              variant="dark"
              onClick={handleEdit}
              className="d-flex align-items-center"
            >
              <FiEdit className="me-2" size={16} />
              Editar Antecedente
            </Button>
          </div>
        </div>

        <Row>
          <Col lg={8}>
            {/* Pestañas de contenido */}
            <Card className="border-1 shadow-sm mb-4">
              <Tab.Container defaultActiveKey="details">
                <Card.Header className="bg-light border-1 p-0">
                  <Nav variant="tabs" className="border-bottom-0">
                    <Nav.Item>
                      <Nav.Link eventKey="details" className="text-dark fw-medium border-0 px-4 py-3">
                        <FiFileText className="me-2" />
                        Detalles
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="persons" className="text-dark fw-medium border-0 px-4 py-3">
                        <FiUser className="me-2" />
                        Personas Vinculadas
                        <Badge bg="dark" className="ms-2">
                          {record.person_relationships?.length || 0}
                        </Badge>
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Header>
                <Card.Body className="p-4">
                  <Tab.Content>
                    <Tab.Pane eventKey="details">
                      <div className="mb-4">
                        <h6 className="fw-bold text-muted small mb-2">Tipo de Antecedente</h6>
                        <Badge
                          bg="dark"
                          className="px-3 py-2 fs-6"
                          style={{
                            maxWidth: '100%',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            display: 'inline-block',
                            textAlign: 'left'
                          }}
                        >
                          {record.type_record || 'No especificado'}
                        </Badge>
                      </div>
                      <h5 className="fw-bold text-dark mb-3">Contenido</h5>
                      <p className="text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                        {record.description || 'No hay contenido disponible.'}
                      </p>
                      {record.observations && (
                        <>
                          <h5 className="fw-bold text-dark mb-3 mt-4">Observaciones</h5>
                          <p className="text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                            {record.observations}
                          </p>
                        </>
                      )}
                    </Tab.Pane>
                    <Tab.Pane eventKey="persons">
                      {!record.person_relationships?.length ? (
                        <div className="text-center py-4">
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                            <FiLink2 size={30} className="text-muted" />
                          </div>
                          <h5 className="text-dark mb-2">No hay personas vinculadas</h5>
                          <p className="text-muted mb-4">Este antecedente no tiene personas asociadas actualmente.</p>
                          <Button
                            variant="dark"
                            onClick={() => setShowCreatePersonModal(true)}
                            className="me-2"
                          >
                            <FiUserPlus className="me-1" />
                            Crear y Vincular Persona
                          </Button>
                          <Button
                            variant="outline-dark"
                            onClick={() => setShowLinkPersonModal(true)}
                          >
                            <FiLink2 className="me-1" />
                            Vincular Persona Existente
                          </Button>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="bg-light">
                              <tr>
                                <th className="fw-bold">Nombre</th>
                                <th className="fw-bold">Identificación</th>
                                <th className="fw-bold">Relación</th>
                                <th className="fw-bold">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {record.person_relationships.map((relationship) => (
                                <tr key={relationship.id || relationship.person_id}>
                                  <td className="align-middle">
                                    {relationship.person?.names} {relationship.person?.lastnames}
                                  </td>
                                  <td className="align-middle">
                                    <Badge bg="dark">
                                      {relationship.person?.identification}
                                    </Badge>
                                  </td>
                                  <td className="align-middle">
                                    <Badge bg="secondary">
                                      {relationship.type_relationship || 'No especificado'}
                                    </Badge>
                                  </td>
                                  <td className="align-middle">
                                    <div className="d-flex gap-2">
                                      <Button
                                        variant="dark"
                                        size="sm"
                                        onClick={() => router.push(`/dashboard/personas/${relationship.person_id}`)}
                                        title="Ver perfil"
                                      >
                                        <FiUser size={14} className="me-1" />
                                        Ver
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleUnlinkPerson(relationship.person_id, `${relationship.person?.names} ${relationship.person?.lastnames}`)}
                                        title="Desvincular del antecedente"
                                      >
                                        <FiTrash2 size={14} className="me-1" />
                                        Desvincular
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Tab.Pane>
                  </Tab.Content>
                </Card.Body>
              </Tab.Container>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Tarjeta de información */}
            <Card className="border-1 shadow-sm mb-4">
              <Card.Header className="bg-light border-1 py-3">
                <h5 className="mb-0 fw-bold text-dark">Información del Sistema</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="small text-muted mb-1">Identificador</div>
                  <div className="fw-medium text-dark">{record.record_id}</div>
                </div>
                <div className="mb-3">
                  <div className="small text-muted mb-1">Fecha de Registro</div>
                  <div className="fw-medium text-dark">
                    {formatDate(record.create_at || record.record_date)}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="small text-muted mb-1">Última Actualización</div>
                  <div className="fw-medium text-dark">
                    {formatDate(record.updated_at || record.record_date)}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="small text-muted mb-1">Estado</div>
                  <Badge bg="success" className="py-1 px-2">Activo</Badge>
                </div>
              </Card.Body>
            </Card>

            {/* Tarjeta de acciones */}
            <Card className="border-1 shadow-sm">
              <Card.Header className="bg-light border-1 py-3">
                <h5 className="mb-0 fw-bold text-dark">Acciones</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="dark" onClick={handleEdit}>
                    <FiEdit className="me-2" />
                    Editar Antecedente
                  </Button>
                  <Button
                    variant="outline-dark"
                    onClick={() => setShowCreatePersonModal(true)}
                    className="mb-2"
                  >
                    <FiUserPlus className="me-2" />
                    Crear y Vincular Persona
                  </Button>
                  <Button
                    variant="outline-dark"
                    onClick={() => setShowLinkPersonModal(true)}
                  >
                    <FiLink2 className="me-2" />
                    Vincular Persona Existente
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* Modal para crear persona */}
        <CreatePersonModal
          show={showCreatePersonModal}
          onHide={() => setShowCreatePersonModal(false)}
          onPersonCreated={handleCreateAndLinkPerson}
        />

        {/* Modal para vincular persona existente */}
        <LinkPersonModal
          show={showLinkPersonModal}
          onHide={() => setShowLinkPersonModal(false)}
          recordId={recordId}
          onPersonLinked={loadRecordData}
          currentLinkedPersons={record?.person_relationships || []}
        />
      </Container>
    </DashboardLayout>
  );
}