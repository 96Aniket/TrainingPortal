from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.dependencies import get_db


router = APIRouter(
    prefix="/api/system",
    tags=["System"]
)


@router.get("/db-test")
def database_test(db: Session = Depends(get_db)):

    result = db.execute(
        text("SELECT DB_NAME() AS database_name")
    )

    database_name = result.scalar()

    return {
        "status": "success",
        "message": "SQL Server connection successful",
        "database": database_name
    }