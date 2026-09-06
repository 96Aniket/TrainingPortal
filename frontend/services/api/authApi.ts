import apiClient from "./apiClient";

export interface LoggedInUser {
  n_user_id: number;
  s_employee_id: string | null;
  s_user_name: string | null;
  s_email: string | null;
  s_role_name: string | null;
}

export interface LoginResponse {
  status: string;
  message: string;
  user: LoggedInUser;
}

export interface MeResponse {
  status: string;
  user: LoggedInUser;
}

export const login = async (
  s_email: string
): Promise<LoginResponse> => {
  const response =
    await apiClient.post<LoginResponse>(
      "/api/auth/login",
      null,
      {
        params: {
          s_email: s_email.trim(),
        },
      }
    );

  return response.data;
};

export const getCurrentUser =
  async (): Promise<LoggedInUser> => {
    const response =
      await apiClient.get<MeResponse>(
        "/api/auth/me"
      );

    return response.data.user;
  };

export const logout = async (): Promise<void> => {
  await apiClient.post(
    "/api/auth/logout"
  );
};