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
  const [isMobile, setIsMobile] = useState(false);
  const [isDashboardHovered, setIsDashboardHovered] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Detectar si estamos en dispositivo móvil
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    
    // Comprobar al cargar
    checkIsMobile();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile);
    
    // Obtener información del usuario del localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Limpiar listener
    return () => window.removeEventListener('resize', checkIsMobile);
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
      className={`px-${isMobile ? '2' : '3'} py-${isMobile ? '2' : '3'} border-bottom`}
      style={{ 
        backgroundColor: '#212529',
        transition: 'margin-left 0.3s ease-in-out',
        zIndex: 1030
      }}
    >
      {/* Botón menú hamburguesa */}
      <Button
        variant="outline-light"
        size={isMobile ? "sm" : "md"}
        onClick={toggleSidebar}
        className="me-2 me-md-3 d-flex align-items-center justify-content-center"
        style={{
          width: isMobile ? '32px' : '38px',
          height: isMobile ? '32px' : '38px',
          padding: '0'
        }}
      >
        <FiMenu size={isMobile ? 16 : 18} />
      </Button>

      {/* Título de la página */}
      <Navbar.Brand 
        className="mb-0 fw-bold" 
        onClick={() => router.push('/dashboard')} 
        onMouseEnter={() => setIsDashboardHovered(true)}
        onMouseLeave={() => setIsDashboardHovered(false)}
        style={{ 
          cursor: 'pointer', 
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: isDashboardHovered ? '#0d6efd' : '#fff',
          textDecoration: isDashboardHovered ? 'underline' : 'none',
          transition: 'all 0.3s ease',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: isDashboardHovered ? 'rgba(13, 110, 253, 0.1)' : 'transparent'
        }}
      >
        Dashboard
      </Navbar.Brand>

      {/* Espaciador */}
      <div className="ms-auto">
        {/* Botones de acción */}
        <div className="d-flex align-items-center">
          {/* Notificaciones */}
          <Button 
            variant="outline-light" 
            className="d-flex align-items-center justify-content-center position-relative me-2" 
            style={{
              width: isMobile ? '32px' : '38px',
              height: isMobile ? '32px' : '38px',
              padding: '0'
            }}
          >
            <FiBell size={isMobile ? 16 : 18} />
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
              size={isMobile ? "sm" : "md"}
              className="d-flex align-items-center"
              style={{ 
                paddingLeft: isMobile ? '8px' : '12px', 
                paddingRight: isMobile ? '8px' : '12px',
                paddingTop: isMobile ? '4px' : '6px',
                paddingBottom: isMobile ? '4px' : '6px'
              }}
            >
              <FiUser size={isMobile ? 14 : 16} className="me-1 me-md-2" />
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
      </div>
    </Navbar>
  );
};

export default Header;