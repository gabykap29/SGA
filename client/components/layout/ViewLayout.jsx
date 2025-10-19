'use client';

import { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { FiUsers, FiFileText, FiLogOut, FiSearch, FiFilter, FiMenu } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { authService } from '../../services/authService';
import SearchPersons from '../persons/SearchPersonsView';
import RecordsSearch from '../persons/RecordsSearchView';

const ViewLayout = () => {
  const [activeTab, setActiveTab] = useState('personas');
  const [isMobile, setIsMobile] = useState(false);
  const [username, setUsername] = useState('');
  const router = useRouter();

  // Detectar si estamos en dispositivo móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Obtener nombre del usuario
    const fetchUserData = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setUsername(user.names ? `${user.names} ${user.lastname || ''}` : user.username);
      }
    };

    // Comprobar al cargar
    checkIsMobile();
    fetchUserData();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile);
    
    // Limpiar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.info('Sesión cerrada correctamente');
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Navbar Superior */}
      <Navbar bg="dark" variant="dark" expand="lg" className="border-bottom shadow-sm">
        <Container fluid className="px-3">
          <Navbar.Brand href="#" className="fw-bold">
            SGA <span className="badge bg-primary ms-2">VIEW</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <div className="text-light me-3 d-none d-sm-block">
                Hola, <span className="fw-bold">{username || 'Usuario'}</span>
              </div>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleLogout} 
                className="d-flex align-items-center"
              >
                <FiLogOut className="me-2" /> Salir
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Cuerpo principal */}
      <Container fluid className="flex-grow-1 d-flex flex-column py-3">
        <Alert variant="info" className="mb-3">
          <strong>Modo de solo consulta:</strong> Tienes acceso limitado al sistema. Solo puedes consultar información de personas y antecedentes.
        </Alert>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="personas" title={<span><FiUsers className="me-2" /> Personas</span>}>
            <SearchPersons />
          </Tab>
          <Tab eventKey="antecedentes" title={<span><FiFileText className="me-2" /> Antecedentes</span>}>
            <RecordsSearch />
          </Tab>
        </Tabs>
      </Container>

      {/* Footer */}
      <footer className="bg-dark text-white p-3 text-center">
        <small>Sistema de Gestión de Antecedentes &copy; {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
};

export default ViewLayout;