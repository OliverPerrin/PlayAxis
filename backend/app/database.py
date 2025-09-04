from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Read URL from env (default to SQLite for local/dev)
RAW_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# 1) Normalize Heroku-style scheme: postgres:// -> postgresql://
if RAW_URL.startswith("postgres://"):
    RAW_URL = RAW_URL.replace("postgres://", "postgresql://", 1)

# 2) If you prefer psycopg3 explicitly (optional), uncomment next line:
# if RAW_URL.startswith("postgresql://"):
#     RAW_URL = RAW_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# 3) SQLite needs special connect args
connect_args = {"check_same_thread": False} if RAW_URL.startswith("sqlite") else {}

engine = create_engine(RAW_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()