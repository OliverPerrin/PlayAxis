
from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

user_interest = Table(
    'user_interest',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('interest_id', Integer, ForeignKey('interests.id'))
)

class Interest(Base):
    __tablename__ = 'interests'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    users = relationship("User", secondary=user_interest, back_populates="interests")
