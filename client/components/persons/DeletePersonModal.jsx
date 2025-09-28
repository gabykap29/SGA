'use client';

import { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

const DeletePersonModal = ({ show, onHide, onConfirm, loading }) => {
  return (
    <Modal show={show} onHide={loading ? null : onHide} centered backdrop="static">
      <Modal.Header closeButton={!loading}>
        <Modal.Title className="text-danger d-flex align-items-center">
          <FiAlertTriangle className="me-2" /> Eliminar Persona
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="text-center mb-4">
          <div 
            className="mx-auto mb-4 text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '80px', height: '80px' }}
          >
            <FiTrash2 size={40} />
          </div>
          <h5 className="mb-3">¿Está seguro que desea eliminar esta persona?</h5>
          <p className="text-muted mb-0">
            Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a esta persona.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={onHide} 
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Eliminando...
            </>
          ) : (
            <>Eliminar Definitivamente</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeletePersonModal;