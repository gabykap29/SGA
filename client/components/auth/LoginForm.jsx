// components/auth/LoginForm.jsx
/**
 * Componente principal del formulario de login
 * Diseño moderno y responsivo con React Bootstrap
 */

import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import { useLogin } from '../../hooks/useLogin';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';

const LoginForm = () => {
  const {
    formData,
    isLoading,
    error,
    showPassword,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    isFormValid
  } = useLogin();

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <div className="login-card">
              <div className="p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-5">
                  <div className="login-icon rounded-circle d-inline-flex align-items-center justify-content-center mb-4">
                    <FiUser size={36} className="text-white" />
                  </div>
                  <h2 className="login-title">SGA</h2>
                  <h2 className="login-title">Iniciar Sesión</h2>
                  <p className="login-subtitle">Ingresa tus credenciales para acceder</p>
                </div>

                {/* Alert de error */}
                <Alert 
                  variant="danger"
                  message={error}
                  show={!!error}
                  className="mb-4"
                />

                {/* Formulario */}
                <Form onSubmit={handleSubmit} noValidate>
                  {/* Campo Usuario */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark">
                      Usuario
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white border-end-0">
                        <FiUser className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu usuario"
                        className="border-start-0 ps-0"
                        required
                        autoComplete="username"
                        disabled={isLoading}
                      />
                    </InputGroup>
                  </Form.Group>

                  {/* Campo Contraseña */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark">
                      Contraseña
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white border-end-0">
                        <FiLock className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu contraseña"
                        className="border-start-0 border-end-0 ps-0"
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                      <InputGroup.Text 
                        className="bg-white border-start-0 cursor-pointer"
                        onClick={togglePasswordVisibility}
                        style={{ cursor: 'pointer' }}
                      >
                        {showPassword ? (
                          <FiEyeOff className="text-muted" />
                        ) : (
                          <FiEye className="text-muted" />
                        )}
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  {/* Checkbox Recordarme */}
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      label="Recordar mi sesión"
                      className="text-muted"
                      disabled={isLoading}
                    />
                  </Form.Group>

                  {/* Botón de Login */}
                  <div className="d-grid">
                    <Button
                      variant="dark"
                      size="lg"
                      type="submit"
                      disabled={isLoading || !isFormValid}
                      className="fw-semibold py-3 rounded-3"
                    >
                      {isLoading ? (
                        <LoadingSpinner 
                          text="Iniciando sesión..." 
                          variant="light"
                        />
                      ) : (
                        <>
                          <FiLogIn size={20} className="me-2" />
                          Iniciar Sesión
                        </>
                      )}
                    </Button>
                  </div>
                </Form>

                {/* Footer */}
                <div className="text-center mt-4 pt-3 border-top">
                  <small className="text-muted">
                    ¿Problemas para acceder?{' '}
                    <a href="#" className="text-dark text-decoration-none fw-semibold">
                      Contacta al administrador
                    </a>
                  </small>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginForm;