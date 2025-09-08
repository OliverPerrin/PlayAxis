from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.crud.user import get_user_by_email
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, email=user_id)
    if user is None:
        raise credentials_exception
    return user

def get_optional_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
) -> User | None:
    """Return authenticated user if a valid Bearer token is provided; otherwise None.
    Does not raise 401 in absence of credentials, enabling public endpoints to behave gracefully.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None
    user = get_user_by_email(db, email=user_id)
    return user