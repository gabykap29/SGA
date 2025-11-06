// hooks/useLogin.js
/**
 * Hook personalizado para manejar la lógica del login
 * Separación de responsabilidades: lógica de estado y UI
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';

export const useLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isView, setIsView] = useState(false);
  
  const router = useRouter();
  
  // Verificar si hay un usuario logueado al cargar el componente
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          
          // Verificar si el usuario tiene rol de admin - múltiples comprobaciones para ser robustos
          const isUserAdmin = 
            // Si role_name está directamente en userData
            (userData.role_name && userData.role_name.toUpperCase() === 'ADMIN') ||
            // Si role contiene role_name
            (userData.role && userData.role.role_name && userData.role.role_name.toUpperCase() === 'ADMIN') ||
            // Si role_id está directamente o dentro de role
            userData.role_id === 1 || 
            (userData.role && userData.role.role_id === 1);
          
          // Verificar si el usuario tiene rol VIEW
          const isUserView = 
            // Si role_name está directamente en userData
            (userData.role_name && userData.role_name.toUpperCase() === 'VIEW') ||
            // Si role contiene role_name
            (userData.role && userData.role.role_name && userData.role.role_name.toUpperCase() === 'VIEW');
          
          // Verificar si el usuario tiene rol USER
          const isRoleUser = 
            // Si role_name está directamente en userData
            (userData.role_name && (userData.role_name.toUpperCase() === 'USER' || userData.role_name.toUpperCase() === 'USERS')) ||
            // Si role contiene role_name
            (userData.role && userData.role.role_name && (userData.role.role_name.toUpperCase() === 'USER' || userData.role.role_name.toUpperCase() === 'USERS'));

          setIsUser(isRoleUser);
          setIsAdmin(isUserAdmin);
          setIsView(isUserView);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      }
    };
    
    checkUserSession();
  }, []);

  /**
   * Maneja los cambios en los inputs del formulario
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  /**
   * Alterna la visibilidad de la contraseña
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  /**
   * Valida los datos del formulario
   */
  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido');
      return false;
    }

    if (!formData.password.trim()) {
      setError('La contraseña es requerida');
      return false;
    }

    return true;
  };

  /**
   * Maneja el envío del formulario de login
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(
        formData.username,
        formData.password,
        formData.rememberMe
      );

      if (result.success) {
        // Login exitoso - mostrar toast y redirigir al dashboard
        setUser(result.user);
        
        // Verificar si el usuario tiene rol de admin - múltiples comprobaciones para ser robustos
        const isUserAdmin = 
          // Si role_name está directamente en result.user
          (result.user?.role_name && result.user.role_name.toUpperCase() === 'ADMIN') ||
          // Si role contiene role_name
          (result.user?.role?.role_name && result.user.role.role_name.toUpperCase() === 'ADMIN') ||
          // Si role_id está directamente o dentro de role
          result.user?.role_id === 1 || 
          (result.user?.role && result.user.role.role_id === 1);
          
        // Verificar si el usuario tiene rol VIEW
        const isUserView = 
          // Si role_name está directamente en result.user
          (result.user?.role_name && result.user.role_name.toUpperCase() === 'VIEW') ||
          // Si role contiene role_name
          (result.user?.role?.role_name && result.user.role.role_name.toUpperCase() === 'VIEW');
        
        

        setIsAdmin(isUserAdmin);
        setIsView(isUserView);
        
        toast.success('¡Bienvenido al sistema!', {
          position: "top-right",
          autoClose: 2000,
        });
        setTimeout(() => {
          // Si es usuario VIEW, redirigir a la vista especial
          if (isUserView) {
            router.push('/dashboard/view');
          } else {
            router.push('/dashboard');
          }
        }, 500);
      } else {
        // Mostrar error del servidor
        setError(result.error);
        
        toast.error(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error inesperado. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpia el formulario
   */
  const clearForm = () => {
    setFormData({
      username: '',
      password: '',
      rememberMe: false
    });
    setError('');
    setShowPassword(false);
  };

  return {
    // Estado
    formData,
    isLoading,
    error,
    showPassword,
    user,
    isAdmin,
    isView,
    isUser,
    
    // Acciones
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    clearForm,
    
    // Utilidades
    isFormValid: formData.username.trim() && formData.password.trim()
  };
};