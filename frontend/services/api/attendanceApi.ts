import apiClient from "./apiClient";

// ============================================================
// ATTENDANCE USER
// ============================================================

export interface AttendanceUser {
  n_user_id: number;
  s_user_name: string;
  s_email: string;
  n_attendance_minutes: number;
  s_attendance_status: string;
  n_assessment_eligible: number;
}

// ============================================================
// ATTENDANCE REPORT PARTICIPANT
// ============================================================

export interface AttendanceReportParticipant {
  n_participant_id: number;

  n_user_id: number;

  s_employee_id: string | null;

  s_user_name: string | null;

  s_email: string | null;

  s_registration_status: string;

  n_attendance_minutes: number | null;

  s_attendance_status: string;

  n_assessment_eligible: number;

  dt_join_time: string | null;

  dt_leave_time: string | null;

  n_duration_minutes: number | null;

  s_report_file_name: string | null;

  n_uploaded_by: number | null;

  dt_uploaded_at: string | null;
}

// ============================================================
// ATTENDANCE UPLOAD RESPONSE
// ============================================================

export interface AttendanceUploadResponse {
  status: string;
  message: string;
  n_training_id: number;
  n_attendance_session_id: number | null;
  total_users: number;
  attended_users: number;
  eligible_users: number;
  not_eligible_users: number;
  users: AttendanceUser[];
}

// ============================================================
// ATTENDANCE REPORT TRAINING
// ============================================================

export interface AttendanceReportTraining {
  n_training_id: number;

  s_training_code: string;

  s_training_name: string;

  d_training_date: string;

  t_start_time: string;

  t_end_time: string;

  n_minimum_attendance_minutes: number;
}

// ============================================================
// ATTENDANCE REPORT RESPONSE
// ============================================================

export interface AttendanceReportResponse {
  status: string;

  training: AttendanceReportTraining;

  count: number;

  participants: AttendanceReportParticipant[];
}

// ============================================================
// UPLOAD ATTENDANCE
// ============================================================

export const uploadAttendance = async (
  trainingId: number,
  file: File
): Promise<AttendanceUploadResponse> => {

  const formData = new FormData();

  formData.append(
    "training_id",
    String(trainingId)
  );

  formData.append(
    "file",
    file
  );

  const response =
    await apiClient.post<AttendanceUploadResponse>(
      "/api/attendance/upload",
      formData
    );

  return response.data;
};

// ============================================================
// GET TRAINING ATTENDANCE REPORT
// ============================================================

export const getTrainingAttendanceReport =
  async (
    trainingId: number
  ): Promise<AttendanceReportResponse> => {

    const response =
      await apiClient.get<AttendanceReportResponse>(
        `/api/attendance/training/${trainingId}`
      );

    return response.data;
  };