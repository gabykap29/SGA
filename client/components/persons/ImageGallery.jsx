'use client';

import { useState } from 'react';
import { Row, Col, Card, Button, Modal, Badge } from 'react-bootstrap';
import { 
  FiImage, 
  FiZoomIn, 
  FiDownload, 
  FiTrash2,
  FiEye,
  FiX,
  FiPlus
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const ImageGallery = ({ images = [], personId, onUpdate }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  console.log('ImageGallery recibió:', images);
  
  // Filtrar imágenes válidas
  const validImages = Array.isArray(images) ? images.filter(img => {
    if (!img) return false;
    // Verificar que tenga las propiedades mínimas necesarias
    return img.file_id && (
      img.mimetype?.startsWith('image/') || 
      img.mime_type?.startsWith('image/') || 
      img.file_type === 'image' || 
      (img.original_filename && /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(img.original_filename))
    );
  }) : [];
  
  console.log('Imágenes válidas filtradas:', validImages.length);

  const openModal = (image) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setShowModal(false);
  };

  const deleteImage = async (imageToDelete) => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseURL}/files/${imageToDelete.file_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Imagen eliminada correctamente');
        if (onUpdate) onUpdate();
        closeModal();
      } else {
        throw new Error('Error al eliminar la imagen');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la imagen');
    }
  };

  const downloadImage = async (image) => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseURL}/files/${image.file_id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = image.original_filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Descarga iniciada');
      } else {
        throw new Error('Error al descargar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al descargar la imagen');
    }
  };

  if (validImages.length === 0) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', padding: '0' }}>
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
            <FiImage size={24} />
          </div>
          <h5 className="fw-bold text-dark mb-2">No hay imágenes</h5>
          <p className="text-muted mb-4">Esta persona no tiene imágenes adjuntas.</p>
          <Button 
            variant="dark" 
            className="px-4 py-2"
            style={{
              backgroundColor: '#212529',
              border: '1px solid #000',
              borderRadius: '4px',
              color: 'white'
            }}
          >
            <FiPlus className="me-2" size={16} />
            Subir primera imagen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '0' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 p-3">
        <div>
          <h4 className="mb-1 fw-bold text-dark">Galería de Imágenes ({validImages.length})</h4>
          <small className="text-muted">Fotos y documentos visuales</small>
        </div>
        <Button 
          variant="dark" 
          size="sm"
          className="px-3 py-2"
          style={{
            backgroundColor: '#212529',
            border: '1px solid #000',
            borderRadius: '4px',
            color: 'white'
          }}
        >
          <FiPlus className="me-2" size={16} />
          Subir imagen
        </Button>
      </div>

      <Row className="g-3 px-3">
        {validImages.map((image, index) => (
          <Col md={6} lg={4} key={image.file_id || index} className="mb-4">
            <Card className="h-100" style={{ 
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              <div 
                className="position-relative overflow-hidden"
                style={{ height: '200px', cursor: 'pointer' }}
                onClick={() => openModal(image)}
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/${image.file_id}/download`}
                  alt={image.description || 'Imagen'}
                  className="w-100 h-100 object-fit-cover"
                  style={{ transition: 'transform 0.3s ease' }}
                  onError={(e) => {
                    console.error(`Error cargando imagen ${image.file_id}`);
                    e.target.src = '/file.svg';
                    e.target.style.padding = '30px';
                    e.target.className = 'w-100 h-100 object-fit-contain bg-light';
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
                <div 
                  className="position-absolute top-0 end-0 m-2"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    padding: '8px',
                    color: 'white'
                  }}
                >
                  <FiZoomIn size={16} />
                </div>
              </div>
              <Card.Body>
                <div className="mb-2">
                  <h6 className="fw-bold mb-1 text-dark">
                    {image.original_filename}
                  </h6>
                  <small className="text-muted">
                    {image.description || 'Sin descripción'}
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg="secondary" className="me-2">
                      {image.file_type?.toUpperCase() || 'IMAGEN'}
                    </Badge>
                    <small className="text-muted">
                      {image.file_size ? `${(image.file_size / 1024).toFixed(0)} KB` : ''}
                    </small>
                  </div>
                  <div className="d-flex gap-1">
                    <Button 
                      size="sm"
                      title="Ver"
                      onClick={() => openModal(image)}
                      style={{
                        backgroundColor: '#3498db',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        padding: '6px 8px'
                      }}
                    >
                      <FiEye size={12} />
                    </Button>
                    <Button 
                      size="sm"
                      title="Descargar"
                      onClick={() => downloadImage(image)}
                      style={{
                        backgroundColor: '#212529',
                        border: '1px solid #000',
                        borderRadius: '4px',
                        color: 'white',
                        padding: '6px 8px'
                      }}
                    >
                      <FiDownload size={12} />
                    </Button>
                    <Button 
                      size="sm"
                      title="Eliminar"
                      onClick={() => deleteImage(image)}
                      style={{
                        backgroundColor: '#e74c3c',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        padding: '6px 8px'
                      }}
                    >
                      <FiTrash2 size={12} />
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal para visualizar imagen */}
      <Modal show={showModal} onHide={closeModal} size="lg" centered>
        <Modal.Body className="p-0" style={{ backgroundColor: '#f8f9fa' }}>
          {selectedImage && (
            <div className="position-relative">
              <Button
                variant="dark"
                className="position-absolute top-0 end-0 m-3"
                style={{
                  zIndex: 1000,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  padding: '0'
                }}
                onClick={closeModal}
              >
                <FiX size={16} />
              </Button>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/${selectedImage.file_id}/download`}
                alt={selectedImage.description || 'Imagen'}
                className="w-100"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
                onError={(e) => {
                  console.error(`Error cargando imagen en modal ${selectedImage.file_id}`);
                  e.target.src = '/file.svg';
                  e.target.style.padding = '50px';
                  e.target.className = 'w-100 bg-light';
                }}
              />
              <div className="p-3" style={{ backgroundColor: 'white', borderTop: '1px solid #dee2e6' }}>
                <h5 className="fw-bold mb-2">{selectedImage.original_filename || 'Imagen sin nombre'}</h5>
                <p className="text-muted mb-3">{selectedImage.description || 'Sin descripción'}</p>
                <div className="d-flex gap-2 mb-3">
                  <Badge bg="secondary">
                    {selectedImage.file_type?.toUpperCase() || 'IMAGEN'}
                  </Badge>
                  {selectedImage.file_size && (
                    <Badge bg="info">
                      {`${(selectedImage.file_size / 1024).toFixed(0)} KB`}
                    </Badge>
                  )}
                  {selectedImage.created_at && (
                    <Badge bg="dark">
                      {new Date(selectedImage.created_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    onClick={() => downloadImage(selectedImage)}
                    style={{
                      backgroundColor: '#212529',
                      border: '1px solid #000',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                  >
                    <FiDownload className="me-2" size={16} />
                    Descargar
                  </Button>
                  <Button 
                    onClick={() => deleteImage(selectedImage)}
                    style={{
                      backgroundColor: '#e74c3c',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                  >
                    <FiTrash2 className="me-2" size={16} />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ImageGallery;