from sqlalchemy.orm import Session
from app.models.interest import Interest
from app.schemas.interest import InterestCreate

def get_interest_by_name(db: Session, name: str):
    return db.query(Interest).filter(Interest.name == name).first()

def create_interest(db: Session, interest: InterestCreate):
    db_interest = Interest(name=interest.name)
    db.add(db_interest)
    db.commit()
    db.refresh(db_interest)
    return db_interest

def get_or_create_interest(db: Session, name: str):
    """Get an existing interest or create a new one"""
    interest = get_interest_by_name(db, name)
    if not interest:
        interest_create = InterestCreate(name=name)
        interest = create_interest(db, interest_create)
    return interest