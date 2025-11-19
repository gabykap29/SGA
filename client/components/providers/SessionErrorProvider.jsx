'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiLogOut } from 'react-icons/fi';

/**
 * Context para manejar errores de sesión expirada o token inválido
 */
const SessionErrorContext = createContext();

/**
 * Hook para usar el context de errores de sesión
 */
export const useSessionError = () => {
  const context = useContext(SessionErrorContext);
  if (!context) {
    throw new Error('useSessionError debe usarse dentro de SessionErrorProvider');
  }
  return context;
};

/**
 * Provider que envuelve la aplicación y maneja errores de sesión
 */
export function SessionErrorProvider({ children }) {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionErrorMessage, setSessionErrorMessage] = useState('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  const router = useRouter();

  /**
   * Muestra el modal de sesión expirada
   */
  const showSessionExpiredModal = useCallback((message) => {
    setSessionErrorMessage(message || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    setShowSessionModal(true);
  }, []);

  /**
   * Maneja el cierre del modal y redirige a la página principal
   */
  const handleSessionModalClose = useCallback(() => {
    setShowSessionModal(false);
    
    // Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_type');
    
    // Redirigir a la página principal
    router.push('/');
  }, [router]);

  /**
   * Configura el listener para errores de sesión desde BaseService
   */
  useEffect(() => {
    const handleSessionError = (event) => {
      const message = event.detail?.message || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      showSessionExpiredModal(message);
    };

    document.addEventListener('session-error', handleSessionError);

    return () => {
      document.removeEventListener('session-error', handleSessionError);
    };
  }, [showSessionExpiredModal]);

  return (
    <SessionErrorContext.Provider value={{ showSessionExpiredModal }}>
      {children}
      
      {/* Modal de sesión expirada */}
      <Modal 
        show={showSessionModal} 
        onHide={handleSessionModalClose}
        centered
        backdrop="static"
        keyboard={false}
        className="session-error-modal"
      >
        <Modal.Header 
          closeButton 
          className="bg-danger text-white border-0"
          style={{ backgroundColor: '#dc3545 !important' }}
        >
          <div className="d-flex align-items-center">
            <FiAlertCircle className="me-2" size={24} />
            <Modal.Title className="mb-0">Sesión Expirada</Modal.Title>
          </div>
        </Modal.Header>
        
        <Modal.Body className="py-4">
          <div className="text-center">
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ 
                backgroundColor: '#ffe5e5',
                width: '70px',
                height: '70px'
              }}
            >
              <FiLogOut size={40} className="text-danger" />
            </div>
            
            <h5 className="fw-bold text-dark mb-3">
              Tu sesión ha expirado
            </h5>
            
            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
              {sessionErrorMessage}
            </p>
            
            <p className="text-muted small mt-3 mb-0">
              Por razones de seguridad, las sesiones expiradas requieren reiniciar sesión.
            </p>
          </div>
        </Modal.Body>
        
        <Modal.Footer className="border-top-1 pt-3 pb-3">
          <Button
            variant="danger"
            onClick={handleSessionModalClose}
            className="px-4 fw-bold"
          >
            <FiLogOut className="me-2" />
            Iniciar Sesión de Nuevo
          </Button>
        </Modal.Footer>
      </Modal>
    </SessionErrorContext.Provider>
  );
}

export default SessionErrorProvider;
