import os
import secrets
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from typing import Tuple, BinaryIO
import uuid

class FileEncryption:
    """
    Clase para manejar la encriptación y desencriptación de archivos
    """
    
    @staticmethod
    def generate_salt() -> str:
        """Genera un salt aleatorio para la encriptación"""
        return secrets.token_hex(32)
    
    @staticmethod
    def generate_key_from_password(password: str, salt: str) -> bytes:
        """
        Genera una clave de encriptación derivada de una contraseña y salt
        """
        salt_bytes = salt.encode('utf-8')
        password_bytes = password.encode('utf-8')
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt_bytes,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
        return key
    
    @staticmethod
    def generate_master_key() -> str:
        """
        Genera una clave maestra para la encriptación
        En producción, esta debería venir de variables de entorno o un servicio seguro
        """
        # En producción, usar una clave fija desde variables de entorno
        return os.getenv('FILE_ENCRYPTION_KEY', 'SGA_DEFAULT_MASTER_KEY_2025')
    
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """
        Genera un nombre único para el archivo en el sistema de archivos
        """
        file_extension = os.path.splitext(original_filename)[1]
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{file_extension}.enc"
    
    @staticmethod
    def encrypt_file(file_data: bytes, original_filename: str) -> Tuple[bytes, str, str, str]:
        """
        Encripta un archivo y retorna los datos encriptados junto con metadatos
        
        Returns:
            Tuple[bytes, str, str, str]: (datos_encriptados, filename_encriptado, salt, hash_clave)
        """
        # Generar salt único para este archivo
        salt = FileEncryption.generate_salt()
        
        # Generar clave de encriptación
        master_key = FileEncryption.generate_master_key()
        encryption_key = FileEncryption.generate_key_from_password(master_key, salt)
        
        # Crear cipher
        fernet = Fernet(encryption_key)
        
        # Encriptar datos
        encrypted_data = fernet.encrypt(file_data)
        
        # Generar nombre único para el archivo encriptado
        encrypted_filename = FileEncryption.generate_unique_filename(original_filename)
        
        # Generar hash de la clave para almacenar (sin revelar la clave real)
        key_hash = hashlib.sha256(encryption_key).hexdigest()
        
        return encrypted_data, encrypted_filename, salt, key_hash
    
    @staticmethod
    def decrypt_file(encrypted_data: bytes, salt: str, key_hash: str) -> bytes:
        """
        Desencripta un archivo usando el salt y verificando el hash de la clave
        
        Args:
            encrypted_data: Datos encriptados del archivo
            salt: Salt usado en la encriptación
            key_hash: Hash de la clave para verificación
            
        Returns:
            bytes: Datos desencriptados del archivo
            
        Raises:
            ValueError: Si la clave no coincide o hay error en desencriptación
        """
        try:
            # Regenerar la clave usando el salt
            master_key = FileEncryption.generate_master_key()
            encryption_key = FileEncryption.generate_key_from_password(master_key, salt)
            
            # Verificar que la clave sea correcta comparando hashes
            generated_key_hash = hashlib.sha256(encryption_key).hexdigest()
            if generated_key_hash != key_hash:
                raise ValueError("Clave de encriptación inválida")
            
            # Crear cipher y desencriptar
            fernet = Fernet(encryption_key)
            decrypted_data = fernet.decrypt(encrypted_data)
            
            return decrypted_data
            
        except Exception as e:
            raise ValueError(f"Error al desencriptar archivo: {str(e)}")
    
    @staticmethod
    def encrypt_file_stream(input_stream: BinaryIO, output_path: str, original_filename: str) -> Tuple[str, str, str]:
        """
        Encripta un archivo desde un stream y lo guarda en el sistema de archivos
        
        Returns:
            Tuple[str, str, str]: (filename_encriptado, salt, hash_clave)
        """
        # Leer datos del stream
        file_data = input_stream.read()
        
        # Encriptar
        encrypted_data, encrypted_filename, salt, key_hash = FileEncryption.encrypt_file(
            file_data, original_filename
        )
        
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Escribir archivo encriptado
        full_path = os.path.join(output_path, encrypted_filename)
        with open(full_path, 'wb') as f:
            f.write(encrypted_data)
        
        return encrypted_filename, salt, key_hash
    
    @staticmethod
    def decrypt_file_from_disk(file_path: str, salt: str, key_hash: str) -> bytes:
        """
        Desencripta un archivo desde el disco
        
        Args:
            file_path: Ruta completa al archivo encriptado
            salt: Salt usado en la encriptación
            key_hash: Hash de la clave para verificación
            
        Returns:
            bytes: Datos desencriptados del archivo
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo encriptado no encontrado: {file_path}")
        
        # Leer archivo encriptado
        with open(file_path, 'rb') as f:
            encrypted_data = f.read()
        
        # Desencriptar y retornar
        return FileEncryption.decrypt_file(encrypted_data, salt, key_hash)

# Funciones de utilidad para validar tipos de archivo
class FileValidator:
    """
    Validador de tipos de archivo permitidos
    """
    
    ALLOWED_MIME_TYPES = {
        'pdf': ['application/pdf'],
        'image': [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/bmp',
            'image/webp'
        ]
    }
    
    ALLOWED_EXTENSIONS = {
        'pdf': ['.pdf'],
        'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    }
    
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    @staticmethod
    def validate_file_type(filename: str, mime_type: str) -> str:
        """
        Valida el tipo de archivo y retorna la categoría
        
        Returns:
            str: 'pdf' o 'image'
            
        Raises:
            ValueError: Si el tipo de archivo no es válido
        """
        file_extension = os.path.splitext(filename.lower())[1]
        
        # Validar por extensión
        for file_type, extensions in FileValidator.ALLOWED_EXTENSIONS.items():
            if file_extension in extensions:
                # Validar también el MIME type
                if mime_type in FileValidator.ALLOWED_MIME_TYPES[file_type]:
                    return file_type
        
        raise ValueError(f"Tipo de archivo no permitido: {filename} ({mime_type})")
    
    @staticmethod
    def validate_file_size(file_size: int) -> bool:
        """
        Valida que el tamaño del archivo no exceda el límite
        
        Returns:
            bool: True si el tamaño es válido
            
        Raises:
            ValueError: Si el archivo es demasiado grande
        """
        if file_size > FileValidator.MAX_FILE_SIZE:
            max_size_mb = FileValidator.MAX_FILE_SIZE / (1024 * 1024)
            raise ValueError(f"Archivo demasiado grande. Máximo permitido: {max_size_mb}MB")
        
        return True