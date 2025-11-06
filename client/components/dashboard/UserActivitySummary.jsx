'use client';

import { useState } from 'react';
import { Card, Row, Col, ListGroup, Badge, Spinner, Tabs, Tab } from 'react-bootstrap';
import { FiUser, FiUserCheck, FiActivity, FiCalendar } from 'react-icons/fi';

const UserActivitySummary = ({ summary, loading }) => {
  const [activeTab, setActiveTab] = useState('users');
  
  if (loading) {
    return (
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando resumen de actividad...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (!summary) {
    return null;
  }
  
  // Preparar datos para usuarios
  const usersList = Object.entries(summary.users || {})
    .map(([userId, data]) => ({
      id: userId,
      username: data.username,
      count: data.count
    }))
    .sort((a, b) => b.count - a.count);
    
  // Preparar datos para actividad diaria
  const dailyActivity = Object.entries(summary.daily_activity || {})
    .map(([date, count]) => ({
      date,
      count
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
    
  // Preparar datos para acciones
  const actionsList = Object.entries(summary.actions || {})
    .map(([action, count]) => ({
      action,
      count
    }))
    .sort((a, b) => b.count - a.count);
    
  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-0 border-bottom"
        >
          <Tab eventKey="users" title="Usuarios Activos">
            <div className="p-3">
              <ListGroup variant="flush">
                {usersList.length > 0 ? (
                  usersList.slice(0, 10).map((user, index) => (
                    <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center py-3 px-0 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-light p-2 me-3">
                          <FiUser size={18} />
                        </div>
                        <div>
                          <h6 className="mb-0">{user.username}</h6>
                          <small className="text-muted">{user.id === 'anonymous' ? 'Usuario anónimo' : `ID: ${user.id.substring(0, 8)}...`}</small>
                        </div>
                      </div>
                      <Badge bg="primary" pill>
                        {user.count} acciones
                      </Badge>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-center py-4">
                    <p className="mb-0 text-muted">No hay datos de actividad de usuarios</p>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          </Tab>
          
          <Tab eventKey="daily" title="Actividad Diaria">
            <div className="p-3">
              <ListGroup variant="flush">
                {dailyActivity.length > 0 ? (
                  dailyActivity.slice(0, 10).map((day, index) => {
                    // Formatear la fecha
                    const date = new Date(day.date);
                    const formattedDate = date.toLocaleDateString('es-ES', {
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric'
                    });
                    
                    return (
                      <ListGroup.Item key={day.date} className="d-flex justify-content-between align-items-center py-3 px-0 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-light p-2 me-3">
                            <FiCalendar size={18} />
                          </div>
                          <div>
                            <h6 className="mb-0">{formattedDate}</h6>
                          </div>
                        </div>
                        <Badge bg="info" pill>
                          {day.count} registros
                        </Badge>
                      </ListGroup.Item>
                    );
                  })
                ) : (
                  <ListGroup.Item className="text-center py-4">
                    <p className="mb-0 text-muted">No hay datos de actividad diaria</p>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          </Tab>
          
          <Tab eventKey="actions" title="Tipos de Acciones">
            <div className="p-3">
              <ListGroup variant="flush">
                {actionsList.length > 0 ? (
                  actionsList.map((actionItem, index) => {
                    const actionColors = {
                      'CREATE': 'success',
                      'UPDATE': 'info',
                      'DELETE': 'danger',
                      'LOGIN_SUCCESS': 'primary',
                      'LOGIN_FAILED': 'warning',
                      'LOGOUT': 'secondary'
                    };
                    
                    return (
                      <ListGroup.Item key={actionItem.action} className="d-flex justify-content-between align-items-center py-3 px-0 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-light p-2 me-3">
                            <FiActivity size={18} />
                          </div>
                          <div>
                            <h6 className="mb-0">{actionItem.action}</h6>
                          </div>
                        </div>
                        <Badge bg={actionColors[actionItem.action] || 'secondary'} pill>
                          {actionItem.count} registros
                        </Badge>
                      </ListGroup.Item>
                    );
                  })
                ) : (
                  <ListGroup.Item className="text-center py-4">
                    <p className="mb-0 text-muted">No hay datos de tipos de acciones</p>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default UserActivitySummary;