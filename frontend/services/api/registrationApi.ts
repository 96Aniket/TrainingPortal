import apiClient from "./apiClient";

// ============================================================
// REGISTRATION USER
// ============================================================

export interface RegistrationUser {
  s_employee_id: string | null;
  s_user_name: string | null;
  s_email: string | null;
}


// ============================================================
// REGISTRATION TRAINING
// ============================================================

export interface RegistrationTraining {
  n_training_id: number;

  s_training_code: string;

  s_training_name: string;

  s_description: string | null;

  d_training_date: string;

  t_start_time: string;

  t_end_time: string;

  dt_registration_start: string;

  dt_registration_end: string;

  s_registration_status: string;

  s_teams_meeting_link?: string | null;
}


// ============================================================
// GET REGISTRATION DETAILS RESPONSE
// ============================================================

export interface RegistrationDetailsResponse {
  status: string;

  user: RegistrationUser;

  training: {
    n_training_id: number;

    s_training_code: string;

    s_training_name: string;

    s_description: string | null;

    d_training_date: string;

    t_start_time: string;

    t_end_time: string;

    dt_registration_start: string;

    dt_registration_end: string;
  };

  registration: {
    n_participant_id: number;

    s_registration_status: string;
  };
}


// ============================================================
// AVAILABLE TRAININGS RESPONSE
// ============================================================

export interface AvailableTrainingsResponse {
  status: string;

  s_user_name: string | null;

  s_email: string | null;

  trainings: RegistrationTraining[];
}


// ============================================================
// CONFIRM MULTIPLE REGISTRATION REQUEST
// ============================================================

export interface ConfirmMultipleRegistrationRequest {
  training_ids: number[];
}


// ============================================================
// CONFIRM MULTIPLE REGISTRATION RESPONSE
// ============================================================

export interface ConfirmMultipleRegistrationResponse {
  status: string;

  message: string;

  s_user_name: string | null;

  s_email: string | null;

  confirmation_email_status: string;

  trainings: RegistrationTraining[];
}


// ============================================================
// GET REGISTRATION DETAILS
// ============================================================

export const getRegistrationDetails =
  async (
    registrationToken: string
  ): Promise<RegistrationDetailsResponse> => {

    const response =
      await apiClient.get<RegistrationDetailsResponse>(
        `/api/registration/${encodeURIComponent(
          registrationToken
        )}`
      );

    return response.data;
  };


// ============================================================
// GET AVAILABLE TRAININGS
// ============================================================

export const getAvailableTrainings =
  async (
    registrationToken: string
  ): Promise<AvailableTrainingsResponse> => {

    const response =
      await apiClient.get<AvailableTrainingsResponse>(
        `/api/registration/${encodeURIComponent(
          registrationToken
        )}/available-trainings`
      );

    return response.data;
  };


// ============================================================
// CONFIRM MULTIPLE REGISTRATION
// ============================================================

export const confirmMultipleRegistration =
  async (
    registrationToken: string,
    data: ConfirmMultipleRegistrationRequest
  ): Promise<ConfirmMultipleRegistrationResponse> => {

    const response =
      await apiClient.post<ConfirmMultipleRegistrationResponse>(
        `/api/registration/${encodeURIComponent(
          registrationToken
        )}/confirm-multiple`,
        data
      );

    return response.data;
  };