'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FiFileText, FiSave, FiArrowLeft } from 'react-icons/fi';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../../../../components/layout/DashboardLayout';
import recordService from '../../../../../../services/recordService';

export default function EditRecord() {
    const params = useParams();
    const router = useRouter();
    const recordId = params.id;

    const [formData, setFormData] = useState({
        title: '',
        date: '',
        content: '',
        observations: '',
        type_record: 'ROBO',
        customTypeRecord: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [originalData, setOriginalData] = useState(null);

    const ANTECEDENT_TYPES = [
        { value: 'ROBO', label: 'Robo' },
        { value: 'ROBO_DE_MOTO', label: 'Robo de Moto' },
        { value: 'ROBO_DE_AUTO', label: 'Robo de Auto' },
        { value: 'HURTO', label: 'Hurto' },
        { value: 'VIOLENCIA_DE_GENERO', label: 'Violencia de Género' }
    ];

    useEffect(() => {
        if (recordId) {
            loadRecordData();
        }
    }, [recordId]);

    const loadRecordData = async () => {
        try {
            setLoading(true);
            const result = await recordService.getRecordById(recordId);

            if (result.success) {
                const record = result.data;

                // Verificar si el tipo de antecedente está en la lista predefinida
                const isPredefinedType = ANTECEDENT_TYPES.some(
                    type => type.value === record.type_record
                );

                const formattedDate = record.record_date
                    ? new Date(record.record_date).toISOString().split('T')[0]
                    : '';

                const initialData = {
                    title: record.record_number || '',
                    date: formattedDate,
                    content: record.description || '',
                    observations: record.observations || '',
                    type_record: isPredefinedType ? record.type_record : 'OTROS',
                    customTypeRecord: !isPredefinedType ? record.type_record : ''
                };

                setFormData(initialData);
                setOriginalData(initialData);
            } else {
                toast.error(result.error || 'Error al cargar los datos del antecedente');
                router.push('/dashboard/antecedentes');
            }
        } catch (error) {
            console.error('Error loading record:', error);
            toast.error('Error inesperado al cargar el antecedente');
            router.push('/dashboard/antecedentes');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error de validación cuando se edita el campo
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
        if (formData.type_record === 'OTROS' && !formData.customTypeRecord.trim()) {
            newErrors.customTypeRecord = 'Debe especificar el tipo de antecedente cuando selecciona "Otros"';
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
            setSaving(true);

            // Preparar datos para enviar
            const dataToSend = {
                title: formData.title,
                date: formData.date,
                content: formData.content,
                observations: formData.observations,
                type_record: formData.type_record === 'OTROS'
                    ? formData.customTypeRecord.toUpperCase()
                    : formData.type_record
            };

            const result = await recordService.updateRecord(recordId, dataToSend);

            if (result.success) {
                toast.success('Antecedente actualizado exitosamente');
                router.push(`/dashboard/antecedentes/${recordId}`);
            } else {
                toast.error(result.error || 'Error al actualizar el antecedente');
            }
        } catch (error) {
            console.error('Error updating record:', error);
            toast.error('Error inesperado al actualizar el antecedente');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (JSON.stringify(formData) !== JSON.stringify(originalData)) {
            if (window.confirm('¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.')) {
                router.push(`/dashboard/antecedentes/${recordId}`);
            }
        } else {
            router.push(`/dashboard/antecedentes/${recordId}`);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <Spinner animation="border" variant="dark" className="mb-3" />
                        <div className="text-muted">Cargando datos del antecedente...</div>
                    </div>
                </Container>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Container fluid>
                {/* Cuadro de título */}
                <div className="mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
                    <div className="d-flex align-items-center">
                        <Button
                            variant="link"
                            onClick={handleCancel}
                            className="p-0 me-3 text-decoration-none text-muted"
                        >
                            <FiArrowLeft size={20} />
                        </Button>
                        <div>
                            <h2 className="display-8 fw-bold text-dark mb-0">Editar Antecedente</h2>
                            <p className="lead text-muted mb-0"> ➜ Modifique los campos necesarios y guarde los cambios</p>
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
                                            disabled={saving}
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
                                            disabled={saving}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.date}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Tipo de Antecedente <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            name="type_record"
                                            value={formData.type_record}
                                            onChange={handleChange}
                                            disabled={saving}
                                        >
                                            {ANTECEDENT_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                            <option value="OTROS">Otros</option>
                                        </Form.Select>
                                    </Form.Group>

                                    {formData.type_record === 'OTROS' && (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Especificar tipo de antecedente <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="customTypeRecord"
                                                value={formData.customTypeRecord}
                                                onChange={handleChange}
                                                placeholder="Ingrese el tipo de antecedente"
                                                isInvalid={!!errors.customTypeRecord}
                                                disabled={saving}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.customTypeRecord}
                                            </Form.Control.Feedback>
                                            <Form.Text className="text-muted">
                                                Describa el tipo de antecedente que no está en las opciones anteriores
                                            </Form.Text>
                                        </Form.Group>
                                    )}

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
                                            disabled={saving}
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
                                            disabled={saving}
                                        />
                                    </Form.Group>

                                    <div className="d-flex justify-content-end pt-3 border-top">
                                        <Button
                                            variant="outline-secondary"
                                            className="me-2"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="dark"
                                            type="submit"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <FiSave className="me-2" />
                                                    Guardar Cambios
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
