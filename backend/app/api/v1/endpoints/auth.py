from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserCreate, User
from app.schemas.token import Token
from app.crud.user import get_user_by_email, create_user
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/signup", response_model=User)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        db_user = get_user_by_email(db, email=user.email)
        if db_user:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered"
            )
        
        # Create new user
        new_user = create_user(db=db, user=user)
        logger.info(f"New user created: {user.email}")
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during signup"
        )

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        # Validate input
        if not form_data.username or not form_data.password:
            raise HTTPException(
                status_code=400,
                detail="Email and password are required"
            )
        
        # Get user from database
        user = get_user_by_email(db, email=form_data.username)
        if not user:
            logger.warning(f"Login attempt with non-existent email: {form_data.username}")
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {form_data.username}")
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="Account is inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token = create_access_token(subject=user.email)
        logger.info(f"Successful login for user: {user.email}")
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )

@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user