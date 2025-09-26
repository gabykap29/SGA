#!/usr/bin/env python3

import sys
import os
sys.path.append('/home/gabrielacosta/Escritorio/SGA/server')

from models.schemas.person_schemas import PersonResponse, UserResponse
from uuid import uuid4
from datetime import datetime, timezone

# Crear datos de prueba
test_data = {
    'person_id': uuid4(),
    'identification': '12345678',
    'identification_type': 'DNI',
    'names': 'Juan',
    'lastnames': 'Pérez',
    'address': 'Calle 123',
    'province': 'Buenos Aires',
    'country': 'Argentina',
    'created_at': datetime.now(timezone.utc),
    'updated_at': datetime.now(timezone.utc),
    'created_by': uuid4(),
    'users': {
        'id': uuid4(),
        'username': 'admin'
    },
    'record_relationships': [],
    'files': []
}

try:
    # Probar la creación del modelo
    person_response = PersonResponse(**test_data)
    print("✅ Modelo creado exitosamente")
    
    # Probar la serialización
    serialized = person_response.model_dump(mode='json')
    print("✅ Serialización exitosa")
    print(f"Datos serializados: {serialized}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()