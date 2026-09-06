import apiClient from "./apiClient";

// ============================================================
// TRAINING TYPES
// ============================================================

export interface Training {
  n_training_id: number;

  s_training_code: string;

  s_training_name: string;

  s_description: string | null;

  n_training_month: number;

  n_training_year: number;

  d_training_date: string;

  t_start_time: string;

  t_end_time: string;

  dt_registration_start: string;

  dt_registration_end: string;

  s_teams_meeting_link: string | null;

  n_passing_score: number;

  n_minimum_attendance_minutes: number;

  n_assessment_required: number;

  s_status: string;

  n_created_by: number;

  dt_created_at: string;

  n_updated_by: number | null;

  dt_updated_at: string | null;
}

// ============================================================
// CREATE TRAINING REQUEST
// ============================================================

export interface CreateTrainingRequest {
  s_training_code: string;

  s_training_name: string;

  s_description?: string | null;

  n_training_month: number;

  n_training_year: number;

  d_training_date: string;

  t_start_time: string;

  t_end_time: string;

  dt_registration_start: string;

  dt_registration_end: string;

  s_teams_meeting_link?: string | null;

  n_passing_score?: number;

  n_minimum_attendance_minutes?: number;

  n_assessment_required?: number;
}

// ============================================================
// UPDATE TRAINING REQUEST
// ============================================================

export interface UpdateTrainingRequest {
  s_training_name?: string;

  s_description?: string | null;

  n_training_month?: number;

  n_training_year?: number;

  d_training_date?: string;

  t_start_time?: string;

  t_end_time?: string;

  dt_registration_start?: string;

  dt_registration_end?: string;

  s_teams_meeting_link?: string | null;

  n_passing_score?: number;

  n_minimum_attendance_minutes?: number;

  n_assessment_required?: number;
}

// ============================================================
// GET ALL TRAININGS RESPONSE
// ============================================================

export interface TrainingsResponse {
  status: string;

  count: number;

  trainings: Training[];
}

// ============================================================
// GET TRAINING BY ID RESPONSE
// ============================================================

export interface TrainingResponse {
  status: string;

  training: Training;
}

// ============================================================
// CREATE TRAINING RESPONSE
// ============================================================

export interface CreateTrainingResponse {
  status: string;

  message: string;

  n_training_id: number;

  s_training_code: string;

  s_status: string;
}

// ============================================================
// UPDATE TRAINING RESPONSE
// ============================================================

export interface UpdateTrainingResponse {
  status: string;

  message: string;

  n_training_id: number;

  s_training_code: string;

  s_status: string;
}

// ============================================================
// PUBLISH TRAINING RESPONSE
// ============================================================

export interface PublishTrainingResponse {
  status: string;

  message: string;

  n_training_id: number;

  s_training_code: string;

  s_status: string;

  total_active_users: number;

  participants_created: number;

  participants_already_exist: number;

  email_result?: {
    status: string;

    message?: string;

    reason?: string;
  };
}

// ============================================================
// GET ALL TRAININGS
// ============================================================

export const getTrainings = async (): Promise<Training[]> => {
  const response =
    await apiClient.get<TrainingsResponse>(
      "/api/trainings"
    );

  return response.data.trainings;
};

// ============================================================
// GET TRAINING BY ID
// ============================================================

export const getTraining = async (
  n_training_id: number
): Promise<Training> => {
  const response =
    await apiClient.get<TrainingResponse>(
      `/api/trainings/${n_training_id}`
    );

  return response.data.training;
};

// ============================================================
// CREATE TRAINING
// ============================================================

export const createTraining = async (
  data: CreateTrainingRequest
): Promise<CreateTrainingResponse> => {
  const response =
    await apiClient.post<CreateTrainingResponse>(
      "/api/trainings",
      data
    );

  return response.data;
};

// ============================================================
// UPDATE TRAINING
// ============================================================

export const updateTraining = async (
  n_training_id: number,
  data: UpdateTrainingRequest
): Promise<UpdateTrainingResponse> => {
  const response =
    await apiClient.put<UpdateTrainingResponse>(
      `/api/trainings/${n_training_id}`,
      data
    );

  return response.data;
};

// ============================================================
// PUBLISH TRAINING
// ============================================================

export const publishTraining = async (
  n_training_id: number
): Promise<PublishTrainingResponse> => {
  const response =
    await apiClient.post<PublishTrainingResponse>(
      `/api/trainings/${n_training_id}/publish`
    );

  return response.data;
};

export interface BulkPublishTrainingResult {
  n_training_id: number;
  s_training_code: string;
  s_training_name: string;
  status: "success" | "failed";
  participant_count?: number;
  existing_participant_count?: number;
  email_result?: {
    status?: string;
    reason?: string;
  };
  message?: string;
}

export interface BulkPublishTrainingResponse {
  status: string;
  message: string;
  total_requested: number;
  published_count: number;
  failed_count: number;
  results: BulkPublishTrainingResult[];
}

export const bulkPublishTrainings = async (
  trainingIds: number[]
): Promise<BulkPublishTrainingResponse> => {

  const response = await apiClient.post(
    "/api/trainings/bulk-publish",
    {
      training_ids: trainingIds,
    }
  );

  return response.data;
};
