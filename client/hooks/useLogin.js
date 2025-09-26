// hooks/useLogin.js
/**
 * Hook personalizado para manejar la lógica del login
 * Separación de responsabilidades: lógica de estado y UI
 */

import { useState } from 'react';
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
  
  const router = useRouter();

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
        toast.success('¡Bienvenido al sistema!', {
          position: "top-right",
          autoClose: 2000,
        });
        setTimeout(() => {
          router.push('/dashboard');
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
    
    // Acciones
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    clearForm,
    
    // Utilidades
    isFormValid: formData.username.trim() && formData.password.trim()
  };
};