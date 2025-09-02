from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated = "auto")

def hash_pass(passwd: str) -> str:
    return pwd_context.hash(passwd)