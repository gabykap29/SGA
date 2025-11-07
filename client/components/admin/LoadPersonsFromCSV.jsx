'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { FiUpload, FiDatabase, FiUsers, FiCheckCircle, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import personService from '../../services/personService';

const LoadPersonsFromCSV = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [statusPoll, setStatusPoll] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  const checkStatus = async () => {
    const result = await personService.getLoadCsvStatus();
    if (result.success) {
      const data = result.data;
      setStatusPoll(data);
      if (!data.is_loading || data.status === 'completed' || data.status === 'failed') {
        setLoading(false);
      }
    }
  };

  const startStatusPolling = () => {
    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 2000); // Poll every 2 seconds
    setPollingInterval(interval);
  };

  const stopStatusPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleLoadPersons = async () => {
    try {
      setLoading(true);
      setLastResult(null);
      setStatusPoll(null);

      const result = await personService.loadPersonsFromCSV();

      if (result.success) {
        const data = result.data;
        if (data.status === 'started' || data.status === 'loading') {
          startStatusPolling();
          toast.info(data.message || 'Carga iniciada. Monitoreando progreso...');
        } else {
          setLoading(false);
          setLastResult({ type: data.status === 'completed' ? 'success' : 'info', message: data.message });
          if(data.status === 'completed') toast.success(data.message);
          else toast.info(data.message);
          if (onSuccess) onSuccess(data);
        }
      } else {
        setLoading(false);
        setLastResult({ type: 'danger', message: result.error });
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error loading persons from CSV:', error);
      setLoading(false);
      const errorMessage = 'Error inesperado al cargar personas desde CSV';
      setLastResult({ type: 'danger', message: errorMessage });
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    return () => stopStatusPolling(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (statusPoll) {
        if (statusPoll.is_loading) {
            setLastResult({
                type: 'info',
                message: statusPoll.message,
                showProgress: true,
                progress: statusPoll.progress,
                total: statusPoll.total
            });
        } else if (statusPoll.status === 'completed') {
            setLastResult({ type: 'success', message: statusPoll.message });
            toast.success(statusPoll.message);
            stopStatusPolling();
            if (onSuccess) onSuccess(statusPoll);
        } else if (statusPoll.status === 'failed') {
            setLastResult({ type: 'danger', message: statusPoll.message });
            toast.error(statusPoll.message);
            stopStatusPolling();
        }
    }
  }, [statusPoll]);

  const calculateProgress = () => {
    if (!lastResult || !lastResult.total || lastResult.total === 0) return 0;
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
              Solo se ejecutará si hay menos de 50 personas en la base de datos.
            </p>

          {lastResult && (
            <Alert variant={lastResult.type} className="mb-4 text-start">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-2 mt-1">
                  {lastResult.type === 'success' && <FiCheckCircle size={20} />}
                  {lastResult.type === 'danger' && <FiX size={20} />}
                </div>
                <div className="flex-grow-1">
                  <span>{lastResult.message}</span>
                  {lastResult.showProgress && (
                    <div className="mt-2">
                      <small>Progreso: {lastResult.progress}/{lastResult.total} registros</small>
                      <ProgressBar now={calculateProgress()} label={`${calculateProgress()}%`} animated={loading} className="mt-1"/>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          <Button variant="primary" size="lg" onClick={handleLoadPersons} disabled={loading} className="d-flex align-items-center justify-content-center mx-auto" style={{ minWidth: '250px' }}>
            {loading ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>Cargando...</>
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