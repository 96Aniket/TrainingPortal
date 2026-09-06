import apiClient from "./apiClient";

// ============================================================
// ATTEMPT RESULT
// ============================================================

export interface AssessmentAttemptResult {
  n_attempt_id: number;

  n_attempt_number: number;

  dt_started_at: string | null;

  dt_submitted_at: string | null;

  n_score: number | null;

  n_percentage: number | null;

  s_result: string | null;
}


// ============================================================
// EMAIL RESULT
// ============================================================

export interface AssessmentEmailResult {
  n_email_log_id: number;

  s_email_type: string;

  s_to_email: string;

  s_status: string;

  dt_sent_at: string | null;

  s_failure_reason: string | null;
}


// ============================================================
// PARTICIPANT RESULT
// ============================================================

export interface AssessmentParticipantResult {
  n_participant_id: number;

  n_user_id: number;

  s_employee_id: string | null;

  s_user_name: string | null;

  s_email: string | null;

  s_registration_status: string;

  n_attendance_minutes: number | null;

  s_attendance_status: string;

  n_assessment_eligible: number;

  n_attempt_count: number;

  n_reattempt_count: number;

  n_final_score: number | null;

  s_final_result: string | null;

  attempts: AssessmentAttemptResult[];

  email: AssessmentEmailResult | null;
}


// ============================================================
// ASSESSMENT RESULT DETAILS
// ============================================================

export interface AssessmentResultDetails {
  n_assessment_id: number;

  n_training_id: number;

  s_training_name: string | null;

  s_assessment_name: string;

  n_total_marks: number;

  n_passing_score: number;

  n_duration_minutes: number | null;

  n_maximum_attempts: number | null;

  s_status: string;
}


// ============================================================
// API RESPONSE
// ============================================================

export interface AssessmentResultsResponse {
  status: string;

  assessment: AssessmentResultDetails;

  count: number;

  results: AssessmentParticipantResult[];
}


// ============================================================
// GET ASSESSMENT RESULTS
// ============================================================

export const getAssessmentResults =
  async (
    assessmentId: number
  ): Promise<AssessmentResultsResponse> => {

    const response =
      await apiClient.get<AssessmentResultsResponse>(
        `/api/assessments/${assessmentId}/results`
      );

    return response.data;
  };