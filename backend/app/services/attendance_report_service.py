from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.attendance_session import AttendanceSession
from app.models.training import Training
from app.models.training_participant import TrainingParticipant
from app.models.user import User


def get_training_attendance_report(
    db: Session,
    training_id: int
):

    training = (
        db.query(Training)
        .filter(
            Training.n_training_id == training_id,
            Training.n_flag == 1,
            Training.delete_flag == 0
        )
        .first()
    )

    if not training:
        raise ValueError(
            "Training not found"
        )

    rows = (
        db.query(
            TrainingParticipant,
            User,
            Attendance
        )
        .join(
            User,
            User.n_user_id
            == TrainingParticipant.n_user_id
        )
        .outerjoin(
            Attendance,
            Attendance.n_participant_id
            == TrainingParticipant.n_participant_id
        )
        .filter(
            TrainingParticipant.n_training_id
            == training_id,

            TrainingParticipant.n_flag == 1,

            TrainingParticipant.delete_flag == 0,

            User.n_flag == 1,

            User.delete_flag == 0
        )
        .order_by(
            TrainingParticipant.n_participant_id
        )
        .all()
    )

    participants = []

    for participant, user, attendance in rows:

        session = None

        if attendance:

            session = (
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

        participants.append({

            "n_participant_id":
                participant.n_participant_id,

            "n_user_id":
                user.n_user_id,

            "s_employee_id":
                user.s_employee_id,

            "s_user_name":
                user.s_user_name,

            "s_email":
                user.s_email,

            "s_registration_status":
                participant.s_registration_status,

            "n_attendance_minutes":
                (
                    attendance
                    .n_total_attendance_minutes
                    if attendance
                    else None
                ),

            "s_attendance_status":
                (
                    attendance
                    .s_attendance_status
                    if attendance
                    else "NOT_PROCESSED"
                ),

            "n_assessment_eligible":
                (
                    attendance
                    .n_assessment_eligible
                    if attendance
                    else 0
                ),

            "dt_join_time":
                (
                    session.dt_join_time
                    if session
                    else None
                ),

            "dt_leave_time":
                (
                    session.dt_leave_time
                    if session
                    else None
                ),

            "n_duration_minutes":
                (
                    session.n_duration_minutes
                    if session
                    else None
                ),

            "s_report_file_name":
                (
                    attendance.s_report_file_name
                    if attendance
                    else None
                ),

            "n_uploaded_by":
                (
                    attendance.n_uploaded_by
                    if attendance
                    else None
                ),

            "dt_uploaded_at":
                (
                    attendance.dt_uploaded_at
                    if attendance
                    else None
                )
        })

    return {

        "status": "success",

        "training": {

            "n_training_id":
                training.n_training_id,

            "s_training_code":
                training.s_training_code,

            "s_training_name":
                training.s_training_name,

            "d_training_date":
                training.d_training_date,

            "t_start_time":
                training.t_start_time,

            "t_end_time":
                training.t_end_time,

            "n_minimum_attendance_minutes":
                training.n_minimum_attendance_minutes
        },

        "count":
            len(participants),

        "participants":
            participants
    }