import apiClient from "./apiClient";

// ============================================================
// ASSESSMENT
// ============================================================

export interface Assessment {
  n_assessment_id: number;

  n_training_id: number;

  s_training_name: string | null;

  s_assessment_name: string;

  s_description: string | null;

  n_total_marks: number;

  n_passing_score: number;

  n_duration_minutes: number | null;

  n_maximum_attempts: number | null;

  s_status: string;

  n_created_by: number | null;

  dt_created_at: string | null;

  n_published_by: number | null;

  dt_published_at: string | null;

  n_updated_by: number | null;

  dt_updated_at: string | null;
}

// ============================================================
// CREATE ASSESSMENT REQUEST
// ============================================================

export interface CreateAssessmentRequest {
  n_training_id: number;

  s_assessment_name: string;

  s_description?: string | null;

  n_total_marks: number;

  n_passing_score: number;

  n_duration_minutes?: number | null;

  n_maximum_attempts?: number | null;
}

// ============================================================
// ASSESSMENT QUESTION
// ============================================================

export interface AssessmentQuestion {
  n_question_id: number;

  n_question_number: number;

  s_question_text: string;

  n_marks: number;

  options: AssessmentOption[];
}

// ============================================================
// ASSESSMENT OPTION
// ============================================================

export interface AssessmentOption {
  n_option_id: number;

  s_option_label: string;

  s_option_text: string;

  n_is_correct: number;
}

// ============================================================
// CREATE QUESTION REQUEST
// ============================================================

export interface CreateQuestionRequest {
  n_question_number: number;

  s_question_text: string;

  n_marks: number;
}

// ============================================================
// CREATE OPTION REQUEST
// ============================================================

export interface CreateOptionRequest {
  s_option_label: string;

  s_option_text: string;

  n_is_correct: number;
}

// ============================================================
// ASSESSMENT DETAILS
// ============================================================

export interface AssessmentDetails {
  n_assessment_id: number;

  n_training_id: number;

  s_assessment_name: string;

  s_description: string | null;

  n_total_marks: number;

  n_passing_score: number;

  n_duration_minutes: number | null;

  n_maximum_attempts: number | null;

  s_status: string;

  questions: AssessmentQuestion[];
}

// ============================================================
// GET ALL ASSESSMENTS RESPONSE
// ============================================================

export interface AssessmentsResponse {
  status: string;

  count: number;

  assessments: Assessment[];
}

// ============================================================
// GET ASSESSMENT RESPONSE
// ============================================================

export interface AssessmentResponse {
  status: string;

  n_assessment_id: number;

  n_training_id: number;

  s_assessment_name: string;

  s_description: string | null;

  n_total_marks: number;

  n_passing_score: number;

  n_duration_minutes: number | null;

  n_maximum_attempts: number | null;

  s_status: string;

  questions: AssessmentQuestion[];
}

// ============================================================
// CREATE ASSESSMENT RESPONSE
// ============================================================

export interface CreateAssessmentResponse {
  status: string;

  message: string;

  n_assessment_id: number;

  s_status: string;
}

// ============================================================
// CREATE QUESTION RESPONSE
// ============================================================

export interface CreateQuestionResponse {
  status: string;

  message: string;

  n_question_id: number;
}

// ============================================================
// CREATE OPTION RESPONSE
// ============================================================

export interface CreateOptionResponse {
  status: string;

  message: string;

  n_option_id: number;
}

// ============================================================
// PUBLISH EMAIL RESULT
// ============================================================

export interface PublishEmailResult {
  status: string;

  message?: string;

  reason?: string;

  eligible_users?: number;

  emails_sent?: number;

  emails_failed?: number;

  emails_skipped?: number;
}

// ============================================================
// PUBLISH ASSESSMENT RESPONSE
// ============================================================

export interface PublishAssessmentResponse {
  status: string;

  message: string;

  n_assessment_id: number;

  n_training_id?: number;

  s_status?: string;

  eligible_users?: number;

  emails_sent?: number;

  emails_failed?: number;

  emails_skipped?: number;

  email_result?: PublishEmailResult;

  reason?: string;
}

// ============================================================
// GET ALL ASSESSMENTS
// ============================================================

export const getAssessments =
  async (): Promise<Assessment[]> => {

    const response =
      await apiClient.get<AssessmentsResponse>(
        "/api/assessments"
      );

    return response.data.assessments;
  };

// ============================================================
// GET ASSESSMENT DETAILS
// ============================================================

export const getAssessment =
  async (
    assessmentId: number
  ): Promise<AssessmentDetails> => {

    const response =
      await apiClient.get<AssessmentResponse>(
        `/api/assessments/${assessmentId}`
      );

    return {
      n_assessment_id:
        response.data.n_assessment_id,

      n_training_id:
        response.data.n_training_id,

      s_assessment_name:
        response.data.s_assessment_name,

      s_description:
        response.data.s_description,

      n_total_marks:
        response.data.n_total_marks,

      n_passing_score:
        response.data.n_passing_score,

      n_duration_minutes:
        response.data.n_duration_minutes,

      n_maximum_attempts:
        response.data.n_maximum_attempts,

      s_status:
        response.data.s_status,

      questions:
        Array.isArray(
          response.data.questions
        )
          ? response.data.questions
          : [],
    };
  };

// ============================================================
// CREATE ASSESSMENT
// ============================================================

export const createAssessment =
  async (
    data: CreateAssessmentRequest
  ): Promise<CreateAssessmentResponse> => {

    const response =
      await apiClient.post<CreateAssessmentResponse>(
        "/api/assessments",
        data
      );

    return response.data;
  };

// ============================================================
// CREATE QUESTION
// ============================================================

export const createQuestion =
  async (
    assessmentId: number,
    data: CreateQuestionRequest
  ): Promise<CreateQuestionResponse> => {

    const response =
      await apiClient.post<CreateQuestionResponse>(
        `/api/assessments/${assessmentId}/questions`,
        data
      );

    return response.data;
  };

// ============================================================
// CREATE OPTION
// ============================================================

export const createOption =
  async (
    questionId: number,
    data: CreateOptionRequest
  ): Promise<CreateOptionResponse> => {

    const response =
      await apiClient.post<CreateOptionResponse>(
        `/api/assessments/questions/${questionId}/options`,
        data
      );

    return response.data;
  };

// ============================================================
// PUBLISH ASSESSMENT
// ============================================================

export const publishAssessment =
  async (
    assessmentId: number
  ): Promise<PublishAssessmentResponse> => {

    const response =
      await apiClient.post<PublishAssessmentResponse>(
        `/api/assessments/${assessmentId}/publish`
      );

    return response.data;
  };
