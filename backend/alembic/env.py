import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# 1. Add project root so we can import `app.db.base`
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# 2. Read the Alembic config file for logging and for sqlalchemy.url
config = context.config
fileConfig(config.config_file_name)

# 3. Import only the Base metadata—NO session.py or config.py here!
from app.db.base import Base
target_metadata = Base.metadata

# 4. Option A: let alembic.ini define the URL:
#    In alembic.ini, under [alembic], set:
#         sqlalchemy.url = postgresql://user:pass@localhost:5432/events
#
#    OR, Option B: pull from the env var DATABASE_URL:
# config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()