'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
import { 
  FiUser, 
  FiImage, 
  FiFileText, 
  FiLink, 
  FiArrowLeft, 
  FiEdit,
  FiDownload,
  FiShare2
} from 'react-icons/fi';
import { toast } from 'react-toastify';

// Componentes
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import PersonDetails from '../../../../../components/persons/PersonDetails';
import ImageGallery from '../../../../../components/persons/ImageGallery';
import DocumentsList from '../../../../../components/persons/DocumentsList';
import RecordsSection from '../../../../../components/persons/RecordsSection';

// Servicios
import personService from '../../../../../services/personService';

export default function PersonView() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id;

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [refreshKey, setRefreshKey] = useState(0);

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
    router.push(`/dashboard/personas/${personId}/editar`);
  };

  const handleBack = () => {
    router.push('/dashboard');
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

  // Separar archivos en imágenes y documentos
  const files = person.files || [];
  const images = files.filter(file => 
    file.file_type === 'image' || 
    file.mime_type?.startsWith('image/') ||
    file.original_filename?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  );
  const documents = files.filter(file => 
    file.file_type !== 'image' && 
    !file.mime_type?.startsWith('image/') &&
    !file.original_filename?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  );

  const records = person.record_relationships || [];

  return (
    <DashboardLayout>
      {/* Contenido con padding-top para el header fijo */}
      <div >
        <Container fluid>

          {/* Pestañas de contenido */}
          <Card className="border-0 shadow-lg" style={{
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }}>
            <Card.Header className="border-0" style={{
              background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
              borderRadius: '16px 16px 0 0',
              padding: '0'
            }}>
              <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="border-0">
                <Nav.Item>
                  <Nav.Link 
                    eventKey="details" 
                    className="d-flex align-items-center text-white border-0 px-4 "
                    style={{
                      backgroundColor: activeTab === 'details' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      borderRadius: activeTab === 'details' ? '8px 8px 0 0' : '0',
                      fontWeight: activeTab === 'details' ? 'bold' : 'normal'
                    }}
                  >
                    <FiUser className="me-2" size={16} />
                    Datos Personales
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="images" 
                    className="d-flex align-items-center text-white border-0 px-4 py-3"
                    style={{
                      backgroundColor: activeTab === 'images' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      borderRadius: activeTab === 'images' ? '8px 8px 0 0' : '0',
                      fontWeight: activeTab === 'images' ? 'bold' : 'normal'
                    }}
                  >
                    <FiImage className="me-2" size={16} />
                    Imágenes ({images.length})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="documents" 
                    className="d-flex align-items-center text-white border-0 px-4 py-3"
                    style={{
                      backgroundColor: activeTab === 'documents' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      borderRadius: activeTab === 'documents' ? '8px 8px 0 0' : '0',
                      fontWeight: activeTab === 'documents' ? 'bold' : 'normal'
                    }}
                  >
                    <FiFileText className="me-2" size={16} />
                    Documentos ({documents.length})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="records" 
                    className="d-flex align-items-center text-white border-0 px-4 py-3"
                    style={{
                      backgroundColor: activeTab === 'records' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      borderRadius: activeTab === 'records' ? '8px 8px 0 0' : '0',
                      fontWeight: activeTab === 'records' ? 'bold' : 'normal'
                    }}
                  >
                    <FiLink className="me-2" size={16} />
                    Antecedentes ({records.length})
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
          
          <Card.Body className="p-4">
            <Tab.Content>
              <Tab.Pane active={activeTab === 'details'}>
                <PersonDetails person={person} onUpdate={handleRefresh} />
              </Tab.Pane>
              
              <Tab.Pane active={activeTab === 'images'}>
                <ImageGallery 
                  images={images} 
                  personId={personId}
                  onUpdate={handleRefresh}
                />
              </Tab.Pane>
              
              <Tab.Pane active={activeTab === 'documents'}>
                <DocumentsList 
                  documents={documents} 
                  personId={personId}
                  onUpdate={handleRefresh}
                />
              </Tab.Pane>
              
              <Tab.Pane active={activeTab === 'records'}>
                <RecordsSection 
                  linkedRecords={records} 
                  personId={personId}
                  onUpdate={handleRefresh}
                />
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
        </Container>
      </div>
    </DashboardLayout>
  );
}