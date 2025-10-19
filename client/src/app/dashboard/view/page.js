'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ViewLayout from '../../../../components/layout/ViewLayout';
import { useLogin } from '../../../../hooks/useLogin';

export default function ViewPage() {
  const router = useRouter();
  const { isView, user } = useLogin();

  // Comprobar autenticación y rol
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Si no es usuario VIEW, redirigir al dashboard normal
    if (user && !isView) {
      router.push('/dashboard');
    }
  }, [router, isView, user]);

  return <ViewLayout />;
}