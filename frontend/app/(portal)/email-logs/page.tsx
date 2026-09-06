"use client";

import {
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getCurrentUser,
} from "@/services/api/authApi";

import {
  EmailLog,
  EmailLogSummary,
  getEmailLogs,
} from "@/services/api/emailLogApi";


const EMPTY_SUMMARY: EmailLogSummary = {
  total: 0,
  success: 0,
  failed: 0,
  pending: 0,
};


function formatDate(
  value: string | null
): string {

  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}


function getStatusClasses(
  status: string | null
) {

  switch (
    status?.toUpperCase()
  ) {

    case "SUCCESS":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "border border-rose-200 bg-rose-50 text-rose-700";

    case "SENDING":
      return "border border-blue-200 bg-blue-50 text-blue-700";

    case "QUEUED":
      return "border border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
}


export default function EmailLogsPage() {

  const router = useRouter();

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    refreshing,
    setRefreshing
  ] = useState(false);

  const [
    accessDenied,
    setAccessDenied
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    logs,
    setLogs
  ] = useState<EmailLog[]>([]);

  const [
    summary,
    setSummary
  ] = useState<EmailLogSummary>(
    EMPTY_SUMMARY
  );

  const [
    emailTypes,
    setEmailTypes
  ] = useState<string[]>([]);

  const [
    search,
    setSearch
  ] = useState("");

  const [
    status,
    setStatus
  ] = useState("");

  const [
    emailType,
    setEmailType
  ] = useState("");

  const [
    selectedLog,
    setSelectedLog
  ] = useState<EmailLog | null>(null);


  const loadLogs = async (
    showRefresh = false
  ) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await getEmailLogs({
          search,
          status,
          email_type: emailType,
        });

      setLogs(
        response.logs || []
      );

      setSummary(
        response.summary ||
        EMPTY_SUMMARY
      );

      setEmailTypes(
        response.email_types || []
      );

    } catch (err: any) {

      if (
        err?.response?.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (
        err?.response?.status === 403
      ) {
        setAccessDenied(true);
        return;
      }

      setError(
        err?.response?.data?.detail ||
        "Unable to load email logs."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {

    const checkAccess =
      async () => {

        try {

          const currentUser =
            await getCurrentUser();

          const role =
            currentUser
              .s_role_name
              ?.trim()
              .toUpperCase();

          if (role !== "ADMIN") {
            setAccessDenied(true);
            setLoading(false);
            return;
          }

          await loadLogs();

        } catch (err: any) {

          if (
            err?.response?.status === 401
          ) {
            router.replace("/login");
            return;
          }

          setAccessDenied(true);
          setLoading(false);
        }
      };

    checkAccess();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const visibleLogs = useMemo(
    () => logs,
    [logs]
  );


  if (accessDenied) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
        Access denied. Only ADMIN users can access Email Logs.
      </div>
    );
  }


  return (
    <div className="min-h-full">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <Mail size={22} />
            </div>

            <div>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Email Logs
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Monitor all training portal emails
              </p>

            </div>

          </div>

        </div>


        <button
          type="button"
          onClick={() =>
            loadLogs(true)
          }
          disabled={
            loading ||
            refreshing
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>

      )}


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Emails
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {summary.total}
              </p>

            </div>

            <Mail className="text-cyan-500" size={24} />

          </div>

        </div>


        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Successful
              </p>

              <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                {summary.success}
              </p>

            </div>

            <CheckCircle2
              className="text-emerald-500"
              size={24}
            />

          </div>

        </div>


        <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Failed
              </p>

              <p className="mt-2 text-2xl font-extrabold text-rose-700">
                {summary.failed}
              </p>

            </div>

            <XCircle
              className="text-rose-500"
              size={24}
            />

          </div>

        </div>


        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pending
              </p>

              <p className="mt-2 text-2xl font-extrabold text-amber-700">
                {summary.pending}
              </p>

            </div>

            <Clock3
              className="text-amber-500"
              size={24}
            />

          </div>

        </div>

      </div>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_250px_auto]">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400"
            />

            <input
              type="text"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(
                event
              ) => {

                if (
                  event.key === "Enter"
                ) {
                  loadLogs();
                }

              }}
              placeholder="Search recipient, subject, type..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />

          </div>


          <select
            value={status}
            onChange={(event) => {

              setStatus(
                event.target.value
              );

            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          >

            <option value="">
              All Status
            </option>

            <option value="SUCCESS">
              Success
            </option>

            <option value="FAILED">
              Failed
            </option>

            <option value="QUEUED">
              Queued
            </option>

            <option value="SENDING">
              Sending
            </option>

          </select>


          <select
            value={emailType}
            onChange={(event) => {

              setEmailType(
                event.target.value
              );

            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          >

            <option value="">
              All Email Types
            </option>

            {emailTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}

          </select>


          <button
            type="button"
            onClick={() =>
              loadLogs()
            }
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Apply
          </button>

        </div>

      </div>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">

        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-6 py-5">

          <div>

            <h2 className="text-base font-extrabold text-slate-800">
              Email History
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-400">
              {visibleLogs.length} records
            </p>

          </div>

        </div>


        {loading ? (

          <div className="p-14 text-center text-sm font-medium text-slate-500">
            Loading email logs...
          </div>

        ) : visibleLogs.length === 0 ? (

          <div className="p-14 text-center">

            <Mail
              size={38}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              No email logs found.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Recipient
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Email Type
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Subject
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Training
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {visibleLogs.map(
                  (log) => (

                    <tr
                      key={
                        log.n_email_log_id
                      }
                      className="border-b border-slate-100 transition-colors hover:bg-cyan-50/40"
                    >

                      <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
                        {formatDate(
                          log.dt_created_at
                        )}
                      </td>


                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-800">
                          {log.s_user_name ||
                            "-"}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-400">
                          {log.s_to_email ||
                            "-"}
                        </div>

                      </td>


                      <td className="px-5 py-4">

                        <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                          {log.s_email_type ||
                            "-"}
                        </span>

                      </td>


                      <td className="max-w-[300px] px-5 py-4">

                        <div
                          className="truncate font-medium text-slate-700"
                          title={
                            log.s_subject ||
                            ""
                          }
                        >
                          {log.s_subject ||
                            "-"}
                        </div>

                      </td>


                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-700">
                          {
                            log.s_training_name ||
                            "-"
                          }
                        </div>

                        <div className="text-xs text-slate-400">
                          {
                            log.s_training_code ||
                            "-"
                          }
                        </div>

                      </td>


                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                            log.s_status
                          )}`}
                        >
                          {
                            log.s_status ||
                            "-"
                          }
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLog(
                              log
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                        >
                          View Details
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      {selectedLog && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h3 className="text-lg font-extrabold text-slate-900">
                  Email Details
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Log ID #
                  {
                    selectedLog.n_email_log_id
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>

            </div>


            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                    selectedLog.s_status
                  )}`}
                >
                  {
                    selectedLog.s_status ||
                    "-"
                  }
                </span>
              </div>


              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Type
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_email_type ||
                    "-"
                  }
                </p>
              </div>


              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recipient
                </p>

                <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_to_email ||
                    "-"
                  }
                </p>
              </div>


              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  CC
                </p>

                <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_cc_email ||
                    "-"
                  }
                </p>
              </div>


              <div className="md:col-span-2">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subject
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_subject ||
                    "-"
                  }
                </p>

              </div>


              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Training
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_training_name ||
                    "-"
                  }
                </p>

                <p className="text-xs text-slate-400">
                  {
                    selectedLog.s_training_code ||
                    "-"
                  }
                </p>

              </div>


              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  User
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_user_name ||
                    "-"
                  }
                </p>

                <p className="text-xs text-slate-400">
                  {
                    selectedLog.s_user_email ||
                    selectedLog.s_to_email ||
                    "-"
                  }
                </p>

              </div>


              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Queued At
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {
                    formatDate(
                      selectedLog.dt_queued_at
                    )
                  }
                </p>

              </div>


              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sent At
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {
                    formatDate(
                      selectedLog.dt_sent_at
                    )
                  }
                </p>

              </div>


              <div className="md:col-span-2">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Message ID
                </p>

                <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-600">
                  {
                    selectedLog.s_message_id ||
                    "-"
                  }
                </p>

              </div>


              {selectedLog.s_failure_reason && (

                <div className="md:col-span-2">

                  <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    Failure Reason
                  </p>

                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {
                      selectedLog.s_failure_reason
                    }
                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}