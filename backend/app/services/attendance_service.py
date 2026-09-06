from datetime import datetime
from io import BytesIO, StringIO
import csv
import re

import pandas as pd
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.attendance_session import AttendanceSession
from app.models.training_participant import TrainingParticipant
from app.models.training import Training
from app.models.user import User


# ==========================================================
# Utility
# ==========================================================

def normalize_email(value):
    if value is None:
        return ""

    text = str(value).strip().lower()

    if text in ("nan", "none", ""):
        return ""

    return text


# ==========================================================
# Duration
# ==========================================================

def parse_duration_to_seconds(value):

    if value is None:
        return 0

    text = str(value).strip().lower()

    if not text or text == "nan":
        return 0

    hours = 0
    minutes = 0
    seconds = 0

    match = re.search(r"(\d+)\s*h", text)
    if match:
        hours = int(match.group(1))

    match = re.search(r"(\d+)\s*m", text)
    if match:
        minutes = int(match.group(1))

    match = re.search(r"(\d+)\s*s", text)
    if match:
        seconds = int(match.group(1))

    return (
        hours * 3600
        + minutes * 60
        + seconds
    )


# ==========================================================
# DateTime
# ==========================================================

def parse_datetime(value):

    if value is None:
        return None

    if pd.isna(value):
        return None

    parsed = pd.to_datetime(
        value,
        errors="coerce"
    )

    if pd.isna(parsed):
        return None

    return parsed.to_pydatetime()


# ==========================================================
# Teams CSV Parser
# ==========================================================

def find_activity_table(
    file_bytes: bytes,
    file_name: str
):
    """
    Parse Microsoft Teams attendance export.

    Current Teams CSV structure:

        1. Summary

        2. Participants
        Name
        First Join
        Last Leave
        In-Meeting Duration
        Email
        Participant ID (UPN)
        Role

        3. In-Meeting Activities

    The Participants table contains the reliable
    total attendance duration for this export.
    """

    extension = (
        file_name
        .lower()
        .split(".")[-1]
    )

    # ======================================================
    # CSV
    # ======================================================

    if extension == "csv":

        # --------------------------------------------------
        # Decode Teams CSV
        # --------------------------------------------------

        if file_bytes.startswith(
            b"\xff\xfe"
        ) or file_bytes.startswith(
            b"\xfe\xff"
        ):

            text = file_bytes.decode(
                "utf-16"
            )

        else:

            try:

                text = file_bytes.decode(
                    "utf-8-sig"
                )

            except UnicodeDecodeError:

                text = file_bytes.decode(
                    "cp1252"
                )

        # --------------------------------------------------
        # Teams uses TAB delimiter
        # --------------------------------------------------

        reader = csv.reader(
            StringIO(
                text,
                newline=""
            ),
            delimiter="\t"
        )

        rows = list(reader)

        header_index = None

        # --------------------------------------------------
        # Find Participants header
        # --------------------------------------------------

        for index, row in enumerate(rows):

            normalized_row = [
                str(value)
                .strip()
                .lower()
                for value in row
            ]

            required_headers = {
                "name",
                "first join",
                "last leave",
                "in-meeting duration",
                "email"
            }

            if required_headers.issubset(
                set(normalized_row)
            ):

                header_index = index
                break

        if header_index is None:

            raise ValueError(
                "Teams Participants table was not found in CSV"
            )

        # --------------------------------------------------
        # Header
        # --------------------------------------------------

        headers = [
            str(value).strip()
            for value in rows[header_index]
        ]

        # --------------------------------------------------
        # Data
        # --------------------------------------------------

        data_rows = []

        for row in rows[
            header_index + 1:
        ]:

            # Stop when next section starts
            first_value = (
                str(row[0])
                .strip()
                .lower()
                if row
                else ""
            )

            if first_value in (
                "3. in-meeting activities",
                "3. in meeting activities"
            ):
                break

            # Skip empty row
            if not any(
                str(value).strip()
                for value in row
            ):
                continue

            # Make row same length
            if len(row) < len(headers):

                row = row + (
                    [""] *
                    (
                        len(headers)
                        - len(row)
                    )
                )

            elif len(row) > len(headers):

                row = row[:len(headers)]

            data_rows.append(row)

        participant_df = pd.DataFrame(
            data_rows,
            columns=headers
        )

        return participant_df

    # ======================================================
    # Excel
    # ======================================================

    elif extension in (
        "xlsx",
        "xlsm"
    ):

        excel_file = BytesIO(
            file_bytes
        )

        sheets = pd.read_excel(
            excel_file,
            sheet_name=None,
            header=None
        )

        required_headers = {
            "name",
            "first join",
            "last leave",
            "in-meeting duration",
            "email"
        }

        for sheet_name, df in sheets.items():

            for row_index in range(
                len(df)
            ):

                row_values = [
                    str(value)
                    .strip()
                    .lower()
                    for value
                    in df.iloc[
                        row_index
                    ].tolist()
                ]

                if required_headers.issubset(
                    set(row_values)
                ):

                    headers = (
                        df.iloc[
                            row_index
                        ].tolist()
                    )

                    participant_df = (
                        df.iloc[
                            row_index + 1:
                        ].copy()
                    )

                    participant_df.columns = [
                        str(column).strip()
                        for column in headers
                    ]

                    return participant_df

        raise ValueError(
            "Teams Participants table was not found in Excel"
        )

    else:

        raise ValueError(
            "Unsupported attendance file format"
        )


