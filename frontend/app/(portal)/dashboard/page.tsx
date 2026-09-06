"use client";

import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  Eye,
  Filter,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getDashboard,
  DashboardMonitoringRow,
  DashboardSummary,
} from "@/services/api/dashboardApi";

export default function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [monitoring, setMonitoring] =
    useState<DashboardMonitoringRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  // ============================================================
  // MONITORING FILTERS
  // ============================================================

  const [monitoringSearch, setMonitoringSearch] =
    useState("");

  const [trainingFilter, setTrainingFilter] =
    useState("ALL");

  const [registrationFilter, setRegistrationFilter] =
    useState("ALL");

  const [attendanceFilter, setAttendanceFilter] =
    useState("ALL");

  const [resultFilter, setResultFilter] =
    useState("ALL");

  const [selectedParticipant, setSelectedParticipant] =
    useState<DashboardMonitoringRow | null>(null);

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadDashboard = async (
    showRefreshState = false
  ) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getDashboard();

      setSummary(response.summary);
      setMonitoring(response.monitoring || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Failed to load dashboard:",
        err
      );

      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // ============================================================
  // CALCULATED METRICS
  // ============================================================

  const metrics = useMemo(() => {
    if (!summary) {
      return {
        registrationRate: 0,
        attendanceRate: 0,
        assessmentEligibilityRate: 0,
        assessmentCompletionRate: 0,
        passRate: 0,
      };
    }

    const totalParticipants =
      summary.total_participants;

    const registrationRate =
      totalParticipants > 0
        ? Math.round(
            (summary.registration_completed /
              totalParticipants) *
              100
          )
        : 0;

    const attendanceRate =
      totalParticipants > 0
        ? Math.round(
            (summary.attendance_completed /
              totalParticipants) *
              100
          )
        : 0;

    const assessmentEligibilityRate =
      totalParticipants > 0
        ? Math.round(
            (summary.assessment_eligible /
              totalParticipants) *
              100
          )
        : 0;

    const assessmentCompletionRate =
      summary.assessment_eligible > 0
        ? Math.round(
            (summary.assessment_completed /
              summary.assessment_eligible) *
              100
          )
        : 0;

    const totalResults =
      summary.passed_count +
      summary.failed_count;

    const passRate =
      totalResults > 0
        ? Math.round(
            (summary.passed_count /
              totalResults) *
              100
          )
        : 0;

    return {
      registrationRate,
      attendanceRate,
      assessmentEligibilityRate,
      assessmentCompletionRate,
      passRate,
    };
  }, [summary]);

  // ============================================================
  // TRAINING OPTIONS
  // ============================================================

  const trainingOptions = useMemo(() => {
    const unique = new Map<
      number,
      {
        id: number;
        code: string;
        name: string;
      }
    >();

    monitoring.forEach((row) => {
      if (!unique.has(row.n_training_id)) {
        unique.set(row.n_training_id, {
          id: row.n_training_id,
          code: row.s_training_code || "",
          name: row.s_training_name || "",
        });
      }
    });

    return Array.from(unique.values()).sort(
      (a, b) =>
        `${a.code} ${a.name}`.localeCompare(
          `${b.code} ${b.name}`
        )
    );
  }, [monitoring]);

  // ============================================================
  // FILTERED MONITORING
  // ============================================================

  const filteredMonitoring = useMemo(() => {
    const searchValue =
      monitoringSearch.trim().toLowerCase();

    return monitoring.filter((row) => {
      // Search
      if (searchValue) {
        const searchableText = [
          row.s_employee_id,
          row.s_user_name,
          row.s_email,
          row.s_training_code,
          row.s_training_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (
          !searchableText.includes(searchValue)
        ) {
          return false;
        }
      }

      // Training
      if (
        trainingFilter !== "ALL" &&
        row.n_training_id.toString() !==
          trainingFilter
      ) {
        return false;
      }

      // Registration
      if (
        registrationFilter !== "ALL" &&
        row.s_registration_status !==
          registrationFilter
      ) {
        return false;
      }

      // Attendance
      if (
        attendanceFilter !== "ALL" &&
        row.s_attendance_status !==
          attendanceFilter
      ) {
        return false;
      }

      // Result
      if (resultFilter !== "ALL") {
        const currentResult =
          row.s_final_result
            ?.trim()
            .toUpperCase() || "PENDING";

        if (currentResult !== resultFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    monitoring,
    monitoringSearch,
    trainingFilter,
    registrationFilter,
    attendanceFilter,
    resultFilter,
  ]);

  // ============================================================
  // RESET FILTERS
  // ============================================================

  const resetMonitoringFilters = () => {
    setMonitoringSearch("");
    setTrainingFilter("ALL");
    setRegistrationFilter("ALL");
    setAttendanceFilter("ALL");
    setResultFilter("ALL");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-1">
        <div className="mb-7">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
              />
            )
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
              />
            )
          )}
        </div>

        <div className="mt-6 h-96 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !summary) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="mb-7">
          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Dashboard
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Training activity and performance
            overview
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
              <AlertCircle size={22} />
            </div>

            <div>
              <h2 className="font-bold text-rose-800">
                Dashboard data unavailable
              </h2>

              <p className="mt-1 text-sm text-rose-700">
                {error ||
                  "Unable to load dashboard data."}
              </p>

              <button
                type="button"
                onClick={() => loadDashboard()}
                className="mt-4 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 text-white shadow-lg shadow-indigo-200">
              <BarChart3 size={22} />
            </div>

            <div>
              <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                Dashboard
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Training activity and performance
                overview
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-500 shadow-sm md:flex">
              <Clock3 size={15} />

              Updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* ========================================================
          KPI CARDS
      ======================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Trainings"
          value={summary.total_trainings}
          subtitle="Active training programs"
          icon={<ClipboardCheck size={21} />}
          accent="indigo"
        />

        <StatCard
          title="Total Participants"
          value={summary.total_participants}
          subtitle="Training participants"
          icon={<Users size={21} />}
          accent="blue"
        />

        <StatCard
          title="Registration Completed"
          value={
            summary.registration_completed
          }
          subtitle={`${metrics.registrationRate}% completion rate`}
          icon={<UserCheck size={21} />}
          accent="violet"
        />

        <StatCard
          title="Total Assessments"
          value={summary.total_assessments}
          subtitle="Active assessments"
          icon={<Target size={21} />}
          accent="purple"
        />
      </div>

      {/* ========================================================
          LIFECYCLE OVERVIEW
      ======================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LifecycleCard
          title="Training Lifecycle"
          subtitle="Participant progress through training"
          items={[
            {
              label:
                "Registration emails sent",
              value:
                summary.registration_email_sent,
              total:
                summary.total_participants,
              icon: <Mail size={18} />,
              type: "blue",
            },
            {
              label:
                "Registration completed",
              value:
                summary.registration_completed,
              total:
                summary.total_participants,
              icon: <UserCheck size={18} />,
              type: "indigo",
            },
            {
              label:
                "Confirmation emails sent",
              value:
                summary.confirmation_email_sent,
              total:
                summary.registration_completed,
              icon: <CheckCircle2 size={18} />,
              type: "emerald",
            },
            {
              label:
                "Attendance completed",
              value:
                summary.attendance_completed,
              total:
                summary.registration_completed,
              icon: <Activity size={18} />,
              type: "violet",
            },
          ]}
        />

        <LifecycleCard
          title="Assessment Lifecycle"
          subtitle="Assessment participation and completion"
          items={[
            {
              label: "Assessment eligible",
              value:
                summary.assessment_eligible,
              total:
                summary.total_participants,
              icon: <Target size={18} />,
              type: "indigo",
            },
            {
              label:
                "Assessment emails sent",
              value:
                summary.assessment_email_sent,
              total:
                summary.assessment_eligible,
              icon: <Mail size={18} />,
              type: "blue",
            },
            {
              label:
                "Assessment attempted",
              value:
                summary.assessment_attempted,
              total:
                summary.assessment_eligible,
              icon: (
                <ClipboardCheck size={18} />
              ),
              type: "violet",
            },
            {
              label:
                "Assessment completed",
              value:
                summary.assessment_completed,
              total:
                summary.assessment_eligible,
              icon: (
                <CheckCircle2 size={18} />
              ),
              type: "emerald",
            },
          ]}
        />
      </div>

      {/* ========================================================
          PROGRESS
      ======================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ProgressCard
          title="Registration"
          value={
            summary.registration_completed
          }
          total={summary.total_participants}
          percentage={metrics.registrationRate}
          description="Participants completed registration"
          icon={<UserCheck size={20} />}
        />

        <ProgressCard
          title="Attendance"
          value={
            summary.attendance_completed
          }
          total={summary.total_participants}
          percentage={metrics.attendanceRate}
          description="Participants completed attendance"
          icon={<Activity size={20} />}
        />

        <ProgressCard
          title="Assessment"
          value={
            summary.assessment_completed
          }
          total={summary.assessment_eligible}
          percentage={
            metrics.assessmentCompletionRate
          }
          description="Eligible participants completed assessment"
          icon={<ClipboardCheck size={20} />}
        />
      </div>

      {/* ========================================================
          RESULTS
      ======================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Assessment Results
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Final assessment outcome
                  distribution
                </p>
              </div>

              <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm">
                <TrendingUp size={19} />
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <ResultRow
              label="Passed"
              value={summary.passed_count}
              total={summary.assessment_completed}
              icon={<CheckCircle2 size={18} />}
              type="success"
            />

            <ResultRow
              label="Failed"
              value={summary.failed_count}
              total={summary.assessment_completed}
              icon={<XCircle size={18} />}
              type="error"
            />

            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Overall Pass Rate
                  </p>

                  <p className="mt-1 text-3xl font-extrabold text-slate-900">
                    {metrics.passRate}%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium text-slate-400">
                    Completed
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-700">
                    {summary.assessment_completed}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
                  style={{
                    width: `${metrics.passRate}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-indigo-50 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Activity Snapshot
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Current dashboard activity
                </p>
              </div>

              <div className="rounded-xl bg-white p-2.5 text-violet-600 shadow-sm">
                <Activity size={19} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <MiniStat
              label="Assessment Eligible"
              value={
                summary.assessment_eligible
              }
              icon={<Target size={17} />}
            />

            <MiniStat
              label="Attempts"
              value={
                summary.assessment_attempted
              }
              icon={
                <ClipboardCheck size={17} />
              }
            />

            <MiniStat
              label="Reattempts"
              value={summary.reattempted}
              icon={<RefreshCw size={17} />}
            />

            <MiniStat
              label="Completed"
              value={
                summary.assessment_completed
              }
              icon={
                <CheckCircle2 size={17} />
              }
            />

            <MiniStat
              label="Passed"
              value={summary.passed_count}
              icon={
                <TrendingUp size={17} />
              }
            />

            <MiniStat
              label="Failed"
              value={summary.failed_count}
              icon={<XCircle size={17} />}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          EMAIL ACTIVITY
      ======================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Email Activity
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Training communication status
              </p>
            </div>

            <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm">
              <Mail size={19} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <EmailActivityCard
            title="Registration Emails"
            value={
              summary.registration_email_sent
            }
            total={
              summary.total_participants
            }
          />

          <EmailActivityCard
            title="Confirmation Emails"
            value={
              summary.confirmation_email_sent
            }
            total={
              summary.registration_completed
            }
          />

          <EmailActivityCard
            title="Assessment Emails"
            value={
              summary.assessment_email_sent
            }
            total={
              summary.assessment_eligible
            }
          />
        </div>
      </div>

      {/* ========================================================
          PARTICIPANT MONITORING
      ======================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        {/* HEADER */}

        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
                  <Users size={20} />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    Participant Monitoring
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Monitor each participant through the complete training lifecycle
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                {filteredMonitoring.length}{" "}
                of {monitoring.length}
              </span>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}

        <div className="border-b border-slate-200 bg-slate-50/70 p-5">
          <div className="grid gap-3 xl:grid-cols-5">
            {/* Search */}

            <div className="relative xl:col-span-2">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400"
              />

              <input
                type="text"
                value={monitoringSearch}
                onChange={(event) =>
                  setMonitoringSearch(
                    event.target.value
                  )
                }
                placeholder="Search employee, name, email or training..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {/* Training */}

            <FilterSelect
              value={trainingFilter}
              onChange={setTrainingFilter}
              icon={<Filter size={15} />}
              options={[
                {
                  value: "ALL",
                  label: "All Trainings",
                },
                ...trainingOptions.map(
                  (training) => ({
                    value:
                      training.id.toString(),
                    label: `${training.code} - ${training.name}`,
                  })
                ),
              ]}
            />

            {/* Registration */}

            <FilterSelect
              value={registrationFilter}
              onChange={setRegistrationFilter}
              options={[
                {
                  value: "ALL",
                  label: "All Registration",
                },
                {
                  value: "REGISTERED",
                  label: "Registered",
                },
                {
                  value: "AVAILABLE",
                  label: "Available",
                },
              ]}
            />

            {/* Attendance */}

            <FilterSelect
              value={attendanceFilter}
              onChange={setAttendanceFilter}
              options={[
                {
                  value: "ALL",
                  label: "All Attendance",
                },
                {
                  value: "COMPLETED",
                  label: "Completed",
                },
                {
                  value: "NOT_PROCESSED",
                  label: "Not Processed",
                },
              ]}
            />
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Result filter */}

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Result
              </span>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    value: "ALL",
                    label: "All",
                  },
                  {
                    value: "PASS",
                    label: "Passed",
                  },
                  {
                    value: "FAIL",
                    label: "Failed",
                  },
                  {
                    value: "PENDING",
                    label: "Pending",
                  },
                ].map((option) => {
                  const active =
                    resultFilter ===
                    option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setResultFilter(
                          option.value
                        )
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset */}

            <button
              type="button"
              onClick={resetMonitoringFilters}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          </div>
        </div>

        {/* TABLE */}

        {filteredMonitoring.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Search size={28} />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-700">
              No participants found
            </h3>

            <p className="mt-1 max-w-md text-xs font-medium text-slate-400">
              No participant matches the
              selected search and filters.
            </p>

            <button
              type="button"
              onClick={resetMonitoringFilters}
              className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1550px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50/70 to-blue-50">
                <tr>
                  <th className="sticky left-0 z-10 min-w-[210px] bg-indigo-50 px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Participant
                  </th>

                  <th className="min-w-[230px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Training
                  </th>

                  <th className="min-w-[145px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Registration
                  </th>

                  <th className="min-w-[150px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Registration Email
                  </th>

                  <th className="min-w-[150px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Confirmation
                  </th>

                  <th className="min-w-[160px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Attendance
                  </th>

                  <th className="min-w-[120px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Minutes
                  </th>

                  <th className="min-w-[145px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Assessment
                  </th>

                  <th className="min-w-[100px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Attempts
                  </th>

                  <th className="min-w-[110px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Reattempts
                  </th>

                  <th className="min-w-[100px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Score
                  </th>

                  <th className="min-w-[120px] px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Result
                  </th>

                  <th className="sticky right-0 z-10 min-w-[90px] bg-indigo-50 px-5 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredMonitoring.map(
                  (row) => {
                    const attendanceMinutes =
                      row.n_attendance_minutes ??
                      0;

                    const minimumMinutes =
                      row.n_minimum_attendance_minutes ??
                      0;

                    const attendanceComplete =
                      row.s_attendance_status
                        ?.trim()
                        .toUpperCase() ===
                      "COMPLETED";

                    const result =
                      row.s_final_result
                        ?.trim()
                        .toUpperCase() ||
                      "PENDING";

                    return (
                      <tr
                        key={
                          row.n_participant_id
                        }
                        className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-indigo-50/40"
                      >
                        {/* PARTICIPANT */}

                        <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-extrabold text-indigo-700">
                              {getInitials(
                                row.s_user_name
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-800">
                                {row.s_user_name ||
                                  "-"}
                              </p>

                              <p className="truncate text-xs font-medium text-slate-400">
                                {row.s_employee_id ||
                                  "-"}
                              </p>

                              <p className="max-w-[150px] truncate text-xs text-slate-400">
                                {row.s_email ||
                                  "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* TRAINING */}

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">
                            {row.s_training_code ||
                              "-"}
                          </p>

                          <p className="mt-0.5 max-w-[190px] truncate text-xs font-medium text-slate-500">
                            {row.s_training_name ||
                              "-"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              row.d_training_date
                            )}
                          </p>
                        </td>

                        {/* REGISTRATION */}

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={
                              row.s_registration_status
                            }
                            type="registration"
                          />

                          {row.dt_registered_at && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatDateTime(
                                row.dt_registered_at
                              )}
                            </p>
                          )}
                        </td>

                        {/* REGISTRATION EMAIL */}

                        <td className="px-5 py-4">
                          <EmailStatusBadge
                            value={
                              row.s_registration_email_status
                            }
                          />

                          {row.dt_registration_email_sent_at && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatDateTime(
                                row.dt_registration_email_sent_at
                              )}
                            </p>
                          )}
                        </td>

                        {/* CONFIRMATION */}

                        <td className="px-5 py-4">
                          <EmailStatusBadge
                            value={
                              row.s_confirmation_email_status
                            }
                          />

                          {row.dt_confirmation_email_sent_at && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatDateTime(
                                row.dt_confirmation_email_sent_at
                              )}
                            </p>
                          )}
                        </td>

                        {/* ATTENDANCE */}

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={
                              row.s_attendance_status
                            }
                            type="attendance"
                          />

                          {attendanceComplete &&
                            minimumMinutes > 0 && (
                              <p className="mt-1 text-[11px] font-medium text-slate-400">
                                {attendanceMinutes} /
                                {minimumMinutes} min
                              </p>
                            )}
                        </td>

                        {/* MINUTES */}

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-700">
                            {row.n_attendance_minutes ??
                              "-"}
                          </p>

                          <p className="text-[11px] text-slate-400">
                            {minimumMinutes > 0
                              ? `Required ${minimumMinutes}`
                              : "No minimum"}
                          </p>
                        </td>

                        {/* ASSESSMENT */}

                        <td className="px-5 py-4">
                          {row.n_assessment_eligible ===
                          1 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                              <CheckCircle2
                                size={13}
                              />
                              Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                              Not Eligible
                            </span>
                          )}

                          {row.n_assessment_eligible ===
                            1 && (
                            <div className="mt-1">
                              <EmailStatusBadge
                                value={
                                  row.s_assessment_email_status
                                }
                              />
                            </div>
                          )}
                        </td>

                        {/* ATTEMPTS */}

                        <td className="px-5 py-4 text-center">
                          <span className="font-extrabold text-slate-800">
                            {row.n_attempt_count}
                          </span>
                        </td>

                        {/* REATTEMPTS */}

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`font-extrabold ${
                              row.n_reattempt_count >
                              0
                                ? "text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            {row.n_reattempt_count}
                          </span>
                        </td>

                        {/* SCORE */}

                        <td className="px-5 py-4">
                          {row.n_final_score !==
                          null ? (
                            <div>
                              <p className="font-extrabold text-slate-800">
                                {row.n_final_score.toFixed(
                                  2
                                )}
                              </p>

                              {row.n_passing_score !==
                                null && (
                                <p className="text-[11px] text-slate-400">
                                  Pass{" "}
                                  {row.n_passing_score}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              Not completed
                            </span>
                          )}
                        </td>

                        {/* RESULT */}

                        <td className="px-5 py-4">
                          <ResultBadge
                            result={result}
                          />
                        </td>

                        {/* ACTION */}

                        <td className="sticky right-0 z-10 border-l border-slate-100 bg-white px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedParticipant(
                                row
                              )
                            }
                            title="View participant details"
                            className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE FOOTER */}

        {filteredMonitoring.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3">
            <div className="flex flex-col gap-2 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing{" "}
                <strong className="text-slate-700">
                  {filteredMonitoring.length}
                </strong>{" "}
                participants
              </span>

              <span className="flex items-center gap-1.5">
                <ChevronDown
                  size={14}
                  className="rotate-[-90deg]"
                />
                Scroll horizontally to view all
                columns
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          PARTICIPANT DETAILS MODAL
      ======================================================== */}

      {selectedParticipant && (
        <ParticipantDetailsModal
          participant={selectedParticipant}
          onClose={() =>
            setSelectedParticipant(null)
          }
        />
      )}
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  accent:
    | "indigo"
    | "blue"
    | "violet"
    | "purple";
}) {
  const accentStyles = {
    indigo: {
      icon: "bg-indigo-100 text-indigo-600",
      value: "text-indigo-950",
    },
    blue: {
      icon: "bg-blue-100 text-blue-600",
      value: "text-blue-950",
    },
    violet: {
      icon: "bg-violet-100 text-violet-600",
      value: "text-violet-950",
    },
    purple: {
      icon: "bg-purple-100 text-purple-600",
      value: "text-purple-950",
    },
  };

  const style = accentStyles[accent];

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-extrabold ${style.value}`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${style.icon} transition-transform group-hover:scale-105`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LIFECYCLE CARD
// ============================================================

function LifecycleCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: {
    label: string;
    value: number;
    total: number;
    icon: ReactNode;
    type:
      | "blue"
      | "indigo"
      | "emerald"
      | "violet";
  }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
        <h2 className="text-base font-extrabold text-slate-800">
          {title}
        </h2>

        <p className="mt-1 text-xs font-medium text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="space-y-5 p-6">
        {items.map((item) => {
          const percentage =
            item.total > 0
              ? Math.min(
                  100,
                  Math.round(
                    (item.value /
                      item.total) *
                      100
                  )
                )
              : 0;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                    {item.icon}
                  </div>

                  <p className="truncate text-sm font-semibold text-slate-700">
                    {item.label}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    {item.value}
                  </span>

                  <span className="text-xs font-medium text-slate-400">
                    / {item.total}
                  </span>
                </div>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.type === "blue"
                      ? "bg-blue-500"
                      : item.type === "indigo"
                        ? "bg-indigo-500"
                        : item.type === "emerald"
                          ? "bg-emerald-500"
                          : "bg-violet-500"
                  }`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <div className="mt-1 text-right text-xs font-semibold text-slate-400">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PROGRESS CARD
