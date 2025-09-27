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
import personService from '../../../services/personService';

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
    
    // Actualizar los datos cada 30 segundos para mantenerlos frescos
    const intervalId = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas del servidor utilizando el nuevo endpoint
      const statsResult = await dashboardService.getStats();
      
      // Obtener personas recientes para la tabla
      const personsResult = await dashboardService.getRecentPersons(5);
      
      console.log('Stats result:', statsResult);
      
      if (statsResult.success && personsResult.success) {
        // Verificar la estructura de datos recibida
        if (statsResult.data && statsResult.data.stats) {
          console.log('Estadísticas encontradas:', statsResult.data.stats);
          
          // Combinar datos de estadísticas y personas recientes
          setDashboardData({
            stats: {
              totalPersonas: statsResult.data.stats.cant_person || 0,
              totalAntecedentes: statsResult.data.stats.cant_record || 0,
              registrosActivos: statsResult.data.stats.cant_record || 0,
              nuevosEsteMes: statsResult.data.stats.cant_month || 0
            },
            recentPersons: personsResult.data || []
          });
        } else {
          console.error('Formato de respuesta incorrecto:', statsResult);
          toast.error('Error en el formato de los datos recibidos');
        }
      } else {
        console.warn('Error al cargar datos del dashboard, utilizando fallback...');
        
        // Fallback: intentar cargar personas directamente con personService
        try {
          const fallbackPersonsResult = await personService.getPersons();
          
          if (fallbackPersonsResult.success) {
            const persons = fallbackPersonsResult.data;
            const sortedPersons = Array.isArray(persons) ? persons.sort((a, b) => {
              const dateA = new Date(a.created_at || a.updated_at || 0);
              const dateB = new Date(b.created_at || b.updated_at || 0);
              return dateB - dateA;
            }) : [];
            
            setDashboardData({
              stats: {
                totalPersonas: persons.length || 0,
                totalAntecedentes: 0,
                registrosActivos: 0,
                nuevosEsteMes: 0
              },
              recentPersons: sortedPersons.slice(0, 5)
            });
          } else {
            throw new Error(fallbackPersonsResult.error);
          }
        } catch (fallbackError) {
          console.error('Fallback también falló:', fallbackError);
          toast.error('Error al cargar datos del dashboard');
          
          // Datos completamente de fallback
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
      }
    } catch (error) {
      console.error('Error al cargar el dashboard:', error);
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
            <Spinner animation="border" variant="dark" className="mb-3" />
            <div className="text-muted">Cargando dashboard...</div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cuadro de título */}
        <div className="mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <h2 className="fw-bold text-dark mb-2">Dashboard</h2>
          <p className="text-muted lead mb-0">
            ➜ Resumen general del sistema
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <StatsCards stats={dashboardData.stats} loading={loading} />

        {/* Tabla de personas recientes */}
        <RecentPersonsTable persons={dashboardData.recentPersons} loading={loading} />
      </Container>
    </DashboardLayout>
  );
}