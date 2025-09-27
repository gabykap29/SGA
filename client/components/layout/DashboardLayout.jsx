'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      
      {/* Contenido principal */}
      <div 
        className="transition-all"
        style={{
          marginLeft: sidebarOpen ? '280px' : '0',
          transition: 'margin-left 0.3s ease-in-out'
        }}
      >
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        
        {/* Contenido */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;