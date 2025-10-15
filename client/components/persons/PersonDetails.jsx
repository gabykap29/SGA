'use client';

import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { 
  FiUser, 
  FiMapPin, 
  FiCalendar, 
  FiEdit2,
  FiGlobe,
  FiCreditCard,
  FiTrash2
} from 'react-icons/fi';
import AddImageModal from './AddImageModal';
import personService from '../../services/personService';
import { toast } from 'react-toastify';
import { useState } from 'react';

const PersonDetails = ({ person, onUpdate, onDelete }) => {
  const [showAddImage, setShowAddImage] = useState(false);
  const [uploading, setUploading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getIdTypeColor = () => {
    // Use a consistent color scheme for all types
    return 'dark';
  };

  const getIdTypeName = (type) => {
    const names = {
      'DNI': 'Documento Nacional de Identidad',
      'PASAPORTE': 'Pasaporte',
      'LIBRETA_CIVICA': 'Libreta Cívica',
      'LIBRETA_ENROLAMIENTO': 'Libreta de Enrolamiento'
    };
    return names[type] || type;
  };

  const handleAddImage = async ({ file, description }) => {
    setUploading(true);
    try {
      await personService.uploadFiles(person.person_id, [{ file, description }]);
      toast.success('Imagen subida correctamente');
      setShowAddImage(false);
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f5f5f5',
      minHeight: '400px',
      padding: '0'
    }}>
      {/* Botón para añadir imagen */}
      <div className="mb-3 text-end">
        <Button variant="dark" onClick={() => setShowAddImage(true)}>
          Añadir Imagen
        </Button>
      </div>

      {/* Información básica */}
      <div className="mb-4 p-3" style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h3 className="fw-bold mb-3 text-dark">
          <FiUser className="me-2" />
          {person.names} {person.lastnames}
        </h3>
        <div className="d-flex flex-wrap gap-2">
          <Badge bg="dark" className="px-2 py-1">
            <FiCreditCard className="me-1" size={12} />
            {person.identification || 'Sin identificación'}
          </Badge>
          <Badge bg="dark" className="px-2 py-1">
            <FiMapPin className="me-1" size={12} />
            {person.province || 'Sin provincia'}
          </Badge>
          <Badge bg="dark" className="px-2 py-1">
            <FiGlobe className="me-1" size={12} />
            {person.country || 'Sin país'}
          </Badge>
        </div>
      </div>

      {/* Detalles completos */}
      <Row className="g-3 px-3">
        <Col md={6}>
          <Card className="h-100" style={{
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <Card.Header className="border-bottom" style={{backgroundColor: '#f5f5f5'}}>
              <h6 className="mb-0 fw-bold text-dark">
                <FiUser className="me-2" size={16} />
                Datos Personales
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label text-muted small">Nombres</label>
                <div className="fw-semibold text-dark">{person.names || 'N/A'}</div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Apellidos</label>
                <div className="fw-semibold text-dark">{person.lastnames || 'N/A'}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100" style={{
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <Card.Header className="border-bottom" style={{backgroundColor: '#f5f5f5'}}>
              <h6 className="mb-0 fw-bold text-dark">
                <FiCreditCard className="me-2" size={16} />
                Identificación
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label text-muted small">Tipo de Documento</label>
                <div>
                  <Badge bg="dark" className="px-2 py-1">
                    {getIdTypeName(person.identification_type)}
                  </Badge>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Número de Documento</label>
                <div className="fw-bold text-dark font-monospace">{person.identification || 'N/A'}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100" style={{
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <Card.Header className="border-bottom" style={{backgroundColor: '#f5f5f5'}}>
              <h6 className="mb-0 fw-bold text-dark">
                <FiMapPin className="me-2" size={16} />
                Ubicación
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label text-muted small">País</label>
                <div className="fw-semibold text-dark">{person.country || 'N/A'}</div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Provincia</label>
                <div className="fw-semibold text-dark">{person.province || 'N/A'}</div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Dirección</label>
                <div className="fw-semibold text-dark">{person.address || 'N/A'}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100" style={{
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <Card.Header className="border-bottom" style={{backgroundColor: '#f5f5f5'}}>
              <h6 className="mb-0 fw-bold text-dark">
                <FiCalendar className="me-2" size={16} />
                Información del Sistema
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label text-muted small">Fecha de Registro</label>
                <div className="fw-semibold text-dark">
                  {person.created_at ? formatDate(person.created_at) : 'N/A'}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Última Actualización</label>
                <div className="fw-semibold text-dark">
                  {person.updated_at ? formatDate(person.updated_at) : 'N/A'}
                </div>
                
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Observaciones</label>
                <div className="fw-semibold text-dark">
                  {person.observations ? person.observations : 'N/A'}
                </div>
                
              </div>
              <div className="mb-3">
                <Button 
                  variant="dark" 
                  size="sm"
                  onClick={() => onUpdate && onUpdate()}
                  style={{
                    backgroundColor: '#212529',
                    border: '1px solid #000',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  <FiEdit2 className="me-2" size={14} />
                  Editar Información
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <AddImageModal 
        show={showAddImage} 
        onHide={() => setShowAddImage(false)} 
        onUpload={handleAddImage} 
        isLoading={uploading} 
      />
    </div>
  );
};

export default PersonDetails;