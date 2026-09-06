import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict
)


# ============================================================
# BACKEND BASE DIRECTORY
# ============================================================

BASE_DIR = Path(
    __file__
).resolve().parents[2]


# ============================================================
# BACKEND .ENV
# ============================================================

ENV_FILE = (
    BASE_DIR / ".env"
)

load_dotenv(
    dotenv_path=ENV_FILE
)


class Settings(BaseSettings):
    # ========================================================
    # DATABASE
    # ========================================================

    DATABASE_USER: str = os.getenv(
        "DATABASE_USER",
        ""
    )

    DATABASE_PASSWORD: str = os.getenv(
        "DATABASE_PASSWORD",
        ""
    )

    DATABASE_SERVER: str = os.getenv(
        "DATABASE_SERVER",
        ""
    )

    DATABASE_PORT: str = os.getenv(
        "DATABASE_PORT",
        "1433"
    )

    DATABASE_NAME: str = os.getenv(
        "DATABASE_NAME",
        "TrainingPortalDB"
    )

    ODBC_DRIVER: str = os.getenv(
        "ODBC_DRIVER",
        "ODBC Driver 18 for SQL Server"
    )

    # ========================================================
    # SESSION
    # ========================================================

    SESSION_SECRET: str = os.getenv(
        "SESSION_SECRET",
        ""
    )

    if not SESSION_SECRET:
        raise RuntimeError(
            "SESSION_SECRET is not configured in backend/.env"
        )

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()