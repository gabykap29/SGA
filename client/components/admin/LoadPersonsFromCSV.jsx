'use client';'use client';



import { useState, useEffect } from 'react';import { useState } from 'react';

import { Card, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';import { Card, Button, Alert, Spinner } from 'react-bootstrap';

import { FiUpload, FiDatabase, FiUsers, FiCheckCircle, FiX } from 'react-icons/fi';import { FiUpload, FiDatabase, FiUsers, FiCheckCircle } from 'react-icons/fi';

import { toast } from 'react-toastify';import { toast } from 'react-toastify';

import personService from '../../services/personService';import personService from '../../services/personService';



const LoadPersonsFromCSV = ({ onSuccess }) => {const LoadPersonsFromCSV = ({ onSuccess }) => {

  const [loading, setLoading] = useState(false);  const [loading, setLoading] = useState(false);

  const [lastResult, setLastResult] = useState(null);  const [lastResult, setLastResult] = useState(null);

  const [statusPoll, setStatusPoll] = useState(null);

  const [pollingInterval, setPollingInterval] = useState(null);  const handleLoadPersons = async () => {

    try {

  // Iniciar el polling de estado      setLoading(true);

  const startStatusPolling = () => {      setLastResult(null);

    // Hacer una llamada inicial para obtener el estado

    checkStatus();      const result = await personService.loadPersonsFromCSV();

    

    // Configurar polling cada 1 segundo      if (result.success) {

    const interval = setInterval(checkStatus, 1000);        setLastResult({

    setPollingInterval(interval);          type: result.data.status === 'success' ? 'success' : 'info',

  };          message: result.data.message

        });

  // Verificar el estado actual de la carga

  const checkStatus = async () => {        if (result.data.status === 'success') {

    const result = await personService.getLoadCsvStatus();          toast.success(result.data.message);

            } else {

    if (result.success) {          toast.info(result.data.message);

      const data = result.data;        }

      setStatusPoll(data);

              // Llamar callback si se proporciona

      // Si la carga se completó o falló, detener el polling        if (onSuccess) {

      if (!data.is_loading || data.status === 'completed' || data.status === 'failed') {          onSuccess(result.data);

        setLoading(false);        }

      }      } else {

    }        setLastResult({

  };          type: 'danger',

          message: result.error

  // Detener el polling        });

  const stopStatusPolling = () => {        toast.error(result.error);

    if (pollingInterval) {      }

      clearInterval(pollingInterval);    } catch (error) {

      setPollingInterval(null);      console.error('Error loading persons from CSV:', error);

    }      const errorMessage = 'Error inesperado al cargar personas desde CSV';

  };      setLastResult({

        type: 'danger',

  const handleLoadPersons = async () => {        message: errorMessage

    try {      });

      setLoading(true);      toast.error(errorMessage);

      setLastResult(null);    } finally {

      setStatusPoll(null);      setLoading(false);

    }

      const result = await personService.loadPersonsFromCSV();  };



      if (result.success) {  return (

        const data = result.data;    <Card className="h-100">

              <Card.Header className="bg-primary text-white d-flex align-items-center">

        // Si el estado es "started", iniciar el polling        <FiDatabase className="me-2" />

        if (data.status === 'started') {        <h5 className="mb-0">Carga de Datos desde Padrón</h5>

          startStatusPolling();      </Card.Header>

          toast.info('Carga iniciada. Monitoreando progreso...');      <Card.Body>

        } else if (data.status === 'loading') {        <div className="text-center py-4">

          startStatusPolling();          <div className="mb-4">

          toast.info('Carga en progreso. Por favor espera...');            <FiUsers size={48} className="text-primary mb-3" />

        } else if (data.status === 'skipped') {            <h6 className="text-dark">Cargar Personas desde CSV</h6>

          setLoading(false);            <p className="text-muted small mb-4">

          setLastResult({              Esta funcionalidad permite cargar personas desde el archivo CSV del padrón electoral.

            type: 'info',              Solo se ejecutará si hay menos de 50 personas en la base de datos.

            message: data.message            </p>

          });          </div>

          toast.info(data.message);

        } else if (data.status === 'completed') {          {/* Resultado de la última operación */}

          setLoading(false);          {lastResult && (

          setLastResult({            <Alert variant={lastResult.type} className="mb-4">

            type: 'success',              <div className="d-flex align-items-center">

            message: data.message                {lastResult.type === 'success' && <FiCheckCircle className="me-2" />}

          });                {lastResult.type === 'info' && <FiDatabase className="me-2" />}

          toast.success(data.message);                <span>{lastResult.message}</span>

          if (onSuccess) {              </div>

            onSuccess(data);            </Alert>

          }          )}

        }

      } else {          {/* Botón de carga */}

        setLoading(false);          <Button

        setLastResult({            variant="primary"

          type: 'danger',            size="lg"

          message: result.error            onClick={handleLoadPersons}

        });            disabled={loading}

        toast.error(result.error);            className="d-flex align-items-center justify-content-center mx-auto"

      }            style={{ minWidth: '250px' }}

    } catch (error) {          >

      console.error('Error loading persons from CSV:', error);            {loading ? (

      setLoading(false);              <>

      const errorMessage = 'Error inesperado al cargar personas desde CSV';                <Spinner

      setLastResult({                  as="span"

        type: 'danger',                  animation="border"

        message: errorMessage                  size="sm"

      });                  role="status"

      toast.error(errorMessage);                  aria-hidden="true"

    }                  className="me-2"

  };                />

                Cargando Personas...

  // Limpiar polling al desmontar              </>

  useEffect(() => {            ) : (

    return () => {              <>

      stopStatusPolling();                <FiUpload className="me-2" />

    };                Cargar Personas desde Padrón

  }, []);              </>

            )}

  // Actualizar resultado cuando cambia el estado del polling          </Button>

  useEffect(() => {

    if (statusPoll && statusPoll.is_loading) {          {loading && (

      setLastResult({            <div className="mt-3">

        type: 'info',              <small className="text-muted">

        message: statusPoll.message,                Este proceso puede tomar varios minutos...

        showProgress: true,              </small>

        progress: statusPoll.progress,            </div>

        total: statusPoll.total          )}

      });        </div>

    } else if (statusPoll && statusPoll.status === 'completed') {      </Card.Body>

      setLastResult({      <Card.Footer className="bg-light text-muted">

        type: 'success',        <small>

        message: statusPoll.message          <strong>Nota:</strong> Esta operación está limitada a administradores y solo se ejecuta

      });          cuando hay pocos datos en el sistema para evitar duplicados.

      toast.success(statusPoll.message);        </small>

      stopStatusPolling();      </Card.Footer>

      if (onSuccess) {    </Card>

        onSuccess(statusPoll);  );

      }};

    } else if (statusPoll && statusPoll.status === 'failed') {

      setLastResult({export default LoadPersonsFromCSV;
        type: 'danger',
        message: statusPoll.message
      });
      toast.error(statusPoll.message);
      stopStatusPolling();
    }
  }, [statusPoll]);

  const calculateProgress = () => {
    if (!lastResult || !lastResult.total || lastResult.total === 0) {
      return 0;
    }
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
          <div className="mb-4">
            <FiUsers size={48} className="text-primary mb-3" />
            <h6 className="text-dark">Cargar Personas desde CSV</h6>
            <p className="text-muted small mb-4">
              Esta funcionalidad permite cargar personas desde el archivo CSV del padrón electoral.
              Solo se ejecutará si hay menos de 50 personas en la base de datos.
            </p>
          </div>

          {/* Resultado de la última operación */}
          {lastResult && (
            <Alert variant={lastResult.type} className="mb-4">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0 me-2">
                  {lastResult.type === 'success' && <FiCheckCircle size={20} />}
                  {lastResult.type === 'danger' && <FiX size={20} />}
                </div>
                <div className="flex-grow-1">
                  <span>{lastResult.message}</span>
                  
                  {/* Mostrar barra de progreso si está en progreso */}
                  {lastResult.showProgress && (
                    <div className="mt-3">
                      <div className="mb-2 text-left">
                        <small>
                          Progreso: {lastResult.progress}/{lastResult.total} registros
                        </small>
                      </div>
                      <ProgressBar 
                        now={calculateProgress()} 
                        label={`${calculateProgress()}%`}
                        animated={loading}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Botón de carga */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleLoadPersons}
            disabled={loading}
            className="d-flex align-items-center justify-content-center mx-auto"
            style={{ minWidth: '250px' }}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Cargando Personas...
              </>
            ) : (
              <>
                <FiUpload className="me-2" />
                Cargar Personas desde Padrón
              </>
            )}
          </Button>

          {loading && statusPoll && !statusPoll.is_loading && statusPoll.status !== 'completed' && (
            <div className="mt-3">
              <small className="text-muted">
                Finalizando proceso...
              </small>
            </div>
          )}

          {loading && (
            <div className="mt-3">
              <small className="text-muted">
                Este proceso puede tomar varios minutos. Por favor, no cierres esta página.
              </small>
            </div>
          )}
        </div>
      </Card.Body>
      <Card.Footer className="bg-light text-muted">
        <small>
          <strong>Nota:</strong> Esta operación está limitada a administradores y solo se ejecuta
          cuando hay pocos datos en el sistema para evitar duplicados.
        </small>
      </Card.Footer>
    </Card>
  );
};

export default LoadPersonsFromCSV;
