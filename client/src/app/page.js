'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../../components/auth/LoginForm';
import { Container, Row, Col } from 'react-bootstrap';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    const token = localStorage.getItem('token');
    if (token) {
      // Redirigir al dashboard o página principal
      router.push('/dashboard');
    }
  }, [router]);

  const handleLoginSuccess = () => {
    // Redirigir al dashboard después del login exitoso
    router.push('/dashboard');
  };

  return (
    <div className="login-container">
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center">
        <Row className="w-100">
          <Col className="mx-auto">
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}
