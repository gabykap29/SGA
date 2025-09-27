'use client';

import { useState } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FiUser, FiMapPin, FiSave, FiFlag, FiCreditCard, FiHome, FiX, FiTag } from 'react-icons/fi';
import personService from '../../services/personService';
import { toast } from 'react-toastify';

const CreatePersonModal = ({ show, onHide, onPersonCreated }) => {
  const [formData, setFormData] = useState({
    identification: '',
    identification_type: 'DNI',
    names: '',
    lastnames: '',
    address: '',
    province: 'Buenos Aires',
    country: 'Argentina',
    type_relationship: 'Denunciado'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Limpiar error del campo cuando el usuario empiece a escribir
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

    if (!formData.identification.trim()) {
      newErrors.identification = 'La identificación es requerida';
    } else if (!/^\d{7,8}$/.test(formData.identification.trim())) {
      newErrors.identification = 'La identificación debe tener 7 u 8 dígitos';
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
    
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Limpiar datos antes de enviar
        const cleanData = {
          identification: formData.identification.trim(),
          identification_type: formData.identification_type,
          names: formData.names.trim(),
          lastnames: formData.lastnames.trim(),
          address: formData.address.trim() || '',
          province: formData.province,
          country: formData.country,
          type_relationship: formData.type_relationship
        };

        const result = await personService.createPerson(cleanData);
        
        if (result.success) {
          toast.success('Persona creada exitosamente');
          // Resetear el formulario
          setFormData({
            identification: '',
            identification_type: 'DNI',
            names: '',
            lastnames: '',
            address: '',
            province: 'Buenos Aires',
            country: 'Argentina',
            type_relationship: 'Denunciado'
          });
          setErrors({});
          
          // Notificar al componente padre
          if (onPersonCreated) {
            onPersonCreated(result.data);
          }
          
          // Cerrar el modal
          onHide();
        } else {
          toast.error(result.error || 'Error al crear la persona');
        }
      } catch (error) {
        console.error('Error al crear persona:', error);
        toast.error('Ocurrió un error inesperado');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      backdrop="static"
      size="lg"
      centered
    >
      <Modal.Header className="border-0 pb-0">
        <Modal.Title as="h5" className="fw-bold text-dark">
          Agregar Nueva Persona
        </Modal.Title>
        <Button 
          variant="link" 
          onClick={onHide} 
          className="text-dark ms-auto p-0"
          disabled={loading}
        >
          <FiX size={20} />
        </Button>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <p className="text-muted small mb-4">
          Complete la información básica para registrar a la persona y vincularla con este antecedente.
        </p>
        
        {Object.keys(errors).length > 0 && (
          <Alert variant="danger" className="mb-4">
            <strong>Por favor corrija los siguientes errores:</strong>
            <ul className="mb-0 mt-1 small">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <div className="bg-light p-3 rounded mb-4">
            <h6 className="fw-bold mb-3">Información de Relación</h6>
            <Row className="g-3 mb-3">
              <Col md={12}>
                <Form.Label className="fw-medium text-dark">
                  Tipo de Relación <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FiTag className="text-muted" size={16} />
                  </InputGroup.Text>
                  <Form.Select
                    name="type_relationship"
                    value={formData.type_relationship}
                    onChange={handleInputChange}
                    className="border-start-0"
                  >
                    <option value="Denunciado">Denunciado</option>
                    <option value="Denunciante">Denunciante</option>
                    <option value="Testigo">Testigo</option>
                    <option value="Víctima">Víctima</option>
                    <option value="Otro">Otro</option>
                  </Form.Select>
                </InputGroup>
                <Form.Text className="text-muted">
                  Seleccione el tipo de relación que tiene la persona con este antecedente
                </Form.Text>
              </Col>
            </Row>
            
            <h6 className="fw-bold mb-3">Información Personal</h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="fw-medium text-dark">
                  Nombres <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FiUser className="text-muted" size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="names"
                    value={formData.names}
                    onChange={handleInputChange}
                    isInvalid={!!errors.names}
                    placeholder="Ej: Juan Carlos"
                    className="border-start-0 ps-0"
                  />
                </InputGroup>
              </Col>

              <Col md={6}>
                <Form.Label className="fw-medium text-dark">
                  Apellidos <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FiUser className="text-muted" size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="lastnames"
                    value={formData.lastnames}
                    onChange={handleInputChange}
                    isInvalid={!!errors.lastnames}
                    placeholder="Ej: Pérez González"
                    className="border-start-0 ps-0"
                  />
                </InputGroup>
              </Col>

              <Col md={4}>
                <Form.Label className="fw-medium text-dark">
                  Tipo de Documento <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FiCreditCard className="text-muted" size={16} />
                  </InputGroup.Text>
                  <Form.Select
                    name="identification_type"
                    value={formData.identification_type}
                    onChange={handleInputChange}
                    className="border-start-0"
                  >
                    <option value="DNI">DNI - Documento Nacional</option>
                    <option value="CI">CI - Cédula de Identidad</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="LIBRETA_CIVICA">L.C. - Libreta Cívica</option>
                    <option value="LIBRETA_ENROLAMIENTO">L.E. - Libreta Enrolamiento</option>
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col md={8}>
                <Form.Label className="fw-medium text-dark">
                  Número de Documento <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>
                      {formData.identification_type}
                    </span>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="identification"
                    value={formData.identification}
                    onChange={handleInputChange}
                    isInvalid={!!errors.identification}
                    placeholder="12345678"
                    maxLength={8}
                    className="border-start-0 ps-2"
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Ingrese solo números, sin puntos ni espacios
                </Form.Text>
              </Col>
            </Row>
          </div>

          <div className="bg-light p-3 rounded mb-4">
            <h6 className="fw-bold mb-3">Ubicación</h6>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label className="fw-medium text-dark">
                  Dirección
                  <span className="text-muted small ms-1">(Opcional)</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FiHome className="text-muted" size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    className="border-start-0 ps-0"
                  />
                </InputGroup>
              </Col>

              <Col md={6}>
                <Form.Label className="fw-medium text-dark">
                  Provincia <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FiMapPin className="text-muted" size={16} />
                  </InputGroup.Text>
                  <Form.Select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    isInvalid={!!errors.province}
                    className="border-start-0"
                  >
                    <option value="">Seleccionar provincia...</option>
                    <option value="Buenos Aires">Buenos Aires</option>
                    <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
                    <option value="Catamarca">Catamarca</option>
                    <option value="Chaco">Chaco</option>
                    <option value="Chubut">Chubut</option>
                    <option value="Córdoba">Córdoba</option>
                    <option value="Corrientes">Corrientes</option>
                    <option value="Entre Ríos">Entre Ríos</option>
                    <option value="Formosa">Formosa</option>
                    <option value="Jujuy">Jujuy</option>
                    <option value="La Pampa">La Pampa</option>
                    <option value="La Rioja">La Rioja</option>
                    <option value="Mendoza">Mendoza</option>
                    <option value="Misiones">Misiones</option>
                    <option value="Neuquén">Neuquén</option>
                    <option value="Río Negro">Río Negro</option>
                    <option value="Salta">Salta</option>
                    <option value="San Juan">San Juan</option>
                    <option value="San Luis">San Luis</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="Santa Fe">Santa Fe</option>
                    <option value="Santiago del Estero">Santiago del Estero</option>
                    <option value="Tierra del Fuego">Tierra del Fuego</option>
                    <option value="Tucumán">Tucumán</option>
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col md={6}>
                <Form.Label className="fw-medium text-dark">
                  País <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FiFlag className="text-muted" size={16} />
                  </InputGroup.Text>
                  <Form.Select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    isInvalid={!!errors.country}
                    className="border-start-0"
                  >
                    <option value="">Seleccionar país...</option>
                    <option value="Argentina">🇦🇷 Argentina</option>
                    <option value="Chile">🇨🇱 Chile</option>
                    <option value="Brasil">🇧🇷 Brasil</option>
                    <option value="Uruguay">🇺🇾 Uruguay</option>
                    <option value="Paraguay">🇵🇾 Paraguay</option>
                    <option value="Bolivia">🇧🇴 Bolivia</option>
                    <option value="Perú">🇵🇪 Perú</option>
                    <option value="Colombia">🇨🇴 Colombia</option>
                    <option value="Ecuador">🇪🇨 Ecuador</option>
                    <option value="Venezuela">🇻🇪 Venezuela</option>
                    <option value="Otro">🌍 Otro país</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <div className="d-flex w-100 justify-content-between">
          <div className="small text-muted mt-2">
            <span className="text-danger">*</span> Campos obligatorios
          </div>
          <div>
            <Button
              variant="light"
              onClick={onHide}
              className="me-2"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="dark"
              onClick={handleSubmit}
              disabled={loading}
              className="d-flex align-items-center"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" animation="border" />
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="me-2" />
                  Guardar y Vincular
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePersonModal;