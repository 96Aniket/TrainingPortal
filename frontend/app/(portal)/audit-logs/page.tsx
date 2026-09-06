"use client";

import {
  Activity,
  Calendar,
  ChevronDown,
  ClipboardList,
  Eye,
  FileClock,
  RefreshCw,
  Search,
  User,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/services/api/authApi";

import {
  AuditLog,
  getAuditLogs,
} from "@/services/api/auditLogApi";


// ============================================================
// HELPERS
// ============================================================

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


function getActionClasses(
  action: string | null
): string {

  switch (
    action?.toUpperCase()
  ) {

    case "CREATE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "UPDATE":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "DELETE":
      return "bg-rose-50 text-rose-700 border-rose-200";

    case "DEACTIVATE":
      return "bg-rose-50 text-rose-700 border-rose-200";

    case "ACTIVATE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PUBLISH":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "LOGIN":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case "LOGOUT":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}


// ============================================================
// PAGE
// ============================================================

export default function AuditLogsPage() {

  const router = useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    accessDenied,
    setAccessDenied,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    logs,
    setLogs,
  ] = useState<AuditLog[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    actionFilter,
    setActionFilter,
  ] = useState("");

  const [
    moduleFilter,
    setModuleFilter,
  ] = useState("");

  const [
    selectedLog,
    setSelectedLog,
  ] = useState<AuditLog | null>(null);


  // ==========================================================
  // LOAD LOGS
  // ==========================================================

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
        await getAuditLogs();

      setLogs(
        response.logs || []
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
        "Unable to load audit logs."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  // ==========================================================
  // ADMIN ACCESS CHECK
  // ==========================================================

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


  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const actions = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map(
              (log) =>
                log.s_action
            )
            .filter(Boolean)
        )
      ).sort(),
    [logs]
  );


  const modules = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map(
              (log) =>
                log.s_module
            )
            .filter(Boolean)
        )
      ).sort(),
    [logs]
  );


  // ==========================================================
  // FILTERED LOGS
  // ==========================================================

  const filteredLogs =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();

      return logs.filter(
        (log) => {

          const matchesSearch =
            !searchValue ||
            [
              log.s_action,
              log.s_module,
              log.s_entity_type,
              log.s_entity_id,
              log.s_description,
              log.s_old_value,
              log.s_new_value,
              log.s_ip_address,
              String(
                log.n_user_id ?? ""
              ),
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      searchValue
                    )
              );

          const matchesAction =
            !actionFilter ||
            log.s_action
              ?.toUpperCase() ===
              actionFilter
                .toUpperCase();

          const matchesModule =
            !moduleFilter ||
            log.s_module
              ?.toUpperCase() ===
              moduleFilter
                .toUpperCase();

          return (
            matchesSearch &&
            matchesAction &&
            matchesModule
          );
        }
      );

    }, [
      logs,
      search,
      actionFilter,
      moduleFilter,
    ]);


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {

    const modulesCount =
      new Set(
        logs
          .map(
            (log) =>
              log.s_module
          )
          .filter(Boolean)
      ).size;

    const usersCount =
      new Set(
        logs
          .map(
            (log) =>
              log.n_user_id
          )
          .filter(
            (id) =>
              id !== null &&
              id !== undefined
          )
      ).size;

    const today =
      new Date();

    const todayCount =
      logs.filter(
        (log) => {

          if (!log.dt_created_at) {
            return false;
          }

          const date =
            new Date(
              log.dt_created_at
            );

          return (
            date.getFullYear() ===
              today.getFullYear() &&
            date.getMonth() ===
              today.getMonth() &&
            date.getDate() ===
              today.getDate()
          );
        }
      ).length;

    return {
      total: logs.length,
      modules: modulesCount,
      users: usersCount,
      today: todayCount,
    };

  }, [logs]);


  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (accessDenied) {

    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <FileClock size={20} />
          </div>

          <div>

            <h2 className="text-sm font-extrabold text-rose-800">
              Access Denied
            </h2>

            <p className="mt-1 text-sm font-medium text-rose-700">
              Only ADMIN users can access Audit Logs.
            </p>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="min-h-full">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileClock size={22} />
          </div>

          <div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Audit Logs
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Monitor system activities and user actions
            </p>

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
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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

              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Total Logs
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {summary.total}
              </p>

            </div>

            <ClipboardList
              size={24}
              className="text-indigo-500"
            />

          </div>

        </div>


        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Modules
              </p>

              <p className="mt-2 text-2xl font-extrabold text-blue-700">
                {summary.modules}
              </p>

            </div>

            <Activity
              size={24}
              className="text-blue-500"
            />

          </div>

        </div>


        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Users
              </p>

              <p className="mt-2 text-2xl font-extrabold text-violet-700">
                {summary.users}
              </p>

            </div>

            <User
              size={24}
              className="text-violet-500"
            />

          </div>

        </div>


        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Today
              </p>

              <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                {summary.today}
              </p>

            </div>

            <Calendar
              size={24}
              className="text-emerald-500"
            />

          </div>

        </div>

      </div>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_220px_auto]">

          {/* Search */}

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search action, module, description..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />

          </div>


          {/* Action */}

          <div className="relative">

            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(
                  event.target.value
                )
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >

              <option value="">
                All Actions
              </option>

              {actions.map(
                (action) => (
                  <option
                    key={action}
                    value={action || ""}
                  >
                    {action}
                  </option>
                )
              )}

            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>


          {/* Module */}

          <div className="relative">

            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(
                  event.target.value
                )
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >

              <option value="">
                All Modules
              </option>

              {modules.map(
                (module) => (
                  <option
                    key={module}
                    value={module || ""}
                  >
                    {module}
                  </option>
                )
              )}

            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>


          {/* Clear */}

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActionFilter("");
              setModuleFilter("");
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Clear
          </button>

        </div>

      </div>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">

        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50 px-6 py-5">

          <div>

            <h2 className="text-base font-extrabold text-slate-800">
              Activity History
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-400">
              Showing {filteredLogs.length} of{" "}
              {logs.length} records
            </p>

          </div>

        </div>


        {loading ? (

          <div className="p-14 text-center">

            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-indigo-400"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading audit logs...
            </p>

          </div>

        ) : filteredLogs.length === 0 ? (

          <div className="p-14 text-center">

            <FileClock
              size={38}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              No audit logs found.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1150px] text-left text-sm">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Module
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Entity
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    User ID
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredLogs.map(
                  (log) => (

                    <tr
                      key={
                        log.n_audit_log_id
                      }
                      className="border-b border-slate-100 transition-colors hover:bg-indigo-50/40"
                    >

                      <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
                        {formatDate(
                          log.dt_created_at
                        )}
                      </td>


                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getActionClasses(
                            log.s_action
                          )}`}
                        >
                          {log.s_action ||
                            "-"}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          {log.s_module ||
                            "-"}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-700">
                          {log.s_entity_type ||
                            "-"}
                        </div>

                        <div className="text-xs text-slate-400">
                          ID:{" "}
                          {log.s_entity_id ||
                            "-"}
                        </div>

                      </td>


                      <td className="px-5 py-4">

                        <span className="font-mono text-xs font-semibold text-slate-600">
                          {log.n_user_id ??
                            "-"}
                        </span>

                      </td>


                      <td className="max-w-[350px] px-5 py-4">

                        <div
                          className="truncate font-medium text-slate-700"
                          title={
                            log.s_description ||
                            ""
                          }
                        >
                          {log.s_description ||
                            "-"}
                        </div>

                      </td>


                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLog(
                              log
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >

                          <Eye
                            size={14}
                          />

                          View

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

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">


            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h3 className="text-lg font-extrabold text-slate-900">
                  Audit Log Details
                </h3>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Log ID #
                  {
                    selectedLog.n_audit_log_id
                  }
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>

            </div>


            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">


              <div>

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Date
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {formatDate(
                    selectedLog.dt_created_at
                  )}
                </p>

              </div>


              <div>

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Action
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getActionClasses(
                    selectedLog.s_action
                  )}`}
                >
                  {
                    selectedLog.s_action ||
                    "-"
                  }
                </span>

              </div>


              <div>

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Module
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_module ||
                    "-"
                  }
                </p>

              </div>


              <div>

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  User ID
                </p>

                <p className="mt-2 font-mono text-sm font-semibold text-slate-700">
                  {
                    selectedLog.n_user_id ??
                    "-"
                  }
                </p>

              </div>


              <div>

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Entity Type
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_entity_type ||
                    "-"
                  }
                </p>

              </div>


              <div>

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Entity ID
                </p>

                <p className="mt-2 font-mono text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_entity_id ||
                    "-"
                  }
                </p>

              </div>


              <div className="md:col-span-2">

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Description
                </p>

                <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                  {
                    selectedLog.s_description ||
                    "-"
                  }
                </div>

              </div>


              <div>

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  IP Address
                </p>

                <p className="mt-2 font-mono text-sm font-semibold text-slate-700">
                  {
                    selectedLog.s_ip_address ||
                    "-"
                  }
                </p>

              </div>


              <div className="md:col-span-2">

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Old Value
                </p>

                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                  {
                    selectedLog.s_old_value ||
                    "-"
                  }
                </pre>

              </div>


              <div className="md:col-span-2">

                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  New Value
                </p>

                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                  {
                    selectedLog.s_new_value ||
                    "-"
                  }
                </pre>

              </div>


            </div>

          </div>

        </div>

      )}

    </div>
  );
}