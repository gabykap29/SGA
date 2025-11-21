import io
from typing import BinaryIO
from PIL import Image


def resize_image_stream(file_stream: BinaryIO, mime_type: str) -> BinaryIO:
    """
    Redimensiona una imagen a un máximo de 800x800 manteniendo el aspect ratio.
    Recibe un stream y retorna un nuevo stream con la imagen redimensionada.
    """
    # Leer la imagen desde el stream
    img = Image.open(file_stream)

    # Convertir a RGB si es necesario (para guardar como JPEG si fuera el caso,
    # aunque aquí intentaremos mantener el formato original si es posible o compatible)
    if img.mode in ("RGBA", "P") and mime_type == "image/jpeg":
        img = img.convert("RGB")

    # Redimensionar manteniendo aspect ratio
    # thumbnail modifica la imagen in-place
    img.thumbnail((800, 800))

    # Guardar en un nuevo buffer
    output_buffer = io.BytesIO()

    # Determinar formato de guardado basado en el mime_type
    format_map = {
        "image/jpeg": "JPEG",
        "image/png": "PNG",
        "image/gif": "GIF",
        "image/bmp": "BMP",
        "image/webp": "WEBP",
    }
    save_format = format_map.get(mime_type, "JPEG")  # Default a JPEG si no se reconoce

    img.save(output_buffer, format=save_format, optimize=True)

    # Resetear el puntero del buffer al inicio
    output_buffer.seek(0)

    return output_buffer
