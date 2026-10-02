import os
import subprocess
import sys

import pytest
from sqlalchemy import create_engine

from app.db.url import database_url


@pytest.mark.parametrize("scheme", ["postgres", "postgresql"])
def test_postgres_uses_installed_driver_without_changing_connection(scheme):
    suffix = "user:p%40ss%25@localhost:5432/app?sslmode=require"
    engine = create_engine(database_url(f"{scheme}://{suffix}"))
    assert engine.dialect.driver == "psycopg2"
    assert engine.url.render_as_string(hide_password=False) == f"postgresql+psycopg2://{suffix}"
    engine.dispose()


@pytest.mark.parametrize("url", ["sqlite:///:memory:", "postgresql+psycopg2://localhost/app", "postgresql+psycopg://localhost/app"])
def test_explicit_drivers_and_sqlite_are_preserved(url):
    assert database_url(url) == url


def test_postgres_application_import_and_offline_migrations():
    env = {**os.environ, "DATABASE_URL": "postgres://user:p%40ss%25@localhost/app?sslmode=require", "SECRET_KEY": "driver-test-only", "RUN_MIGRATIONS": "0"}
    subprocess.run([sys.executable, "-c", "from app.main import app; from app.db.database import engine; assert engine.dialect.driver == 'psycopg2'"], env=env, check=True, capture_output=True)
    # Historical migrations inspect live tables, so render only the initial
    # migration to exercise Alembic URL handling without a database server.
    result = subprocess.run([sys.executable, "-m", "alembic", "upgrade", "778b17015fd0", "--sql"], env=env, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert "CREATE TABLE users" in result.stdout
