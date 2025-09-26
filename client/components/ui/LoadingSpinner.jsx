// components/ui/LoadingSpinner.jsx
/**
 * Componente reutilizable de loading spinner
 * Principio de responsabilidad única: Solo mostrar estados de carga
 */

import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ 
  size = 'sm', 
  variant = 'light', 
  text = 'Cargando...', 
  className = '' 
}) => {
  return (
    <div className={`d-flex align-items-center ${className}`}>
      <Spinner
        as="span"
        animation="border"
        size={size}
        variant={variant}
        role="status"
        aria-hidden="true"
        className="me-2"
      />
      {text && <span>{text}</span>}
    </div>
  );
};

export default LoadingSpinner;