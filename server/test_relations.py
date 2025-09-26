#!/usr/bin/env python3
"""
Script para verificar las relaciones entre personas y registros
"""
import sys
import os

# Agregar el directorio del servidor al path para importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db import get_db
from models.Recortds_Persons import RecordsPersons
from models.Persons import Persons
from models.Record import Records
from sqlalchemy.orm import joinedload
import uuid

def test_person_relations():
    db = next(get_db())
    try:
        # Verificar si hay relaciones en la tabla
        relations = db.query(RecordsPersons).all()
        print(f'Total relaciones en RecordsPersons: {len(relations)}')
        
        if relations:
            for rel in relations:
                print(f'  - Relación ID: {rel.id}')
                print(f'    Person ID: {rel.person_id}')
                print(f'    Record ID: {rel.record_id}')
                print(f'    Tipo: {rel.type_relationship}')
                print('---')

        # Verificar la persona específica
        person_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
        try:
            person_uuid = uuid.UUID(person_id)
            
            # Consulta con joinedload (como en el servicio)
            person = db.query(Persons).options(
                joinedload(Persons.users),
                joinedload(Persons.record_relationships).joinedload(RecordsPersons.record)
            ).filter(Persons.person_id == person_uuid).first()
            
            if person:
                print(f'\nPersona encontrada: {person.names} {person.lastnames}')
                print(f'Relaciones de records: {len(person.record_relationships)}')
                
                for rel in person.record_relationships:
                    print(f'  - Relación tipo: {rel.type_relationship}')
                    print(f'    Record título: {rel.record.title}')
                    print('  ---')
            else:
                print(f'\nNo se encontró la persona con ID: {person_id}')
                
        except Exception as e:
            print(f'Error al buscar persona: {e}')
            
    except Exception as e:
        print(f'Error general: {e}')
    finally:
        db.close()

if __name__ == "__main__":
    test_person_relations()