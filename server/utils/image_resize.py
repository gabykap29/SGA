import io
from typing import BinaryIO
from PIL import Image


def resize_image_stream(file_stream: BinaryIO, mime_type: str) -> BinaryIO:
    """
    Redimensiona una imagen a un máximo de 800x800 manteniendo el aspect ratio.
    Recibe un stream y retorna un nuevo stream con la imagen redimensionada.
    """
    img = Image.open(file_stream)

    if img.mode in ("RGBA", "P") and mime_type == "image/jpeg":
        img = img.convert("RGB")

    img.thumbnail((800, 800))

    output_buffer = io.BytesIO()

    format_map = {
        "image/jpeg": "JPEG",
        "image/png": "PNG",
        "image/gif": "GIF",
        "image/bmp": "BMP",
        "image/webp": "WEBP",
    }
    save_format = format_map.get(mime_type, "JPEG")
    img.save(output_buffer, format=save_format, optimize=True)
    output_buffer.seek(0)

    return output_buffer
