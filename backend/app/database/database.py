from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config.settings import settings


connection_string = (
    f"DRIVER={{{settings.ODBC_DRIVER}}};"
    f"SERVER={settings.DATABASE_SERVER},{settings.DATABASE_PORT};"
    f"DATABASE={settings.DATABASE_NAME};"
    f"UID={settings.DATABASE_USER};"
    f"PWD={settings.DATABASE_PASSWORD};"
    f"Encrypt=no;"
    f"TrustServerCertificate=yes;"
    f"Connection Timeout=500;"
)


connection_url = (
    "mssql+pyodbc:///?odbc_connect="
    + quote_plus(connection_string)
)


engine = create_engine(
    connection_url,
    pool_pre_ping=True,
    pool_recycle=1800,
    future=True
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


Base = declarative_base()