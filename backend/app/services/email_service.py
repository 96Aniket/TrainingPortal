import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from email.utils import make_msgid
from pathlib import Path
from dotenv import load_dotenv

from sqlalchemy.orm import Session

from app.models.email_template import EmailTemplate
from app.models.email_log import EmailLog

load_dotenv()

# ============================================================
# Configuration
# ============================================================

MAIL_SERVER = os.getenv(
    "MAIL_SERVER",
    ""
)

MAIL_PORT = int(
    os.getenv(
        "MAIL_PORT",
        "587"
    )
)

MAIL_USERNAME = os.getenv(
    "MAIL_USERNAME",
    ""
)

MAIL_PASSWORD = os.getenv(
    "MAIL_PASSWORD",
    ""
)

MAIL_FROM = os.getenv(
    "MAIL_FROM",
    MAIL_USERNAME
)

MAIL_USE_TLS = os.getenv(
    "MAIL_USE_TLS",
    "true"
).lower() == "true"


# ============================================================
# Text Log Directory
# ============================================================

LOG_DIRECTORY = Path("logs") / "email"

LOG_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# Get Daily Log File
# ============================================================

def get_email_log_file():

    file_name = (
        datetime.now()
        .strftime("%Y-%m-%d")
        + ".log"
    )

    return LOG_DIRECTORY / file_name


# ============================================================
# Write Text Email Log
# ============================================================

def write_email_text_log(
    *,
    email_type,
    training_id,
    user_id,
    to_email,
    cc_email,
    subject,
    status,
    message_id=None,
    failure_reason=None
):

    log_file = get_email_log_file()

    log_lines = [
        "============================================================",
        f"TIME={datetime.now()}",
        f"EMAIL_TYPE={email_type}",
        f"TRAINING_ID={training_id}",
        f"USER_ID={user_id}",
        f"TO={to_email}",
        f"CC={cc_email or ''}",
        f"SUBJECT={subject}",
        f"STATUS={status}",
        f"MESSAGE_ID={message_id or ''}",
        f"FAILURE_REASON={failure_reason or ''}",
        "============================================================",
        ""
    ]

    with open(
        log_file,
        "a",
        encoding="utf-8"
    ) as file:

        file.write(
            "\n".join(log_lines)
        )


# ============================================================
# Replace Template Variables
# ============================================================

def replace_template_variables(
    template_text,
    variables
):

    result = template_text

    for key, value in variables.items():

        placeholder = "{{" + key + "}}"

        result = result.replace(
            placeholder,
            str(value or "")
        )

    return result


# ============================================================
# Get Email Template
# ============================================================

def get_email_template(
    db: Session,
    email_type: str
):

    template = (
        db.query(EmailTemplate)
        .filter(
            EmailTemplate.s_template_code
            == email_type,

            EmailTemplate.n_flag == 1,

            EmailTemplate.delete_flag == 0
        )
        .first()
    )

    return template


# ============================================================
# Send Email
# ============================================================

