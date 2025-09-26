import os
from pathlib import Path

class FileStorageConfig:
    """
    Configuración para el almacenamiento de archivos
    """
    
    # Directorio base para almacenar archivos
    BASE_STORAGE_DIR = os.getenv('FILE_STORAGE_PATH', '/home/gabrielacosta/Escritorio/SGA/storage')
    
    # Subdirectorios por tipo de archivo
    STORAGE_SUBDIRS = {
        'pdf': 'documents',
        'image': 'images',
        'temp': 'temp'  # Para archivos temporales durante procesamiento
    }
    
    # Configuraciones de seguridad
    ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    # Configuración de encriptación
    ENCRYPTION_KEY_ENV = 'SGA_FILE_ENCRYPTION_KEY'
    
    @classmethod
    def get_storage_path(cls, file_type: str) -> str:
        """
        Obtiene la ruta de almacenamiento para un tipo de archivo específico
        """
        subdir = cls.STORAGE_SUBDIRS.get(file_type, 'others')
        return os.path.join(cls.BASE_STORAGE_DIR, subdir)
    
    @classmethod
    def ensure_storage_directories(cls):
        """
        Crea los directorios de almacenamiento si no existen
        """
        for file_type in cls.STORAGE_SUBDIRS.values():
            directory = os.path.join(cls.BASE_STORAGE_DIR, file_type)
            Path(directory).mkdir(parents=True, exist_ok=True)
            
            # Crear archivo .gitignore para excluir archivos de git
            gitignore_path = os.path.join(directory, '.gitignore')
            if not os.path.exists(gitignore_path):
                with open(gitignore_path, 'w') as f:
                    f.write('# Excluir todos los archivos encriptados\n')
                    f.write('*.enc\n')
                    f.write('*.tmp\n')
    
    @classmethod
    def get_full_file_path(cls, file_type: str, encrypted_filename: str) -> str:
        """
        Obtiene la ruta completa de un archivo
        """
        storage_path = cls.get_storage_path(file_type)
        return os.path.join(storage_path, encrypted_filename)
    
    @classmethod
    def cleanup_temp_files(cls, max_age_hours: int = 24):
        """
        Limpia archivos temporales antiguos
        """
        import time
        
        temp_dir = cls.get_storage_path('temp')
        if not os.path.exists(temp_dir):
            return
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                if file_age > max_age_seconds:
                    try:
                        os.remove(file_path)
                        print(f"Archivo temporal eliminado: {filename}")
                    except Exception as e:
                        print(f"Error al eliminar archivo temporal {filename}: {e}")


# Inicializar directorios al importar el módulo
FileStorageConfig.ensure_storage_directories()