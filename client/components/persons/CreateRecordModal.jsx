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
    type_record: 'ROBO',
    customTypeRecord: '',
    date: new Date().toISOString().split('T')[0], // Fecha actual como valor predeterminado
    type_relationship: 'Denunciado' // Tipo de vinculación por defecto
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDuplicateError, setIsDuplicateError] = useState(false);

  const relationshipTypes = [
    'Denunciado',
    'Denunciante',
    'Testigo',
    'Autor',
    'Víctima',
    'Sospechoso',
    'Implicado',
    'Querellante'
  ];

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

    if (formData.type_record === 'OTROS' && !formData.customTypeRecord?.trim()) {
      setError('Debe especificar el tipo de antecedente cuando selecciona "Otros"');
      return;
    }

    try {
      setLoading(true);
      const dataToSend = {
        ...formData,
        type_record: formData.type_record === 'OTROS' ? formData.customTypeRecord : formData.type_record
      };
      delete dataToSend.customTypeRecord;
      const result = await recordService.createRecord(dataToSend);

      if (result.success) {
        toast.success('Antecedente creado exitosamente');
        setFormData({
          title: '',
          content: '',
          observations: '',
          category: 'PENAL',
          type_record: 'ROBO',
          customTypeRecord: '',
          date: new Date().toISOString().split('T')[0],
          type_relationship: 'Denunciado'
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
              Tipo de Antecedente <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select 
              name="type_record" 
              value={formData.type_record} 
              onChange={handleInputChange}
            >
              <option value="ROBO">Robo</option>
              <option value="ROBO_DE_MOTO">Robo de Moto</option>
              <option value="ROBO_DE_AUTO">Robo de Auto</option>
              <option value="HURTO">Hurto</option>
              <option value="VIOLENCIA_DE_GENERO">Violencia de Género</option>
              <option value="OTROS">Otros</option>
            </Form.Select>
          </Form.Group>

          {formData.type_record === 'OTROS' && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                Especificar tipo de antecedente <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="customTypeRecord"
                value={formData.customTypeRecord}
                onChange={handleInputChange}
                placeholder="Ingrese el tipo de antecedente"
              />
              <Form.Text className="text-muted">
                Describa el tipo de antecedente que no está en las opciones anteriores
              </Form.Text>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              Tipo de Vinculación <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select 
              name="type_relationship" 
              value={formData.type_relationship} 
              onChange={handleInputChange}
            >
              {relationshipTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Indica qué rol tiene la persona respecto a este antecedente
            </Form.Text>
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