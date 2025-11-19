'use client';

import { useState, useRef } from 'react';
import { Card, Row, Col, Button, Badge, ListGroup, Alert, Form } from 'react-bootstrap';
import { 
  FiUpload, 
  FiFile, 
  FiImage, 
  FiTrash2, 
  FiDownload, 
  FiEye,
  FiPaperclip,
  FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const FileManager = ({ personId, files = [], onFilesUpload, onFileDelete, loading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const allowedTypes = {
    'image/jpeg': { ext: 'jpg', icon: FiImage, color: 'success' },
    'image/png': { ext: 'png', icon: FiImage, color: 'success' },
    'image/gif': { ext: 'gif', icon: FiImage, color: 'success' },
    'application/pdf': { ext: 'pdf', icon: FiFile, color: 'danger' },
    'application/msword': { ext: 'doc', icon: FiFile, color: 'primary' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', icon: FiFile, color: 'primary' },
    'text/plain': { ext: 'txt', icon: FiFile, color: 'secondary' }
  };

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    if (!allowedTypes[file.type]) {
      return `Tipo de archivo no permitido: ${file.type}`;
    }
    
    if (file.size > maxFileSize) {
      return `El archivo es demasiado grande. Máximo: ${maxFileSize / (1024 * 1024)}MB`;
    }
    
    return null;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (fileList) => {
    const validFiles = [];
    const errors = [];

    fileList.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          description: '', // Campo de descripción inicializado vacío
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        });
      }
    });

    if (errors.length > 0) {
      toast.error(`Errores en archivos:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const updateFileDescription = (fileId, description) => {
    setSelectedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, description }
          : file
      )
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.warning('Seleccione archivos para subir');
      return;
    }

    if (!personId) {
      toast.error('Debe crear la persona primero');
      return;
    }

    // Crear un array de objetos con archivo y descripción
    const filesToUpload = selectedFiles.map(f => ({
      file: f.file,
      description: f.description || ''
    }));
    
    await onFilesUpload(filesToUpload);
    
    // Limpiar archivos seleccionados después de subir
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    return allowedTypes[type]?.icon || FiFile;
  };

  const getFileColor = (type) => {
    return allowedTypes[type]?.color || 'secondary';
  };

  // Obtener token de autenticación
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Headers con autenticación
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  // Función para verificar autenticación
  const checkAuth = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      return false;
    }
    return true;
  };

  // Función para ver archivo
  const handleViewFile = async (file) => {
    if (!checkAuth()) return;
    
    // Validar que el archivo tiene un file_id válido (no es un archivo local sin subir)
    const fileId = file.file_id || file.id;
    
    // Si no tiene file_id ni id, o el id no es un UUID (tiene caracteres de timestamp)
    if (!fileId || (!file.file_id && typeof fileId === 'number')) {
      toast.error('El archivo aún no ha sido subido al servidor. Por favor, suba los archivos primero.');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/${fileId}/download`, {
        method: 'GET',
        headers: getAuthHeaders()
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
          toast.error(errorData.detail || 'Error al acceder al archivo');
        }
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error('Error al acceder al archivo');
    }
  };

  // Función para descargar archivo
  const handleDownloadFile = async (file) => {
    if (!checkAuth()) return;
    
    // Validar que el archivo tiene un file_id válido
    if (!file.file_id) {
      toast.error('El archivo aún no ha sido subido al servidor. Por favor, suba los archivos primero.');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/${file.file_id}/download`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_filename || file.filename || 'archivo';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Archivo descargado exitosamente');
      } else {
        if (response.status === 401 || response.status === 403) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.detail || 'Error al descargar el archivo');
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  // Función para eliminar archivo
  const handleDeleteFile = async (file) => {
    if (!checkAuth()) return;
    
    // Validar que el archivo tiene un file_id válido
    if (!file.file_id) {
      toast.error('El archivo aún no ha sido subido al servidor. Por favor, suba los archivos primero.');
      return;
    }
    
    if (window.confirm('¿Está seguro de que desea eliminar este archivo?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/${file.file_id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          toast.success('Archivo eliminado exitosamente');
          // Llamar callback para actualizar la lista
          if (onFileDelete) {
            onFileDelete(file.file_id);
          }
        } else {
          if (response.status === 401 || response.status === 403) {
            toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.detail || 'Error al eliminar el archivo');
          }
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Error al eliminar el archivo');
      }
    }
  };

  return (
    <div>
      {!personId && (
        <Alert variant="warning" className="mb-4">
          <strong>⚠️ Atención:</strong> Debe completar el paso anterior (crear persona) antes de subir archivos.
        </Alert>
      )}

      {/* Zona de arrastrar y soltar */}
      <Card 
        className={`mb-4 border-2 border-dashed ${dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Card.Body className="text-center py-5">
          <FiUpload size={48} className={`mb-3 ${dragActive ? 'text-primary' : 'text-muted'}`} />
          <h5 className="mb-2">Arrastra archivos aquí o haz clic para seleccionar</h5>
          <p className="text-muted mb-3">
            Tipos permitidos: JPG, PNG, GIF, PDF, DOC, DOCX, TXT
            <br />
            Tamaño máximo: 10MB por archivo
          </p>
          <Button 
            variant="outline-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={!personId}
          >
            <FiPaperclip className="me-2" />
            Seleccionar Archivos
          </Button>
          <Form.Control
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />
        </Card.Body>
      </Card>

      {/* Archivos seleccionados para subir */}
      {selectedFiles.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0 fw-bold">
              Archivos Seleccionados ({selectedFiles.length})
            </h6>
          </Card.Header>
          <Card.Body className="p-3">
            {selectedFiles.map((file) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div key={file.id} className="border rounded p-3 mb-3">
                  <div className="d-flex align-items-start mb-3">
                    <div className="d-flex align-items-center flex-grow-1">
                      <IconComponent 
                        size={20} 
                        className={`me-3 text-${getFileColor(file.type)}`} 
                      />
                      <div className="flex-grow-1">
                        <div className="fw-medium">{file.name}</div>
                        <small className="text-muted">
                          {formatFileSize(file.size)} • {allowedTypes[file.type]?.ext.toUpperCase()}
                        </small>
                      </div>
                      {file.preview && (
                        <img 
                          src={file.preview} 
                          alt="Preview" 
                          className="me-3 rounded"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <FiX size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Campo de descripción */}
                  <div>
                    <Form.Label className="small fw-medium text-muted mb-2">
                      Descripción del archivo (opcional)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Ej: Documento de identidad, Foto de perfil, Certificado médico..."
                      value={file.description}
                      onChange={(e) => updateFileDescription(file.id, e.target.value)}
                      className="form-control-sm"
                    />
                  </div>
                </div>
              );
            })}
            
            {/* Botones de acción - REPOSITIONADO ABAJO */}
            <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setSelectedFiles([])}
              >
                Cancelar
              </Button>
              <Button 
                variant="success" 
                size="sm" 
                onClick={handleUpload}
                disabled={loading || !personId}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <FiUpload className="me-2" />
                    Subir Archivos
                  </>
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Archivos ya subidos */}
      {files.length > 0 && (
        <Card>
          <Card.Header className="bg-white">
            <h6 className="mb-0 fw-bold">
              Archivos Subidos ({files.length})
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            <ListGroup variant="flush">
              {files.map((file, index) => {
                const IconComponent = getFileIcon(file.mime_type || file.type);
                return (
                  <ListGroup.Item key={file.id || index} className="py-3">
                    <div className="d-flex align-items-start">
                      <IconComponent 
                        size={20} 
                        className={`me-3 mt-1 text-${getFileColor(file.mime_type || file.type)}`} 
                      />
                      <div className="flex-grow-1">
                        <div className="fw-medium mb-1">{file.original_filename || file.filename || file.name}</div>
                        <small className="text-muted d-block mb-2">
                          {formatFileSize(file.file_size || file.size)} • Subido el {new Date(file.created_at || Date.now()).toLocaleDateString()}
                        </small>
                        {file.description && (
                          <div className="small text-muted bg-light p-2 rounded">
                            <strong>Descripción:</strong> {file.description}
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2 ms-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          title="Ver archivo"
                          onClick={() => handleViewFile(file)}
                        >
                          <FiEye size={14} />
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          title="Descargar"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <FiDownload size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Eliminar"
                          onClick={() => handleDeleteFile(file)}
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card.Body>
        </Card>
      )}

      {files.length === 0 && selectedFiles.length === 0 && personId && (
        <Alert variant="info" className="text-center">
          <FiFile size={48} className="mb-3 text-muted" />
          <h6>No hay archivos adjuntos</h6>
          <p className="mb-0">Los documentos e imágenes aparecerán aquí una vez que los subas.</p>
        </Alert>
      )}
    </div>
  );
};

export default FileManager;