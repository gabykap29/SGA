'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Nav, Tab, Spinner, Alert, Modal } from 'react-bootstrap';
import { 
  FiUser, 
  FiImage, 
  FiFileText, 
  FiLink, 
  FiArrowLeft, 
  FiEdit,
  FiDownload,
  FiShare2,
  FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-toastify';

// Componentes
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import PersonDetails from '../../../../../components/persons/PersonDetails';
import ImageGallery from '../../../../../components/persons/ImageGallery';
import DocumentsList from '../../../../../components/persons/DocumentsList';
import RecordsSection from '../../../../../components/persons/RecordsSection';
import ConnectionsSection from '../../../../../components/persons/ConnectionsSection';
import DeletePersonModal from '../../../../../components/persons/DeletePersonModal';
import EditPersonModal from '../../../../../components/persons/EditPersonModal';

// Servicios
import personService from '../../../../../services/personService';
import { useLogin } from '../../../../../hooks/useLogin';

export default function PersonView() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id;
  const { isView } = useLogin();

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);



  useEffect(() => {
    if (personId) {
      loadPersonData();
    }
  }, [personId, refreshKey]);

  const loadPersonData = async () => {
    try {
      setLoading(true);
      const result = await personService.getPersonById(personId);
      
      if (result.success) {
        setPerson(result.data);
      } else {
        toast.error(result.error || 'Error al cargar los datos de la persona');
        if (result.error?.includes('404') || result.error?.includes('not found')) {
          router.push('/dashboard/personas');
        }
      }
    } catch (error) {
      console.error('Error loading person:', error);
      toast.error('Error inesperado al cargar la persona');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    handleRefresh(); // Recargar los datos de la persona
  };

  const handleBack = () => {
    router.push('/dashboard');
  };
  
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const result = await personService.deletePerson(personId);
      
      if (result.success) {
        toast.success('Persona eliminada correctamente');
        router.push('/dashboard/personas/buscar');
      } else {
        setShowDeleteModal(false);
        toast.error(result.error || 'Error al eliminar la persona');
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      toast.error('Error inesperado al eliminar la persona');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <div className="text-muted">Cargando datos de la persona...</div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  if (!person) {
    return (
      <DashboardLayout>
        <Container>
          <Alert variant="danger" className="text-center">
            <h5>Persona no encontrada</h5>
            <p>No se pudo encontrar la persona solicitada.</p>
            <Button variant="primary" onClick={handleBack}>
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
        {/* Header con acciones */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          <div className="d-flex align-items-center">
            <Button variant="outline-secondary" className="me-3" onClick={handleBack}>
              <FiArrowLeft /> Volver
            </Button>
          </div>
          
          {!isView && (
            <div className="d-flex mt-2 mt-md-0">
              <Button 
                variant="danger" 
                onClick={() => setShowDeleteModal(true)}
              >
                <FiTrash2 className="me-1" /> Eliminar
              </Button>
            </div>
          )}
        </div>
        
        <Card>
          <Card.Header>
            <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
              <Nav.Item>
                <Nav.Link eventKey="details">
                  <FiUser className="me-1" /> Detalles
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="images">
                  <FiImage className="me-1" /> Imágenes
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="documents">
                  <FiFileText className="me-1" /> Documentos
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="records">
                  <FiFileText className="me-1" /> Antecedentes
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="connections">
                  <FiLink className="me-1" /> Conexiones
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey="details" active={activeTab === 'details'}>
                <PersonDetails 
                  person={person} 
                  onRefresh={handleRefresh}
                  onUpdate={handleEdit}
                />
              </Tab.Pane>
              
              <Tab.Pane eventKey="images" active={activeTab === 'images'}>
                <ImageGallery 
                  personId={personId} 
                  images={person.files?.filter(file => file && file.mime_type && file.mime_type.startsWith('image/')) || []} 
                  refreshKey={refreshKey} 
                  onUpdate={handleRefresh}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="documents" active={activeTab === 'documents'}>
                <DocumentsList 
                  personId={personId} 
                  documents={person.files?.filter(file => file && file.mime_type && !file.mime_type.startsWith('image/')) || []}
                  refreshKey={refreshKey} 
                  onUpdate={handleRefresh}
                />
              </Tab.Pane>
              
              <Tab.Pane eventKey="records" active={activeTab === 'records'}>
                <RecordsSection 
                  personId={personId}
                  linkedRecords={person.record_relationships?.map(rel => ({
                    ...rel.record,
                    type_relationship: rel.type_relationship
                  })) || []}
                  refreshKey={refreshKey}
                  onUpdate={handleRefresh}
                />
              </Tab.Pane>
              
              <Tab.Pane eventKey="connections" active={activeTab === 'connections'}>
                <ConnectionsSection 
                  personId={personId}
                  refreshKey={refreshKey}
                  onRefresh={handleRefresh}
                />
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Container>

      {/* Modal de confirmación para eliminar persona */}
      <DeletePersonModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        personName={person ? `${person.names} ${person.lastnames}` : ''}
      />

      {/* Modal para editar persona */}
      {person && (
        <EditPersonModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          person={person}
          onSuccess={handleEditSuccess}
        />
      )}
    </DashboardLayout>
  );
}