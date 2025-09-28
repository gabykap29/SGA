import json
import datetime
import uuid
from decimal import Decimal
from typing import Any
from fastapi.responses import JSONResponse
from sqlalchemy.ext.declarative import DeclarativeMeta

class CustomJSONEncoder(json.JSONEncoder):
    """Encoder JSON personalizado para manejar tipos Python comunes que no son serializables por defecto."""
    
    def default(self, o: Any) -> Any:
        """Convierte objetos especiales a tipos serializables."""
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        elif isinstance(o, uuid.UUID):
            return str(o)
        elif isinstance(o, Decimal):
            return float(o)
        elif hasattr(o, '__dict__'):
            # Para objetos SQLAlchemy
            if isinstance(o.__class__, DeclarativeMeta):
                return self._sqlalchemy_to_dict(o)
            # Para otros objetos personalizados
            return self._serialize_obj(o)
        return super().default(o)
    
    def _serialize_obj(self, o: Any) -> dict:
        """Serializa un objeto basado en su __dict__."""
        result = {}
        for key, value in o.__dict__.items():
            # Ignorar atributos privados o protegidos
            if key.startswith('_'):
                continue
                
            # Manejar tipos especiales
            if isinstance(value, (datetime.date, datetime.datetime)):
                result[key] = value.isoformat()
            elif isinstance(value, uuid.UUID):
                result[key] = str(value)
            elif isinstance(value, Decimal):
                result[key] = float(value)
            else:
                result[key] = value
                
        return result
    
    def _sqlalchemy_to_dict(self, obj):
        """Convierte un objeto SQLAlchemy a diccionario."""
        data = {}
        for column in obj.__table__.columns:
            value = getattr(obj, column.name)
            # Ya estamos manejando la conversión en el método default
            data[column.name] = value
        return data

def json_dumps(obj: Any) -> str:
    """Función helper para serializar objetos a JSON usando el encoder personalizado."""
    return json.dumps(obj, cls=CustomJSONEncoder)

class CustomJSONResponse(JSONResponse):
    """Respuesta JSON personalizada que utiliza nuestro CustomJSONEncoder."""
    
    def render(self, content: Any) -> bytes:
        """Renderiza el contenido usando nuestro serializador personalizado."""
        return json_dumps(content).encode("utf-8")