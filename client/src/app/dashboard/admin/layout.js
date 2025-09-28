import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminLayout({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}