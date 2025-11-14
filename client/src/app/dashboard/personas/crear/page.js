'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Button, ProgressBar } from 'react-bootstrap';
import { FiUser, FiFileText, FiImage, FiSave, FiArrowLeft, FiCheck, FiUsers, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

// Componentes
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import PersonForm from '../../../../../components/persons/PersonForm';
import FileManager from '../../../../../components/persons/FileManager';
import AntecedentLinker from '../../../../../components/persons/AntecedentLinker';
import CreateRecordModal from '../../../../../components/persons/CreateRecordModal';
import PersonLinker from '../../../../../components/persons/PersonLinker';

// Servicios
import personService from '../../../../../services/personService';

export default function CreatePerson() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [personData, setPersonData] = useState(null);
  const [files, setFiles] = useState([]);
  const [linkedRecords, setLinkedRecords] = useState([]);
  const [linkedPersons, setLinkedPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isDuplicateError, setIsDuplicateError] = useState(false);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);

  // Cuando personData esté disponible y activeStep sea 1, avanzar a paso 2
  useEffect(() => {
    if (personData && personData.person_id && activeStep === 1 && completedSteps.has(1)) {
      // Hacer un pequeño delay para asegurar que el state se actualice
      const timer = setTimeout(() => {
        setActiveStep(2);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [personData, activeStep, completedSteps]);

  const steps = [
    { 
      id: 1, 
      title: 'Datos Personales', 
      subtitle: 'Información básica de la persona',
      icon: FiUser, 
      component: 'person' 
    },
    { 
      id: 2, 
      title: 'Archivos', 
      subtitle: 'Documentos e imágenes',
      icon: FiImage, 
      component: 'files' 
    },
    { 
      id: 3, 
      title: 'Antecedentes', 
      subtitle: 'Vincular registros existentes',
      icon: FiFileText, 
      component: 'records' 
    },
    { 
      id: 4, 
      title: 'Vínculos Personales', 
      subtitle: 'Relaciones con otras personas',
      icon: FiUsers, 
      component: 'persons' 
    }
  ];

  const handlePersonSave = async (formData) => {
    try {
      setLoading(true);
      
      // Si la persona ya existe (fue encontrada por DNI), usarla directamente
      if (formData.existingPerson) {
        const personObject = formData.existingPerson;
        
        setPersonData(personObject);
        setCompletedSteps(prev => new Set([...prev, 1]));
        
        // Cargar archivos existentes de la persona (si los hay)
        try {
          const filesResult = await personService.getPersonFiles(personObject.person_id);
          if (filesResult.success) {
            setFiles(filesResult.data);
          }
        } catch (fileError) {
          // Error silencioso al cargar archivos
        }
        
        toast.success('Persona encontrada. Usando datos existentes.');
        // No llamar a setActiveStep aquí, dejar que useEffect lo maneje
        return;
      }
      
      // Si no existe, crear la nueva persona
      const result = await personService.createPerson(formData);
      
      if (result.data.status_code == 422 || result.data.status_code == 400) {
        // Mensaje específico para personas duplicadas
        if (result.data.status_code == 422 ) {
          setIsDuplicateError(true);
          toast.error('La persona ya existe en el sistema. Verifique el número de identificación.');
        } else {
          setIsDuplicateError(false);
          toast.error(result.error || 'Error al crear la persona');
        }

      } else {
        // La respuesta del backend tiene esta estructura:
        // { message: "...", person_id: "...", data: PersonObject }
        let personObject;
        
        if (result.data.data) {
          // Si hay un campo 'data' anidado, usar ese
          personObject = result.data.data;
        } else {
          // Si no, usar la respuesta completa (fallback)
          personObject = result.data;
        }
        
        // Asegurar que tenemos el person_id correcto
        if (result.data.person_id && !personObject.person_id) {
          personObject.person_id = result.data.person_id;
        }
        
        setPersonData(personObject);
        setCompletedSteps(prev => new Set([...prev, 1]));
        
        // Cargar archivos existentes de la persona (si los hay)
        try {
          const filesResult = await personService.getPersonFiles(personObject.person_id);
          if (filesResult.success) {
            setFiles(filesResult.data);
          }
        } catch (fileError) {
          // Error silencioso al cargar archivos
        }
        
        toast.success('Persona creada exitosamente');
        // No llamar a setActiveStep aquí, dejar que useEffect lo maneje
      }
    } catch (error) {
      console.error('Error creating person:', error);
      toast.error('Error inesperado al crear la persona');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUpload = async (uploadedFiles) => {
    if (!personData?.person_id) {
      toast.error('Debe crear la persona primero');
      return;
    }

    try {
      setLoading(true);
      const result = await personService.uploadFiles(personData.person_id, uploadedFiles);
      
      if (result.success) {
        setFiles(prev => [...prev, ...result.data]);
        setCompletedSteps(prev => new Set([...prev, 2]));
        
        const uploadedCount = result.data.length;
        const totalCount = uploadedFiles.length;
        
        if (uploadedCount === totalCount) {
          toast.success(`${uploadedCount} archivo(s) subido(s) exitosamente`);
        } else {
          toast.success(`${uploadedCount} de ${totalCount} archivo(s) subidos exitosamente`);
          if (result.warnings && result.warnings.length > 0) {
            toast.warning(`Algunos archivos no se pudieron subir: ${result.warnings.join(', ')}`);
          }
        }
      } else {
        toast.error(result.error || 'Error al subir archivos');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error inesperado al subir archivos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    // Actualizar la lista de archivos eliminando el archivo borrado
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleRecordsLink = async (antecedent, typeRelationship = 'Denunciado') => {
    if (!personData?.person_id) {
      toast.error('Debe crear la persona primero');
      return;
    }

    try {
      setLoading(true);
      // Manejo de antecedente individual (viene de AntecedentLinker uno por uno)
      const recordIds = [(antecedent.record_id || antecedent.id)];
      const result = await personService.linkRecords(personData.person_id, recordIds, typeRelationship);
      
      if (result.success) {
        // Agregar el nuevo antecedente a la lista existente, incluyendo el tipo de vinculación
        const antecedentWithRelationship = {
          ...antecedent,
          type_relationship: typeRelationship
        };
        
        setLinkedRecords(prev => [...prev, antecedentWithRelationship]);
        setCompletedSteps(prev => new Set([...prev, 3]));
        
        toast.success(`Antecedente vinculado exitosamente`);
      } else {
        toast.error(result.error || 'Error al vincular antecedente');
      }
    } catch (error) {
      console.error('Error linking records:', error);
      toast.error('Error inesperado al vincular antecedente');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordUnlink = async (record) => {
    if (!personData?.person_id) {
      toast.error('Debe crear la persona primero');
      return;
    }

    try {
      setLoading(true);
      const recordId = record.record_id || record.id;
      const result = await personService.unlinkRecord(personData.person_id, recordId);
      
      if (result.success) {
        setLinkedRecords(prev => prev.filter(r => (r.record_id || r.id) !== recordId));
        if (linkedRecords.length === 1) {
          setCompletedSteps(prev => {
            const newSet = new Set(prev);
            newSet.delete(3);
            return newSet;
          });
        }
        toast.success('Antecedente desvinculado exitosamente');
      } else {
        toast.error(result.error || 'Error al desvincular antecedente');
      }
    } catch (error) {
      console.error('Error unlinking record:', error);
      toast.error('Error inesperado al desvincular antecedente');
    } finally {
      setLoading(false);
    }
  };

  // Manejar creación de antecedente desde el modal
  const handleRecordCreated = (record) => {
    toast.success(`Antecedente "${record.title}" creado exitosamente`);
    setShowCreateRecordModal(false);
    
    // Si estamos en el paso de antecedentes, vincular automáticamente
    if (activeStep === 3 && personData) {
      // Extraer el type_relationship del record retornado por el backend
      const typeRelationship = record.type_relationship || 'Denunciado';
      // handleRecordsLink espera un objeto 'antecedent' y el tipo de relación
      handleRecordsLink(record, typeRelationship);
    }
  };

  // Manejar vinculación de personas
  const handlePersonsLink = async (persons, relationshipType) => {
    if (!personData?.person_id) {
      toast.error('Debe crear la persona primero');
      return;
    }

    try {
      setLoading(true);
      const result = await personService.linkPersons(personData.person_id, persons, relationshipType);
      
      if (result.success) {
        // Agregar las nuevas personas a la lista existente
        const linkedCount = result.data.length;
        const totalCount = persons.length;
        
        setLinkedPersons(prev => [...prev, ...result.data]);
        setCompletedSteps(prev => new Set([...prev, 4]));
        
        if (linkedCount === totalCount) {
          toast.success(`${linkedCount} persona(s) vinculada(s) exitosamente`);
        } else {
          toast.success(`${linkedCount} de ${totalCount} persona(s) vinculadas exitosamente`);
          if (result.warnings && result.warnings.length > 0) {
            toast.warning(`Algunos vínculos no se pudieron crear: ${result.warnings.join(', ')}`);
          }
        }
      } else {
        toast.error(result.error || 'Error al vincular personas');
      }
    } catch (error) {
      console.error('Error linking persons:', error);
      toast.error('Error inesperado al vincular personas');
    } finally {
      setLoading(false);
    }
  };

  // Manejar desvinculación de personas
  const handlePersonUnlink = async (person) => {
    if (!personData?.person_id) {
      toast.error('Debe crear la persona primero');
      return;
    }

    try {
      setLoading(true);
      const result = await personService.unlinkPerson(personData.person_id, person.person_id);
      
      if (result.success) {
        setLinkedPersons(prev => prev.filter(p => p.person_id !== person.person_id));
        if (linkedPersons.length === 1) {
          setCompletedSteps(prev => {
            const newSet = new Set(prev);
            newSet.delete(4);
            return newSet;
          });
        }
        toast.success('Persona desvinculada exitosamente');
      } else {
        toast.error(result.error || 'Error al desvincular persona');
      }
    } catch (error) {
      console.error('Error unlinking person:', error);
      toast.error('Error inesperado al desvincular persona');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    toast.success('Persona creada y configurada completamente');
    // Redirect to the person detail page using the person ID
    if (personData && personData.person_id) {
      router.push(`/dashboard/personas/${personData.person_id}`);
    } else {
      // Fallback to dashboard if no person ID is available
      router.push('/dashboard');
    }
  };

  const isStepAccessible = (stepId) => {
    if (stepId === 1) return true;
    return personData !== null;
  };

  const getStepStatus = (stepId) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === activeStep) return 'active';
    if (isStepAccessible(stepId)) return 'accessible';
    return 'disabled';
  };

  const calculateProgress = () => {
    return (completedSteps.size / steps.length) * 100;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <PersonForm
            onSave={handlePersonSave}
            loading={loading}
            initialData={personData}
            isDuplicateError={isDuplicateError}
            onDuplicateErrorChange={(val) => setIsDuplicateError(val)}
          />
        );
      case 2:
        return (
          <FileManager
            personId={personData?.person_id}
            files={files}
            onFilesUpload={handleFilesUpload}
            onFileDelete={handleFileDelete}
            loading={loading}
          />
        );
      case 3:
        return (
          <>
            <div className="d-flex justify-content-end mb-3">
              <Button
                variant="success"
                size="sm"
                className="d-flex align-items-center"
                onClick={() => setShowCreateRecordModal(true)}
              >
                <FiPlus className="me-1" /> Crear Nuevo Antecedente
              </Button>
            </div>
            <AntecedentLinker
              personId={personData?.person_id}
              linkedAntecedents={linkedRecords}
              onLink={handleRecordsLink}
              onUnlink={handleRecordUnlink}
              loading={loading}
            />
          </>
        );
      case 4:
        return (
          <PersonLinker
            personId={personData?.person_id}
            linkedPersons={linkedPersons}
            onLink={handlePersonsLink}
            onUnlink={handlePersonUnlink}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cuadro de título */}
        <div className="mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center mb-2">
                <Button 
                  variant="link" 
                  onClick={() => router.push('/dashboard')}
                  className="p-0 me-3 text-decoration-none text-muted"
                >
                  <FiArrowLeft size={20} />
                </Button>
                <h2 className="fw-bold text-dark mb-0">Crear Nueva Persona</h2>
              </div>
              <p className="lead text-muted mb-0 ms-5">Complete los siguientes pasos para registrar una nueva persona en el sistema</p>
            </div>
            
            {/* Indicador de progreso en header */}
            <div className="text-end">
              <div className="small text-muted mb-1">Progreso general</div>
              <div className="d-flex align-items-center">
                <span className="small fw-medium me-2">{Math.round(calculateProgress())}%</span>
                <ProgressBar 
                  now={calculateProgress()} 
                  style={{ width: '100px', height: '6px' }}
                  className="rounded-pill"
                />
              </div>
            </div>
          </div>
        </div>

        <Row className="g-4">
          {/* Sidebar rediseñado */}
          <Col lg={4} xl={3} className="mb-4">
            {/* Stepper vertical mejorado */}
            <Card className="border-1 shadow-sm">
              <Card.Header className="bg-light border-1 pb-2">
                <h6 className="mb-0 fw-bold text-dark">Pasos del Proceso</h6>
              </Card.Header>
              <Card.Body className="py-3">
                <div className="position-relative">
                  {steps.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const IconComponent = step.icon;
                    const isLast = index === steps.length - 1;
                    
                    return (
                      <div key={step.id} className="position-relative">
                        {/* Línea conectora */}
                        {!isLast && (
                          <div 
                            className="position-absolute"
                            style={{
                              left: '19px',
                              top: '50px',
                              height: '40px',
                              width: '2px',
                              backgroundColor: status === 'completed' || completedSteps.has(step.id + 1) ? '#198754' : '#e9ecef'
                            }}
                          />
                        )}
                        
                        <div 
                          className={`d-flex align-items-start p-3 rounded-3 mb-3 position-relative transition-all ${
                            status === 'active' ? 'bg-dark text-white' : 
                            status === 'completed' ? 'bg-light border border-success' :
                            status === 'accessible' ? 'bg-light hover-shadow cursor-pointer' : 
                            'bg-light opacity-50'
                          }`}
                          onClick={() => {
                            if (isStepAccessible(step.id)) {
                              setActiveStep(step.id);
                            }
                          }}
                          style={{
                            cursor: isStepAccessible(step.id) ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Círculo del paso */}
                          <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 ${
                              status === 'completed' ? 'bg-success text-white' :
                              status === 'active' ? 'bg-white text-dark' :
                              status === 'accessible' ? 'bg-white border border-2' :
                              'bg-muted text-white'
                            }`}
                            style={{ width: '40px', height: '40px' }}
                          >
                            {status === 'completed' ? (
                              <FiCheck size={16} />
                            ) : (
                              <IconComponent size={16} />
                            )}
                          </div>
                          
                          {/* Contenido del paso */}
                          <div className="flex-grow-1">
                            <div className={`fw-medium mb-1 ${
                              status === 'active' ? 'text-white' : 
                              status === 'completed' ? 'text-success' : 
                              'text-dark'
                            }`}>
                              {step.title}
                            </div>
                            <div className={`small ${
                              status === 'active' ? 'text-white-50' : 'text-muted'
                            }`}>
                              {step.subtitle}
                            </div>
                            
                            {/* Badge de estado */}
                            {status === 'completed' && (
                              <span className="badge bg-success mt-1">Completado</span>
                            )}
                            {status === 'active' && (
                              <span className="badge bg-white text-dark mt-1">Actual</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>

            {/* Panel de resumen mejorado */}
            {personData && (
              <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-success bg-opacity-10 border-1">
                  <div className="d-flex align-items-center">
                    <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '24px', height: '24px'}}>
                      <FiCheck size={14} className="text-white" />
                    </div>
                    <h6 className="mb-0 fw-bold text-success">Persona Registrada</h6>
                  </div>
                </Card.Header>
                <Card.Body className="py-3">
                  <div className="small">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Nombre:</span>
                      <span className="fw-medium">{personData?.names || ''} {personData?.lastnames || ''}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">DNI:</span>
                      <span className="fw-medium">{personData?.identification || ''}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">ID:</span>
                      <span className="fw-medium text-primary">#{personData?.person_id || ''}</span>
                    </div>
                  </div>
                  
                  <hr className="my-3" />
                  
                  {/* Estadísticas */}
                  <div className="row g-2 text-center">
                    <div className="col-6">
                      <div className="p-2 bg-light rounded">
                        <div className="fw-bold text-primary">{files.length}</div>
                        <div className="small text-muted">Archivos</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 bg-light rounded">
                        <div className="fw-bold text-primary">{linkedRecords.length}</div>
                        <div className="small text-muted">Antecedentes</div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Contenido principal mejorado */}
          <Col lg={8} xl={9}>
            <Card className="border-1 shadow-sm">
              <Card.Header className="bg-light border-1 py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    {(() => {
                      const currentStep = steps.find(s => s.id === activeStep);
                      const IconComponent = currentStep?.icon;
                      const status = getStepStatus(activeStep);
                      
                      return (
                        <>
                          <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                              status === 'completed' ? 'bg-success text-white' :
                              status === 'active' ? 'bg-dark text-white' :
                              'bg-light text-muted'
                            }`}
                            style={{ width: '40px', height: '40px' }}
                          >
                            {status === 'completed' ? (
                              <FiCheck size={18} />
                            ) : (
                              IconComponent && <IconComponent size={18} />
                            )}
                          </div>
                          <div>
                            <h5 className="mb-0 fw-bold text-dark">
                              {currentStep?.title}
                            </h5>
                            <div className="small text-muted">
                              {currentStep?.subtitle}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Indicador de paso actual */}
                  <div className="text-end">
                    <div className="small text-muted">Paso</div>
                    <div className="fw-bold">{activeStep} de {steps.length}</div>
                  </div>
                </div>
              </Card.Header>
              
              <Card.Body className="p-4">
                {renderStepContent()}
                
                {/* Botones de navegación mejorados */}
                <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                  <Button
                    variant="outline-secondary"
                    disabled={activeStep === 1 || loading}
                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                    className="px-4"
                  >
                    <FiArrowLeft className="me-2" size={16} />
                    Anterior
                  </Button>
                  
                  {/* Progress indicator */}
                  <div className="d-flex align-items-center">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`rounded-circle me-2 ${
                          getStepStatus(step.id) === 'completed' ? 'bg-success' :
                          getStepStatus(step.id) === 'active' ? 'bg-dark' :
                          'bg-light border'
                        }`}
                        style={{ width: '8px', height: '8px' }}
                      />
                    ))}
                  </div>
                  
                  <div className="d-flex gap-2">
                    {activeStep < 4 ? (
                      <Button
                        variant="dark"
                        disabled={!personData && activeStep > 1 || loading}
                        onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
                        className="px-4"
                      >
                        Siguiente
                        <FiArrowLeft className="ms-2" size={16} style={{ transform: 'rotate(180deg)' }} />
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        onClick={handleFinish}
                        className="d-flex align-items-center px-4"
                        disabled={loading}
                      >
                        <FiSave className="me-2" />
                        Finalizar Registro
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Modal para crear antecedentes */}
        <CreateRecordModal
          show={showCreateRecordModal}
          onHide={() => setShowCreateRecordModal(false)}
          onRecordCreated={handleRecordCreated}
        />
      </Container>
    </DashboardLayout>
  );
}