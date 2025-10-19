'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, Row, Col, Card, Table, Button, 
  Spinner, Badge, Modal, Form, Alert
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { 
  FiUsers, FiEdit, FiTrash2, FiPlus, 
  FiCheck, FiX, FiEye, FiEyeOff 
} from 'react-icons/fi';

// Componentes del layout
import DashboardLayout from '../../../../components/layout/DashboardLayout';

// Servicios
import userService from '../../../../services/userService';
import roleService from '../../../../services/roleService';

export default function UsersPage() {
  const router = useRouter();
  
  // Estados para la lista de usuarios
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados para los modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    names: '',
    lastname: '',
    username: '',
    passwd: '',
    confirm_passwd: '',
    role_id: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Comprobar autenticación y detectar dispositivo móvil
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Detectar si estamos en dispositivo móvil
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Comprobar al cargar
    checkIsMobile();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile);
    
    // Cargar datos
    loadUsers();
    loadRoles();
    
    // Limpiar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [router]);
  
  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await userService.getUsers();
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        console.error('Error al cargar usuarios:', result.error);
        toast.error(result.error || 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error inesperado al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar roles
  const loadRoles = async () => {
    try {
      const result = await roleService.getRoles();
      
      if (result.success) {
        setRoles(result.data || []);
      } else {
        console.error('Error al cargar roles:', result.error);
        toast.error(result.error || 'Error al cargar roles');
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
      toast.error('Error inesperado al cargar roles');
    }
  };
  
  // Manejadores para los modales
  const handleShowCreateModal = () => {
    setFormData({
      names: '',
      lastname: '',
      username: '',
      passwd: '',
      confirm_passwd: '',
      role_id: roles.length > 0 ? roles[0].id : ''
    });
    setErrors({});
    setShowCreateModal(true);
  };
  
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };
  
  const handleShowEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      names: user.names || '',
      lastname: user.lastname || '',
      username: user.username || '',
      passwd: '',
      confirm_passwd: '',
      role_id: user.role_id || ''
    });
    setErrors({});
    setShowEditModal(true);
  };
  
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };
  
  const handleShowDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };
  
  // Manejador para cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error de este campo si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.names.trim()) newErrors.names = 'El nombre es requerido';
    if (!formData.lastname.trim()) newErrors.lastname = 'El apellido es requerido';
    if (!formData.username.trim()) newErrors.username = 'El nombre de usuario es requerido';
    if (!formData.role_id) newErrors.role_id = 'Debe seleccionar un rol';
    
    // Solo validar contraseña en creación o si se ingresó algo en edición
    if (showCreateModal || formData.passwd) {
      if (!formData.passwd) newErrors.passwd = 'La contraseña es requerida';
      else if (formData.passwd.length < 6) newErrors.passwd = 'La contraseña debe tener al menos 6 caracteres';
      
      if (formData.passwd !== formData.confirm_passwd) {
        newErrors.confirm_passwd = 'Las contraseñas no coinciden';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío de creación de usuario
  const handleCreateUser = async () => {
    if (!validateForm()) return;
    
    try {
      const result = await userService.createUser(formData);
      
      if (result.success) {
        toast.success('Usuario creado exitosamente');
        handleCloseCreateModal();
        loadUsers(); // Recargar lista
      } else {
        toast.error(result.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast.error('Error inesperado al crear usuario');
    }
  };
  
  // Manejar envío de edición de usuario
  const handleUpdateUser = async () => {
    if (!validateForm()) return;
    
    try {
      // Si no se ingresó contraseña en edición, eliminarla del payload
      const payload = { ...formData };
      if (!payload.passwd) {
        delete payload.passwd;
        delete payload.confirm_passwd;
      }
      
      const result = await userService.updateUser(selectedUser.id, payload);
      
      if (result.success) {
        toast.success('Usuario actualizado exitosamente');
        handleCloseEditModal();
        loadUsers(); // Recargar lista
      } else {
        toast.error(result.error || 'Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Error inesperado al actualizar usuario');
    }
  };
  
  // Manejar eliminación de usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const result = await userService.deleteUser(selectedUser.id);
      
      if (result.success) {
        toast.success('Usuario eliminado exitosamente');
        handleCloseDeleteModal();
        loadUsers(); // Recargar lista
      } else {
        toast.error(result.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error inesperado al eliminar usuario');
    }
  };
  
  // Renderizado condicional para cargando
  if (loading) {
    return (
      <DashboardLayout>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="dark" className="mb-3" />
            <div className="text-muted">Cargando usuarios...</div>
          </div>
        </Container>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Container fluid>
        {/* Cabecera */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 p-4 bg-white rounded shadow-sm" style={{ border: '1px solid #d4cfcfff' }}>
          <div className="mb-3 mb-md-0">
            <h2 className="fw-bold text-dark mb-2">
              <FiUsers className="me-2" />
              Gestión de Usuarios
            </h2>
            <p className="text-muted lead mb-0">
              ➜ Administra los usuarios del sistema
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={handleShowCreateModal} 
            className="d-flex align-items-center"
          >
            <FiPlus className="me-1" /> 
            Nuevo Usuario
          </Button>
        </div>
        
        {/* Tabla de usuarios */}
        <Card className="shadow-sm border">
          <Card.Body>
            {users.length === 0 ? (
              <Alert variant="info">
                No hay usuarios registrados en el sistema.
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      {!isMobile && <th>Rol</th>}
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-gradient text-white rounded-circle d-flex justify-content-center align-items-center me-3" 
                                 style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                              {user.names?.charAt(0)?.toUpperCase() || '?'}
                              {user.lastname?.charAt(0)?.toUpperCase() || ''}
                            </div>
                            <div>
                              <div className="fw-bold">{user.names} {user.lastname}</div>
                              {isMobile && (
                                <Badge bg="secondary" className="mt-1">{user.role_name}</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{user.username}</td>
                        {!isMobile && (
                          <td>
                            <Badge bg="secondary">{user.role_name}</Badge>
                          </td>
                        )}
                        <td>
                          <div className="d-flex justify-content-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-2" 
                              onClick={() => handleShowEditModal(user)}
                              title="Editar"
                            >
                              <FiEdit />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleShowDeleteModal(user)}
                              title="Eliminar"
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
      
      {/* Modal para crear usuario */}
      <Modal 
        show={showCreateModal} 
        onHide={handleCloseCreateModal}
        backdrop="static"
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombres</Form.Label>
                  <Form.Control
                    type="text"
                    name="names"
                    value={formData.names}
                    onChange={handleInputChange}
                    isInvalid={!!errors.names}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.names}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    isInvalid={!!errors.lastname}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lastname}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    isInvalid={!!errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    isInvalid={!!errors.role_id}
                  >
                    <option value="">Seleccionar Rol</option>
                    {roles.map(role => {
                      let label = role.name;
                      if (role.name === 'ADMIN') label = 'Administrador';
                      else if (role.name === 'MODERATE') label = 'Moderador';
                      else if (role.name === 'USER') label = 'Usuario';
                      else if (role.name === 'VIEW') label = 'Solo Consulta';
                      return (
                        <option key={role.id} value={role.id}>
                          {label}
                        </option>
                      );
                    })}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.role_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="passwd"
                      value={formData.passwd}
                      onChange={handleInputChange}
                      isInvalid={!!errors.passwd}
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      {errors.passwd}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirmar Contraseña</Form.Label>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="confirm_passwd"
                    value={formData.confirm_passwd}
                    onChange={handleInputChange}
                    isInvalid={!!errors.confirm_passwd}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirm_passwd}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCreateModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateUser}>
            Crear Usuario
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal para editar usuario */}
      <Modal 
        show={showEditModal} 
        onHide={handleCloseEditModal}
        backdrop="static"
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombres</Form.Label>
                  <Form.Control
                    type="text"
                    name="names"
                    value={formData.names}
                    onChange={handleInputChange}
                    isInvalid={!!errors.names}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.names}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    isInvalid={!!errors.lastname}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lastname}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    isInvalid={!!errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    isInvalid={!!errors.role_id}
                  >
                    <option value="">Seleccionar Rol</option>
                    {roles.map(role => {
                      let label = role.name;
                      if (role.name === 'ADMIN') label = 'Administrador';
                      else if (role.name === 'MODERATE') label = 'Moderador';
                      else if (role.name === 'USER') label = 'Usuario';
                      else if (role.name === 'VIEW') label = 'Solo Consulta';
                      return (
                        <option key={role.id} value={role.id}>
                          {label}
                        </option>
                      );
                    })}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.role_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Alert variant="info">
              <strong>Información:</strong> Deje los campos de contraseña vacíos si no desea cambiarla.
            </Alert>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nueva Contraseña</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="passwd"
                      value={formData.passwd}
                      onChange={handleInputChange}
                      isInvalid={!!errors.passwd}
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      {errors.passwd}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="confirm_passwd"
                    value={formData.confirm_passwd}
                    onChange={handleInputChange}
                    isInvalid={!!errors.confirm_passwd}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirm_passwd}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdateUser}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal para eliminar usuario */}
      <Modal 
        show={showDeleteModal} 
        onHide={handleCloseDeleteModal}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p className="mb-2">¿Está seguro de eliminar este usuario?</p>
              <div className="alert alert-danger mb-0">
                <strong>Usuario:</strong> {selectedUser.names} {selectedUser.lastname} ({selectedUser.username})
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
}