'use client';

import { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { FiFileText, FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import recordService from '../../services/recordService';
import { toast } from 'react-toastify';

const CreateRecordModal = ({ show, onHide, onRecordCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    observations: '',
    category: 'PENAL',
    type_record: 'JUDICIAL',
    date: new Date().toISOString().split('T')[0] // Añadimos la fecha actual como valor predeterminado
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDuplicateError, setIsDuplicateError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Limpiar errores de duplicados cuando cambia el título
    if (name === 'title' && isDuplicateError) {
      setIsDuplicateError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsDuplicateError(false);

    // Validaciones
    if (!formData.title?.trim()) {
      setError('El título del antecedente es obligatorio');
      return;
    }

    if (!formData.content?.trim()) {
      setError('El contenido del antecedente es obligatorio');
      return;
    }

    try {
      setLoading(true);
      const result = await recordService.createRecord(formData);

      if (result.success) {
        toast.success('Antecedente creado exitosamente');
        setFormData({
          title: '',
          content: '',
          observations: '',
          category: 'PENAL',
          type_record: 'JUDICIAL',
          date: new Date().toISOString().split('T')[0]
        });
        onRecordCreated(result.data);
        onHide();
      } else {
        if (result.isDuplicate) {
          setIsDuplicateError(true);
          toast.error('Ya existe un antecedente con este título');
        } else {
          setError(result.error || 'Error al crear el antecedente');
        }
      }
    } catch (error) {
      console.error('Error creating record:', error);
      setError('Error inesperado al crear el antecedente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <FiFileText className="me-2" /> 
          Crear Nuevo Antecedente
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {error && (
            <Alert variant="danger" className="mb-4 d-flex align-items-center">
              <FiAlertCircle size={20} className="me-2" />
              <div>{error}</div>
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              Título <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Ej: Robo en grado de tentativa"
              isInvalid={isDuplicateError}
            />
            {isDuplicateError && (
              <Form.Control.Feedback type="invalid">
                Este título ya existe en el sistema
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              Fecha <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              Categoría <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select 
              name="category" 
              value={formData.category} 
              onChange={handleInputChange}
            >
              <option value="PENAL">Penal</option>
              <option value="CIVIL">Civil</option>
              <option value="COMERCIAL">Comercial</option>
              <option value="FAMILIAR">Familiar</option>
              <option value="LABORAL">Laboral</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="OTRO">Otro</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              Tipo de Antecedente <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select 
              name="type_record" 
              value={formData.type_record} 
              onChange={handleInputChange}
            >
              <option value="JUDICIAL">Judicial</option>
              <option value="POLICIAL">Policial</option>
              <option value="PERIODISTICO">Periodístico</option>
              <option value="REDES_SOCIALES">Redes Sociales</option>
              <option value="TESTIMONIO">Testimonio</option>
              <option value="OTRO">Otro</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              Contenido <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Descripción detallada del antecedente..."
            />
          </Form.Group>

          <Form.Group>
            <Form.Label className="fw-medium">
              Observaciones <span className="text-muted">(Opcional)</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="observations"
              value={formData.observations}
              onChange={handleInputChange}
              placeholder="Notas adicionales, observaciones o detalles complementarios..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
            <FiX className="me-1" /> Cancelar
          </Button>
          <Button variant="dark" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creando...
              </>
            ) : (
              <>
                <FiSave className="me-1" /> Guardar Antecedente
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateRecordModal;