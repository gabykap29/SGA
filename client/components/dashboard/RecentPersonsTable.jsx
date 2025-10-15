'use client';

import { Card, Table, Badge, Button } from 'react-bootstrap';
import { FiEye, FiEdit, FiCalendar, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const RecentPersonsTable = ({ persons = [], loading = false }) => {
  const router = useRouter();

  const handleViewPerson = (personId) => {
    router.push(`/dashboard/personas/${personId}`);
  };

  const handleEditPerson = (personId) => {
    // Por ahora redirigir a la vista de detalle, más adelante se puede crear vista de edición
    router.push(`/dashboard/personas/${personId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const LoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <tr key={index}>
          <td>
            <div className="placeholder-glow">
              <span className="placeholder col-8"></span>
            </div>
          </td>
          <td>
            <div className="placeholder-glow">
              <span className="placeholder col-6"></span>
            </div>
          </td>
          <td>
            <div className="placeholder-glow">
              <span className="placeholder col-4"></span>
            </div>
          </td>
          <td>
            <div className="placeholder-glow">
              <span className="placeholder col-7"></span>
            </div>
          </td>
          <td>
            <div className="placeholder-glow">
              <span className="placeholder col-5"></span>
            </div>
          </td>
          <td>
            <div className="placeholder-glow d-flex gap-1">
              <span className="placeholder col-4"></span>
              <span className="placeholder col-4"></span>
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <Card className="border-1 shadow-sm">
      <Card.Header className="border-1" style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderBottom: '1px solid #dee2e6'
      }}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center justify-content-center me-3" style={{
              backgroundColor: '#1b3e61ff',
              borderRadius: '4px',
              width: '48px',
              height: '48px'
            }}>
              <FiUser className="text-white" size={24} />
            </div>
            <div>
              <h5 className="mb-1 fw-bold text-dark">Últimas Personas Registradas</h5>
              <small className="text-muted">Registros más recientes del sistema</small>
            </div>
          </div>
          <Badge bg="dark" style={{
            color: 'white',
            fontSize: '14px',
            padding: '6px 12px',
            borderRadius: '4px'
          }}>
            {persons.length}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table className="mb-0" hover>
            <thead style={{
              backgroundColor: '#f5f5f5'
            }}>
              <tr>
                <th className="fw-bold py-3 px-3 text-dark">Nombre Completo</th>
                <th className="fw-bold py-3 px-3 text-dark">Identificación</th>
                <th className="fw-bold py-3 px-3 text-dark">Provincia</th>
                <th className="fw-bold py-3 px-3 text-dark">
                  <FiCalendar className="me-2" size={16} />
                  Fecha de Registro
                </th>
                <th className="fw-bold py-3 px-3 text-dark">País</th>
                <th className="fw-bold py-3 px-3 text-center text-dark">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingSkeleton />
              ) : persons.length > 0 ? (
                persons.map((person, index) => (
                  <tr 
                    key={person.id || index}
                    style={{
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.transform = 'scale(1.01)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(26, 28, 72, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleViewPerson(person.person_id || person.id)}
                  >
                    <td className="py-4 px-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            fontSize: '16px', 
                            fontWeight: 'bold',
                            backgroundColor: '#1b3e61ff',
                            border: '1px solid #dee2e6'
                          }}
                        >
                          {person.names?.charAt(0) || 'N'}
                          {person.lastnames?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">
                            {person.names} {person.lastnames}
                          </div>
                          <small className="text-muted">
                            ID: {person.person_id || person.id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div>
                        <span className="font-monospace fw-bold text-dark">
                          {person.identification || 'No especificado'}
                        </span>
                        <br />
                        <small className="text-muted" style={{ 
                          padding: '2px 8px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px'
                        }}>
                          {person.identification_type || 'N/A'}
                        </small>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <Badge bg="secondary" style={{
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '12px',
                        border: 'none'
                      }}>
                        {person.province || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-4 px-3">
                      <span style={{ 
                        color: 'white', 
                        fontWeight: '500',
                        background: '#1b3e61ff',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        {formatDate(person.created_at)}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <Badge bg="secondary" style={{
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontWeight: '500',
                        fontSize: '12px'
                      }}>
                        {person.country || 'Otro'}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Button 
                          size="sm"
                          variant="dark"
                          title="Ver detalles"
                          onClick={() => handleViewPerson(person.person_id || person.id)}
                        >
                          <FiEye size={14} />
                        </Button>
                        <Button 
                          size="sm"
                          variant="success"
                          title="Editar"
                          onClick={() => handleEditPerson(person.person_id || person.id)}
                        >
                          <FiEdit size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div style={{
                      padding: '40px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      margin: '20px'
                    }}>
                      <div 
                        className="d-flex align-items-center justify-content-center mb-3"
                        style={{
                          backgroundColor: '#212529',
                          borderRadius: '50%',
                          width: '80px',
                          height: '80px',
                          margin: '0 auto 20px',
                          boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)'
                        }}
                      >
                        <FiUser size={40} className="text-white" />
                      </div>
                      <div className="text-dark" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        No hay personas registradas aún
                      </div>
                      <small className="text-muted" style={{ fontSize: '14px' }}>
                        Los nuevos registros aparecerán aquí
                      </small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
      {persons.length > 0 && (
        <Card.Footer className="border-0 p-3 text-center">
          <Button 
            variant="dark"
            onClick={() => router.push('/dashboard/personas/buscar')}
          >
            <FiUser className="me-2" size={16} />
            Ver todas las personas
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
};

export default RecentPersonsTable;