import apiClient from "./apiClient";

export interface DbTestResponse {
  status: string;
  message?: string;
}

export const testDatabaseConnection = async (): Promise<DbTestResponse> => {
  const response = await apiClient.get("/api/system/db-test");

  return response.data;
};