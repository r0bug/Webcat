import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={8} lg={6}>
          <RegisterForm />
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;