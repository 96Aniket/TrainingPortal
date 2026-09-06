import apiClient from "./apiClient";

// ============================================================
// ASSESSMENT OPTION
// ============================================================

export interface AssessmentAttemptOption {
  n_option_id: number;

  s_option_label: string;

  s_option_text: string;
}


// ============================================================
// ASSESSMENT QUESTION
// ============================================================

export interface AssessmentAttemptQuestion {
  n_question_id: number;

  n_question_number: number;

  s_question_text: string;

  n_marks: number;

  options: AssessmentAttemptOption[];
}

export interface AssessmentPreview {
  n_assessment_id: number;

  n_training_id: number;

  s_assessment_name: string;

  s_description: string | null;

  n_total_marks: number;

  n_passing_score: number;

  n_duration_minutes: number | null;

  n_maximum_attempts: number | null;

  s_status: string;
}


// ============================================================
// START ASSESSMENT REQUEST
// ============================================================

export interface StartAssessmentRequest {
  registration_token: string;
}


// ============================================================
// START ASSESSMENT RESPONSE
// ============================================================

export interface StartAssessmentResponse {
  status: string;

  message: string;

  n_attempt_id: number;

  n_attempt_number: number;

  n_assessment_id: number;

  s_assessment_name: string;

  n_total_marks: number;

  n_passing_score: number;

  n_duration_minutes: number | null;

  n_maximum_attempts: number | null;

  questions: AssessmentAttemptQuestion[];
}


// ============================================================
// SUBMIT ANSWER
// ============================================================

export interface SubmitAssessmentAnswer {
  n_question_id: number;

  n_selected_option_id: number;
}


// ============================================================
// SUBMIT ASSESSMENT REQUEST
// ============================================================

export interface SubmitAssessmentRequest {
  n_attempt_id: number;

  registration_token: string;

  answers: SubmitAssessmentAnswer[];
}


// ============================================================
// SUBMIT ASSESSMENT RESPONSE
// ============================================================

export interface SubmitAssessmentResponse {
  status: string;

  message: string;

  n_attempt_id: number;

  n_attempt_number: number;

  n_assessment_id: number;

  n_user_id: number;

  n_total_marks: number;

  n_score: number;

  n_percentage: number;

  n_passing_score: number;

  s_result: string;

  email_status: string;

  email_message: string | null;
}


// ============================================================
// START ASSESSMENT
// ============================================================

export const startAssessment =
  async (
    assessmentId: number,
    registrationToken: string
  ): Promise<StartAssessmentResponse> => {

    const response =
      await apiClient.post<StartAssessmentResponse>(
        `/api/assessments/${assessmentId}/start`,
        {
          registration_token:
            registrationToken,
        }
      );

    return response.data;
  };

  export const getAssessmentPreview =
    async (
        assessmentId: number
    ): Promise<AssessmentPreview> => {

        const response =
        await apiClient.get<AssessmentPreview & {
            status: string;
        }>(
            `/api/assessments/${assessmentId}`
        );

        return response.data;
    };

// ============================================================
// SUBMIT ASSESSMENT
// ============================================================

export const submitAssessment =
  async (
    assessmentId: number,
    data: SubmitAssessmentRequest
  ): Promise<SubmitAssessmentResponse> => {

    const response =
      await apiClient.post<SubmitAssessmentResponse>(
        `/api/assessments/${assessmentId}/submit`,
        data
      );

    return response.data;
  };