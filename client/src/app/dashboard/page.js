'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Componentes del dashboard
import DashboardLayout from '../../../components/layout/DashboardLayout';
import StatsCards from '../../../components/dashboard/StatsCards';
import RecentPersonsTable from '../../../components/dashboard/RecentPersonsTable';

// Servicios
import { dashboardService } from '../../../services/dashboardService';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    recentPersons: []
  });

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Cargar datos del dashboard
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getDashboardData();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        toast.error('Error al cargar datos del dashboard');
        console.error('Error loading dashboard data:', result.error);
        
        // Datos de fallback
        setDashboardData({
          stats: {
            totalPersonas: 0,
            totalAntecedentes: 0,
            registrosActivos: 0,
            nuevosEsteMes: 0
          },
          recentPersons: []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error inesperado al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <div className="text-muted">Cargando dashboard...</div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Título de bienvenida */}
        <div className="mb-4">
          <h2 className="fw-bold text-dark mb-1">Dashboard</h2>
          <p className="text-muted">Resumen general del sistema</p>
        </div>

        {/* Tarjetas de estadísticas */}
        <StatsCards stats={dashboardData.stats} loading={loading} />

        {/* Tabla de personas recientes */}
        <RecentPersonsTable persons={dashboardData.recentPersons} loading={loading} />
      </Container>
    </DashboardLayout>
  );
}