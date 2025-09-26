'use client';

import { useState } from 'react';
import { Nav, Collapse } from 'react-bootstrap';
import { 
  FiUsers, 
  FiFileText, 
  FiUser, 
  FiPlus, 
  FiFilter, 
  FiChevronDown,
  FiChevronRight 
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggle }) => {
  const [openMenus, setOpenMenus] = useState({
    personas: false,
    antecedentes: false
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const sidebarItems = [
    {
      id: 'personas',
      title: 'Personas',
      icon: FiUsers,
      hasSubmenu: true,
      submenu: [
        { title: 'Crear', icon: FiPlus, href: '/dashboard/personas/crear' },
        { title: 'Filtrar', icon: FiFilter, href: '/dashboard/personas/filtrar' }
      ]
    },
    {
      id: 'antecedentes',
      title: 'Antecedentes',
      icon: FiFileText,
      hasSubmenu: true,
      submenu: [
        { title: 'Crear', icon: FiPlus, href: '/dashboard/antecedentes/crear' },
        { title: 'Filtrar', icon: FiFilter, href: '/dashboard/antecedentes/filtrar' }
      ]
    },
    {
      id: 'usuarios',
      title: 'Usuarios',
      icon: FiUser,
      hasSubmenu: false,
      href: '/dashboard/usuarios'
    }
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="position-fixed w-100 h-100" 
          style={{ 
            top: 0, 
            left: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 1040 
          }}
          onClick={toggle}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`bg-dark text-white position-fixed h-100 transition-all ${
          isOpen ? 'translate-x-0' : 'translate-x-n100'
        }`}
        style={{ 
          width: '280px',
          top: 0,
          left: 0,
          zIndex: 1050,
          transition: 'transform 0.3s ease-in-out',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* Header del sidebar */}
        <div className="p-4 border-bottom border-secondary">
          <h4 className="mb-0 fw-bold">
            <FiFileText className="me-2" />
            SGA Sistema
          </h4>
          <small className="text-muted">Sistema de Gestión</small>
        </div>

        {/* Navegación */}
        <Nav className="flex-column p-3">
          {sidebarItems.map((item) => (
            <div key={item.id} className="mb-2">
              {item.hasSubmenu ? (
                <>
                  <Nav.Link
                    className="text-white d-flex align-items-center justify-content-between py-3 px-3 rounded hover-item"
                    onClick={() => toggleMenu(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <item.icon size={18} className="me-3" />
                      <span className="fw-medium">{item.title}</span>
                    </div>
                    {openMenus[item.id] ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                  </Nav.Link>
                  
                  <Collapse in={openMenus[item.id]}>
                    <div className="ms-4">
                      {item.submenu.map((subItem, index) => (
                        <Nav.Link
                          key={index}
                          href={subItem.href}
                          className="text-light d-flex align-items-center py-2 px-3 rounded submenu-item"
                        >
                          <subItem.icon size={14} className="me-2" />
                          <span className="small">{subItem.title}</span>
                        </Nav.Link>
                      ))}
                    </div>
                  </Collapse>
                </>
              ) : (
                <Nav.Link
                  href={item.href}
                  className="text-white d-flex align-items-center py-3 px-3 rounded hover-item"
                >
                  <item.icon size={18} className="me-3" />
                  <span className="fw-medium">{item.title}</span>
                </Nav.Link>
              )}
            </div>
          ))}
        </Nav>
      </div>

      <style jsx>{`
        .hover-item:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          text-decoration: none !important;
        }
        
        .submenu-item:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          text-decoration: none !important;
        }
        
        .transition-all {
          transition: all 0.3s ease-in-out;
        }
        
        @media (min-width: 992px) {
          .sidebar-desktop {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;