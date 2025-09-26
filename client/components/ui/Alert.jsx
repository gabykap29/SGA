// components/ui/Alert.jsx
/**
 * Componente reutilizable de alerta
 * Principio de responsabilidad única: Solo mostrar alertas
 */

import { Alert as BootstrapAlert } from 'react-bootstrap';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const Alert = ({ 
  variant = 'danger', 
  message, 
  show = true, 
  onClose, 
  dismissible = false,
  icon = true 
}) => {
  if (!show || !message) return null;

  const getIcon = () => {
    if (!icon) return null;

    const iconProps = { size: 20, className: 'me-2' };
    
    switch (variant) {
      case 'success':
        return <FiCheckCircle {...iconProps} />;
      case 'info':
        return <FiInfo {...iconProps} />;
      case 'warning':
        return <FiAlertTriangle {...iconProps} />;
      default:
        return <FiAlertCircle {...iconProps} />;
    }
  };

  return (
    <BootstrapAlert 
      variant={variant} 
      show={show}
      onClose={onClose}
      dismissible={dismissible}
      className="d-flex align-items-center"
    >
      {getIcon()}
      <span>{message}</span>
    </BootstrapAlert>
  );
};

export default Alert;