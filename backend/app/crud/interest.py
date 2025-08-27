from sqlalchemy.orm import Session
from app import models

def get_interest_by_name(db: Session, name: str):
    return db.query(models.Interest).filter(models.Interest.name == name).first()

def create_interest(db: Session, interest: models.Interest):
    db.add(interest)
    db.commit()
    db.refresh(interest)
    return interest
