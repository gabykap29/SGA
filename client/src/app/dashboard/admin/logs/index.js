import React from 'react';
import dynamic from 'next/dynamic';

// Importar el componente que incluye los estilos
const LogsPageWithStyles = dynamic(() => import('./page-with-styles'), {
  ssr: false,
});

export default function LogsPage() {
  return <LogsPageWithStyles />;
}