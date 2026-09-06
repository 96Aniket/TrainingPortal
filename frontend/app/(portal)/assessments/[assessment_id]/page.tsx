"use client";

import {
    Fragment,
    useEffect,
    useState,
} from "react";

import {
    useParams,
    useRouter,
} from "next/navigation";

import {
    getAssessmentResults,
    AssessmentResultDetails,
    AssessmentParticipantResult,
} from "@/services/api/assessmentResultApi";


export default function AssessmentResultsPage() {

    const params =
        useParams<{
            assessment_id: string;
        }>();

    const router =
        useRouter();

    const assessmentId =
        Number(
            params?.assessment_id
        );


    // ============================================================
    // STATE
    // ============================================================

    const [
        assessment,
        setAssessment
    ] =
        useState<AssessmentResultDetails | null>(
            null
        );


    const [
        results,
        setResults
    ] =
        useState<AssessmentParticipantResult[]>(
            []
        );


    const [
        loading,
        setLoading
    ] =
        useState(true);


    const [
        error,
        setError
    ] =
        useState("");


    const [
        expandedParticipant,
        setExpandedParticipant
    ] =
        useState<number | null>(
            null
        );

    const [
        searchTerm,
        setSearchTerm
    ] =
        useState("");

    const [
        resultFilter,
        setResultFilter
    ] =
        useState("ALL");

    const [
        eligibilityFilter,
        setEligibilityFilter
    ] =
        useState("ALL");

    const [
        attendanceFilter,
        setAttendanceFilter
    ] =
        useState("ALL");


    // ============================================================
    // LOAD RESULTS
    // ============================================================

    const loadResults = async () => {

        if (
            !assessmentId ||
            assessmentId <= 0
        ) {

            setError(
                "Invalid assessment."
            );

            setLoading(false);

            return;
        }


        try {

            setLoading(true);
            setError("");

            const response =
                await getAssessmentResults(
                    assessmentId
                );


            setAssessment(
                response.assessment
            );


            setResults(
                Array.isArray(
                    response.results
                )
                    ? response.results
                    : []
            );

        } catch (err: any) {

            console.error(
                "Assessment results loading failed:",
                err
            );


            const detail =
                err?.response?.data?.detail;


            const message =
                err?.response?.data?.message;


            setError(
                typeof detail === "string"
                    ? detail
                    : typeof message === "string"
                        ? message
                        : "Unable to load assessment results."
            );

        } finally {

            setLoading(false);

        }
    };


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadResults();

    }, [
        assessmentId
    ]);

    const filteredResults =
        results.filter(
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


                const matchesResult =
                    resultFilter === "ALL" ||
                    (
                        participant.s_final_result ||
                        "NOT_ATTEMPTED"
                    ) === resultFilter;


                const matchesEligibility =
                    eligibilityFilter === "ALL" ||
                    (
                        participant.n_assessment_eligible === 1
                            ? "ELIGIBLE"
                            : "NOT_ELIGIBLE"
                    ) === eligibilityFilter;


                const matchesAttendance =
                    attendanceFilter === "ALL" ||
                    (
                        participant.s_attendance_status ||
                        "NOT_PROCESSED"
                    ) === attendanceFilter;


                return (
                    matchesSearch &&
                    matchesResult &&
                    matchesEligibility &&
                    matchesAttendance
                );

            }
        );

    const totalParticipants =
        results.length;

    const eligibleParticipants =
        results.filter(
            (participant) =>
                participant.n_assessment_eligible === 1
        ).length;

    const attemptedParticipants =
        results.filter(
            (participant) =>
                participant.attempts.length > 0
        ).length;

    const passedParticipants =
        results.filter(
            (participant) =>
                participant.s_final_result === "PASS"
        ).length;

    const failedParticipants =
        results.filter(
            (participant) =>
                participant.s_final_result === "FAIL"
        ).length;

    const notAttemptedParticipants =
        results.filter(
            (participant) =>
                participant.attempts.length === 0
        ).length;


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div className="rounded-2xl border border-indigo-100 bg-white p-12 text-center text-sm font-semibold text-slate-500 shadow-xl shadow-indigo-100/40">

                Loading assessment results...

            </div>

        );

    }


    // ============================================================
    // ERROR
    // ============================================================

    if (error) {

        return (

            <div className="space-y-5">

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/assessments"
                        )
                    }
                    className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md"
                >
                    ← Back to Assessments
                </button>


                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700 shadow-md shadow-rose-100/50">

                    {
                        error
                    }

                </div>

            </div>

        );

    }


    // ============================================================
    // PAGE
    // ============================================================

    return (

        <div className="min-h-full space-y-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">


            {/* ======================================================
          HEADER
      ====================================================== */}

            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-start">

                <div>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/assessments"
                            )
                        }
                        className="mb-4 inline-flex items-center rounded-lg px-2 py-1 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
                    >
                        ← Back to Assessments
                    </button>


                    <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                        Assessment Results
                    </h1>


                    {assessment && (

                        <div className="mt-2">

                            <p className="text-lg font-extrabold text-slate-900">
                                {
                                    assessment.s_assessment_name
                                }
                            </p>


                            <p className="mt-1 text-sm font-medium text-slate-500">

                                {
                                    assessment.s_training_name ||
                                    "Training"
                                }

                            </p>

                        </div>

                    )}

                </div>


                <button
                    type="button"
                    onClick={
                        loadResults
                    }
                    className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md"
                >
                    Refresh
                </button>

            </div>


            {/* ======================================================
          ASSESSMENT SUMMARY
      ====================================================== */}

            {assessment && (

                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">


                    <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Marks
                        </p>

                        <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                            {
                                assessment.n_total_marks
                            }
                        </p>

                    </div>


                    <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Passing
                        </p>

                        <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                            {
                                assessment.n_passing_score
                            }%
                        </p>

                    </div>


                    <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Duration
                        </p>

                        <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">

                            {
                                assessment.n_duration_minutes !==
                                    null
                                    ? assessment.n_duration_minutes
                                    : "-"
                            }

                        </p>

                        {assessment.n_duration_minutes !== null && (

                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                minutes
                            </p>

                        )}

                    </div>


                    <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Attempts Allowed
                        </p>

                        <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">

                            {
                                assessment.n_maximum_attempts ??
                                "Unlimited"
                            }

                        </p>

                    </div>


                    <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Participants
                        </p>

                        <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                            {
                                results.length
                            }
                        </p>

                    </div>

                </div>

            )}

            {/* ======================================================
    RESULT SUMMARY
====================================================== */}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">

                <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Participants
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {totalParticipants}
                    </p>

                </div>


                <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Eligible
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {eligibleParticipants}
                    </p>

                </div>


                <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Attempted
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {attemptedParticipants}
                    </p>

                </div>


                <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Not Attempted
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {notAttemptedParticipants}
                    </p>

                </div>


                <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Passed
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {passedParticipants}
                    </p>

                </div>


                <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Failed
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {failedParticipants}
                    </p>

                </div>

            </div>

            {/* ======================================================
          RESULTS TABLE
      ====================================================== */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">


                <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white via-55% to-violet-50/70 px-6 py-5">

                    <div className="flex items-center justify-between">

                        <div className="min-w-0 flex-1">

                            <h2 className="text-lg font-semibold text-gray-900">
                                Participant Results
                            </h2>

                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Attendance, eligibility, attempts and final results.
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
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                />

                                <select
                                    value={resultFilter}
                                    onChange={(event) =>
                                        setResultFilter(
                                            event.target.value
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                >

                                    <option value="ALL">
                                        All Results
                                    </option>

                                    <option value="PASS">
                                        Passed
                                    </option>

                                    <option value="FAIL">
                                        Failed
                                    </option>

                                    <option value="NOT_ATTEMPTED">
                                        Not Attempted
                                    </option>

                                </select>

                                <select
                                    value={eligibilityFilter}
                                    onChange={(event) =>
                                        setEligibilityFilter(
                                            event.target.value
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
                                    value={attendanceFilter}
                                    onChange={(event) =>
                                        setAttendanceFilter(
                                            event.target.value
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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

                            </div>

                        </div>

                        <span className="ml-6 shrink-0 text-sm text-gray-500">
                            {
                                filteredResults.length
                            } participants
                        </span>

                    </div>

                </div>


                {filteredResults.length === 0 ? (

                    <div className="rounded-2xl border border-indigo-100 bg-white p-12 text-center text-sm font-semibold text-slate-500 shadow-xl shadow-indigo-100/40">

                        No participant results found.

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
                                        Eligibility
                                    </th>

                                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                        Attempts
                                    </th>

                                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                        Score
                                    </th>

                                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                        Result
                                    </th>

                                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                        Email
                                    </th>

                                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredResults.map(
                                    (participant) => (

                                        <Fragment
                                            key={
                                                participant.n_participant_id
                                            }
                                        >

                                            <tr
                                                className="border-b border-slate-100 transition-all duration-150 hover:bg-indigo-50/50 hover:shadow-[inset_3px_0_0_#6366f1]"
                                            >
                                                <td className="px-5 py-4 font-semibold text-slate-800">
                                                    {
                                                        participant.s_employee_id ||
                                                        "-"
                                                    }
                                                </td>


                                                <td className="px-5 py-4">
                                                    {
                                                        participant.s_user_name ||
                                                        "-"
                                                    }
                                                </td>


                                                <td className="px-5 py-4 font-medium text-slate-600">
                                                    {
                                                        participant.s_email ||
                                                        "-"
                                                    }
                                                </td>


                                                <td className="px-5 py-4">

                                                    <div>
                                                        {
                                                            participant.n_attendance_minutes ??
                                                            "-"
                                                        }{" "}
                                                        min
                                                    </div>

                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        {
                                                            participant.s_attendance_status
                                                        }
                                                    </div>

                                                </td>


                                                <td className="px-5 py-4">

                                                    {participant.n_assessment_eligible ===
                                                        1 ? (

                                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                                            Eligible
                                                        </span>

                                                    ) : (

                                                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-rose-700">
                                                            Not Eligible
                                                        </span>

                                                    )}

                                                </td>


                                                <td className="px-5 py-4">

                                                    <div>
                                                        {
                                                            participant.n_attempt_count
                                                        }
                                                        {" "}
                                                        attempt(s)
                                                    </div>

                                                    {participant.n_reattempt_count >
                                                        0 && (

                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                Reattempts:{" "}
                                                                {
                                                                    participant.n_reattempt_count
                                                                }
                                                            </div>

                                                        )}

                                                </td>


                                                <td className="px-5 py-4">

                                                    {participant.n_final_score !==
                                                        null ? (

                                                        <span className="font-semibold">
                                                            {
                                                                participant.n_final_score
                                                            }
                                                            /
                                                            {
                                                                assessment?.n_total_marks
                                                            }
                                                        </span>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            -
                                                        </span>

                                                    )}

                                                </td>


                                                <td className="px-5 py-4">

                                                    {participant.s_final_result ? (

                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-medium ${participant.s_final_result ===
                                                                "PASS"
                                                                ? "border border-emerald-200 bg-emerald-100 text-emerald-700 shadow-sm"
                                                                : participant.s_final_result ===
                                                                    "FAIL"
                                                                    ? "border border-rose-200 bg-rose-100 text-rose-700 shadow-sm"
                                                                    : "border border-amber-200 bg-amber-100 text-amber-700 shadow-sm"
                                                                }`}
                                                        >
                                                            {
                                                                participant.s_final_result
                                                            }
                                                        </span>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            -
                                                        </span>

                                                    )}

                                                </td>


                                                <td className="px-5 py-4">

                                                    {participant.email ? (

                                                        <div>

                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs font-medium ${participant.email.s_status ===
                                                                    "SENT"
                                                                    ? "border border-emerald-200 bg-emerald-100 text-emerald-700 shadow-sm"
                                                                    : participant.email.s_status ===
                                                                        "FAILED"
                                                                        ? "border border-rose-200 bg-rose-100 text-rose-700 shadow-sm"
                                                                        : "border border-amber-200 bg-amber-100 text-amber-700 shadow-sm"
                                                                    }`}
                                                            >
                                                                {
                                                                    participant.email.s_status
                                                                }
                                                            </span>


                                                            <div className="mt-1 text-xs text-gray-500">
                                                                {
                                                                    participant.email.s_email_type
                                                                }
                                                            </div>

                                                        </div>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            -
                                                        </span>

                                                    )}

                                                </td>


                                                <td className="px-5 py-4">

                                                    {participant.attempts.length >
                                                        0 && (

                                                            <button
                                                                type="button"
                                                                onClick={() => {

                                                                    setExpandedParticipant(
                                                                        (
                                                                            current
                                                                        ) =>
                                                                            current ===
                                                                                participant.n_participant_id
                                                                                ? null
                                                                                : participant.n_participant_id
                                                                    );

                                                                }}
                                                                className="rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-indigo-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md"
                                                            >
                                                                {
                                                                    expandedParticipant ===
                                                                        participant.n_participant_id
                                                                        ? "Hide"
                                                                        : "Attempts"
                                                                }
                                                            </button>

                                                        )}

                                                </td>

                                            </tr>


                                            {/* ==================================================
                          ATTEMPT DETAILS
                      ================================================== */}

                                            {expandedParticipant ===
                                                participant.n_participant_id && (

                                                    <tr>

                                                        <td
                                                            colSpan={10}
                                                            className="bg-slate-50 px-5 py-5"
                                                        >

                                                            <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg shadow-violet-100/40">

                                                                <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 px-4 py-3">

                                                                    <h3 className="font-medium">
                                                                        Attempt History
                                                                    </h3>

                                                                </div>


                                                                <div className="overflow-x-auto">

                                                                    <table className="w-full text-left text-sm">

                                                                        <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50/70 to-blue-50">

                                                                            <tr>

                                                                                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                    Attempt
                                                                                </th>

                                                                                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                    Started
                                                                                </th>

                                                                                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                    Submitted
                                                                                </th>

                                                                                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                    Score
                                                                                </th>

                                                                                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                    Percentage
                                                                                </th>

                                                                                <th className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                    Result
                                                                                </th>

                                                                            </tr>

                                                                        </thead>


                                                                        <tbody>

                                                                            {participant.attempts.map(
                                                                                (attempt) => (

                                                                                    <tr
                                                                                        key={
                                                                                            attempt.n_attempt_id
                                                                                        }
                                                                                        className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/40"
                                                                                    >

                                                                                        <td className="px-4 py-3 font-medium">
                                                                                            Attempt{" "}
                                                                                            {
                                                                                                attempt.n_attempt_number
                                                                                            }
                                                                                        </td>

                                                                                        <td className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                            {
                                                                                                attempt.dt_started_at ||
                                                                                                "-"
                                                                                            }
                                                                                        </td>

                                                                                        <td className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                            {
                                                                                                attempt.dt_submitted_at ||
                                                                                                "-"
                                                                                            }
                                                                                        </td>

                                                                                        <td className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                            {
                                                                                                attempt.n_score ??
                                                                                                "-"
                                                                                            }
                                                                                        </td>

                                                                                        <td className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                                                                                            {
                                                                                                attempt.n_percentage ??
                                                                                                "-"
                                                                                            }%
                                                                                        </td>

                                                                                        <td className="px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">

                                                                                            {
                                                                                                attempt.s_result ||
                                                                                                "-"
                                                                                            }

                                                                                        </td>

                                                                                    </tr>

                                                                                )
                                                                            )}

                                                                        </tbody>

                                                                    </table>

                                                                </div>

                                                            </div>

                                                        </td>

                                                    </tr>

                                                )}

                                        </Fragment>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );
}