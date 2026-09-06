import apiClient from "./apiClient";

export interface DashboardSummary {
  total_trainings: number;
  total_participants: number;

  registration_email_sent: number;
  registration_completed: number;

  confirmation_email_sent: number;

  attendance_completed: number;

  assessment_eligible: number;
  assessment_email_sent: number;

  assessment_attempted: number;
  reattempted: number;
  assessment_completed: number;

  passed_count: number;
  failed_count: number;

  total_assessments: number;
}

export interface DashboardMonitoringRow {
  n_participant_id: number;
  n_training_id: number;
  n_user_id: number;

  // User
  s_employee_id: string | null;
  s_user_name: string | null;
  s_email: string | null;

  // Training
  s_training_code: string | null;
  s_training_name: string | null;
  d_training_date: string | null;
  s_training_status: string | null;
  n_passing_score: number | null;
  n_minimum_attendance_minutes: number | null;

  // Registration
  s_registration_status: string | null;
  s_registration_email_status: string | null;
  dt_registration_email_sent_at: string | null;
  dt_registered_at: string | null;

  // Confirmation
  s_confirmation_email_status: string | null;
  dt_confirmation_email_sent_at: string | null;

  // Attendance
  s_attendance_status: string | null;
  n_attendance_minutes: number | null;
  dt_attendance_processed_at: string | null;

  // Assessment
  n_assessment_eligible: number;
  s_assessment_email_status: string | null;
  dt_assessment_email_sent_at: string | null;

  // Attempts / Result
  n_attempt_count: number;
  n_reattempt_count: number;
  n_final_score: number | null;
  s_final_result: string | null;
}

export interface DashboardResponse {
  status: string;
  summary: DashboardSummary;
  monitoring: DashboardMonitoringRow[];
}

export const getDashboard =
  async (): Promise<DashboardResponse> => {
    const response =
      await apiClient.get<DashboardResponse>(
        "/api/dashboard"
      );

    return response.data;
  };