// ============================================================

function ProgressCard({
  title,
  value,
  total,
  percentage,
  description,
  icon,
}: {
  title: string;
  value: number;
  total: number;
  percentage: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-extrabold text-slate-800">
            {title}
          </h3>

          <p className="text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-3xl font-extrabold text-slate-900">
            {percentage}%
          </p>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {value} of {total}
          </p>
        </div>

        <TrendingUp
          className="text-indigo-500"
          size={24}
        />
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 transition-all duration-700"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// RESULT ROW
// ============================================================

function ResultRow({
  label,
  value,
  total,
  icon,
  type,
}: {
  label: string;
  value: number;
  total: number;
  icon: ReactNode;
  type: "success" | "error";
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  const styles =
    type === "success"
      ? {
          icon: "bg-emerald-100 text-emerald-600",
          bar: "bg-emerald-500",
        }
      : {
          icon: "bg-rose-100 text-rose-600",
          bar: "bg-rose-500",
        };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2 ${styles.icon}`}
          >
            {icon}
          </div>

          <span className="text-sm font-semibold text-slate-700">
            {label}
          </span>
        </div>

        <div>
          <span className="text-sm font-extrabold text-slate-800">
            {value}
          </span>

          <span className="ml-1 text-xs font-medium text-slate-400">
            ({percentage}%)
          </span>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${styles.bar}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// MINI STAT
// ============================================================

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white p-2 text-indigo-600 shadow-sm">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EMAIL ACTIVITY CARD
// ============================================================

function EmailActivityCard({
  title,
  value,
  total,
}: {
  title: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.round((value / total) * 100)
        )
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">
          {title}
        </p>

        <Mail
          size={18}
          className="text-indigo-500"
        />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl font-extrabold text-slate-900">
          {value}
        </p>

        <p className="text-xs font-semibold text-slate-400">
          {percentage}%
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs font-medium text-slate-400">
        {value} sent out of {total}
      </p>
    </div>
  );
}

// ============================================================
// FILTER SELECT
// ============================================================

function FilterSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  icon?: ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-indigo-400">
          {icon}
        </div>
      )}

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 ${
          icon ? "pl-10" : "pl-3.5"
        }`}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  value,
  type,
}: {
  value: string | null;
  type: "registration" | "attendance";
}) {
  const normalized =
    value?.trim().toUpperCase() ||
    "PENDING";

  let classes =
    "border-slate-200 bg-slate-100 text-slate-500";

  let label = normalized.replaceAll(
    "_",
    " "
  );

  if (
    normalized === "REGISTERED" ||
    normalized === "COMPLETED"
  ) {
    classes =
      type === "attendance"
        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
        : "border-indigo-200 bg-indigo-100 text-indigo-700";
  } else if (
    normalized === "AVAILABLE" ||
    normalized === "NOT_PROCESSED"
  ) {
    classes =
      "border-amber-200 bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {label}
    </span>
  );
}

// ============================================================
// EMAIL STATUS BADGE
// ============================================================

function EmailStatusBadge({
  value,
}: {
  value: string | null;
}) {
  const normalized =
    value?.trim().toUpperCase() ||
    "PENDING";

  let classes =
    "border-slate-200 bg-slate-100 text-slate-500";

  if (normalized === "SUCCESS") {
    classes =
      "border-emerald-200 bg-emerald-100 text-emerald-700";
  } else if (normalized === "FAILED") {
    classes =
      "border-rose-200 bg-rose-100 text-rose-700";
  } else if (
    normalized === "QUEUED" ||
    normalized === "SENDING"
  ) {
    classes =
      "border-amber-200 bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}
    >
      {normalized}
    </span>
  );
}

// ============================================================
// RESULT BADGE
// ============================================================

function ResultBadge({
  result,
}: {
  result: string;
}) {
  if (result === "PASS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 size={13} />
        PASS
      </span>
    );
  }

  if (result === "FAIL") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
        <XCircle size={13} />
        FAIL
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
      <Clock3 size={13} />
      Pending
    </span>
  );
}

// ============================================================
// PARTICIPANT DETAILS MODAL
// ============================================================

function ParticipantDetailsModal({
  participant,
  onClose,
}: {
  participant: DashboardMonitoringRow;
  onClose: () => void;
}) {
  const result =
    participant.s_final_result
      ?.trim()
      .toUpperCase() || "PENDING";

  const attendanceMinutes =
    participant.n_attendance_minutes ?? 0;

  const minimumMinutes =
    participant.n_minimum_attendance_minutes ??
    0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/30">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-extrabold text-indigo-700">
              {getInitials(
                participant.s_user_name
              )}
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {participant.s_user_name ||
                  "-"}
              </h2>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {participant.s_employee_id ||
                  "-"}{" "}
                ·{" "}
                {participant.s_email || "-"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-indigo-100 hover:text-indigo-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}

        <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Training */}

            <DetailSection
              title="Training"
              icon={<ClipboardCheck size={18} />}
            >
              <DetailItem
                label="Training Code"
                value={
                  participant.s_training_code
                }
              />

              <DetailItem
                label="Training Name"
                value={
                  participant.s_training_name
                }
              />

              <DetailItem
                label="Training Date"
                value={formatDate(
                  participant.d_training_date
                )}
              />

              <DetailItem
                label="Training Status"
                value={
                  participant.s_training_status
                }
              />
            </DetailSection>

            {/* Registration */}

            <DetailSection
              title="Registration"
              icon={<UserCheck size={18} />}
            >
              <DetailItem
                label="Registration Status"
                value={
                  participant.s_registration_status
                }
              />

              <DetailItem
                label="Registration Email"
                value={
                  participant.s_registration_email_status
                }
              />

              <DetailItem
                label="Registration Email Sent"
                value={formatDateTime(
                  participant.dt_registration_email_sent_at
                )}
              />

              <DetailItem
                label="Registered At"
                value={formatDateTime(
                  participant.dt_registered_at
                )}
              />
            </DetailSection>

            {/* Confirmation */}

            <DetailSection
              title="Confirmation"
              icon={<Mail size={18} />}
            >
              <DetailItem
                label="Email Status"
                value={
                  participant.s_confirmation_email_status
                }
              />

              <DetailItem
                label="Email Sent"
                value={formatDateTime(
                  participant.dt_confirmation_email_sent_at
                )}
              />
            </DetailSection>

            {/* Attendance */}

            <DetailSection
              title="Attendance"
              icon={<Activity size={18} />}
            >
              <DetailItem
                label="Attendance Status"
                value={
                  participant.s_attendance_status
                }
              />

              <DetailItem
                label="Attendance Minutes"
                value={
                  participant.n_attendance_minutes !==
                  null
                    ? `${attendanceMinutes} minutes`
                    : "-"
                }
              />

              <DetailItem
                label="Minimum Required"
                value={
                  minimumMinutes > 0
                    ? `${minimumMinutes} minutes`
                    : "-"
                }
              />

              <DetailItem
                label="Processed At"
                value={formatDateTime(
                  participant.dt_attendance_processed_at
                )}
              />
            </DetailSection>

            {/* Assessment */}

            <DetailSection
              title="Assessment"
              icon={
                <ClipboardCheck size={18} />
              }
            >
              <DetailItem
                label="Eligibility"
                value={
                  participant.n_assessment_eligible ===
                  1
                    ? "Eligible"
                    : "Not Eligible"
                }
              />

              <DetailItem
                label="Assessment Email"
                value={
                  participant.s_assessment_email_status
                }
              />

              <DetailItem
                label="Attempt Count"
                value={
                  participant.n_attempt_count.toString()
                }
              />

              <DetailItem
                label="Reattempt Count"
                value={
                  participant.n_reattempt_count.toString()
                }
              />
            </DetailSection>

            {/* Result */}

            <DetailSection
              title="Final Result"
              icon={<Target size={18} />}
            >
              <DetailItem
                label="Final Score"
                value={
                  participant.n_final_score !==
                  null
                    ? participant.n_final_score.toFixed(
                        2
                      )
                    : "Not completed"
                }
              />

              <DetailItem
                label="Passing Score"
                value={
                  participant.n_passing_score !==
                  null
                    ? participant.n_passing_score.toFixed(
                        2
                      )
                    : "-"
                }
              />

              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-slate-400">
                  Result
                </p>

                <ResultBadge
                  result={result}
                />
              </div>
            </DetailSection>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL SECTION
// ============================================================

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
          {icon}
        </div>

        <h3 className="text-sm font-extrabold text-slate-800">
          {title}
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-5">
      <span className="text-xs font-medium text-slate-400">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-xs font-bold text-slate-700">
        {value || "-"}
      </span>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(
  name: string | null
): string {
  if (!name?.trim()) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

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

  return date.toLocaleDateString();
}

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}