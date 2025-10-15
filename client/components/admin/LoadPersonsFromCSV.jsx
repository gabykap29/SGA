'use client';

import { useState } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FiUpload, FiDatabase, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import personService from '../../services/personService';

const LoadPersonsFromCSV = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleLoadPersons = async () => {
    try {
      setLoading(true);
      setLastResult(null);

      const result = await personService.loadPersonsFromCSV();

      if (result.success) {
        setLastResult({
          type: result.data.status === 'success' ? 'success' : 'info',
          message: result.data.message
        });

        if (result.data.status === 'success') {
          toast.success(result.data.message);
        } else {
          toast.info(result.data.message);
        }

        // Llamar callback si se proporciona
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        setLastResult({
          type: 'danger',
          message: result.error
        });
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error loading persons from CSV:', error);
      const errorMessage = 'Error inesperado al cargar personas desde CSV';
      setLastResult({
        type: 'danger',
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
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
              <div className="d-flex align-items-center">
                {lastResult.type === 'success' && <FiCheckCircle className="me-2" />}
                {lastResult.type === 'info' && <FiDatabase className="me-2" />}
                <span>{lastResult.message}</span>
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

          {loading && (
            <div className="mt-3">
              <small className="text-muted">
                Este proceso puede tomar varios minutos...
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