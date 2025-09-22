from dotenv import load_dotenv
import os

load_dotenv()

database_url = os.getenv("DATABASE_URL")
pass_admin = os.getenv("PASS_ADMIN")

secret_key = os.getenv("SECRET_KEY")
if os.getenv("HASH_ALGORITHM"):
    hash_algorithm = os.getenv("HASH_ALGORITHM")
else: 
    hash_algorithm = "H256"
if os.getenv("TOKEN_EXPIRATION_MINUTES"):
    token_expires_minutes = int(os.getenv("TOKEN_EXPIRATION_MINUTES"))
else:
    token_expires_minutes = 60