# ==========================================================
# Process Attendance
# ==========================================================

def process_attendance_report(
    db: Session,
    training_id: int,
    file_bytes: bytes,
    file_name: str,
    uploaded_by: int
):

    try:

        # ==================================================
        # 1. Validate Training
        # ==================================================

        training = (
            db.query(Training)
            .filter(
                Training.n_training_id
                == training_id,

                Training.n_flag == 1,

                Training.delete_flag == 0
            )
            .first()
        )

        if not training:

            raise ValueError(
                "Training not found"
            )

        # ==================================================
        # 2. Parse Teams Report
        # ==================================================

        participant_df = (
            find_activity_table(
                file_bytes=file_bytes,
                file_name=file_name
            )
        )

        # ==================================================
        # 3. Find Columns
        # ==================================================

        column_map = {}

        for column in participant_df.columns:

            normalized = (
                str(column)
                .strip()
                .lower()
            )

            if normalized == "name":

                column_map["name"] = column

            elif normalized == "first join":

                column_map["join_time"] = column

            elif normalized == "last leave":

                column_map["leave_time"] = column

            elif normalized == "in-meeting duration":

                column_map["duration"] = column

            elif normalized == "email":

                column_map["email"] = column

        required_columns = [
            "name",
            "join_time",
            "leave_time",
            "duration",
            "email"
        ]

        for required in required_columns:

            if required not in column_map:

                raise ValueError(
                    "Required Teams column missing: "
                    + required
                )

        # ==================================================
        # 4. Read Teams Participants
        # ==================================================

        report_users = {}

        for _, row in participant_df.iterrows():

            email = normalize_email(
                row[
                    column_map["email"]
                ]
            )

            if not email:
                continue

            join_time = parse_datetime(
                row[
                    column_map["join_time"]
                ]
            )

            leave_time = parse_datetime(
                row[
                    column_map["leave_time"]
                ]
            )

            duration_seconds = (
                parse_duration_to_seconds(
                    row[
                        column_map["duration"]
                    ]
                )
            )

            report_users[email] = {
                "name": (
                    str(
                        row[
                            column_map["name"]
                        ]
                    ).strip()
                ),

                "join_time": join_time,

                "leave_time": leave_time,

                "duration_seconds":
                    duration_seconds
            }

        # ==================================================
        # 5. Get Registered Users
        # ==================================================

        participants = (
            db.query(
                TrainingParticipant,
                User
            )
            .join(
                User,
                User.n_user_id
                == TrainingParticipant.n_user_id
            )
            .filter(
                TrainingParticipant.n_training_id
                == training_id,

                TrainingParticipant.s_registration_status
                == "REGISTERED",

                TrainingParticipant.n_flag == 1,

                TrainingParticipant.delete_flag == 0,

                User.n_flag == 1,

                User.delete_flag == 0
            )
            .all()
        )

        # ==================================================
        # 6. Process Users
        # ==================================================

        result_users = []

        eligible_count = 0
        not_eligible_count = 0
        attended_count = 0

        last_attendance_session_id = None

        minimum_minutes = (
            training.n_minimum_attendance_minutes
        )

        for participant, user in participants:

            user_email = normalize_email(
                user.s_email
            )

            report_user = report_users.get(
                user_email
            )

            # ------------------------------------------------
            # User found in Teams report
            # ------------------------------------------------

            if report_user:

                total_seconds = (
                    report_user[
                        "duration_seconds"
                    ]
                )

                total_minutes = (
                    total_seconds // 60
                )

                join_time = (
                    report_user[
                        "join_time"
                    ]
                )

                leave_time = (
                    report_user[
                        "leave_time"
                    ]
                )

                attended_count += 1

            # ------------------------------------------------
            # User did not attend / not present
            # ------------------------------------------------

            else:

                total_seconds = 0
                total_minutes = 0

                join_time = None
                leave_time = None

            # =================================================
            # Attendance Status + Assessment Eligibility
            # =================================================

            if report_user is None:

                attendance_status = "NOT_ATTENDED"

                assessment_eligible = 0

                not_eligible_count += 1

            elif total_minutes >= minimum_minutes:

                attendance_status = "ATTENDED"

                assessment_eligible = 1

                eligible_count += 1

            else:

                attendance_status = "ATTENDED"

                assessment_eligible = 0

                not_eligible_count += 1

            # =================================================
            # Create Attendance Master
            # =================================================

            existing_attendance = (
                db.query(Attendance)
                .filter(
                    Attendance.n_participant_id
                    == participant.n_participant_id,

                    Attendance.n_flag == 1,

                    Attendance.delete_flag == 0
                )
                .order_by(
                    Attendance.n_attendance_id.desc()
                )
                .first()
            )


            if existing_attendance:

                attendance = existing_attendance

                attendance.s_attendance_status = (
                    attendance_status
                )

                attendance.n_total_attendance_minutes = (
                    total_minutes
                )

                attendance.n_assessment_eligible = (
                    assessment_eligible
                )

                attendance.s_report_file_name = (
                    file_name
                )

                attendance.n_uploaded_by = (
                    uploaded_by
                )

                attendance.dt_uploaded_at = (
                    datetime.now()
                )

            else:

                existing_attendance = (
                    db.query(Attendance)
                    .filter(
                        Attendance.n_participant_id
                        == participant.n_participant_id,

                        Attendance.n_flag == 1,

                        Attendance.delete_flag == 0
                    )
                    .order_by(
                        Attendance.n_attendance_id.desc()
                    )
                    .first()
                )


                if existing_attendance:

                    attendance = existing_attendance

                    attendance.s_attendance_status = (
                        attendance_status
                    )

                    attendance.n_total_attendance_minutes = (
                        total_minutes
                    )

                    attendance.n_assessment_eligible = (
                        assessment_eligible
                    )

                    attendance.s_report_file_name = (
                        file_name
                    )

                    attendance.n_uploaded_by = (
                        uploaded_by
                    )

                    attendance.dt_uploaded_at = (
                        datetime.now()
                    )

                else:

                    attendance = Attendance(

                        n_participant_id=(
                            participant.n_participant_id
                        ),

                        s_attendance_status=(
                            attendance_status
                        ),

                        n_total_attendance_minutes=(
                            total_minutes
                        ),

                        n_assessment_eligible=(
                            assessment_eligible
                        ),

                        s_report_file_name=file_name,

                        n_uploaded_by=uploaded_by,

                        dt_uploaded_at=datetime.now(),

                        n_flag=1,

                        delete_flag=0,

                        dt_created_at=datetime.now(),

                        s_created_by=str(
                            uploaded_by
                        )
                    )

                    db.add(attendance)

                    db.flush()

            # =================================================
            # Save Attendance Session
            # =================================================

            if join_time:

                existing_session = (
                    db.query(
                        AttendanceSession
                    )
                    .filter(
                        AttendanceSession.n_attendance_id
                        == attendance.n_attendance_id,

                        AttendanceSession.n_flag == 1,

                        AttendanceSession.delete_flag == 0
                    )
                    .order_by(
                        AttendanceSession
                        .n_attendance_session_id
                        .desc()
                    )
                    .first()
                )


                if existing_session:

                    existing_session.dt_join_time = (
                        join_time
                    )

                    existing_session.dt_leave_time = (
                        leave_time
                    )

                    existing_session.n_duration_minutes = (
                        total_minutes
                    )

                    attendance_session = (
                        existing_session
                    )

                else:

                    attendance_session = (
                        AttendanceSession(

                            n_attendance_id=(
                                attendance.n_attendance_id
                            ),

                            dt_join_time=join_time,

                            dt_leave_time=leave_time,

                            n_duration_minutes=(
                                total_minutes
                            ),

                            n_flag=1,

                            delete_flag=0,

                            dt_created_at=datetime.now(),

                            s_created_by=str(
                                uploaded_by
                            )
                        )
                    )

                    db.add(
                        attendance_session
                    )

                    db.flush()


                last_attendance_session_id = (
                    attendance_session
                    .n_attendance_session_id
                )
            # =================================================
            # IMPORTANT:
            # Update Participant
            # =================================================

            participant.s_attendance_status = (
                attendance_status
            )

            participant.n_attendance_minutes = (
                total_minutes
            )

            participant.dt_attendance_processed_at = (
                datetime.now()
            )

            participant.n_assessment_eligible = (
                assessment_eligible
            )

            participant.dt_updated_at = (
                datetime.now()
            )

            participant.s_updated_by = (
                str(uploaded_by)
            )

            # =================================================
            # Response User
            # =================================================

            result_users.append(
                {
                    "n_user_id":
                        user.n_user_id,

                    "s_user_name":
                        user.s_user_name or "",

                    "s_email":
                        user.s_email,

                    "n_attendance_minutes":
                        total_minutes,

                    "s_attendance_status":
                        attendance_status,

                    "n_assessment_eligible":
                        assessment_eligible
                }
            )

        # ==================================================
        # 7. Commit
        # ==================================================

        db.commit()

        # ==================================================
        # 8. Response
        # ==================================================

        return {

            "status": "success",

            "message":
                "Attendance report processed successfully",

            "n_training_id":
                training_id,

            "n_attendance_session_id":
                last_attendance_session_id,

            "total_users":
                len(participants),

            "attended_users":
                attended_count,

            "eligible_users":
                eligible_count,

            "not_eligible_users":
                not_eligible_count,

            "users":
                result_users
        }

    except Exception:

        db.rollback()

        raise