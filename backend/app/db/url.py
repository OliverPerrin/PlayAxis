"""Keep the installed PostgreSQL driver explicit across runtime and migrations."""


def database_url(url: str) -> str:
    # SQLAlchemy 2.1 changed the bare PostgreSQL URL default to psycopg 3.
    # This application installs psycopg2; preserve credentials/query parameters
    # verbatim and respect URLs that already select a driver.
    for scheme in ("postgres://", "postgresql://"):
        if url.startswith(scheme):
            return "postgresql+psycopg2://" + url[len(scheme):]
    return url
