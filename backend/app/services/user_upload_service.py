import re

import pandas as pd
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.coordinator_user import CoordinatorUser


EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
)


REQUIRED_COLUMNS = [
    "Employee ID",
    "User Name",
    "Email"
]


def validate_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.match(email))


def process_user_excel(
    file_content: bytes,
    db: Session,
    coordinator_id: int | None = None
):

    from io import BytesIO

    df = pd.read_excel(
        BytesIO(file_content),
        dtype=str
    )

    # Remove completely empty rows
    df = df.dropna(
        how="all"
    )

    # Remove spaces from column names
    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: {', '.join(missing_columns)}"
        )

    preview_rows = []

    file_emails = set()

    total_rows = len(df)
    valid_rows = 0
    duplicate_file_rows = 0
    existing_user_rows = 0
    invalid_rows = 0

    for index, row in df.iterrows():

        excel_row_number = index + 2

        employee_id = (
            str(row["Employee ID"]).strip()
            if pd.notna(row["Employee ID"])
            else ""
        )

        user_name = (
            str(row["User Name"]).strip()
            if pd.notna(row["User Name"])
            else ""
        )

        email = (
            str(row["Email"]).strip().lower()
            if pd.notna(row["Email"])
            else ""
        )

        errors = []

        if not email:
            errors.append("Email is required")
        elif not validate_email(email):
            errors.append("Invalid email")

        if not user_name:
            errors.append("User Name is required")

        if email and email in file_emails:
            errors.append("Duplicate email in uploaded file")
            duplicate_file_rows += 1

        if email:
            file_emails.add(email)

        existing_user = None
        already_assigned = False

        if email and validate_email(email):

            existing_user = (
                db.query(User)
                .filter(
                    User.s_email == email
                )
                .first()
            )

            if existing_user:
                existing_user_rows += 1

                if coordinator_id is not None:

                    existing_mapping = (
                        db.query(CoordinatorUser)
                        .filter(
                            CoordinatorUser.n_coordinator_id
                            == coordinator_id,
                            CoordinatorUser.n_user_id
                            == existing_user.n_user_id,
                            CoordinatorUser.n_flag == 1,
                            CoordinatorUser.delete_flag == 0
                        )
                        .first()
                    )

                    if existing_mapping:
                        already_assigned = True
                        errors.append(
                            "User is already assigned to you"
                        )

        if errors:
            invalid_rows += 1
            status = "INVALID"
        else:
            valid_rows += 1
            status = "VALID"

        preview_rows.append(
            {
                "excel_row": excel_row_number,
                "s_employee_id": employee_id or None,
                "s_user_name": user_name or None,
                "s_email": email or None,
                "status": status,
                "errors": errors
            }
        )

    return {
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "duplicate_file_rows": duplicate_file_rows,
        "existing_user_rows": existing_user_rows,
        "invalid_rows": invalid_rows,
        "rows": preview_rows
    }

def import_valid_users(
    file_content: bytes,
    db: Session,
    created_by: str,
    coordinator_id: int | None = None
):
    
    from io import BytesIO

    # Read Excel
    df = pd.read_excel(
        BytesIO(file_content),
        dtype=str
    )

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Clean column names
    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: {', '.join(missing_columns)}"
        )

    imported_users = []
    skipped_users = []

    # Keep track of emails inside this Excel
    file_emails = set()

    try:

        for index, row in df.iterrows():

            employee_id = (
                str(row["Employee ID"]).strip()
                if pd.notna(row["Employee ID"])
                else ""
            )

            user_name = (
                str(row["User Name"]).strip()
                if pd.notna(row["User Name"])
                else ""
            )

            email = (
                str(row["Email"]).strip().lower()
                if pd.notna(row["Email"])
                else ""
            )

            # -----------------------------
            # Basic validation
            # -----------------------------

            if not email:
                skipped_users.append({
                    "excel_row": index + 2,
                    "email": email,
                    "reason": "Email is required"
                })
                continue

            if not validate_email(email):
                skipped_users.append({
                    "excel_row": index + 2,
                    "email": email,
                    "reason": "Invalid email"
                })
                continue

            if not user_name:
                skipped_users.append({
                    "excel_row": index + 2,
                    "email": email,
                    "reason": "User Name is required"
                })
                continue

            # -----------------------------
            # Duplicate in same Excel
            # -----------------------------

            if email in file_emails:

                skipped_users.append({
                    "excel_row": index + 2,
                    "email": email,
                    "reason": "Duplicate email in uploaded file"
                })

                continue

            file_emails.add(email)

            # -----------------------------
            # Check existing DB user
            # -----------------------------

            existing_user = (
                db.query(User)
                .filter(
                    User.s_email == email
                )
                .first()
            )

            if existing_user:

                # --------------------------------------------------------
                # Existing user
                # --------------------------------------------------------

                if coordinator_id is not None:

                    existing_mapping = (
                        db.query(CoordinatorUser)
                        .filter(
                            CoordinatorUser.n_coordinator_id
                            == coordinator_id,
                            CoordinatorUser.n_user_id
                            == existing_user.n_user_id,
                            CoordinatorUser.n_flag == 1,
                            CoordinatorUser.delete_flag == 0
                        )
                        .first()
                    )

                    if existing_mapping:

                        skipped_users.append({
                            "excel_row": index + 2,
                            "email": email,
                            "reason": "User is already assigned to you"
                        })

                        continue

                    coordinator_user = CoordinatorUser(
                        n_coordinator_id=coordinator_id,
                        n_user_id=existing_user.n_user_id,
                        n_flag=1,
                        delete_flag=0,
                        s_created_by=created_by
                    )

                    db.add(coordinator_user)

                    imported_users.append({
                        "excel_row": index + 2,
                        "s_employee_id": existing_user.s_employee_id,
                        "s_user_name": existing_user.s_user_name,
                        "s_email": existing_user.s_email,
                        "action": "ASSIGNED_EXISTING_USER"
                    })

                    continue

                skipped_users.append({
                    "excel_row": index + 2,
                    "email": email,
                    "reason": "User already exists"
                })

                continue

            # -----------------------------
            # Create user
            # -----------------------------

            user = User(
                s_employee_id=employee_id or None,
                s_user_name=user_name or None,
                s_email=email,
                n_flag=1,
                delete_flag=0,
                s_created_by=created_by
            )

            db.add(user)

            imported_users.append({
                "excel_row": index + 2,
                "s_employee_id": employee_id,
                "s_user_name": user_name,
                "s_email": email
            })

        # Commit everything together
        db.commit()

        return {
            "imported_count": len(imported_users),
            "skipped_count": len(skipped_users),
            "imported_users": imported_users,
            "skipped_users": skipped_users
        }

    except Exception:

        db.rollback()

        raise