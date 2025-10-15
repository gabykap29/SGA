from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_pass(passwd: str) -> str:
    # bcrypt tiene un límite de 72 bytes, truncamos si es necesario
    if len(passwd.encode('utf-8')) > 72:
        passwd = passwd[:72]
    return pwd_context.hash(passwd)