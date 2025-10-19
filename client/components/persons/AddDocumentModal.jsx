import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { FiUpload, FiX, FiFileText } from 'react-icons/fi';

const AddDocumentModal = ({ show, onHide, onUpload, isLoading }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && onUpload) {
      onUpload({ file, description });
    }
  };

  const resetForm = () => {
    setFile(null);
    setDescription('');
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FiFileText className="me-2" /> Subir Documento
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Selecciona un documento</Form.Label>
            <Form.Control 
              type="file" 
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" 
              onChange={handleFileChange} 
              required 
            />
            <Form.Text className="text-muted">
              Formatos permitidos: PDF, Word, Excel, PowerPoint, imágenes, texto
            </Form.Text>
          </Form.Group>
          <Form.Group controlId="formDescription" className="mb-3">
            <Form.Label>Descripción (opcional)</Form.Label>
            <Form.Control 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Descripción del documento..." 
              maxLength={200}
            />
            <Form.Text className="text-muted">
              Máximo 200 caracteres
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleHide} disabled={isLoading}>
            <FiX className="me-1" /> Cancelar
          </Button>
          <Button variant="dark" type="submit" disabled={isLoading || !file}>
            {isLoading ? <Spinner size="sm" animation="border" className="me-2" /> : <FiUpload className="me-1" />} 
            Subir Documento
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddDocumentModal;