'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import personService from '../../services/personService';

const EditPersonModal = ({ show, onHide, person, onSuccess }) => {
  const [formData, setFormData] = useState({
    identification: '',
    identification_type: 'DNI',
    names: '',
    lastnames: '',
    address: '',
    province: '',
    country: '',
    observations: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Llenar el formulario cuando se selecciona una persona
  useEffect(() => {
    if (person && show) {
      setFormData({
        identification: person.identification || '',
        identification_type: person.identification_type || 'DNI',
        names: person.names || '',
        lastnames: person.lastnames || '',
        address: person.address || '',
        province: person.province || '',
        country: person.country || '',
        observations: person.observations || ''
      });
      setErrors({});
    }
  }, [person, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.names.trim()) {
      newErrors.names = 'Los nombres son requeridos';
    }
    
    if (!formData.lastnames.trim()) {
      newErrors.lastnames = 'Los apellidos son requeridos';
    }
    
    if (!formData.identification_type.trim()) {
      newErrors.identification_type = 'El tipo de identificación es requerido';
    }
    
    if (!formData.province.trim()) {
      newErrors.province = 'La provincia es requerida';
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'El país es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await personService.updatePerson(person.person_id, formData);
      
      if (result.success) {
        toast.success('Persona actualizada exitosamente');
        onSuccess();
        onHide();
      } else {
        toast.error(result.error || 'Error al actualizar la persona');
      }
    } catch (error) {
      console.error('Error updating person:', error);
      toast.error('Error inesperado al actualizar la persona');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      identification: '',
      identification_type: 'DNI',
      names: '',
      lastnames: '',
      address: '',
      province: '',
      country: '',
      observations: ''
    });
    setErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Información de la Persona</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombres *</Form.Label>
                <Form.Control
                  type="text"
                  name="names"
                  value={formData.names}
                  onChange={handleInputChange}
                  isInvalid={!!errors.names}
                  placeholder="Ingrese los nombres"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.names}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Apellidos *</Form.Label>
                <Form.Control
                  type="text"
                  name="lastnames"
                  value={formData.lastnames}
                  onChange={handleInputChange}
                  isInvalid={!!errors.lastnames}
                  placeholder="Ingrese los apellidos"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.lastnames}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Identificación *</Form.Label>
                <Form.Select
                  name="identification_type"
                  value={formData.identification_type}
                  onChange={handleInputChange}
                  isInvalid={!!errors.identification_type}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Cedula">Cédula</option>
                  <option value="Carnet">Carnet de Identidad</option>
                  <option value="Otro">Otro</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.identification_type}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Número de Identificación</Form.Label>
                <Form.Control
                  type="text"
                  name="identification"
                  value={formData.identification}
                  onChange={handleInputChange}
                  isInvalid={!!errors.identification}
                  placeholder="Ingrese el número de identificación"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.identification}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              isInvalid={!!errors.address}
              placeholder="Ingrese la dirección"
            />
            <Form.Control.Feedback type="invalid">
              {errors.address}
            </Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Provincia *</Form.Label>
                <Form.Control
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  isInvalid={!!errors.province}
                  placeholder="Ingrese la provincia"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.province}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>País *</Form.Label>
                <Form.Control
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  isInvalid={!!errors.country}
                  placeholder="Ingrese el país"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.country}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="observations"
              value={formData.observations}
              onChange={handleInputChange}
              placeholder="Ingrese observaciones adicionales (opcional)"
            />
          </Form.Group>

          <Alert variant="info" className="mt-3">
            <small>
              * Los campos marcados con asterisco son obligatorios
            </small>
          </Alert>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Persona'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditPersonModal;