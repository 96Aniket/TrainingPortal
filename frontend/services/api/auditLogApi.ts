import apiClient from "./apiClient";


export interface AuditLog {
  n_audit_log_id: number;

  n_user_id: number | null;

  s_action: string | null;
  s_module: string | null;

  s_entity_type: string | null;
  s_entity_id: string | null;

  s_description: string | null;

  s_old_value: string | null;
  s_new_value: string | null;

  s_ip_address: string | null;

  dt_created_at: string | null;
}


export interface AuditLogsResponse {
  status: string;
  count: number;
  logs: AuditLog[];
}


export const getAuditLogs = async (): Promise<
  AuditLogsResponse
> => {

  const response =
    await apiClient.get<AuditLogsResponse>(
      "/api/audit-logs"
    );

  return response.data;
};