def send_training_email(
    *,
    db: Session,
    email_type: str,
    to_email: str,
    training_id: int | None = None,
    user_id: int | None = None,
    coordinator_email: str | None = None,
    template_variables: dict | None = None,
    created_by: str | None = None
):

    template_variables = template_variables or {}

    # ========================================================
    # Get Email Template
    # ========================================================

    template = get_email_template(
        db,
        email_type
    )

    if not template:

        raise ValueError(
            f"Email template not found: {email_type}"
        )

    # ========================================================
    # Prepare Subject
    # ========================================================

    subject = replace_template_variables(
        template.s_subject_template,
        template_variables
    )

    # ========================================================
    # Prepare Body
    # ========================================================

    body = replace_template_variables(
        template.s_body_template,
        template_variables
    )

    # ========================================================
    # Coordinator CC
    # ========================================================

    cc_email = None

    if (
        template.n_cc_coordinator == 1
        and coordinator_email
    ):
        cc_email = coordinator_email

    # ========================================================
    # Message ID
    # ========================================================

    message_id = make_msgid()

    # ========================================================
    # Create Email Log - QUEUED
    # ========================================================

    email_log = EmailLog(

        n_email_template_id=(
            template.n_email_template_id
        ),

        n_training_id=training_id,

        n_user_id=user_id,

        s_email_type=email_type,

        s_from_email=MAIL_FROM,

        s_to_email=to_email,

        s_cc_email=cc_email,

        s_bcc_email=None,

        s_subject=subject,

        s_status="QUEUED",

        s_message_id=message_id,

        dt_queued_at=datetime.now(),

        n_flag=1,

        delete_flag=0,

        dt_created_at=datetime.now(),

        s_created_by=created_by
    )

    db.add(email_log)

    try:

        # Save QUEUED log
        db.commit()

        # Refresh generated ID
        db.refresh(email_log)

    except Exception:

        db.rollback()

        raise

    # ========================================================
    # Build Email Message
    # ========================================================

    message = EmailMessage()

    message["From"] = MAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message["Message-ID"] = message_id

    if cc_email:

        message["Cc"] = cc_email

    message.set_content(
        "Please view this email in an HTML-compatible mail client."
    )

    message.add_alternative(
        body,
        subtype="html"
    )

    # ========================================================
    # Change Status → SENDING
    # ========================================================

    try:

        email_log.s_status = "SENDING"

        db.commit()

    except Exception:

        db.rollback()

        # Try to mark FAILED
        try:

            email_log = (
                db.query(EmailLog)
                .filter(
                    EmailLog.n_email_log_id
                    == email_log.n_email_log_id
                )
                .first()
            )

            if email_log:

                email_log.s_status = "FAILED"

                email_log.dt_failed_at = datetime.now()

                email_log.s_failure_reason = (
                    "Unable to update email status to SENDING"
                )

                db.commit()

        except Exception:

            db.rollback()

        raise

    # ========================================================
    # Send Email
    # ========================================================

    try:

        if not MAIL_SERVER:

            raise ValueError(
                "MAIL_SERVER is not configured"
            )

        with smtplib.SMTP(
            MAIL_SERVER,
            MAIL_PORT,
            timeout=30
        ) as smtp:

            # STARTTLS only if configured
            if MAIL_USE_TLS:

                smtp.starttls()

            # Login only if credentials configured
            if MAIL_USERNAME:

                smtp.login(
                    MAIL_USERNAME,
                    MAIL_PASSWORD
                )

            smtp.send_message(
                message
            )

        # ====================================================
        # SUCCESS
        # ====================================================

        email_log.s_status = "SUCCESS"

        email_log.dt_sent_at = datetime.now()

        email_log.s_failure_reason = None

        db.commit()

        # ====================================================
        # Text Log
        # ====================================================

        write_email_text_log(

            email_type=email_type,

            training_id=training_id,

            user_id=user_id,

            to_email=to_email,

            cc_email=cc_email,

            subject=subject,

            status="SUCCESS",

            message_id=message_id
        )

        return {

            "status": "success",

            "message": "Email sent successfully",

            "email_log_id": (
                email_log.n_email_log_id
            ),

            "message_id": message_id

        }

    # ========================================================
    # SMTP FAILURE
    # ========================================================

    except Exception as exc:

        failure_reason = str(exc)

        # ----------------------------------------------------
        # IMPORTANT:
        # SMTP failed, so mark FAILED.
        # ----------------------------------------------------

        try:

            email_log.s_status = "FAILED"

            email_log.dt_failed_at = datetime.now()

            email_log.s_failure_reason = failure_reason

            db.commit()

        except Exception:

            db.rollback()

        # ----------------------------------------------------
        # Text Log
        # ----------------------------------------------------

        write_email_text_log(

            email_type=email_type,

            training_id=training_id,

            user_id=user_id,

            to_email=to_email,

            cc_email=cc_email,

            subject=subject,

            status="FAILED",

            message_id=message_id,

            failure_reason=failure_reason
        )

        return {

            "status": "failed",

            "message": "Email sending failed",

            "email_log_id": (
                email_log.n_email_log_id
            ),

            "reason": failure_reason

        }
    