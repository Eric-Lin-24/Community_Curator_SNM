from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate
import os
import base64

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """Verifies the password against the given hash and salt."""
    return pwd_context.verify(f"{plain_password}{salt}", hashed_password)

def get_password_hash(password: str, salt: str) -> str:
    """Hashes the password with the given salt."""
    return pwd_context.hash(f"{password}{salt}")

def create_user(db: Session, user: UserCreate) -> User:
    salt = base64.b64encode(os.urandom(16)).decode('utf-8')
    hashed_password = get_password_hash(user.password, salt)
    db_user = User(username=user.username, hashed_password=hashed_password, salt=salt)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
