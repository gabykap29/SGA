'use client';

import { Card, Table, Badge, Button } from 'react-bootstrap';
import { FiEye, FiEdit, FiCalendar, FiUser } from 'react-icons/fi';

const RecentPersonsTable = ({ persons = [], loading = false }) => {
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
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <FiUser className="me-2 text-primary" size={20} />
            <h5 className="mb-0 fw-bold">Últimas Personas Registradas</h5>
          </div>
          <Badge bg="primary" pill>
            {persons.length}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table className="mb-0" hover>
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold text-muted py-3">Nombre Completo</th>
                <th className="fw-semibold text-muted py-3">Identificación</th>
                <th className="fw-semibold text-muted py-3">Provincia</th>
                <th className="fw-semibold text-muted py-3">
                  <FiCalendar className="me-1" size={14} />
                  Fecha de Registro
                </th>
                <th className="fw-semibold text-muted py-3">País</th>
                <th className="fw-semibold text-muted py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingSkeleton />
              ) : persons.length > 0 ? (
                persons.map((person, index) => (
                  <tr key={person.id || index}>
                    <td className="py-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px', fontSize: '14px' }}
                        >
                          {person.names?.charAt(0) || 'N'}
                          {person.lastnames?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div className="fw-semibold">
                            {person.names} {person.lastnames}
                          </div>
                          <small className="text-muted">
                            ID: {person.person_id || person.id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <span className="font-monospace fw-semibold">
                          {person.identification || 'No especificado'}
                        </span>
                        <br />
                        <small className="text-muted">
                          {person.identification_type || 'N/A'}
                        </small>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge bg="light" text="dark">
                        {person.province || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className="text-muted">
                        {formatDate(person.created_at)}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge bg="info" text="dark">
                        {person.country || 'Argentina'}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          title="Ver detalles"
                        >
                          <FiEye size={14} />
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          title="Editar"
                        >
                          <FiEdit size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <FiUser size={48} className="mb-3 opacity-50" />
                    <div>No hay personas registradas aún</div>
                    <small>Los nuevos registros aparecerán aquí</small>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
      {persons.length > 0 && (
        <Card.Footer className="bg-light text-center">
          <Button variant="outline-primary" size="sm">
            Ver todas las personas
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
};

export default RecentPersonsTable;