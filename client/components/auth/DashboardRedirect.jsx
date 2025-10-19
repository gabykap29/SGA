'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../hooks/useLogin';

const DashboardRedirect = () => {
  const { isView } = useLogin();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Si el usuario tiene rol VIEW, redirigir a la vista especial
    if (isView) {
      router.push('/dashboard/view');
    } else {
      // Si no tiene rol VIEW, redirigir al dashboard normal
      router.push('/dashboard');
    }
  }, [router, isView]);

  return null;
};

export default DashboardRedirect;