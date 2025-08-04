import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiUsers, FiPackage, FiMessageSquare, FiCalendar, FiSettings, FiTag } from 'react-icons/fi';
import { MdPalette } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <FiUsers size={40} />,
      link: '/admin/users',
      color: 'primary'
    },
    {
      title: 'Theme Editor',
      description: 'Customize site appearance and branding',
      icon: <MdPalette size={40} />,
      link: '/admin/theme',
      color: 'success'
    },
    {
      title: 'Item Management',
      description: 'View and manage all catalog items',
      icon: <FiPackage size={40} />,
      link: '/admin/items',
      color: 'info'
    },
    {
      title: 'Tag Management',
      description: 'Manage product tags and categories',
      icon: <FiTag size={40} />,
      link: '/admin/tags',
      color: 'warning'
    },
    {
      title: 'Messages',
      description: 'Monitor user communications',
      icon: <FiMessageSquare size={40} />,
      link: '/admin/messages',
      color: 'danger'
    },
    {
      title: 'Events',
      description: 'Manage calendar events',
      icon: <FiCalendar size={40} />,
      link: '/admin/events',
      color: 'secondary'
    }
  ];

  const staffCards = adminCards.filter(card => 
    !['Theme Editor', 'User Management'].includes(card.title)
  );

  const displayCards = user?.userType === 'Admin' ? adminCards : staffCards;

  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>
      <p className="text-muted mb-4">Welcome back, {user?.name}!</p>
      
      <Row>
        {displayCards.map((card, index) => (
          <Col md={6} lg={4} key={index} className="mb-4">
            <Card as={Link} to={card.link} className="h-100 text-decoration-none shadow-sm hover-shadow">
              <Card.Body className="text-center p-4">
                <div className={`text-${card.color} mb-3`}>
                  {card.icon}
                </div>
                <h5 className="card-title">{card.title}</h5>
                <p className="card-text text-muted small">
                  {card.description}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <style>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </Container>
  );
};

export default AdminDashboard;