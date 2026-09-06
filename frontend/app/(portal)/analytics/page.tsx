"use client";

import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  Mail,
  RefreshCw,
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
  getAnalytics,
  AnalyticsResponse,
  TrainingPerformance,
  AssessmentPerformance,
  AnalyticsFilters,
} from "@/services/api/analyticsApi";

export default function AnalyticsPage() {
  const [data, setData] =
    useState<AnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

      // ============================================================
    // ANALYTICS FILTERS
    // ============================================================

    const [trainingFilter, setTrainingFilter] =
        useState<string>("ALL");

    const [dateFrom, setDateFrom] =
        useState<string>("");

    const [dateTo, setDateTo] =
        useState<string>("");

    const [appliedFilters, setAppliedFilters] =
        useState<AnalyticsFilters>({});

    const [availableTrainings, setAvailableTrainings] =
        useState<TrainingPerformance[]>([]);

  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

    const loadAnalytics = async (
        showRefreshState = false,
        filters?: AnalyticsFilters
    ) => {
        try {
        if (showRefreshState) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        const response = await getAnalytics(
            filters
        );

        setData(response);

        // Keep the complete training list available
        // for the filter dropdown after filtering.
        if (
            Object.keys(filters || {}).length === 0
        ) {
            setAvailableTrainings(
            response.training_performance
            );
        }

        setLastUpdated(new Date());
        } catch (err) {
        console.error(
            "Failed to load analytics:",
            err
        );

        setError(
            "Unable to load analytics data."
        );
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
    };

  useEffect(() => {
    loadAnalytics();
  }, []);

    // ============================================================
    // APPLY FILTERS
    // ============================================================

    const handleApplyFilters = async () => {
        if (
        dateFrom &&
        dateTo &&
        dateFrom > dateTo
        ) {
        setError(
            "From date cannot be later than To date."
        );

        return;
        }

        const filters: AnalyticsFilters = {};

        if (trainingFilter !== "ALL") {
        filters.training_id =
            Number(trainingFilter);
        }

        if (dateFrom) {
        filters.date_from = dateFrom;
        }

        if (dateTo) {
        filters.date_to = dateTo;
        }

        setAppliedFilters(filters);

        await loadAnalytics(true, filters);
    };

    // ============================================================
    // RESET FILTERS
    // ============================================================

    const handleResetFilters = async () => {
        setTrainingFilter("ALL");
        setDateFrom("");
        setDateTo("");
        setAppliedFilters({});

        await loadAnalytics(true, {});
    };

  // ============================================================
  // SORTED TRAININGS
  // ============================================================

  const sortedTrainings = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.training_performance].sort(
      (a, b) =>
        (b.n_participants || 0) -
        (a.n_participants || 0)
    );
  }, [data]);

  // ============================================================
  // BEST PERFORMING TRAINING
  // ============================================================

  const bestTraining = useMemo(() => {
    const completedTrainings =
      sortedTrainings.filter(
        (training) =>
          training.n_passed +
            training.n_failed >
          0
      );

    if (completedTrainings.length === 0) {
      return null;
    }

    return completedTrainings.reduce(
      (
        best: TrainingPerformance,
        current
      ) =>
        current.pass_rate > best.pass_rate
          ? current
          : best
    );
  }, [sortedTrainings]);

  // ============================================================
  // ASSESSMENT SUMMARY
  // ============================================================

  const assessmentTotals = useMemo(() => {
    if (!data) {
      return {
        passed: 0,
        failed: 0,
        attempted: 0,
      };
    }

    const passed =
      data.assessment_performance.reduce(
        (sum, item) =>
          sum + item.n_passed,
        0
      );

    const failed =
      data.assessment_performance.reduce(
        (sum, item) =>
          sum + item.n_failed,
        0
      );

    return {
      passed,
      failed,
      attempted: passed + failed,
    };
  }, [data]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-1">
        <div className="mb-7">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
              />
            )
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />

          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>

        <div className="mt-6 h-96 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !data) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="mb-7">
          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Training Analytics
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Training performance and insights
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
              <AlertCircle size={22} />
            </div>

            <div>
              <h2 className="font-bold text-rose-800">
                Analytics data unavailable
              </h2>

              <p className="mt-1 text-sm text-rose-700">
                {error ||
                  "Unable to load analytics data."}
              </p>

              <button
                type="button"
                onClick={() => loadAnalytics()}
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

  const {
    overview,
    rates,
    score_analytics,
    attendance_analytics,
    email_analytics,
  } = data;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 text-white shadow-lg shadow-indigo-200">
            <BarChart3 size={22} />
          </div>

          <div>
            <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Training Analytics
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Training performance, participation
              and assessment insights
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Training Filter */}

            <select
                value={trainingFilter}
                onChange={(event) =>
                setTrainingFilter(
                    event.target.value
                )
                }
                disabled={refreshing}
                className="min-w-[190px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <option value="ALL">
                All Trainings
                </option>

                {availableTrainings.map(
                (training) => (
                    <option
                    key={training.n_training_id}
                    value={training.n_training_id}
                    >
                    {training.s_training_code} -{" "}
                    {training.s_training_name}
                    </option>
                )
                )}
            </select>

            {/* From Date */}

            <input
                type="date"
                value={dateFrom}
                onChange={(event) =>
                setDateFrom(event.target.value)
                }
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {/* To Date */}

            <input
                type="date"
                value={dateTo}
                onChange={(event) =>
                setDateTo(event.target.value)
                }
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {/* Apply */}

            <button
                type="button"
                onClick={handleApplyFilters}
                disabled={refreshing}
                className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
                {refreshing
                ? "Applying..."
                : "Apply"}
            </button>

            {/* Reset */}

            <button
                type="button"
                onClick={handleResetFilters}
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                Reset
            </button>

            {/* Updated */}

            {lastUpdated && (
                <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-500 shadow-sm 2xl:flex">
                <Clock3 size={15} />

                Updated{" "}
                {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
                </div>
            )}

            {/* Refresh */}

            <button
                type="button"
                onClick={() =>
                loadAnalytics(
                    true,
                    appliedFilters
                )
                }
                disabled={refreshing}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      </div>

            {/* ========================================================
                ACTIVE FILTER SUMMARY
            ======================================================== */}

            {(trainingFilter !== "ALL" ||
                dateFrom ||
                dateTo) && (
                <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-3.5">
                <span className="text-xs font-extrabold uppercase tracking-wide text-indigo-500">
                    Active Filters
                </span>

                {trainingFilter !== "ALL" && (
                    <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                    Training:{" "}
                    {availableTrainings.find(
                        (training) =>
                        training.n_training_id.toString() ===
                        trainingFilter
                    )?.s_training_code ||
                        trainingFilter}
                    </span>
                )}

                {dateFrom && (
                    <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                    From: {dateFrom}
                    </span>
                )}

                {dateTo && (
                    <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                    To: {dateTo}
                    </span>
                )}
                </div>
            )}

      {/* ========================================================
          PRIMARY KPI
      ======================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Training Programs"
          value={overview.total_trainings}
          subtitle="Active training programs"
          icon={<ClipboardCheck size={21} />}
          accent="indigo"
        />

        <MetricCard
          title="Participants"
          value={overview.total_participants}
          subtitle="Across all trainings"
          icon={<Users size={21} />}
          accent="blue"
        />

        <MetricCard
          title="Registration Rate"
          value={`${rates.registration_rate}%`}
          subtitle={`${overview.registration_completed} completed`}
          icon={<UserCheck size={21} />}
          accent="violet"
        />

        <MetricCard
          title="Attendance Rate"
          value={`${rates.attendance_rate}%`}
          subtitle={`${overview.attendance_completed} completed`}
          icon={<Activity size={21} />}
          accent="purple"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Assessment Eligibility"
          value={`${rates.assessment_eligibility_rate}%`}
          subtitle={`${overview.assessment_eligible} eligible`}
          icon={<Target size={21} />}
          accent="indigo"
        />

        <MetricCard
          title="Assessment Completion"
          value={`${rates.assessment_completion_rate}%`}
          subtitle={`${overview.assessment_completed} completed`}
          icon={<CheckCircle2 size={21} />}
          accent="blue"
        />

        <MetricCard
          title="Pass Rate"
          value={`${rates.pass_rate}%`}
          subtitle={`${overview.passed_count} passed`}
          icon={<Award size={21} />}
          accent="violet"
        />

        <MetricCard
          title="Average Score"
          value={score_analytics.average_score}
          subtitle={`Range ${score_analytics.lowest_score} - ${score_analytics.highest_score}`}
          icon={<TrendingUp size={21} />}
          accent="purple"
        />
      </div>

      {/* ========================================================
          PERFORMANCE OVERVIEW
      ======================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AnalyticsCard
          title="Training Completion Funnel"
          subtitle="Participant journey across key training stages"
          icon={<TrendingUp size={19} />}
        >
          <FunnelRow
            label="Participants"
            value={overview.total_participants}
            total={overview.total_participants}
            icon={<Users size={17} />}
          />

          <FunnelRow
            label="Registered"
            value={overview.registration_completed}
            total={overview.total_participants}
            icon={<UserCheck size={17} />}
          />

          <FunnelRow
            label="Attendance Completed"
            value={overview.attendance_completed}
            total={overview.total_participants}
            icon={<Activity size={17} />}
          />

          <FunnelRow
            label="Assessment Eligible"
            value={overview.assessment_eligible}
            total={overview.total_participants}
            icon={<Target size={17} />}
          />

          <FunnelRow
            label="Assessment Completed"
            value={overview.assessment_completed}
            total={overview.assessment_eligible}
            icon={<ClipboardCheck size={17} />}
          />

          <FunnelRow
            label="Passed"
            value={overview.passed_count}
            total={overview.assessment_completed}
            icon={<CheckCircle2 size={17} />}
          />
        </AnalyticsCard>

        <AnalyticsCard
          title="Score & Attendance Insights"
          subtitle="Overall assessment and attendance statistics"
          icon={<BarChart3 size={19} />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InsightCard
              title="Average Score"
              value={`${score_analytics.average_score}`}
              description="Across completed assessments"
              icon={<TrendingUp size={18} />}
            />

            <InsightCard
              title="Highest Score"
              value={`${score_analytics.highest_score}`}
              description="Best recorded score"
              icon={<Award size={18} />}
            />

            <InsightCard
              title="Lowest Score"
              value={`${score_analytics.lowest_score}`}
              description="Lowest recorded score"
              icon={<Target size={18} />}
            />

            <InsightCard
              title="Average Attendance"
              value={`${attendance_analytics.average_minutes}`}
              description="Minutes per processed participant"
              icon={<Clock3 size={18} />}
            />
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Attendance Range
                </p>

                <p className="mt-1 text-lg font-extrabold text-slate-800">
                  {attendance_analytics.lowest_minutes}{" "}
                  -{" "}
                  {attendance_analytics.highest_minutes}{" "}
                  min
                </p>
              </div>

              <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm">
                <Activity size={18} />
              </div>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-500">
              {attendance_analytics.processed_participants}{" "}
              participant records processed for
              attendance.
            </p>
          </div>
        </AnalyticsCard>
      </div>

      {/* ========================================================
          RESULTS + EMAIL
      ======================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Result Distribution */}

        <AnalyticsCard
          title="Assessment Results"
          subtitle="Overall outcome distribution"
          icon={<Award size={19} />}
        >
          <div className="space-y-5">
            <DistributionRow
              label="Passed"
              value={assessmentTotals.passed}
              total={assessmentTotals.attempted}
              icon={<CheckCircle2 size={17} />}
              type="success"
            />

            <DistributionRow
              label="Failed"
              value={assessmentTotals.failed}
              total={assessmentTotals.attempted}
              icon={<XCircle size={17} />}
              type="error"
            />

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Reattempts
              </p>

              <p className="mt-1 text-2xl font-extrabold text-amber-600">
                {overview.reattempted}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Participants requiring another
                attempt
              </p>
            </div>
          </div>
        </AnalyticsCard>

        {/* Email */}

        <AnalyticsCard
          title="Email Delivery"
          subtitle="Training communication performance"
          icon={<Mail size={19} />}
        >
          <EmailMetricRow
            title="Registration"
            success={
              email_analytics.registration
                .success
            }
            failed={
              email_analytics.registration
                .failed
            }
          />

          <EmailMetricRow
            title="Confirmation"
            success={
              email_analytics.confirmation
                .success
            }
            failed={
              email_analytics.confirmation
                .failed
            }
          />

          <EmailMetricRow
            title="Assessment"
            success={
              email_analytics.assessment
                .success
            }
            failed={
              email_analytics.assessment
                .failed
            }
          />
        </AnalyticsCard>

        {/* Best Training */}

        <AnalyticsCard
          title="Performance Highlight"
          subtitle="Top performing training"
          icon={<TrendingUp size={19} />}
        >
          {bestTraining ? (
            <div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                      Best Pass Rate
                    </p>

                    <p className="mt-2 text-xl font-extrabold text-slate-800">
                      {bestTraining.s_training_code}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {bestTraining.s_training_name}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                    <Award size={20} />
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-extrabold text-emerald-700">
                      {bestTraining.pass_rate}%
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Pass rate
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-700">
                      {bestTraining.average_score}
                    </p>

                    <p className="text-xs font-medium text-slate-400">
                      Avg. score
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <SmallMetric
                  label="Participants"
                  value={
                    bestTraining.n_participants
                  }
                />

                <SmallMetric
                  label="Passed"
                  value={bestTraining.n_passed}
                />

                <SmallMetric
                  label="Failed"
                  value={bestTraining.n_failed}
                />
              </div>
            </div>
          ) : (
            <EmptyState text="No completed assessment results yet." />
          )}
        </AnalyticsCard>
      </div>

      {/* ========================================================
          TRAINING PERFORMANCE TABLE
      ======================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
                  <ClipboardCheck size={19} />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    Training Performance
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Compare participant progress and
                    assessment outcomes by training
                  </p>
                </div>
              </div>
            </div>

            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
              {sortedTrainings.length} trainings
            </span>
          </div>
        </div>

        {sortedTrainings.length === 0 ? (
          <EmptyState text="No training performance data available." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50/70 to-blue-50">
                <tr>
                  <TableHeader>
                    Training
                  </TableHeader>

                  <TableHeader>
                    Participants
                  </TableHeader>

                  <TableHeader>
                    Registration
                  </TableHeader>

                  <TableHeader>
                    Attendance
                  </TableHeader>

                  <TableHeader>
                    Eligible
                  </TableHeader>

                  <TableHeader>
                    Completed
                  </TableHeader>

                  <TableHeader>
                    Passed
                  </TableHeader>

                  <TableHeader>
                    Failed
                  </TableHeader>

                  <TableHeader>
                    Avg. Score
                  </TableHeader>

                  <TableHeader>
                    Pass Rate
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {sortedTrainings.map(
                  (training) => (
                    <TrainingPerformanceRow
                      key={
                        training.n_training_id
                      }
                      training={training}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          ASSESSMENT PERFORMANCE
      ======================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-indigo-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2.5 text-violet-600">
              <Target size={19} />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Assessment Performance
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Score distribution and assessment-level
                outcomes
              </p>
            </div>
          </div>
        </div>

        {data.assessment_performance.length ===
        0 ? (
          <EmptyState text="No assessment performance data available." />
        ) : (
          <div className="grid gap-4 p-6 lg:grid-cols-2">
            {data.assessment_performance.map(
              (assessment) => (
                <AssessmentCard
                  key={
                    assessment.n_assessment_id
                  }
                  assessment={assessment}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  accent:
    | "indigo"
    | "blue"
    | "violet"
    | "purple";
}) {
  const styles = {
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

  const style = styles[accent];

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-4">
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
// ANALYTICS CARD
// ============================================================

function AnalyticsCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              {title}
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {subtitle}
            </p>
          </div>

          <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm">
            {icon}
          </div>
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}

// ============================================================
// FUNNEL ROW
// ============================================================

function FunnelRow({
  label,
  value,
  total,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  icon: ReactNode;
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (value / total) * 100
          )
        )
      : 0;

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
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

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
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
// INSIGHT CARD
// ============================================================

function InsightCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-white p-2 text-indigo-600 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DISTRIBUTION ROW
// ============================================================

function DistributionRow({
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
          className={`h-full rounded-full ${styles.bar}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// EMAIL METRIC ROW
// ============================================================

function EmailMetricRow({
  title,
  success,
  failed,
}: {
  title: string;
  success: number;
  failed: number;
}) {
  const total = success + failed;

  const successRate =
    total > 0
      ? Math.round(
          (success / total) * 100
        )
      : 0;

  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700">
          {title}
        </p>

        <p className="text-xs font-bold text-emerald-600">
          {successRate}% success
        </p>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
          <CheckCircle2 size={14} />
          {success} successful
        </span>

        <span className="flex items-center gap-1.5 font-semibold text-rose-500">
          <XCircle size={14} />
          {failed} failed
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{
            width: `${successRate}%`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// SMALL METRIC
// ============================================================

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-[11px] font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-extrabold text-slate-800">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// TABLE HEADER
// ============================================================

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
      {children}
    </th>
  );
}

// ============================================================
// TRAINING PERFORMANCE ROW
// ============================================================

function TrainingPerformanceRow({
  training,
}: {
  training: TrainingPerformance;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-indigo-50/40">
      <td className="px-5 py-4">
        <p className="font-bold text-slate-800">
          {training.s_training_code ||
            "-"}
        </p>

        <p className="mt-0.5 max-w-[220px] truncate text-xs font-medium text-slate-500">
          {training.s_training_name ||
            "-"}
        </p>

        <p className="mt-1 text-[11px] text-slate-400">
          {formatDate(
            training.d_training_date
          )}
        </p>
      </td>

      <td className="px-5 py-4 font-extrabold text-slate-800">
        {training.n_participants}
      </td>

      <td className="px-5 py-4">
        <PercentageCell
          value={training.registration_rate}
        />
      </td>

      <td className="px-5 py-4">
        <PercentageCell
          value={training.attendance_rate}
        />
      </td>

      <td className="px-5 py-4">
        <span className="font-bold text-indigo-600">
          {training.n_assessment_eligible}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="font-bold text-slate-700">
          {training.n_assessment_completed}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 size={13} />
          {training.n_passed}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
          <XCircle size={13} />
          {training.n_failed}
        </span>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="font-extrabold text-slate-800">
            {training.average_score}
          </p>

          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{
                width: `${Math.min(
                  100,
                  training.average_score
                )}%`,
              }}
            />
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold ${
            training.pass_rate >= 70
              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
              : training.pass_rate > 0
                ? "border-amber-200 bg-amber-100 text-amber-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
          }`}
        >
          {training.pass_rate}%
        </span>
      </td>
    </tr>
  );
}

// ============================================================
// PERCENTAGE CELL
// ============================================================

function PercentageCell({
  value,
}: {
  value: number;
}) {
  return (
    <div>
      <p className="font-extrabold text-slate-800">
        {value}%
      </p>

      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{
            width: `${Math.min(
              100,
              value
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// ASSESSMENT CARD
// ============================================================

function AssessmentCard({
  assessment,
}: {
  assessment: AssessmentPerformance;
}) {
  const total =
    assessment.n_passed +
    assessment.n_failed;

  const passRate =
    total > 0
      ? Math.round(
          (assessment.n_passed / total) *
            100
        )
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            Assessment
          </p>

          <h3 className="mt-1 text-base font-extrabold text-slate-800">
            {assessment.s_assessment_name ||
              "-"}
          </h3>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {assessment.n_participants} participants
          </p>
        </div>

        <div className="rounded-xl bg-white p-2.5 text-violet-600 shadow-sm">
          <Target size={18} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <SmallMetric
          label="Passed"
          value={assessment.n_passed}
        />

        <SmallMetric
          label="Failed"
          value={assessment.n_failed}
        />

        <SmallMetric
          label="Avg Score"
          value={assessment.average_score}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Pass Rate
          </span>

          <span className="text-sm font-extrabold text-slate-800">
            {passRate}%
          </span>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
            style={{
              width: `${passRate}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span>
          Lowest:{" "}
          {assessment.lowest_score}
        </span>

        <span>
          Highest:{" "}
          {assessment.highest_score}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
        <BarChart3 size={27} />
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-600">
        {text}
      </p>
    </div>
  );
}

// ============================================================
// DATE
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

  return date.toLocaleDateString();
}