"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  Plus,
  RefreshCw,
  Search,
  X,
  Eye,
  Pencil,
  Send,
  CheckSquare,
  Square,
  Layers,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  createTraining,
  getTrainings,
  publishTraining,
  updateTraining,
  bulkPublishTrainings,
  Training,
  CreateTrainingRequest,
  UpdateTrainingRequest,
} from "@/services/api/trainingApi";


export default function TrainingsPage() {
  // ============================================================
  // LIST STATE
  // ============================================================

  const [trainings, setTrainings] = useState<Training[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // CREATE STATE
  // ============================================================

  const [showCreate, setShowCreate] =
    useState(false);

  const [saving, setSaving] = useState(false);

  // ============================================================
  // EDIT STATE
  // ============================================================

  const [showEdit, setShowEdit] =
    useState(false);

  const [updating, setUpdating] = useState(false);

  // ============================================================
  // VIEW STATE
  // ============================================================

  const [showView, setShowView] =
    useState(false);

  const [selectedTraining, setSelectedTraining] =
    useState<Training | null>(null);

  // ============================================================
  // PUBLISH STATE
  // ============================================================

  const [publishingId, setPublishingId] =
    useState<number | null>(null);

  const [selectedTrainingIds, setSelectedTrainingIds] =
    useState<number[]>([]);

  const [showBulkPublish, setShowBulkPublish] =
    useState(false);

  const [bulkPublishing, setBulkPublishing] =
    useState(false);

  const [bulkPublishResults, setBulkPublishResults] =
    useState<any[]>([]);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [trainingCode, setTrainingCode] =
    useState("");

  const [trainingName, setTrainingName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [trainingMonth, setTrainingMonth] =
    useState("");

  const [trainingYear, setTrainingYear] =
    useState("");

  const [trainingDate, setTrainingDate] =
    useState("");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [registrationStart, setRegistrationStart] =
    useState("");

  const [registrationEnd, setRegistrationEnd] =
    useState("");

  const [meetingLink, setMeetingLink] =
    useState("");

  const [passingScore, setPassingScore] =
    useState("80");

  const [minimumAttendance, setMinimumAttendance] =
    useState("30");

  const [assessmentRequired, setAssessmentRequired] =
    useState("1");

  // ============================================================
  // LOAD TRAININGS
  // ============================================================

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTrainings();

      setTrainings(data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load trainings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setTrainingCode("");
    setTrainingName("");
    setDescription("");

    setTrainingMonth("");
    setTrainingYear("");

    setTrainingDate("");

    setStartTime("");
    setEndTime("");

    setRegistrationStart("");
    setRegistrationEnd("");

    setMeetingLink("");

    setPassingScore("80");
    setMinimumAttendance("30");
    setAssessmentRequired("1");
  };

  // ============================================================
  // OPEN CREATE
  // ============================================================

  const openCreateTraining = () => {
    setError("");
    setSuccess("");

    resetForm();

    setShowCreate(true);
  };

  // ============================================================
  // CREATE TRAINING
  // ============================================================

  const handleCreateTraining = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!trainingCode.trim()) {
      setError(
        "Training Code is required."
      );
      return;
    }

    if (!trainingName.trim()) {
      setError(
        "Training Name is required."
      );
      return;
    }

    if (!trainingMonth) {
      setError(
        "Training Month is required."
      );
      return;
    }

    if (!trainingYear) {
      setError(
        "Training Year is required."
      );
      return;
    }

    if (!trainingDate) {
      setError(
        "Training Date is required."
      );
      return;
    }

    if (!startTime || !endTime) {
      setError(
        "Training start and end time are required."
      );
      return;
    }

    if (
      !registrationStart ||
      !registrationEnd
    ) {
      setError(
        "Registration period is required."
      );
      return;
    }

    try {
      setSaving(true);

      const requestData:
        CreateTrainingRequest = {
        s_training_code:
          trainingCode.trim(),

        s_training_name:
          trainingName.trim(),

        s_description:
          description.trim() || null,

        n_training_month:
          Number(trainingMonth),

        n_training_year:
          Number(trainingYear),

        d_training_date:
          trainingDate,

        t_start_time:
          startTime,

        t_end_time:
          endTime,

        dt_registration_start:
          registrationStart,

        dt_registration_end:
          registrationEnd,

        s_teams_meeting_link:
          meetingLink.trim() || null,

        n_passing_score:
          Number(passingScore),

        n_minimum_attendance_minutes:
          Number(minimumAttendance),

        n_assessment_required:
          Number(assessmentRequired),
      };

      const result =
        await createTraining(
          requestData
        );

      setSuccess(
        `Training "${result.s_training_code}" created successfully as DRAFT.`
      );

      setShowCreate(false);

      resetForm();

      await loadTrainings();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Unable to create training.";

      setError(
        Array.isArray(message)
          ? "Please check the training details."
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // OPEN EDIT TRAINING
  // ============================================================

  const openEditTraining = (
    training: Training
  ) => {
    setError("");
    setSuccess("");

    setSelectedTraining(training);

    setTrainingCode(
      training.s_training_code
    );

    setTrainingName(
      training.s_training_name
    );

    setDescription(
      training.s_description || ""
    );

    setTrainingMonth(
      String(
        training.n_training_month
      )
    );

    setTrainingYear(
      String(
        training.n_training_year
      )
    );

    setTrainingDate(
      training.d_training_date
    );

    setStartTime(
      training.t_start_time.substring(
        0,
        5
      )
    );

    setEndTime(
      training.t_end_time.substring(
        0,
        5
      )
    );

    setRegistrationStart(
      training.dt_registration_start.substring(
        0,
        16
      )
    );

    setRegistrationEnd(
      training.dt_registration_end.substring(
        0,
        16
      )
    );

    setMeetingLink(
      training.s_teams_meeting_link ||
        ""
    );

    setPassingScore(
      String(
        training.n_passing_score
      )
    );

    setMinimumAttendance(
      String(
        training.n_minimum_attendance_minutes
      )
    );

    setAssessmentRequired(
      String(
        training.n_assessment_required
      )
    );

    setShowEdit(true);
  };

  // ============================================================
  // UPDATE TRAINING
  // ============================================================

  const handleUpdateTraining = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedTraining) {
      return;
    }

    setError("");
    setSuccess("");

    if (!trainingName.trim()) {
      setError(
        "Training Name is required."
      );
      return;
    }

    if (
      !trainingMonth ||
      !trainingYear
    ) {
      setError(
        "Training Month and Year are required."
      );
      return;
    }

    if (!trainingDate) {
      setError(
        "Training Date is required."
      );
      return;
    }

    if (!startTime || !endTime) {
      setError(
        "Training start and end time are required."
      );
      return;
    }

    if (
      !registrationStart ||
      !registrationEnd
    ) {
      setError(
        "Registration period is required."
      );
      return;
    }

    try {
      setUpdating(true);

      const requestData:
        UpdateTrainingRequest = {
        s_training_name:
          trainingName.trim(),

        s_description:
          description.trim() || null,

        n_training_month:
          Number(trainingMonth),

        n_training_year:
          Number(trainingYear),

        d_training_date:
          trainingDate,

        t_start_time:
          startTime,

        t_end_time:
          endTime,

        dt_registration_start:
          registrationStart,

        dt_registration_end:
          registrationEnd,

        s_teams_meeting_link:
          meetingLink.trim() || null,

        n_passing_score:
          Number(passingScore),

        n_minimum_attendance_minutes:
          Number(minimumAttendance),

        n_assessment_required:
          Number(assessmentRequired),
      };

      const result =
        await updateTraining(
          selectedTraining.n_training_id,
          requestData
        );

      setShowEdit(false);

      setSelectedTraining(null);

      setSuccess(
        `Training "${result.s_training_code}" updated successfully.`
      );

      await loadTrainings();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Unable to update training.";

      setError(
        Array.isArray(message)
          ? "Please check the training details."
          : message
      );
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================
  // PUBLISH TRAINING
  // ============================================================

  const handlePublishTraining = async (
    training: Training
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to publish "${training.s_training_name}"?\n\n` +
          `This will create participant records for all active users ` +
          `and start the training email process.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setPublishingId(
        training.n_training_id
      );

      setError("");
      setSuccess("");

      const result =
        await publishTraining(
          training.n_training_id
        );

      const emailStatus =
        result.email_result?.status;

      let message =
        `Training "${training.s_training_code}" published successfully. ` +
        `${result.total_active_users} active users processed.`;

      if (emailStatus) {
        message += ` Email status: ${emailStatus}.`;
      }

      setSuccess(message);

      await loadTrainings();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Unable to publish training.";

      setError(
        Array.isArray(message)
          ? "Unable to publish training."
          : message
      );
    } finally {
      setPublishingId(null);
    }
  };

  // ============================================================
  // BULK SELECTION
  // ============================================================

  const draftTrainings =
    trainings.filter(
      (training) =>
        training.s_status === "DRAFT"
    );

  const allDraftSelected =
    draftTrainings.length > 0 &&
    draftTrainings.every(
      (training) =>
        selectedTrainingIds.includes(
          training.n_training_id
        )
    );

  const toggleTrainingSelection = (
    trainingId: number
  ) => {

    setSelectedTrainingIds(
      (current) =>
        current.includes(trainingId)
          ? current.filter(
              (id) => id !== trainingId
            )
          : [
              ...current,
              trainingId
            ]
    );
  };

  const toggleSelectAllDrafts = () => {

    if (allDraftSelected) {

      setSelectedTrainingIds([]);

      return;
    }

    setSelectedTrainingIds(
      draftTrainings.map(
        (training) =>
          training.n_training_id
      )
    );
  };

  // ============================================================
  // BULK PUBLISH
  // ============================================================

  const handleBulkPublish = async () => {

    if (
      selectedTrainingIds.length === 0
    ) {
      setError(
        "Please select at least one DRAFT training."
      );

      return;
    }

    try {

      setBulkPublishing(true);

      setError("");
      setSuccess("");

      setBulkPublishResults([]);

      const result =
        await bulkPublishTrainings(
          selectedTrainingIds
        );

      setBulkPublishResults(
        result.results
      );

      if (
        result.failed_count === 0
      ) {

        setSuccess(
          `${result.published_count} training(s) published successfully.`
        );

      } else {

        setSuccess(
          `${result.published_count} published, ${result.failed_count} failed.`
        );
      }

      setSelectedTrainingIds([]);

      setShowBulkPublish(false);

      await loadTrainings();

    } catch (err: any) {

      console.error(
        "Bulk publish failed:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        "Unable to bulk publish trainings.";

      setError(
        Array.isArray(message)
          ? "Unable to bulk publish trainings."
          : message
      );

    } finally {

      setBulkPublishing(false);
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredTrainings =
    trainings.filter((training) => {
      const value =
        search
          .trim()
          .toLowerCase();

      return (
        training.s_training_code
          .toLowerCase()
          .includes(value) ||
        training.s_training_name
          .toLowerCase()
          .includes(value)
      );
    });

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "PUBLISHED":
        return "border-emerald-200 bg-emerald-100 text-emerald-700";

      case "DRAFT":
        return "border-amber-200 bg-amber-100 text-amber-700";

      case "COMPLETED":
        return "border-blue-200 bg-blue-100 text-blue-700";

      case "CANCELLED":
        return "border-rose-200 bg-rose-100 text-rose-700";

      default:
        return "border-slate-200 bg-slate-100 text-slate-700";
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="mb-7 flex items-center justify-between gap-4">

        <div>
          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-2xl font-extrabold text-transparent">
            Training Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage training programs
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateTraining
          }
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300"
        >
          <Plus size={18} />

          Create Training
        </button>

      </div>

      {/* ========================================================
          SUCCESS
      ======================================================== */}

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {/* ========================================================
          BULK PUBLISH RESULT
      ======================================================== */}

      {bulkPublishResults.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Bulk Publish Result
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Individual result for each selected training.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBulkPublishResults([])}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
              title="Close result"
            >
              <X size={16} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {bulkPublishResults.map((result) => (
              <div
                key={`${result.n_training_id}-${result.status}`}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {result.s_training_code} — {result.s_training_name}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {result.status === "success"
                      ? `${result.participant_count ?? 0} participant records created. Email status: ${result.email_result?.status ?? "processed"}.`
                      : result.message ?? "Publish failed."}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-extrabold ${
                    result.status === "success"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                      : "border-rose-200 bg-rose-100 text-rose-700"
                  }`}
                >
                  {result.status === "success" ? "SUCCESS" : "FAILED"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TOOLBAR
      ======================================================== */}

      <div className="mb-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">

        <div className="relative w-full max-w-xl">

          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400"
          />

          <input
            type="text"
            placeholder="Search training..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />

        </div>

        <div className="flex items-center gap-2">

          {draftTrainings.length > 0 && (
            <button
              type="button"
              onClick={
                toggleSelectAllDrafts
              }
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100"
            >
              {allDraftSelected
                ? "Clear Selection"
                : "Select All Drafts"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {

              if (
                selectedTrainingIds.length === 0
              ) {

                setError(
                  "Please select at least one DRAFT training."
                );

                return;
              }

              setError("");
              setSuccess("");
              setShowBulkPublish(true);

            }}
            disabled={
              selectedTrainingIds.length === 0 ||
              bulkPublishing
            }
            className="
              flex items-center gap-2
              rounded-xl
              bg-gradient-to-r
              from-violet-600
              to-indigo-600
              px-4 py-3
              text-sm font-semibold
              text-white
              shadow-lg
              shadow-indigo-200
              transition-all
              hover:-translate-y-0.5
              hover:shadow-xl
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Layers size={17} />

            Bulk Publish

            {selectedTrainingIds.length > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {selectedTrainingIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={loadTrainings}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={17} />

            Refresh
          </button>

        </div>
      </div>

      {/* ========================================================
          TRAINING TABLE
      ======================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/70 px-6 py-5">

          <div className="flex items-center justify-between">

            <h2 className="text-base font-bold text-slate-800">
              Trainings
            </h2>

            <span className="text-sm font-medium text-slate-500">
              {filteredTrainings.length} trainings
            </span>

          </div>

        </div>

        {loading ? (

          <div className="p-12 text-center text-sm font-medium text-slate-500">
            Loading trainings...
          </div>

        ) : filteredTrainings.length === 0 ? (

          <div className="p-12 text-center text-sm font-medium text-slate-500">
            No trainings found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50/60 to-blue-50">

                <tr>

                  <th className="w-12 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={
                        toggleSelectAllDrafts
                      }
                      title="Select all DRAFT trainings"
                      className="rounded-lg p-1 text-indigo-600 hover:bg-indigo-100"
                    >
                      {allDraftSelected ? (
                        <CheckSquare size={17} />
                      ) : (
                        <Square size={17} />
                      )}
                    </button>
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Code
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Training
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Date
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Time
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Registration
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredTrainings.map(
                  (training) => {

                    const isDraft =
                      training.s_status ===
                      "DRAFT";

                    const isPublishing =
                      publishingId ===
                      training.n_training_id;

                    return (
                      <tr
                        key={
                          training.n_training_id
                        }
                        className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/50"
                      >
                        <td className="px-4 py-4">
                          {isDraft ? (
                            <button
                              type="button"
                              onClick={() =>
                                toggleTrainingSelection(
                                  training.n_training_id
                                )
                              }
                              className={`rounded-lg p-1.5 transition ${
                                selectedTrainingIds.includes(
                                  training.n_training_id
                                )
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                              }`}
                              title="Select training"
                            >
                              {selectedTrainingIds.includes(
                                training.n_training_id
                              ) ? (
                                <CheckSquare size={18} />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {training.s_training_code}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {training.s_training_name}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {training.d_training_date}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                          {training.t_start_time}
                          {" - "}
                          {training.t_end_time}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">

                          <div>
                            {formatDateTime(
                              training.dt_registration_start
                            )}
                          </div>

                          <div className="text-slate-500">
                            to
                          </div>

                          <div>
                            {formatDateTime(
                              training.dt_registration_end
                            )}
                          </div>

                        </td>

                        <td className="px-5 py-4 text-slate-700">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                              training.s_status
                            )}`}
                          >
                            {training.s_status}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-slate-700">

                          <div className="flex items-center gap-2">

                            {/* VIEW */}

                            <button
                              type="button"
                              title="View Training"
                              onClick={() => {
                                setSelectedTraining(
                                  training
                                );

                                setShowView(
                                  true
                                );

                                setError("");
                                setSuccess("");
                              }}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
                            >
                              <Eye size={16} />
                            </button>

                            {/* EDIT */}

                            {isDraft && (
                              <button
                                type="button"
                                title="Edit Training"
                                onClick={() =>
                                  openEditTraining(
                                    training
                                  )
                                }
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>
                            )}

                            {/* PUBLISH */}

                            {isDraft && (
                              <button
                                type="button"
                                title="Publish Training"
                                disabled={
                                  isPublishing
                                }
                                onClick={() =>
                                  handlePublishTraining(
                                    training
                                  )
                                }
                                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Send
                                  size={14}
                                />

                                {isPublishing
                                  ? "Publishing..."
                                  : "Publish"}
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ========================================================
          BULK PUBLISH CONFIRMATION
      ======================================================== */}

      {showBulkPublish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-publish-title"
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/30">

            <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <Layers size={22} />
                  </div>

                  <div>
                    <h2
                      id="bulk-publish-title"
                      className="text-xl font-extrabold"
                    >
                      Confirm Bulk Publish
                    </h2>
                    <p className="mt-1 text-sm text-indigo-100">
                      Review the selected DRAFT trainings before publishing.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBulkPublish(false)}
                  disabled={bulkPublishing}
                  className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="max-h-[62vh] overflow-y-auto bg-slate-50/60 p-6">

              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
                    Selected Trainings
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-indigo-700">
                    {selectedTrainingIds.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">
                    Current Selection
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-blue-700">
                    DRAFT
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
                    Action
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-amber-700">
                    PUBLISH
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
                  <h3 className="text-sm font-extrabold text-indigo-900">
                    Selected Trainings
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedTrainingIds.map((trainingId) => {
                    const training = trainings.find(
                      (item) => item.n_training_id === trainingId
                    );

                    if (!training) {
                      return null;
                    }

                    return (
                      <div
                        key={trainingId}
                        className="flex items-center justify-between gap-4 px-5 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-800">
                            {training.s_training_code}
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-slate-500">
                            {training.s_training_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {training.d_training_date} • {training.t_start_time} - {training.t_end_time}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                          DRAFT
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <AlertCircle
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={20}
                />
                <div>
                  <p className="text-sm font-extrabold text-amber-800">
                    Bulk publishing starts the normal training publication workflow.
                  </p>
                  <p className="mt-1 text-xs font-medium leading-5 text-amber-700">
                    Participant records will be created for active users and the training availability email process will run for each selected training. The individual result will be shown after processing.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowBulkPublish(false)}
                disabled={bulkPublishing}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBulkPublish}
                disabled={bulkPublishing || selectedTrainingIds.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkPublishing ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Confirm Bulk Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE TRAINING MODAL
      ======================================================== */}

      {showCreate && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-indigo-950/30">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

              <div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  Create Training
                </h2>

                <p className="mt-1 text-xs font-medium text-indigo-600">
                  New training will be created as DRAFT.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleCreateTraining
              }
              className="flex-1 overflow-y-auto"
            >

              <TrainingFormFields
                mode="create"
                trainingCode={
                  trainingCode
                }
                setTrainingCode={
                  setTrainingCode
                }
                trainingName={
                  trainingName
                }
                setTrainingName={
                  setTrainingName
                }
                description={
                  description
                }
                setDescription={
                  setDescription
                }
                trainingMonth={
                  trainingMonth
                }
                setTrainingMonth={
                  setTrainingMonth
                }
                trainingYear={
                  trainingYear
                }
                setTrainingYear={
                  setTrainingYear
                }
                trainingDate={
                  trainingDate
                }
                setTrainingDate={
                  setTrainingDate
                }
                startTime={
                  startTime
                }
                setStartTime={
                  setStartTime
                }
                endTime={
                  endTime
                }
                setEndTime={
                  setEndTime
                }
                registrationStart={
                  registrationStart
                }
                setRegistrationStart={
                  setRegistrationStart
                }
                registrationEnd={
                  registrationEnd
                }
                setRegistrationEnd={
                  setRegistrationEnd
                }
                meetingLink={
                  meetingLink
                }
                setMeetingLink={
                  setMeetingLink
                }
                passingScore={
                  passingScore
                }
                setPassingScore={
                  setPassingScore
                }
                minimumAttendance={
                  minimumAttendance
                }
                setMinimumAttendance={
                  setMinimumAttendance
                }
                assessmentRequired={
                  assessmentRequired
                }
                setAssessmentRequired={
                  setAssessmentRequired
                }
              />

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Training"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ========================================================
          VIEW TRAINING MODAL
      ======================================================== */}

      {showView &&
        selectedTraining && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/60 bg-white shadow-2xl shadow-indigo-950/30">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

                <div>

                  <h2 className="text-xl font-extrabold text-slate-900">
                    Training Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedTraining.s_training_code
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowView(false);
                    setSelectedTraining(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
                >
                  <X size={20} />
                </button>

              </div>

              {/* BODY */}

              <div className="space-y-6 bg-slate-50/50 p-6">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h3 className="text-2xl font-extrabold text-slate-900">
                      {
                        selectedTraining.s_training_name
                      }
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedTraining.s_description ||
                        "No description"
                      }
                    </p>

                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      selectedTraining.s_status
                    )}`}
                  >
                    {
                      selectedTraining.s_status
                    }
                  </span>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <DetailItem
                    label="Training Code"
                    value={
                      selectedTraining.s_training_code
                    }
                  />

                  <DetailItem
                    label="Month / Year"
                    value={`${selectedTraining.n_training_month} / ${selectedTraining.n_training_year}`}
                  />

                  <DetailItem
                    label="Training Date"
                    value={
                      selectedTraining.d_training_date
                    }
                  />

                  <DetailItem
                    label="Training Time"
                    value={`${selectedTraining.t_start_time} - ${selectedTraining.t_end_time}`}
                  />

                  <DetailItem
                    label="Registration Start"
                    value={formatDateTime(
                      selectedTraining.dt_registration_start
                    )}
                  />

                  <DetailItem
                    label="Registration End"
                    value={formatDateTime(
                      selectedTraining.dt_registration_end
                    )}
                  />

                  <DetailItem
                    label="Passing Score"
                    value={`${selectedTraining.n_passing_score}%`}
                  />

                  <DetailItem
                    label="Minimum Attendance"
                    value={`${selectedTraining.n_minimum_attendance_minutes} minutes`}
                  />

                  <DetailItem
                    label="Assessment Required"
                    value={
                      selectedTraining.n_assessment_required ===
                      1
                        ? "Yes"
                        : "No"
                    }
                  />

                  <DetailItem
                    label="Created By"
                    value={
                      selectedTraining.n_created_by
                    }
                  />

                </div>

                {/* TEAMS LINK */}

                <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Teams Meeting Link
                  </p>

                  {selectedTraining.s_teams_meeting_link ? (

                    <a
                      href={
                        selectedTraining.s_teams_meeting_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block break-all text-sm text-blue-600 hover:underline"
                    >
                      {
                        selectedTraining.s_teams_meeting_link
                      }
                    </a>

                  ) : (

                    <p className="mt-2 text-sm text-gray-500">
                      No Teams meeting link configured.
                    </p>

                  )}

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">

                {selectedTraining.s_status ===
                  "DRAFT" && (

                  <button
                    type="button"
                    onClick={() => {
                      const training =
                        selectedTraining;

                      setShowView(false);

                      openEditTraining(
                        training
                      );
                    }}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                  >
                    <Pencil size={16} />

                    Edit
                  </button>

                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowView(false);
                    setSelectedTraining(
                      null
                    );
                  }}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      {/* ========================================================
          EDIT TRAINING MODAL
      ======================================================== */}

      {showEdit &&
        selectedTraining && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-indigo-950/30">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

                <div>

                  <h2 className="text-xl font-extrabold text-slate-900">
                    Edit Training
                  </h2>

                  <p className="mt-1 text-xs font-medium text-indigo-600">
                    {
                      selectedTraining.s_training_code
                    }{" "}
                    • DRAFT
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false);
                    setSelectedTraining(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
                >
                  <X size={20} />
                </button>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleUpdateTraining
                }
                className="flex-1 overflow-y-auto"
              >

                <TrainingFormFields
                  mode="edit"
                  trainingCode={
                    trainingCode
                  }
                  setTrainingCode={
                    setTrainingCode
                  }
                  trainingName={
                    trainingName
                  }
                  setTrainingName={
                    setTrainingName
                  }
                  description={
                    description
                  }
                  setDescription={
                    setDescription
                  }
                  trainingMonth={
                    trainingMonth
                  }
                  setTrainingMonth={
                    setTrainingMonth
                  }
                  trainingYear={
                    trainingYear
                  }
                  setTrainingYear={
                    setTrainingYear
                  }
                  trainingDate={
                    trainingDate
                  }
                  setTrainingDate={
                    setTrainingDate
                  }
                  startTime={
                    startTime
                  }
                  setStartTime={
                    setStartTime
                  }
                  endTime={
                    endTime
                  }
                  setEndTime={
                    setEndTime
                  }
                  registrationStart={
                    registrationStart
                  }
                  setRegistrationStart={
                    setRegistrationStart
                  }
                  registrationEnd={
                    registrationEnd
                  }
                  setRegistrationEnd={
                    setRegistrationEnd
                  }
                  meetingLink={
                    meetingLink
                  }
                  setMeetingLink={
                    setMeetingLink
                  }
                  passingScore={
                    passingScore
                  }
                  setPassingScore={
                    setPassingScore
                  }
                  minimumAttendance={
                    minimumAttendance
                  }
                  setMinimumAttendance={
                    setMinimumAttendance
                  }
                  assessmentRequired={
                    assessmentRequired
                  }
                  setAssessmentRequired={
                    setAssessmentRequired
                  }
                />

                <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">

                  <button
                    type="button"
                    onClick={() => {
                      setShowEdit(false);
                      setSelectedTraining(
                        null
                      );
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updating}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating
                      ? "Updating..."
                      : "Update Training"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

    </div>
  );
}


// ============================================================
// TRAINING FORM FIELDS
// ============================================================

function TrainingFormFields({
  mode,
  trainingCode,
  setTrainingCode,
  trainingName,
  setTrainingName,
  description,
  setDescription,
  trainingMonth,
  setTrainingMonth,
  trainingYear,
  setTrainingYear,
  trainingDate,
  setTrainingDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  registrationStart,
  setRegistrationStart,
  registrationEnd,
  setRegistrationEnd,
  meetingLink,
  setMeetingLink,
  passingScore,
  setPassingScore,
  minimumAttendance,
  setMinimumAttendance,
  assessmentRequired,
  setAssessmentRequired,
}: {
  mode: "create" | "edit";

  trainingCode: string;
  setTrainingCode: (
    value: string
  ) => void;

  trainingName: string;
  setTrainingName: (
    value: string
  ) => void;

  description: string;
  setDescription: (
    value: string
  ) => void;

  trainingMonth: string;
  setTrainingMonth: (
    value: string
  ) => void;

  trainingYear: string;
  setTrainingYear: (
    value: string
  ) => void;

  trainingDate: string;
  setTrainingDate: (
    value: string
  ) => void;

  startTime: string;
  setStartTime: (
    value: string
  ) => void;

  endTime: string;
  setEndTime: (
    value: string
  ) => void;

  registrationStart: string;
  setRegistrationStart: (
    value: string
  ) => void;

  registrationEnd: string;
  setRegistrationEnd: (
    value: string
  ) => void;

  meetingLink: string;
  setMeetingLink: (
    value: string
  ) => void;

  passingScore: string;
  setPassingScore: (
    value: string
  ) => void;

  minimumAttendance: string;
  setMinimumAttendance: (
    value: string
  ) => void;

  assessmentRequired: string;
  setAssessmentRequired: (
    value: string
  ) => void;
}) {
  return (
    <div className="space-y-6 bg-slate-50/50 p-6">

      {/* ========================================================
          BASIC INFORMATION
      ======================================================== */}

      <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm shadow-indigo-100/60">

        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-indigo-900">
          Basic Information
        </h3>

        <div className="grid gap-5 md:grid-cols-2">

          <FormInput
            label="Training Code"
            value={trainingCode}
            onChange={setTrainingCode}
            placeholder="TRN-001"
            required
            disabled={mode === "edit"}
          />

          <FormInput
            label="Training Name"
            value={trainingName}
            onChange={setTrainingName}
            placeholder="Python Training"
            required
          />

        </div>

        <div className="mt-5">

          <label className="mb-1.5 block text-sm font-medium">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Training description..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />

        </div>

      </div>

      {/* ========================================================
          TRAINING SCHEDULE
      ======================================================== */}

      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60">

        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-indigo-900">
          Training Schedule
        </h3>

        <div className="grid gap-5 md:grid-cols-3">

          <div>

            <label className="mb-1.5 block text-sm font-medium">
              Month
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={trainingMonth}
              onChange={(event) =>
                setTrainingMonth(
                  event.target.value
                )
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >

              <option value="">
                Select month
              </option>

              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map(
                (month, index) => (
                  <option
                    key={month}
                    value={
                      index + 1
                    }
                  >
                    {month}
                  </option>
                )
              )}

            </select>

          </div>

          <FormInput
            label="Year"
            type="number"
            value={trainingYear}
            onChange={setTrainingYear}
            placeholder="2026"
            required
            min="2020"
            max="2100"
          />

          <FormInput
            label="Training Date"
            type="date"
            value={trainingDate}
            onChange={setTrainingDate}
            required
          />

        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          <FormInput
            label="Start Time"
            type="time"
            value={startTime}
            onChange={setStartTime}
            required
          />

          <FormInput
            label="End Time"
            type="time"
            value={endTime}
            onChange={setEndTime}
            required
          />

        </div>

      </div>

      {/* ========================================================
          REGISTRATION PERIOD
      ======================================================== */}

      <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm shadow-violet-100/60">

        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-indigo-900">
          Registration Period
        </h3>

        <div className="grid gap-5 md:grid-cols-2">

          <FormInput
            label="Registration Start"
            type="datetime-local"
            value={registrationStart}
            onChange={
              setRegistrationStart
            }
            required
          />

          <FormInput
            label="Registration End"
            type="datetime-local"
            value={registrationEnd}
            onChange={
              setRegistrationEnd
            }
            required
          />

        </div>

      </div>

      {/* ========================================================
          TEAMS
      ======================================================== */}

      <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm shadow-cyan-100/60">

        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-indigo-900">
          Teams Meeting
        </h3>

        <label className="mb-1.5 block text-sm font-medium">
          Teams Meeting Link
        </label>

        <input
          type="url"
          value={meetingLink}
          onChange={(event) =>
            setMeetingLink(
              event.target.value
            )
          }
          placeholder="https://teams.microsoft.com/..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />

        <p className="mt-1.5 text-xs text-gray-500">
          The Teams link will be provided to the
          user only after successful registration.
        </p>

      </div>

      {/* ========================================================
          ASSESSMENT SETTINGS
      ======================================================== */}

      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-100/60">

        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-indigo-900">
          Assessment & Attendance
        </h3>

        <div className="grid gap-5 md:grid-cols-3">

          <FormInput
            label="Passing Score (%)"
            type="number"
            value={passingScore}
            onChange={setPassingScore}
            min="0"
            max="100"
          />

          <FormInput
            label="Minimum Attendance (minutes)"
            type="number"
            value={minimumAttendance}
            onChange={
              setMinimumAttendance
            }
            min="0"
          />

          <div>

            <label className="mb-1.5 block text-sm font-medium">
              Assessment Required
            </label>

            <select
              value={
                assessmentRequired
              }
              onChange={(event) =>
                setAssessmentRequired(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >

              <option value="1">
                Yes
              </option>

              <option value="0">
                No
              </option>

            </select>

          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// FORM INPUT
// ============================================================

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
  disabled = false,
}: {
  label: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  type?: string;

  placeholder?: string;

  required?: boolean;

  min?: string;

  max?: string;

  disabled?: boolean;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-medium">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />

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
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-bold text-slate-800">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// FORMAT DATETIME
// ============================================================

function formatDateTime(
  value: string
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}