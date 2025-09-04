from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

RAW_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Normalize Heroku-style scheme: postgres:// -> postgresql://
if RAW_URL.startswith("postgres://"):
    RAW_URL = RAW_URL.replace("postgres://", "postgresql://", 1)

# Optional: explicitly use psycopg3 driver
# if RAW_URL.startswith("postgresql://"):
#     RAW_URL = RAW_URL.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if RAW_URL.startswith("sqlite") else {}

engine = create_engine(RAW_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()