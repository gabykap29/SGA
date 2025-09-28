'use client';

import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FiFileText, FiSave, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import recordService from '../../../../../services/recordService';

export default function CreateRecord() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    observations: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }
    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'El contenido es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      const result = await recordService.createRecord(formData);
      
      if (result.success) {
        toast.success('Antecedente creado exitosamente');
        router.push('/dashboard/antecedentes');
      } else {
        // Mensaje específico para antecedentes duplicados
        if (result.isDuplicate) {
          toast.error('El antecedente con este título ya existe en el sistema. Por favor utilice un título diferente.');
          setErrors({
            ...errors,
            title: 'Este título ya existe en el sistema. Intente con otro título.'
          });
        } else {
          toast.error(result.error || 'Error al crear el antecedente');
        }
      }
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error('Error inesperado al crear el antecedente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cuadro de título */}
        <div className="mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <div className="d-flex align-items-center">
            <Button 
              variant="link" 
              onClick={() => router.push('/dashboard/antecedentes')}
              className="p-0 me-3 text-decoration-none text-muted"
            >
              <FiArrowLeft size={20} />
            </Button>
            <div>
              <h2 className="display-8 fw-bold text-dark mb-0">Crear Nuevo Antecedente</h2>
              <p className="lead text-muted mb-0"> ➜ Complete el formulario para registrar un nuevo antecedente</p>
            </div>
          </div>
        </div>

        <Row className="justify-content-center">
          <Col lg={12}>
            <Card className="border-1 shadow-sm">
              <Card.Header className="bg-light border-1 py-3">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <FiFileText size={18} className="text-white" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">Información del Antecedente</h5>
                    <div className="small text-muted">Complete todos los campos obligatorios (*)</div>
                  </div>
                </div>
              </Card.Header>
              
              <Card.Body className="p-4">
                {Object.values(errors).some(error => error) && (
                  <Alert variant="danger">
                    <ul className="mb-0">
                      {Object.values(errors).map((error, index) => 
                        error && <li key={index}>{error}</li>
                      )}
                    </ul>
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Título <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Ingrese un título descriptivo"
                      isInvalid={!!errors.title}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.title}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Fecha <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      isInvalid={!!errors.date}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.date}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Contenido <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Describa detalladamente el antecedente"
                      isInvalid={!!errors.content}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.content}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Observaciones</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="observations"
                      value={formData.observations}
                      onChange={handleChange}
                      placeholder="Agregue observaciones adicionales (opcional)"
                      disabled={loading}
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end pt-3 border-top">
                    <Button
                      variant="outline-secondary"
                      className="me-2"
                      onClick={() => router.push('/dashboard/antecedentes')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="dark"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FiSave className="me-2" />
                          Guardar Antecedente
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}