'use client';

import { Card, Row, Col } from 'react-bootstrap';
import { FiUsers, FiFileText, FiTrendingUp, FiDatabase } from 'react-icons/fi';

const StatsCard = ({ title, value, icon: Icon, color, loading = false }) => {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div className="flex-grow-1">
          <h6 className="text-muted mb-1 fw-normal">{title}</h6>
          {loading ? (
            <div className="placeholder-glow">
              <span className="placeholder col-6"></span>
            </div>
          ) : (
            <h3 className="mb-0 fw-bold" style={{ color }}>
              {value}
            </h3>
          )}
        </div>
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ 
            width: '50px', 
            height: '50px', 
            backgroundColor: `${color}15`,
            color: color
          }}
        >
          <Icon size={24} />
        </div>
      </Card.Body>
    </Card>
  );
};

const StatsCards = ({ stats, loading = false }) => {
  const cardsData = [
    {
      title: 'Total Personas',
      value: stats?.totalPersonas || 0,
      icon: FiUsers,
      color: '#007bff'
    },
    {
      title: 'Antecedentes Cargados',
      value: stats?.totalAntecedentes || 0,
      icon: FiFileText,
      color: '#28a745'
    },
    {
      title: 'Registros Activos',
      value: stats?.registrosActivos || 0,
      icon: FiDatabase,
      color: '#ffc107'
    },
    {
      title: 'Nuevos Este Mes',
      value: stats?.nuevosEsteMes || 0,
      icon: FiTrendingUp,
      color: '#dc3545'
    }
  ];

  return (
    <Row className="g-4 mb-4">
      {cardsData.map((card, index) => (
        <Col key={index} xs={12} sm={6} lg={3}>
          <StatsCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            loading={loading}
          />
        </Col>
      ))}
    </Row>
  );
};

export default StatsCards;