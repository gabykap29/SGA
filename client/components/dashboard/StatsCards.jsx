'use client';

import { Card, Row, Col } from 'react-bootstrap';
import { FiUsers, FiFileText, FiTrendingUp, FiDatabase } from 'react-icons/fi';

const StatsCard = ({ title, value, icon: Icon, loading = false }) => {
  return (
    <Card className="h-100 border-1 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div className="flex-grow-1">
          <h6 className="text-muted mb-1 fw-normal">{title}</h6>
          {loading ? (
            <div className="placeholder-glow">
              <span className="placeholder col-6"></span>
            </div>
          ) : (
            <h3 className="mb-0 fw-bold text-dark">
              {value}
            </h3>
          )}
        </div>
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ 
            width: '50px', 
            height: '50px', 
            backgroundColor: '#f5f5f5',
            color: '#212529'
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
      icon: FiUsers
    },
    {
      title: 'Antecedentes Cargados',
      value: stats?.totalAntecedentes || 0,
      icon: FiFileText
    },
    {
      title: 'Registros Activos',
      value: stats?.registrosActivos || 0,
      icon: FiDatabase
    }
  ];

  return (
    <Row className="g-4 mb-4">
      {cardsData.map((card, index) => (
        <Col key={index} xs={12} sm={6} lg={4}>
          <StatsCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            loading={loading}
          />
        </Col>
      ))}
    </Row>
  );
};

export default StatsCards;