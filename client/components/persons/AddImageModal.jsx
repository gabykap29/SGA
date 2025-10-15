import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { FiUpload, FiX } from 'react-icons/fi';

const AddImageModal = ({ show, onHide, onUpload, isLoading }) => {
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

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FiUpload className="me-2" /> Subir Imagen
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Selecciona una imagen</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleFileChange} required />
          </Form.Group>
          <Form.Group controlId="formDescription" className="mb-3">
            <Form.Label>Descripción (opcional)</Form.Label>
            <Form.Control 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Descripción de la imagen..." 
              maxLength={200}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            <FiX className="me-1" /> Cancelar
          </Button>
          <Button variant="dark" type="submit" disabled={isLoading || !file}>
            {isLoading ? <Spinner size="sm" animation="border" className="me-2" /> : <FiUpload className="me-1" />} 
            Subir Imagen
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddImageModal;
