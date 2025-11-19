'use client';

import { useEffect } from 'react';
import SessionErrorProvider from '../../../components/providers/SessionErrorProvider';

export default function DashboardLayout({ children }) {
  return (
    <SessionErrorProvider>
      {children}
    </SessionErrorProvider>
  );
}
