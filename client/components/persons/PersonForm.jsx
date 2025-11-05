'use client';

import { useState, useEffect, useRef } from 'react';
import { Form, Row, Col, Button, Card, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { FiUser, FiMapPin, FiSave, FiFlag, FiCreditCard, FiHome, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import personService from '../../services/personService';

const PersonForm = ({ onSave, loading = false, initialData = null, isDuplicateError = false, onDuplicateErrorChange }) => {
  const [formData, setFormData] = useState({
    identification: '',
    identification_type: 'DNI',
    names: '',
    lastnames: '',
    address: '',
    province: 'Buenos Aires',
    country: 'Argentina',
    observations: ''
  });

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [searchingDNI, setSearchingDNI] = useState(false);
  const [personFound, setPersonFound] = useState(null);
  const dniSearchTimeout = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setIsEditing(true);
      validateAllSections(initialData);
    }
  }, [initialData]);

  // Cleanup del timeout cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (dniSearchTimeout.current) {
        clearTimeout(dniSearchTimeout.current);
      }
    };
  }, []);

  // Función para buscar persona por DNI
  const searchPersonByDNI = async (dni) => {
    if (!dni || dni.length < 7) {
      setPersonFound(null);
      return;
    }

    try {
      setSearchingDNI(true);
      const result = await personService.searchPersons({
        identification: dni
      });

      if (result.success && result.data && result.data.length > 0) {
        const person = result.data[0];
        setPersonFound(person);

        // Auto-llenar los campos
        const updatedFormData = {
          ...formData,
          names: person.names || '',
          lastnames: person.lastnames || '',
          province: person.province || 'Buenos Aires',
          country: person.country || 'Argentina',
          address: person.address || '',
          identification_type: person.identification_type || 'DNI'
        };
        setFormData(updatedFormData);
        validateAllSections(updatedFormData);

        toast.success('Persona encontrada. Información completada automáticamente.');
      } else {
        setPersonFound(null);
      }
    } catch (error) {
      console.error('Error al buscar persona:', error);
      setPersonFound(null);
    } finally {
      setSearchingDNI(false);
    }
  };

  const validateAllSections = (data) => {
    const completed = new Set();
    
    // Validar sección personal
    if (data && 
        data.names && typeof data.names === 'string' && data.names.trim() && 
        data.lastnames && typeof data.lastnames === 'string' && data.lastnames.trim() && 
        data.identification && typeof data.identification === 'string' && data.identification.trim() && 
        data.identification_type) {
      completed.add('personal');
    }
    
    // Validar sección ubicación (dirección es opcional pero provincia es requerida)
    if (data && data.province) {
      completed.add('location');
    }
    
    // Validar sección adicional
    if (data && data.country) {
      completed.add('additional');
    }
    
    setCompletedSections(completed);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);
    
    // Asegurarnos de que newFormData está correctamente definido antes de validar
    if (newFormData) {
      try {
        validateAllSections(newFormData);
      } catch (error) {
        console.error('Error validating form sections:', error);
      }
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Si el campo es identificación, también limpiamos el error de duplicado
    if (name === 'identification' || name === 'identification_type') {
      // Si hay una función callback para el error de duplicado, la llamamos
      if (isDuplicateError && typeof onDuplicateErrorChange === 'function') {
        onDuplicateErrorChange(false);
      }
    }

    // Si es el campo de DNI, buscar persona después de 500ms sin escribir
    if (name === 'identification') {
      if (dniSearchTimeout.current) {
        clearTimeout(dniSearchTimeout.current);
      }

      if (value.trim().length >= 7) {
        dniSearchTimeout.current = setTimeout(() => {
          searchPersonByDNI(value.trim());
        }, 500);
      } else {
        setPersonFound(null);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.names || !formData.names.trim()) {
      newErrors.names = 'Los nombres son requeridos';
    }

    if (!formData.lastnames || !formData.lastnames.trim()) {
      newErrors.lastnames = 'Los apellidos son requeridos';
    }

    if (!formData.identification || !formData.identification.trim()) {
      newErrors.identification = 'La identificación es requerida';
    } else if (!/^\d{7,8}$/.test(formData.identification.trim())) {
      newErrors.identification = 'La identificación debe tener 7 u 8 dígitos';
    }

    if (!formData.identification_type || !formData.identification_type.trim()) {
      newErrors.identification_type = 'El tipo de identificación es requerido';
    }

    if (!formData.province || !formData.province.trim()) {
      newErrors.province = 'La provincia es requerida';
    }

    if (!formData.country || !formData.country.trim()) {
      newErrors.country = 'El país es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Limpiar datos antes de enviar
      const cleanData = {
        identification: formData.identification ? formData.identification.trim() : '',
        identification_type: formData.identification_type || 'DNI',
        names: formData.names ? formData.names.trim() : '',
        lastnames: formData.lastnames ? formData.lastnames.trim() : '',
        address: (formData.address ? formData.address.trim() : '') || '',
        province: formData.province || 'Buenos Aires',
        country: formData.country || 'Argentina',
        observations: formData.observations ? formData.observations.trim() : ''
      };

      onSave(cleanData);
    }
  };

  const getSectionStatus = (sectionName) => {
    return completedSections.has(sectionName) ? 'completed' : 'incomplete';
  };

  const getProgressPercentage = () => {
    return Math.round((completedSections.size / 3) * 100);
  };

  const renderSectionHeader = (title, icon, sectionName, description) => {
    const IconComponent = icon;
    const isCompleted = getSectionStatus(sectionName) === 'completed';
    
    return (
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center">
          <div 
            className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
              isCompleted ? 'bg-success text-white' : 'bg-primary text-white'
            }`}
            style={{ width: '36px', height: '36px' }}
          >
            {isCompleted ? (
              <FiCheck size={16} />
            ) : (
              <IconComponent size={16} />
            )}
          </div>
          <div>
            <h6 className={`fw-bold mb-0 ${isCompleted ? 'text-success' : 'text-dark'}`}>
              {title}
            </h6>
            <small className="text-muted">{description}</small>
          </div>
        </div>
        
        {isCompleted && (
          <div className="badge bg-success bg-opacity-10 text-success border border-success">
            <FiCheck size={12} className="me-1" />
            Completado
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Alerta de persona duplicada */}
      {isDuplicateError && (
        <Alert variant="danger" className="mb-4 d-flex align-items-center">
          <FiAlertCircle size={20} className="me-2" />
          <div>
            <strong>Persona duplicada detectada!</strong> El número de identificación ya existe en el sistema. 
            Por favor, verifique el número de documento o utilice otro.
          </div>
        </Alert>
      )}

      {/* Header con progreso */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              {isEditing ? 'Editar Información Personal' : 'Registro de Nueva Persona'}
            </h5>
            <p className="text-muted small mb-0">
              Complete toda la información requerida para el registro
            </p>
          </div>
          <div className="text-end">
            <div className="small text-muted mb-1">Progreso del formulario</div>
            <div className="d-flex align-items-center">
              <span className="small fw-medium me-2">{getProgressPercentage()}%</span>
              <div className="progress" style={{ width: '100px', height: '6px' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {Object.keys(errors).length > 0 && (
          <Alert variant="danger" className="d-flex align-items-center">
            <FiAlertCircle className="me-2" />
            <div>
              <strong>Por favor corrija los siguientes errores:</strong>
              <ul className="mb-0 mt-1 small">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          {/* Información Personal Básica */}
          <Col lg={12}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                {renderSectionHeader(
                  'Información Personal Básica', 
                  FiUser, 
                  'personal',
                  'Datos identificatorios principales'
                )}
                
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="fw-medium text-dark">
                      Nombres <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <FiUser className="text-muted" size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="names"
                        value={formData.names}
                        onChange={handleInputChange}
                        isInvalid={!!errors.names}
                        isValid={!errors.names && formData.names && formData.names.trim() ? true : false}
                        placeholder="Ej: Juan Carlos"
                        className="border-start-0 ps-0"
                        style={{ boxShadow: 'none' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.names}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Col>

                  <Col md={6}>
                    <Form.Label className="fw-medium text-dark">
                      Apellidos <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <FiUser className="text-muted" size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="lastnames"
                        value={formData.lastnames}
                        onChange={handleInputChange}
                        isInvalid={!!errors.lastnames}
                        isValid={!errors.lastnames && formData.lastnames && formData.lastnames.trim() ? true : false}
                        placeholder="Ej: Pérez González"
                        className="border-start-0 ps-0"
                        style={{ boxShadow: 'none' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastnames}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Col>

                  <Col md={4}>
                    <Form.Label className="fw-medium text-dark">
                      Tipo de Documento <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <FiCreditCard className="text-muted" size={16} />
                      </InputGroup.Text>
                      <Form.Select
                        name="identification_type"
                        value={formData.identification_type}
                        onChange={handleInputChange}
                        className="border-start-0"
                        style={{ boxShadow: 'none' }}
                      >
                        <option value="DNI">DNI - Documento Nacional</option>
                        <option value="CI">CI - Cédula de Identidad</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="LIBRETA_CIVICA">L.C. - Libreta Cívica</option>
                        <option value="LIBRETA_ENROLAMIENTO">L.E. - Libreta Enrolamiento</option>
                      </Form.Select>
                    </InputGroup>
                  </Col>

                  <Col md={5}>
                    <Form.Label className="fw-medium text-dark">
                      Número de Documento <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>
                          {formData.identification_type}
                        </span>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="identification"
                        value={formData.identification}
                        onChange={handleInputChange}
                        isInvalid={!!errors.identification || isDuplicateError}
                        isValid={!isDuplicateError && !errors.identification && formData.identification && formData.identification.trim() ? true : false}
                        placeholder="12345678"
                        maxLength={8}
                        className="border-start-0 ps-2"
                        style={{ boxShadow: isDuplicateError ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : 'none' }}
                      />
                      {searchingDNI && <InputGroup.Text><Spinner size="sm" animation="border" /></InputGroup.Text>}
                      <Form.Control.Feedback type="invalid">
                        {isDuplicateError ? 'Este número de identificación ya existe en el sistema' : errors.identification}
                      </Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Ingrese solo números, sin puntos ni espacios. Se verificará si la persona existe.
                    </Form.Text>
                    {personFound && (
                      <Alert variant="success" className="mt-2 mb-0 py-2">
                        ✓ Persona encontrada. Información completada automáticamente.
                      </Alert>
                    )}
                  </Col>

                  <Col md={3}>
                    <div className="h-100 d-flex align-items-end">
                      <div className="w-100 text-center p-3 bg-light rounded border">
                        <div className="small text-muted mb-1">Vista previa</div>
                        <div className="fw-bold text-dark">
                          {formData.identification_type} {formData.identification || '########'}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Información de Ubicación */}
          <Col lg={12}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                {renderSectionHeader(
                  'Información de Ubicación', 
                  FiMapPin, 
                  'location',
                  'Domicilio y ubicación geográfica'
                )}
                
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Label className="fw-medium text-dark">
                      Dirección Completa
                      <span className="text-muted small ms-1">(Opcional)</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <FiHome className="text-muted" size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Ej: Av. Corrientes 1234, CABA"
                        className="border-start-0 ps-0"
                        style={{ boxShadow: 'none' }}
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Incluya calle, número, localidad si es posible
                    </Form.Text>
                  </Col>

                  <Col md={4}>
                    <Form.Label className="fw-medium text-dark">
                      Provincia <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <FiMapPin className="text-muted" size={16} />
                      </InputGroup.Text>
                      <Form.Select
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        isValid={!errors.province && formData.province}
                        className="border-start-0"
                        style={{ boxShadow: 'none' }}
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
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Información Adicional */}
          <Col lg={12}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                {renderSectionHeader(
                  'Información Adicional', 
                  FiFlag, 
                  'additional',
                  'Datos complementarios del registro'
                )}
                
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="fw-medium text-dark">
                      País de Origen <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-end-0">
                        <FiFlag className="text-muted" size={16} />
                      </InputGroup.Text>
                      <Form.Select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        isInvalid={!!errors.country}
                        isValid={!errors.country && formData.country}
                        className="border-start-0"
                        style={{ boxShadow: 'none' }}
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
                      <Form.Control.Feedback type="invalid">
                        {errors.country}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Col>

                  <Col md={6}>
                    <div className="h-100 d-flex align-items-end">
                      <div className="w-100">
                        <div className="bg-success bg-opacity-10 border border-success rounded p-3">
                          <div className="small text-success mb-2 fw-medium">
                            <FiCheck className="me-1" />
                            Resumen del Registro
                          </div>
                          <div className="small">
                            <div><strong>Nombre completo:</strong> {formData.names} {formData.lastnames}</div>
                            <div><strong>Documento:</strong> {formData.identification_type} {formData.identification}</div>
                            <div><strong>Ubicación:</strong> {formData.province}, {formData.country}</div>
                            <div><strong>Secciones completadas:</strong> {completedSections.size} de 3</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={12} className="mt-3">
                    <Form.Label className="fw-medium text-dark">
                      Observaciones <span className="text-muted">(Opcional)</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="observations"
                      value={formData.observations}
                      onChange={handleInputChange}
                      placeholder="Telefonos, redes sociales, u observaciones extras"
                      style={{ resize: 'vertical' }}
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Botón de acción mejorado */}
        <div className="mt-4 pt-4 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              <span className="text-danger">*</span> Campos obligatorios
            </div>
            
            <Button
              type="submit"
              variant="dark"
              disabled={loading || completedSections.size < 3}
              size="lg"
              className="d-flex align-items-center px-4"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Guardando datos...
                </>
              ) : (
                <>
                  <FiSave className="me-2" />
                  {isEditing ? 'Actualizar Persona' : 'Crear Persona'}
                </>
              )}
            </Button>
          </div>
          
          {completedSections.size < 3 && !loading && (
            <div className="text-end mt-2">
              <small className="text-muted">
                Complete todas las secciones requeridas para continuar
              </small>
            </div>
          )}
        </div>
      </Form>
    </div>
  );
};

export default PersonForm;