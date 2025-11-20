'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { FiUpload, FiDatabase, FiUsers, FiCheckCircle, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import personService from '../../services/personService';

const LoadPersonsFromCSV = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleLoadPersons = async () => {
    try {
      setLoading(true);
      setLastResult(null);

      // Initial call to start the process
      let result = await personService.loadPersonsFromCSV();

      if (!result.success) {
        setLoading(false);
        setLastResult({ type: 'danger', message: result.error });
        toast.error(result.error);
        return;
      }

      let data = result.data;

      // If the process started or is already loading, we poll
      if (data && (data.status === 'started' || data.status === 'loading')) {
        setLastResult({
          type: 'info',
          message: data.message || 'Carga iniciada...',
          showProgress: true,
          progress: data.progress || 0,
          total: data.total || 100
        });

        // Polling loop
        const pollInterval = setInterval(async () => {
          try {
            const pollResult = await personService.loadPersonsFromCSV();

            if (pollResult.success) {
              const pollData = pollResult.data;

              if (pollData.status === 'completed' || pollData.status === 'skipped') {
                clearInterval(pollInterval);
                setLoading(false);
                const isSkipped = pollData.status === 'skipped';
                const message = isSkipped ? 'Carga finalizada (ya existen registros)' : (pollData.message || 'Carga completada exitosamente');

                setLastResult({
                  type: 'success',
                  message: message,
                  showProgress: false
                });
                toast.success(message);
                if (onSuccess) onSuccess(pollData);
              } else if (pollData.status === 'failed') {
                clearInterval(pollInterval);
                setLoading(false);
                setLastResult({ type: 'danger', message: pollData.message || 'Error en la carga' });
                toast.error(pollData.message || 'Error en la carga');
              } else if (pollData.status === 'loading') {
                // Update progress
                setLastResult(prev => ({
                  ...prev,
                  message: pollData.message || 'Procesando...',
                  progress: pollData.progress || prev.progress
                }));
              }
            } else {
              // Network error or other issue during poll
              console.warn('Error polling status:', pollResult.error);
            }
          } catch (error) {
            console.error('Polling error:', error);
            clearInterval(pollInterval);
            setLoading(false);
            setLastResult({ type: 'danger', message: 'Error de conexión al verificar estado' });
          }
        }, 2000); // Poll every 2 seconds

      } else if (data && (data.status === 'completed' || data.status === 'skipped')) {
        // Completed immediately (e.g. skipped)
        setLoading(false);
        const isSkipped = data.status === 'skipped';
        const message = isSkipped ? 'Carga finalizada (ya existen registros)' : (data.message || 'Carga completada');
        setLastResult({ type: 'success', message: message });
        toast.success(message);
        if (onSuccess) onSuccess(data);
      } else {
        // Unknown status or error
        setLoading(false);
        setLastResult({ type: 'danger', message: data?.message || 'Estado desconocido' });
        toast.error(data?.message || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error loading persons from CSV:', error);
      setLoading(false);
      const errorMessage = 'Error inesperado al cargar personas desde CSV';
      setLastResult({ type: 'danger', message: errorMessage });
      toast.error(errorMessage);
    }
  };

  const calculateProgress = () => {
    if (!lastResult || !lastResult.total || lastResult.total === 0) return 0;
    // If progress is just a number (0-100) from backend
    if (lastResult.progress <= 100 && lastResult.total === 100) return lastResult.progress;
    return Math.round((lastResult.progress / lastResult.total) * 100);
  };

  return (
    <Card className="h-100">
      <Card.Header className="bg-primary text-white d-flex align-items-center">
        <FiDatabase className="me-2" />
        <h5 className="mb-0">Carga de Datos desde Padrón</h5>
      </Card.Header>
      <Card.Body>
        <div className="text-center py-4">
          <FiUsers size={48} className="text-primary mb-3" />
          <h6 className="text-dark">Cargar Personas desde CSV</h6>
          <p className="text-muted small mb-4">
            Esta funcionalidad permite cargar personas desde el archivo CSV del padrón electoral.
            Solo se ejecutará si hay menos de 5 personas en la base de datos.
          </p>

          {lastResult && (
            <Alert variant={lastResult.type} className="mb-4 text-start">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-2 mt-1">
                  {lastResult.type === 'success' && <FiCheckCircle size={20} />}
                  {(lastResult.type === 'danger' || lastResult.type === 'warning') && <FiX size={20} />}
                  {lastResult.type === 'info' && <Spinner animation="border" size="sm" />}
                </div>
                <div className="flex-grow-1">
                  <span>{lastResult.message}</span>
                  {lastResult.showProgress && (
                    <div className="mt-2">
                      <ProgressBar now={calculateProgress()} label={`${calculateProgress()}%`} animated={loading} className="mt-1" />
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          <Button variant="primary" size="lg" onClick={handleLoadPersons} disabled={loading} className="d-flex align-items-center justify-content-center mx-auto" style={{ minWidth: '250px' }}>
            {loading ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Procesando...</>
            ) : (
              <><FiUpload className="me-2" />Cargar Personas desde Padrón</>
            )}
          </Button>

          {loading && (
            <div className="mt-3">
              <small className="text-muted">Este proceso puede tomar varios minutos. Por favor, no cierres esta página.</small>
            </div>
          )}
        </div>
      </Card.Body>
      <Card.Footer className="bg-light text-muted">
        <small><strong>Nota:</strong> Esta operación está limitada a administradores y solo se ejecuta cuando hay pocos datos en el sistema.</small>
      </Card.Footer>
    </Card>
  );
};

export default LoadPersonsFromCSV;