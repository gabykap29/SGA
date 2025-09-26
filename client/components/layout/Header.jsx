'use client';

import { useState, useEffect } from 'react';
import { Navbar, Nav, Dropdown, Button } from 'react-bootstrap';
import { 
  FiMenu, 
  FiUser, 
  FiLogOut, 
  FiSettings,
  FiBell
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Obtener información del usuario del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Limpiar datos de autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Mostrar toast de despedida
    toast.info('¡Hasta pronto!', {
      position: "top-right",
      autoClose: 2000,
    });

    // Redirigir al login
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const handleProfile = () => {
    // TODO: Implementar vista de perfil
    toast.info('Funcionalidad en desarrollo');
  };

  const handleSettings = () => {
    // TODO: Implementar configuraciones
    toast.info('Funcionalidad en desarrollo');
  };

  return (
    <Navbar 
      bg="dark" 
      variant="dark" 
      className="px-3 py-3 border-bottom border-secondary"
      style={{ 
        marginLeft: sidebarOpen ? '0' : '0',
        transition: 'margin-left 0.3s ease-in-out',
        zIndex: 1030
      }}
    >
      {/* Botón menú hamburguesa */}
      <Button
        variant="outline-light"
        size="sm"
        onClick={toggleSidebar}
        className="me-3 d-flex align-items-center"
      >
        <FiMenu size={18} />
      </Button>

      {/* Título de la página */}
      <Navbar.Brand className="mb-0 fw-bold">
        Dashboard
      </Navbar.Brand>

      {/* Espaciador */}
      <div className="ms-auto d-flex align-items-center">
        {/* Notificaciones */}
        <Button 
          variant="outline-light" 
          size="sm" 
          className="me-3 position-relative"
          onClick={() => toast.info('No hay notificaciones nuevas')}
        >
          <FiBell size={16} />
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.6rem' }}
          >
            0
          </span>
        </Button>

        {/* Dropdown del usuario */}
        <Dropdown align="end">
          <Dropdown.Toggle 
            variant="outline-light" 
            size="sm"
            className="d-flex align-items-center"
          >
            <FiUser size={16} className="me-2" />
            <span className="d-none d-md-inline">
              {user?.username || 'Usuario'}
            </span>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow border-0">
            <Dropdown.Header>
              <div className="fw-bold">{user?.username || 'Usuario'}</div>
              <small className="text-muted">{user?.role_name || 'Rol no definido'}</small>
            </Dropdown.Header>
            
            <Dropdown.Divider />
            
            <Dropdown.Item 
              onClick={handleProfile}
              className="d-flex align-items-center"
            >
              <FiUser size={14} className="me-2" />
              Mi Perfil
            </Dropdown.Item>
            
            <Dropdown.Item 
              onClick={handleSettings}
              className="d-flex align-items-center"
            >
              <FiSettings size={14} className="me-2" />
              Configuración
            </Dropdown.Item>
            
            <Dropdown.Divider />
            
            <Dropdown.Item 
              onClick={handleLogout}
              className="d-flex align-items-center text-danger"
            >
              <FiLogOut size={14} className="me-2" />
              Cerrar Sesión
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
};

export default Header;