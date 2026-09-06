import apiClient from "./apiClient";

export interface User {
  n_user_id: number;
  s_employee_id?: string | null;
  s_user_name?: string | null;
  s_email?: string | null;
  n_flag?: number | null;
  delete_flag?: number | null;
}

export interface CreateUserRequest {
  s_employee_id: string;
  s_user_name: string;
  s_email: string;
}

export interface UpdateUserRequest {
  s_employee_id?: string | null;
  s_user_name?: string | null;
  s_email?: string | null;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get("/api/users");

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data.users)) {
    return response.data.users;
  }

  if (Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
};

export const createUser = async (
  data: CreateUserRequest
): Promise<User> => {
  const response = await apiClient.post("/api/users", data);

  return response.data;
};

export const updateUser = async (
  n_user_id: number,
  data: UpdateUserRequest
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.put(
    `/api/users/${n_user_id}`,
    data
  );

  return response.data;
};

export const deactivateUser = async (
  n_user_id: number
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.patch(
    `/api/users/${n_user_id}/deactivate`
  );

  return response.data;
};

export const activateUser = async (
  n_user_id: number
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.patch(
    `/api/users/${n_user_id}/activate`
  );

  return response.data;
};

export interface UserUploadRow {
  excel_row: number;
  s_employee_id: string | null;
  s_user_name: string | null;
  s_email: string | null;
  status: "VALID" | "INVALID";
  errors: string[];
}

export interface UserUploadPreview {
  status: string;
  message: string;
  filename: string;
  summary: {
    total_rows: number;
    valid_rows: number;
    duplicate_file_rows: number;
    existing_user_rows: number;
    invalid_rows: number;
  };
  rows: UserUploadRow[];
}

export interface UserUploadImportResult {
  status: string;
  message: string;
  filename: string;
  imported_count: number;
  skipped_count: number;
  imported_users: {
    excel_row: number;
    s_employee_id: string;
    s_user_name: string;
    s_email: string;
  }[];
  skipped_users: {
    excel_row: number;
    email: string;
    reason: string;
  }[];
}

export const previewUserUpload = async (
  file: File
): Promise<UserUploadPreview> => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await apiClient.post(
    "/api/users/upload/preview",
    formData
  );

  return response.data;
};

export const importUserUpload = async (
  file: File
): Promise<UserUploadImportResult> => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await apiClient.post(
    "/api/users/upload/import",
    formData
  );

  return response.data;
};