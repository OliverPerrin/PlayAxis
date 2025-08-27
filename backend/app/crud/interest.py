from app.models.user import User
from app.models.interest import Interest
from sqlalchemy.orm import Session

def get_interest_by_name(db: Session, name: str):
    return db.query(Interest).filter(Interest.name == name).first()

def create_interest(db: Session, interest: Interest):
    db.add(interest)
    db.commit()
    db.refresh(interest)
    return interest