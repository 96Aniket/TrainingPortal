import apiClient from "./apiClient";

// ============================================================
// OVERVIEW
// ============================================================

export interface AnalyticsOverview {
  total_trainings: number;
  total_participants: number;
  total_assessments: number;

  registration_completed: number;
  attendance_completed: number;

  assessment_eligible: number;
  assessment_attempted: number;
  assessment_completed: number;

  passed_count: number;
  failed_count: number;
  reattempted: number;
}

// ============================================================
// RATES
// ============================================================

export interface AnalyticsRates {
  registration_rate: number;
  attendance_rate: number;
  assessment_eligibility_rate: number;
  assessment_completion_rate: number;
  pass_rate: number;
}

// ============================================================
// SCORE ANALYTICS
// ============================================================

export interface ScoreAnalytics {
  average_score: number;
  highest_score: number;
  lowest_score: number;
  completed_assessments: number;
}

// ============================================================
// ATTENDANCE ANALYTICS
// ============================================================

export interface AttendanceAnalytics {
  average_minutes: number;
  highest_minutes: number;
  lowest_minutes: number;
  processed_participants: number;
}

// ============================================================
// EMAIL ANALYTICS
// ============================================================

export interface EmailAnalyticsItem {
  success: number;
  failed: number;
}

export interface EmailAnalytics {
  registration: EmailAnalyticsItem;
  confirmation: EmailAnalyticsItem;
  assessment: EmailAnalyticsItem;
}

// ============================================================
// TRAINING PERFORMANCE
// ============================================================

export interface TrainingPerformance {
  n_training_id: number;

  s_training_code: string | null;
  s_training_name: string | null;

  d_training_date: string | null;
  s_status: string | null;

  n_participants: number;
  n_registered: number;
  registration_rate: number;

  n_attendance_completed: number;
  attendance_rate: number;

  n_assessment_eligible: number;
  n_assessment_completed: number;

  n_passed: number;
  n_failed: number;

  average_score: number;
  pass_rate: number;
}

// ============================================================
// ASSESSMENT PERFORMANCE
// ============================================================

export interface AssessmentPerformance {
  n_assessment_id: number;
  n_training_id: number;

  s_assessment_name: string | null;
  s_status: string | null;

  n_participants: number;

  n_passed: number;
  n_failed: number;

  average_score: number;
  highest_score: number;
  lowest_score: number;
}

// ============================================================
// RESPONSE
// ============================================================

export interface AnalyticsResponse {
  status: string;

  overview: AnalyticsOverview;

  rates: AnalyticsRates;

  score_analytics: ScoreAnalytics;

  attendance_analytics: AttendanceAnalytics;

  email_analytics: EmailAnalytics;

  training_performance: TrainingPerformance[];

  assessment_performance: AssessmentPerformance[];
}

// ============================================================
// FILTERS
// ============================================================

export interface AnalyticsFilters {
  training_id?: number;
  date_from?: string;
  date_to?: string;
}

// ============================================================
// API
// ============================================================

export const getAnalytics = async (
  filters?: AnalyticsFilters
): Promise<AnalyticsResponse> => {
  const params: Record<
    string,
    string | number
  > = {};

  if (filters?.training_id) {
    params.training_id =
      filters.training_id;
  }

  if (filters?.date_from) {
    params.date_from =
      filters.date_from;
  }

  if (filters?.date_to) {
    params.date_to =
      filters.date_to;
  }

  const response =
    await apiClient.get<AnalyticsResponse>(
      "/api/analytics",
      {
        params,
      }
    );

  return response.data;
};