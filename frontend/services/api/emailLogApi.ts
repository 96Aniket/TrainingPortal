import apiClient from "./apiClient";

export interface EmailLog {
  n_email_log_id: number;
  n_email_template_id: number | null;

  n_training_id: number | null;
  n_user_id: number | null;

  s_email_type: string | null;

  s_from_email: string | null;
  s_to_email: string | null;
  s_cc_email: string | null;
  s_bcc_email: string | null;

  s_subject: string | null;
  s_status: string | null;
  s_message_id: string | null;

  dt_queued_at: string | null;
  dt_sent_at: string | null;
  dt_failed_at: string | null;

  s_failure_reason: string | null;

  dt_created_at: string | null;
  s_created_by: string | null;

  s_training_code: string | null;
  s_training_name: string | null;

  s_user_name: string | null;
  s_user_email: string | null;
}

export interface EmailLogSummary {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

export interface EmailLogsResponse {
  status: string;
  count: number;
  summary: EmailLogSummary;
  email_types: string[];
  logs: EmailLog[];
}

export interface EmailLogFilters {
  search?: string;
  status?: string;
  email_type?: string;
}

export const getEmailLogs = async (
  filters: EmailLogFilters = {}
): Promise<EmailLogsResponse> => {

  const response =
    await apiClient.get<EmailLogsResponse>(
      "/api/email-logs",
      {
        params: {
          search:
            filters.search || undefined,

          status:
            filters.status || undefined,

          email_type:
            filters.email_type || undefined
        }
      }
    );

  return response.data;
};