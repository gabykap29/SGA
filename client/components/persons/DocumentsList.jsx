'use client';

import { useState } from 'react';
import { Table, Card, Button, Badge, Alert } from 'react-bootstrap';
import {
  FiFile,
  FiDownload,
  FiEye,
  FiTrash2,
  FiFileText,
  FiFilePlus,
  FiCalendar
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import AddDocumentModal from './AddDocumentModal';
import personService from '../../services/personService';

const DocumentsList = ({ documents = [], personId, onUpdate }) => {
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  console.log('DocumentsList - Documentos recibidos:', documents);

  // Filtrar documentos que no tienen propiedades necesarias
  const validDocuments = Array.isArray(documents) ? documents.filter(doc => {
    if (!doc || typeof doc !== 'object') return false;
    // Verificar que tenga un ID de archivo válido
    return doc.file_id && doc.file_id.trim() !== '';
  }) : [];

  console.log('DocumentsList - Documentos válidos:', validDocuments.length);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getFileIcon = (filename, mimeType, fileType) => {
    // Determinar el tipo de archivo por extensión o mime type
    const extension = filename?.split('.').pop()?.toLowerCase();

    // Si no hay suficiente información para determinar el tipo
    if (!filename && !mimeType && !fileType) {
      return { icon: FiFile, color: 'secondary', type: 'Documento' };
    }

    if (fileType === 'pdf' || mimeType?.includes('pdf') || extension === 'pdf') {
      return { icon: FiFile, color: 'danger', type: 'PDF' };
    }
    if (mimeType?.includes('word') || ['doc', 'docx'].includes(extension)) {
      return { icon: FiFileText, color: 'primary', type: 'Word' };
    }
    if (mimeType?.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
      return { icon: FiFileText, color: 'success', type: 'Excel' };
    }
    if (mimeType?.includes('powerpoint') || ['ppt', 'pptx'].includes(extension)) {
      return { icon: FiFileText, color: 'warning', type: 'PowerPoint' };
    }
    if (mimeType?.includes('text') || extension === 'txt') {
      return { icon: FiFileText, color: 'secondary', type: 'Texto' };
    }

    return { icon: FiFile, color: 'dark', type: 'Archivo' };
  };

  const downloadDocument = async (doc) => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseURL}/files/${doc.file_id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = doc.original_filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Descarga iniciada');
      } else {
        throw new Error('Error al descargar');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar el documento');
    }
  };

  const viewDocument = async (doc) => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        return;
      }

      const response = await fetch(`${baseURL}/files/${doc.file_id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Limpiar el URL después de un tiempo para liberar memoria
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        if (response.status === 401 || response.status === 403) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.detail || 'Error al acceder al documento');
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Error al abrir el documento');
    }
  };

  const deleteDocument = async (doc) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el documento "${doc.original_filename || 'sin nombre'}"?`)) {
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${baseURL}/files/${doc.file_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          toast.success('Documento eliminado correctamente');
          onUpdate?.();
        } else {
          throw new Error('Error al eliminar el documento');
        }
      } catch (error) {
        console.error('Error eliminando documento:', error);
        toast.error('Error al eliminar el documento');
      }
    }
  };

  const handleAddDocument = async ({ file, description }) => {
    try {
      setUploading(true);
      const result = await personService.uploadFiles(personId, [{ file, description }]);

      if (result.success) {
        toast.success('Documento subido exitosamente');
        setShowAddDocumentModal(false);
        onUpdate?.(); // Actualizar la lista de documentos
      } else {
        toast.error(result.error || 'Error al subir el documento');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error inesperado al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  if (validDocuments.length === 0) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', padding: '0' }}>
        <div className="text-center py-5 mx-3" style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <div
            className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
              color: 'white'
            }}
          >
            <FiFileText size={36} />
          </div>
          <h5 className="fw-bold text-dark mb-2">No hay documentos</h5>
          <p className="text-muted mb-4">Esta persona no tiene documentos adjuntos.</p>
          <Button
            variant="dark"
            onClick={() => setShowAddDocumentModal(true)}
            className="px-4 py-2 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            <FiFilePlus className="me-2" />
            Subir primer documento
          </Button>
        </div>

        {/* Modal para añadir documento cuando no hay documentos */}
        <AddDocumentModal
          show={showAddDocumentModal}
          onHide={() => setShowAddDocumentModal(false)}
          onUpload={handleAddDocument}
          isLoading={uploading}
        />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '0' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3">
        <div>
          <h4 className="mb-1 fw-bold text-dark">Documentos Adjuntos ({validDocuments.length})</h4>
          <small className="text-muted">Archivos y documentos digitales</small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Badge
            bg="dark"
            pill
            className="px-3 py-2 shadow-sm"
            style={{ fontSize: '0.9rem' }}
          >
            {validDocuments.length}
          </Badge>
          <Button
            variant="dark"
            size="sm"
            className="px-3 py-2 shadow-sm"
            onClick={() => setShowAddDocumentModal(true)}
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            <FiFilePlus className="me-2" size={16} />
            Subir documento
          </Button>
        </div>
      </div>

      {/* Lista de documentos */}
      <Card className="mx-3" style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead style={{
              backgroundColor: '#f8f9fa'
            }}>
              <tr>
                <th className="fw-bold py-3 text-dark">Documento</th>
                <th className="fw-bold py-3 text-dark">Tipo</th>
                <th className="fw-bold py-3 text-dark">Tamaño</th>
                <th className="fw-bold py-3 text-dark">
                  <FiCalendar className="me-1" size={14} />
                  Fecha
                </th>
                <th className="fw-bold py-3 text-dark">Descripción</th>
                <th className="fw-bold py-3 text-center text-dark">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {validDocuments.map((document, index) => {
                const fileInfo = getFileIcon(
                  document.original_filename || 'unknown',
                  document.mimetype || document.mime_type,
                  document.file_type
                );
                const IconComponent = fileInfo.icon;

                return (
                  <tr key={document.file_id || index}>
                    <td className="py-3">
                      <div className="d-flex align-items-center">
                        <div
                          className={`rounded d-flex align-items-center justify-content-center me-3 text-white bg-${fileInfo.color}`}
                          style={{ width: '40px', height: '40px' }}
                        >
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <div className="fw-semibold mb-1">
                            {document.original_filename || document.name || 'Archivo sin nombre'}
                          </div>
                          <small className="text-muted">
                            ID: {document.file_id ? document.file_id.slice(0, 8) + '...' : 'N/A'}
                            {document.file_size ? ` • ${formatFileSize(document.file_size)}` : ''}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge bg={fileInfo.color} className="text-white">
                        {fileInfo.type}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className="font-monospace small">
                        {document.file_size ? formatFileSize(document.file_size) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-muted small">
                        {formatDate(document.created_at)}
                      </span>
                    </td>
                    <td className="py-3">
                      {document.description ? (
                        <div className="small" style={{ maxWidth: '200px' }}>
                          <span className="text-truncate d-block" title={document.description}>
                            {document.description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted small">Sin descripción</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <Button
                          variant="dark"
                          size="sm"
                          title="Ver documento"
                          onClick={() => document.file_id ? viewDocument(document) : toast.warning('No se puede visualizar: ID de archivo no válido')}
                          className="shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            border: 'none',
                            borderRadius: '6px'
                          }}
                        >
                          <FiEye size={14} />
                        </Button>
                        <Button
                          variant="dark"
                          size="sm"
                          title="Descargar"
                          onClick={() => document.file_id ? downloadDocument(document) : toast.warning('No se puede descargar: ID de archivo no válido')}
                          className="shadow-sm"
                          style={{
                            backgroundColor: '#212529',
                            border: '1px solid #000',
                            borderRadius: '4px',
                            color: 'white'
                          }}
                        >
                          <FiDownload size={14} />
                        </Button>
                        <Button
                          variant="dark"
                          size="sm"
                          title="Eliminar"
                          onClick={() => document.file_id ? deleteDocument(document) : toast.warning('No se puede eliminar: ID de archivo no válido')}
                          className="shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            border: 'none',
                            borderRadius: '6px'
                          }}
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Resumen */}
      <div className="mt-4">
        <Card className="border-0 shadow-sm" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <Card.Body className="p-4">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="p-3 rounded shadow-sm" style={{
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                }}>
                  <div className="fw-bold text-primary fs-3">
                    {validDocuments.length}
                  </div>
                  <small className="text-dark fw-semibold">Total de documentos</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded shadow-sm" style={{
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
                }}>
                  <div className="fw-bold text-success fs-3">
                    {formatFileSize(documents.reduce((total, doc) => total + (doc.file_size || 0), 0))}
                  </div>
                  <small className="text-dark fw-semibold">Tamaño total</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded shadow-sm" style={{
                  background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc82 100%)'
                }}>
                  <div className="fw-bold text-warning fs-3">
                    {documents.filter(doc => doc.file_type === 'pdf' || doc.mime_type?.includes('pdf')).length}
                  </div>
                  <small className="text-dark fw-semibold">Archivos PDF</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded shadow-sm" style={{
                  background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)'
                }}>
                  <div className="fw-bold fs-3" style={{ color: '#6a1b9a' }}>
                    {documents.filter(doc => doc.description && doc.description.trim()).length}
                  </div>
                  <small className="text-dark fw-semibold">Con descripción</small>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Modal para añadir documento */}
      <AddDocumentModal
        show={showAddDocumentModal}
        onHide={() => setShowAddDocumentModal(false)}
        onUpload={handleAddDocument}
        isLoading={uploading}
      />
    </div>
  );
};

export default DocumentsList;