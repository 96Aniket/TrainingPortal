"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getTrainings,
  Training,
} from "@/services/api/trainingApi";

import {
  getTrainingAttendanceReport,
  uploadAttendance,
  AttendanceUser,
  AttendanceReportParticipant,
} from "@/services/api/attendanceApi";

export default function AttendancePage() {

  const [trainings, setTrainings] =
    useState<Training[]>([]);

  const [selectedTrainingId, setSelectedTrainingId] =
    useState<number>(0);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [users, setUsers] =
    useState<AttendanceUser[]>([]);

  const [reportParticipants, setReportParticipants] =
    useState<AttendanceReportParticipant[]>([]);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [loadingTrainings, setLoadingTrainings] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [summary, setSummary] = useState({
    total_users: 0,
    attended_users: 0,
    eligible_users: 0,
    not_eligible_users: 0,
  });

  const [searchTerm, setSearchTerm] =
    useState("");

  const [attendanceFilter, setAttendanceFilter] =
    useState("ALL");

  const [eligibilityFilter, setEligibilityFilter] =
    useState("ALL");

  const [registrationFilter, setRegistrationFilter] =
    useState("ALL");

  const [selectedParticipant, setSelectedParticipant] =
    useState<AttendanceReportParticipant | null>(null);

  const loadTrainings = async () => {

    try {

      setLoadingTrainings(true);
      setError("");

      const data =
        await getTrainings();

      setTrainings(data);

    } catch (err: any) {

      console.error(
        "Training loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to load trainings."
      );

    } finally {

      setLoadingTrainings(false);

    }
  };

  useEffect(() => {

    loadTrainings();

  }, []);

  // ============================================================
  // SELECTED TRAINING
  // ============================================================

  const selectedTraining =
    trainings.find(
      (training) =>
        training.n_training_id ===
        selectedTrainingId
    );

  // ============================================================
  // FILE SELECTION
  // ============================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0] || null;

    setSelectedFile(file);

    setError("");
    setSuccess("");

  };

  // ============================================================
  // LOAD EXISTING ATTENDANCE REPORT
  // ============================================================

  const loadAttendanceReport = async (
    trainingId: number
  ) => {

    if (
      !trainingId ||
      trainingId <= 0
    ) {

      setReportParticipants([]);
      setUsers([]);

      return;
    }

    try {

      setLoadingReport(true);
      setError("");

      const response =
        await getTrainingAttendanceReport(
          trainingId
        );

      const participants =
        Array.isArray(
          response.participants
        )
          ? response.participants
          : [];

      setReportParticipants(
        participants
      );

      setUsers(
        participants.map(
          (participant) => ({
            n_user_id:
              participant.n_user_id,

            s_user_name:
              participant.s_user_name || "",

            s_email:
              participant.s_email || "",

            n_attendance_minutes:
              participant.n_attendance_minutes ?? 0,

            s_attendance_status:
              participant.s_attendance_status,

            n_assessment_eligible:
              participant.n_assessment_eligible,
          })
        )
      );

      const attendedUsers =
        participants.filter(
          (participant) =>
            participant.s_attendance_status ===
            "ATTENDED"
        ).length;

      const eligibleUsers =
        participants.filter(
          (participant) =>
            participant.n_assessment_eligible === 1
        ).length;

      const notEligibleUsers =
        participants.filter(
          (participant) =>
            participant.n_assessment_eligible !== 1
        ).length;

      setSummary({

        total_users:
          participants.length,

        attended_users:
          attendedUsers,

        eligible_users:
          eligibleUsers,

        not_eligible_users:
          notEligibleUsers,

      });

    } catch (err: any) {

      console.error(
        "Attendance report loading failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      const message =
        err?.response?.data?.message;

      setReportParticipants([]);
      setUsers([]);

      setSummary({
        total_users: 0,
        attended_users: 0,
        eligible_users: 0,
        not_eligible_users: 0,
      });

      setError(
        typeof detail === "string"
          ? detail
          : typeof message === "string"
            ? message
            : "Unable to load attendance report."
      );

    } finally {

      setLoadingReport(false);

    }
  };

  // ============================================================
  // FILTER ATTENDANCE RESULTS
  // ============================================================

  const filteredParticipants =
    reportParticipants.filter(
      (participant) => {

        const search =
          searchTerm
            .trim()
            .toLowerCase();

        const matchesSearch =
          !search ||
          (
            participant.s_employee_id ||
            ""
          )
            .toLowerCase()
            .includes(search) ||
          (
            participant.s_user_name ||
            ""
          )
            .toLowerCase()
            .includes(search) ||
          (
            participant.s_email ||
            ""
          )
            .toLowerCase()
            .includes(search);

        const matchesAttendance =
          attendanceFilter === "ALL" ||
          participant.s_attendance_status.toUpperCase() ===
          attendanceFilter;

        const matchesEligibility =
          eligibilityFilter === "ALL" ||
          (
            participant.n_assessment_eligible === 1
              ? "ELIGIBLE"
              : "NOT_ELIGIBLE"
          ) === eligibilityFilter;

        const matchesRegistration =
          registrationFilter === "ALL" ||
          participant.s_registration_status.toUpperCase() ===
          registrationFilter;

        return (
          matchesSearch &&
          matchesAttendance &&
          matchesEligibility &&
          matchesRegistration
        );
      }
    );

    // ============================================================
    // ATTENDANCE SUMMARY
    // ============================================================

    const totalRegisteredUsers =
      reportParticipants.filter(
        (participant) =>
          participant.s_registration_status.toUpperCase() ===
          "REGISTERED"
      ).length;

    const attendedUsers =
      reportParticipants.filter(
        (participant) =>
          participant.s_attendance_status.toUpperCase() ===
          "ATTENDED"
      ).length;

    const notAttendedUsers =
      reportParticipants.filter(
        (participant) =>
          participant.s_attendance_status.toUpperCase() ===
          "NOT_ATTENDED"
      ).length;

    const eligibleUsers =
      reportParticipants.filter(
        (participant) =>
          participant.n_assessment_eligible === 1
      ).length;

    const notEligibleUsers =
      reportParticipants.filter(
        (participant) =>
          participant.n_assessment_eligible !== 1
      ).length;

    const attendancePercentage =
      totalRegisteredUsers > 0
        ? Math.round(
            (attendedUsers /
              totalRegisteredUsers) *
              100
          )
        : 0;

  const handleUpload = async () => {

    setError("");
    setSuccess("");

    if (
      !selectedTrainingId ||
      selectedTrainingId <= 0
    ) {

      setError(
        "Please select a training."
      );

      return;
    }

    if (!selectedFile) {

      setError(
        "Please select an attendance file."
      );

      return;
    }

    try {

      setUploading(true);

      const response =
        await uploadAttendance(
          selectedTrainingId,
          selectedFile
        );

      setSuccess(
        response.message
      );

      setUsers(
        response.users || []
      );

      setSummary({
        total_users:
          response.total_users,

        attended_users:
          response.attended_users,

        eligible_users:
          response.eligible_users,

        not_eligible_users:
          response.not_eligible_users,
      });

      await loadAttendanceReport(
        selectedTrainingId
      );

    } catch (err: any) {

      console.error(
        "Attendance upload failed:",
        err
      );

      const responseData =
        err?.response?.data;

      const detail =
        responseData?.detail;

      const message =
        responseData?.message;

      if (Array.isArray(detail)) {

        setError(
          detail
            .map(
              (item: any) =>
                item?.msg ||
                String(item)
            )
            .join(", ")
        );

      } else {

        setError(
          typeof detail === "string"
            ? detail
            : typeof message === "string"
              ? message
              : "Attendance processing failed."
        );
      }

    } finally {

      setUploading(false);

    }
  };

  return (
    <div className="min-h-full space-y-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div>

        <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          Attendance Management
        </h1>

        <p className="mt-1 text-sm font-medium text-slate-500">
          Upload and process Teams attendance reports.
        </p>

      </div>


      {/* ========================================================
          SUCCESS MESSAGE
      ======================================================== */}

      {success && (

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {success}
        </div>

      )}


      {/* ========================================================
          ERROR MESSAGE
      ======================================================== */}

      {error && (

        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {error}
        </div>

      )}


      {/* ========================================================
          UPLOAD CARD
      ======================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">

        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

          <h2 className="text-lg font-extrabold text-slate-900">
            Upload Attendance
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Select a training and upload its attendance report.
          </p>

        </div>


        <div className="space-y-6 p-6">


          {/* ====================================================
              TRAINING
          ==================================================== */}

          <div>

            <label
              htmlFor="attendanceTraining"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Training
            </label>


            {loadingTrainings ? (

              <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 text-sm font-medium text-indigo-700">
                Loading trainings...
              </div>

            ) : (

              <select
                id="attendanceTraining"
                value={
                  selectedTrainingId
                }
                onChange={(event) => {

                  const trainingId =
                    Number(
                      event.target.value
                    );

                  setSelectedTrainingId(
                    trainingId
                  );

                  setSelectedFile(null);

                  setUsers([]);

                  setReportParticipants([]);

                  setSummary({
                    total_users: 0,
                    attended_users: 0,
                    eligible_users: 0,
                    not_eligible_users: 0,
                  });

                  setError("");
                  setSuccess("");

                  setSearchTerm("");
                  setAttendanceFilter("ALL");
                  setEligibilityFilter("ALL");
                  setRegistrationFilter("ALL");

                  if (trainingId > 0) {

                    loadAttendanceReport(
                      trainingId
                    );

                  }

                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              >

                <option value={0}>
                  Select training
                </option>


                {trainings.map(
                  (training) => (

                    <option
                      key={
                        training.n_training_id
                      }
                      value={
                        training.n_training_id
                      }
                    >
                      {
                        training.s_training_code
                      }
                      {" - "}
                      {
                        training.s_training_name
                      }
                    </option>

                  )
                )}

              </select>

            )}

          </div>


          {/* ====================================================
              SELECTED TRAINING INFORMATION
          ==================================================== */}

          {selectedTraining && (

            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/70 p-5 shadow-sm md:grid-cols-4">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Training
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {
                    selectedTraining.s_training_name
                  }
                </p>

              </div>


              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Training Date
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {
                    selectedTraining.d_training_date
                  }
                </p>

              </div>


              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Time
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {
                    selectedTraining.t_start_time
                  }
                  {" - "}
                  {
                    selectedTraining.t_end_time
                  }
                </p>

              </div>


              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Minimum Attendance
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {
                    selectedTraining
                      .n_minimum_attendance_minutes
                  }{" "}
                  minutes
                </p>

              </div>

            </div>

          )}


          {/* ====================================================
              FILE
          ==================================================== */}

          <div>

            <label
              htmlFor="attendanceFile"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Attendance File
            </label>


            <input
              id="attendanceFile"
              type="file"
              accept=".xlsx,.xlsm,.csv"
              onChange={
                handleFileChange
              }
              className="block w-full rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm file:mr-4 file:border-0 file:border-r file:border-indigo-100 file:bg-indigo-50 file:px-4 file:py-3 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />


            <p className="mt-2 text-xs font-medium text-slate-500">
              Supported files: Excel (.xlsx, .xlsm) and CSV.
            </p>


            {selectedFile && (

              <p className="mt-2 text-sm font-medium text-slate-700">
                Selected file:{" "}
                <span className="font-medium">
                  {
                    selectedFile.name
                  }
                </span>
              </p>

            )}

          </div>


          {/* ====================================================
              UPLOAD BUTTON
          ==================================================== */}

          <div className="flex justify-end border-t border-slate-200 pt-5">

            <button
              type="button"
              onClick={
                handleUpload
              }
              disabled={
                uploading ||
                loadingTrainings ||
                !selectedTrainingId ||
                !selectedFile
              }
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {
                uploading
                  ? "Processing..."
                  : "Upload Attendance"
              }
            </button>

          </div>

        </div>

      </div>


     {/* ========================================================
          ATTENDANCE SUMMARY
      ======================================================== */}

      {selectedTrainingId > 0 && (

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">

          {/* TOTAL REGISTERED */}

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">

            <p className="text-sm text-gray-500">
              Registered Users
            </p>

            <p className="mt-2 text-3xl font-extrabold text-indigo-700">
              {totalRegisteredUsers}
            </p>

          </div>


          {/* ATTENDED */}

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">

            <p className="text-sm text-gray-500">
              Attended Users
            </p>

            <p className="mt-2 text-3xl font-extrabold text-indigo-700">
              {attendedUsers}
            </p>

          </div>


          {/* NOT ATTENDED */}

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">

            <p className="text-sm text-gray-500">
              Not Attended
            </p>

            <p className="mt-2 text-3xl font-extrabold text-rose-600">
              {notAttendedUsers}
            </p>

          </div>


          {/* ELIGIBLE */}

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">

            <p className="text-sm text-gray-500">
              Assessment Eligible
            </p>

            <p className="mt-2 text-3xl font-extrabold text-emerald-600">
              {eligibleUsers}
            </p>

          </div>


          {/* ATTENDANCE PERCENTAGE */}

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">

            <p className="text-sm text-gray-500">
              Attendance %
            </p>

            <p className="mt-2 text-3xl font-extrabold text-indigo-700">
              {attendancePercentage}%
            </p>

          </div>

        </div>

      )}

      {/* ========================================================
    ATTENDANCE RESULTS
======================================================== */}

      {(loadingReport ||
        users.length > 0) && (

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

            {/* ====================================================
        RESULTS HEADER
    ==================================================== */}

            <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-extrabold text-slate-900">
                    Attendance Results
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Attendance processing result for registered users.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search employee, name or email..."
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />

                    <select
                      value={attendanceFilter}
                      onChange={(event) =>
                        setAttendanceFilter(
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="ALL">
                        All Attendance
                      </option>

                      <option value="ATTENDED">
                        Attended
                      </option>

                      <option value="NOT_ATTENDED">
                        Not Attended
                      </option>

                      <option value="NOT_PROCESSED">
                        Not Processed
                      </option>
                    </select>

                    <select
                      value={eligibilityFilter}
                      onChange={(event) =>
                        setEligibilityFilter(
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="ALL">
                        All Eligibility
                      </option>

                      <option value="ELIGIBLE">
                        Eligible
                      </option>

                      <option value="NOT_ELIGIBLE">
                        Not Eligible
                      </option>
                    </select>

                    <select
                      value={registrationFilter}
                      onChange={(event) =>
                        setRegistrationFilter(
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="ALL">
                        All Registration
                      </option>

                      <option value="REGISTERED">
                        Registered
                      </option>

                      <option value="AVAILABLE">
                        Available
                      </option>
                    </select>

                  </div>

                </div>

                {selectedTraining && (

                  <div className="text-right">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      Minimum Required
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">

                      {
                        selectedTraining
                          .n_minimum_attendance_minutes
                      }{" "}

                      minutes

                    </p>

                  </div>

                )}

              </div>

            </div>


            {/* ====================================================
        LOADING / TABLE
    ==================================================== */}

            {loadingReport ? (

              <div className="p-10 text-center text-sm text-gray-500">

                Loading attendance report...

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50/70 to-blue-50">

                    <tr>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Employee ID
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Name
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Email
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Attendance
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Assessment Eligibility
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Join Time
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Leave Time
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Duration
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Report File
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Uploaded At
                      </th>

                      <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredParticipants.map(
                      (participant) => {


                        return (

                          <tr
                            key={
                              participant.n_participant_id
                            }
                            className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/40"
                          >

                            {/* EMPLOYEE ID */}

                            <td className="px-5 py-4">

                              <div className="font-bold text-slate-800">

                                {
                                  participant.s_employee_id ||
                                  "-"
                                }

                              </div>

                            </td>


                            {/* NAME */}

                            <td className="px-5 py-4">

                              <div className="font-bold text-slate-800">

                                {
                                  participant.s_user_name ||
                                  "-"
                                }

                              </div>

                            </td>


                            {/* EMAIL */}

                            <td className="px-5 py-4 font-medium text-slate-600">

                              {
                                participant.s_email ||
                                "-"
                              }

                            </td>


                            {/* ATTENDANCE MINUTES */}

                            <td className="px-5 py-4">

                              <span className="font-semibold">

                                {
                                  participant.n_attendance_minutes ??
                                  "-"
                                }

                              </span>{" "}

                              minutes

                            </td>


                            {/* ATTENDANCE STATUS */}

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${participant.s_attendance_status
                                  .toUpperCase() ===
                                  "ATTENDED"
                                  ? "bg-green-100 text-green-700"
                                  : participant.s_attendance_status
                                    .toUpperCase() ===
                                    "NOT_ATTENDED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                  }`}
                              >

                                {
                                  participant.s_attendance_status
                                }

                              </span>

                            </td>


                            {/* ASSESSMENT ELIGIBILITY */}

                            <td className="px-5 py-4">

                              {participant.n_assessment_eligible ===
                                1 ? (

                                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                                  Eligible
                                </span>

                              ) : (

                                <span className="rounded-full border border-rose-200 bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm">
                                  Not Eligible
                                </span>

                              )}

                            </td>


                            {/* JOIN TIME */}

                            <td className="px-5 py-4 font-medium text-slate-600">

                              {
                                participant.dt_join_time ||
                                "-"
                              }

                            </td>


                            {/* LEAVE TIME */}

                            <td className="px-5 py-4 font-medium text-slate-600">

                              {
                                participant.dt_leave_time ||
                                "-"
                              }

                            </td>


                            {/* DURATION */}

                            <td className="px-5 py-4">

                                {
                                  participant.n_duration_minutes ??
                                  "-"
                                }{" "}

                                {
                                  participant.n_duration_minutes !== null
                                    ? "minutes"
                                    : ""
                                }

                            </td>


                            {/* REPORT FILE */}

                            <td className="px-5 py-4 font-medium text-slate-600">

                              {
                                participant.s_report_file_name ||
                                "-"
                              }

                            </td>


                            {/* UPLOADED AT */}

                            <td className="px-5 py-4 font-medium text-slate-600">

                              {
                                participant.dt_uploaded_at ||
                                "-"
                              }

                            </td>

                            <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedParticipant(
                                  participant
                                )
                              }
                              className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md"
                            >
                              View
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

          </div>

        )}

      {/* ========================================================
              PARTICIPANT DETAILS
          ======================================================== */}

          {selectedParticipant && (

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

              <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-indigo-950/30">

                {/* ====================================================
                    MODAL HEADER
                ==================================================== */}

                <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

                  <div>

                    <h2 className="text-xl font-semibold text-gray-900">
                      Attendance Details
                    </h2>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Complete attendance information for the selected participant.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedParticipant(null)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Close
                  </button>

                </div>


                {/* ====================================================
                    MODAL CONTENT
                ==================================================== */}

                <div className="max-h-[75vh] overflow-y-auto bg-slate-50/50 p-6">

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">


                    {/* EMPLOYEE ID */}

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        Employee ID
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {
                          selectedParticipant.s_employee_id ||
                          "-"
                        }
                      </p>
                    </div>


                    {/* NAME */}

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        Name
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {
                          selectedParticipant.s_user_name ||
                          "-"
                        }
                      </p>
                    </div>


                    {/* EMAIL */}

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        Email
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {
                          selectedParticipant.s_email ||
                          "-"
                        }
                      </p>
                    </div>


                    {/* REGISTRATION */}

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        Registration Status
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {
                          selectedParticipant.s_registration_status ||
                          "-"
                        }
                      </p>
                    </div>

                  </div>


                  {/* ==================================================
                      ATTENDANCE
                  ================================================== */}

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <h3 className="text-sm font-extrabold text-indigo-900">
                      Attendance
                    </h3>

                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">

                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Attendance Minutes
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {
                            selectedParticipant.n_attendance_minutes ??
                            "-"
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Attendance Status
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {
                            selectedParticipant.s_attendance_status ||
                            "-"
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Assessment Eligibility
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">

                          {
                            selectedParticipant.n_assessment_eligible ===
                            1
                              ? "Eligible"
                              : "Not Eligible"
                          }

                        </p>

                      </div>

                    </div>

                  </div>


                  {/* ==================================================
                      SESSION
                  ================================================== */}

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <h3 className="text-sm font-extrabold text-indigo-900">
                      Attendance Session
                    </h3>

                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">

                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Join Time
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {
                            selectedParticipant.dt_join_time ||
                            "-"
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Leave Time
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {
                            selectedParticipant.dt_leave_time ||
                            "-"
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Duration
                        </p>

                        <p className="mt-1 font-bold text-slate-800">

                          {
                            selectedParticipant.n_duration_minutes ??
                            "-"
                          }{" "}

                          {
                            selectedParticipant.n_duration_minutes !==
                            null
                              ? "minutes"
                              : ""
                          }

                        </p>

                      </div>

                    </div>

                  </div>


                  {/* ==================================================
                      REPORT INFORMATION
                  ================================================== */}

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <h3 className="text-sm font-extrabold text-indigo-900">
                      Report Information
                    </h3>

                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">

                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Report File
                        </p>

                        <p className="mt-1 break-all font-medium text-gray-900">
                          {
                            selectedParticipant.s_report_file_name ||
                            "-"
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Uploaded At
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {
                            selectedParticipant.dt_uploaded_at ||
                            "-"
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 p-4 shadow-sm">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Uploaded By
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {
                            selectedParticipant.n_uploaded_by ??
                            "-"
                          }
                        </p>

                      </div>

                    </div>

                  </div>

                </div>


                {/* ====================================================
                    MODAL FOOTER
                ==================================================== */}

                <div className="flex justify-end border-t border-slate-200 bg-white px-6 py-4">

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedParticipant(null)
                    }
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          )}

      {/* ========================================================
          NO RESULTS
      ======================================================== */}

      {!uploading &&
        !loadingReport &&
        selectedTrainingId > 0 &&
        reportParticipants.length === 0 &&
        !error && (

          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 p-10 text-center shadow-sm">

            <p className="text-sm text-gray-500">
              No attendance data is available for the selected training.
            </p>

          </div>

        )}

    </div>
  );
}