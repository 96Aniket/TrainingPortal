"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

import {
  getAssessmentPreview,
  startAssessment,
  submitAssessment,
  AssessmentAttemptQuestion,
  SubmitAssessmentAnswer,
  SubmitAssessmentResponse,
  AssessmentPreview,
} from "@/services/api/assessmentAttemptApi";


export default function AssessmentPage() {

  // ============================================================
  // ROUTE
  // ============================================================

  const params =
    useParams<{
      assessment_id: string;
    }>();

  const searchParams =
    useSearchParams();

  const assessmentId =
    Number(
      params?.assessment_id
    );

  const registrationToken =
    searchParams.get(
      "token"
    ) || "";


  // ============================================================
  // ASSESSMENT
  // ============================================================

  const [assessmentName, setAssessmentName] =
    useState("");

  const [preview, setPreview] =
    useState<AssessmentPreview | null>(null);

  const [totalMarks, setTotalMarks] =
    useState(0);

  const [passingScore, setPassingScore] =
    useState(0);

  const [durationMinutes, setDurationMinutes] =
    useState<number | null>(null);

  const [maximumAttempts, setMaximumAttempts] =
    useState<number | null>(null);

  const [attemptId, setAttemptId] =
    useState<number | null>(null);

  const [attemptNumber, setAttemptNumber] =
    useState<number | null>(null);

  const [questions, setQuestions] =
    useState<AssessmentAttemptQuestion[]>([]);


  // ============================================================
  // ANSWERS
  // ============================================================

  const [answers, setAnswers] =
    useState<
      Record<number, number>
    >({});


  // ============================================================
  // UI STATE
  // ============================================================

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [started, setStarted] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<SubmitAssessmentResponse | null>(
      null
    );


  // ============================================================
  // TIMER
  // ============================================================

  const [remainingSeconds, setRemainingSeconds] =
    useState<number | null>(null);


  // ============================================================
  // LOAD / START
  // ============================================================

  const handleStartAssessment =
    async () => {

      if (!assessmentId) {

        setError(
          "Invalid assessment."
        );

        return;
      }

      if (!registrationToken) {

        setError(
          "Assessment registration token is missing."
        );

        return;
      }

      try {

        setStarting(true);
        setError("");

        const response =
          await startAssessment(
            assessmentId,
            registrationToken
          );

        setAssessmentName(
          response.s_assessment_name
        );

        setTotalMarks(
          response.n_total_marks
        );

        setPassingScore(
          response.n_passing_score
        );

        setDurationMinutes(
          response.n_duration_minutes
        );

        setMaximumAttempts(
          response.n_maximum_attempts
        );

        setAttemptId(
          response.n_attempt_id
        );

        setAttemptNumber(
          response.n_attempt_number
        );

        setQuestions(
          Array.isArray(
            response.questions
          )
            ? response.questions
            : []
        );

        setStarted(true);


        if (
          response.n_duration_minutes !== null
        ) {

          setRemainingSeconds(
            response.n_duration_minutes * 60
          );

        }

      } catch (err: any) {

        console.error(
          "Assessment start failed:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to start assessment."
        );

      } finally {

        setStarting(false);
        setLoading(false);

      }
    };


  // ============================================================
  // INITIAL START
  // ============================================================

  useEffect(() => {

    const loadAssessmentPreview =
        async () => {

        if (!assessmentId) {

            setError(
            "Invalid assessment."
            );

            setLoading(false);

            return;
        }

        if (!registrationToken) {

            setError(
            "Assessment registration token is missing."
            );

            setLoading(false);

            return;
        }

        try {

            setLoading(true);
            setError("");

            const data =
            await getAssessmentPreview(
                assessmentId
            );

            setPreview(data);

        } catch (err: any) {

            console.error(
            "Assessment preview failed:",
            err
            );

            const detail =
            err?.response?.data?.detail;

            const message =
            err?.response?.data?.message;

            if (
            Array.isArray(detail)
            ) {

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
                    : "Unable to load assessment."
            );

            }

        } finally {

            setLoading(false);

        }

        };

    loadAssessmentPreview();

    }, [
    assessmentId,
    registrationToken,
    ]);


  // ============================================================
  // TIMER
  // ============================================================

  useEffect(() => {

    if (
      !started ||
      submitted ||
      remainingSeconds === null
    ) {

      return;
    }


    if (
      remainingSeconds <= 0
    ) {

      if (!submitting) {
        handleSubmit(true);
      }

      return;
    }


    const timer =
      window.setInterval(
        () => {

          setRemainingSeconds(
            (previous) =>
              previous !== null
                ? previous - 1
                : null
          );

        },
        1000
      );


    return () => {

      window.clearInterval(
        timer
      );

    };

  }, [
    started,
    submitted,
    remainingSeconds,
    submitting,
  ]);


  // ============================================================
  // ANSWER SELECTION
  // ============================================================

  const handleAnswerChange =
    (
      questionId: number,
      optionId: number
    ) => {

      setAnswers(
        (previous) => ({
          ...previous,
          [questionId]:
            optionId,
        })
      );

    };


  // ============================================================
  // ANSWER COUNT
  // ============================================================

  const answeredCount =
    Object.keys(
      answers
    ).length;


  const unansweredCount =
    Math.max(
      questions.length -
        answeredCount,
      0
    );


  // ============================================================
  // TIMER DISPLAY
  // ============================================================

  const timerText =
    useMemo(() => {

      if (
        remainingSeconds === null
      ) {

        return "--:--";

      }


      const minutes =
        Math.floor(
          remainingSeconds /
            60
        );

      const seconds =
        remainingSeconds %
        60;


      return `${String(
        minutes
      ).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;

    }, [
      remainingSeconds,
    ]);


  // ============================================================
  // SUBMIT ASSESSMENT
  // ============================================================

  const handleSubmit =
    async (
      automatic = false
    ) => {

      if (
        !attemptId ||
        submitted ||
        submitting
      ) {

        return;
      }


      setError("");


      const submittedAnswers:
        SubmitAssessmentAnswer[] =
        questions.map(
          (question) => ({

            n_question_id:
              question.n_question_id,

            n_selected_option_id:
              answers[
                question.n_question_id
              ],

          })
        );


      const hasMissingAnswer =
        submittedAnswers.some(
          (answer) =>
            !answer.n_selected_option_id
        );


      if (
        hasMissingAnswer &&
        !automatic
      ) {

        setError(
          "Please answer all questions before submitting."
        );

        return;
      }


      try {

        setSubmitting(true);


        const response =
          await submitAssessment(
            assessmentId,
            {
              n_attempt_id:
                attemptId,

              registration_token:
                registrationToken,

              answers:
                submittedAnswers,
            }
          );


        setResult(
          response
        );

        setSubmitted(
          true
        );

      } catch (err: any) {

        console.error(
          "Assessment submission failed:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to submit assessment."
        );

      } finally {

        setSubmitting(false);

      }
    };


  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading ||
    starting
  ) {

    return (

        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">

            <div className="rounded-xl border bg-white px-8 py-10 text-center shadow-sm">

            <p className="text-sm text-slate-500">
                Starting assessment...
            </p>

            </div>

        </main>

        );

    }


    // ============================================================
    // ERROR
    // ============================================================

    if (
        error &&
        !started
    ) {

        return (

        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">

            <div className="w-full max-w-lg rounded-xl border bg-white p-8 text-center shadow-sm">

            <h1 className="text-2xl font-semibold text-slate-900">
                Assessment Unavailable
            </h1>

            <p className="mt-3 text-sm text-rose-600">
                {
                error
                }
            </p>

            </div>

        </main>

        );

    }

        // ============================================================
        // ASSESSMENT START SCREEN
        // ============================================================

        if (!started) {

        if (!started) {

    return (

        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5 py-10">

        <div className="mx-auto w-full max-w-3xl">

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="border-b px-6 py-6">

                <p className="text-sm font-medium text-slate-500">
                Assessment
                </p>

                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Assessment Instructions
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                Please review the assessment details before starting.
                </p>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="mx-6 mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
                </div>

            )}


            {/* ==================================================
                DETAILS
            ================================================== */}

            {preview && (

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm">

                    <p className="text-xs text-slate-500">
                    Assessment
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                    {
                        preview.s_assessment_name
                    }
                    </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm">

                    <p className="text-xs text-slate-500">
                    Training
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                        Training ID:{" "}
                        {
                            preview.n_training_id
                        }
                    </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm">

                    <p className="text-xs text-slate-500">
                    Total Marks
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                    {
                        preview.n_total_marks
                    }
                    </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm">

                    <p className="text-xs text-slate-500">
                    Passing Score
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                    {
                        preview.n_passing_score
                    }%
                    </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm">

                    <p className="text-xs text-slate-500">
                    Duration
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">

                    {
                        preview.n_duration_minutes !==
                        null
                        ? `${preview.n_duration_minutes} minutes`
                        : "No time limit"
                    }

                    </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm">

                    <p className="text-xs text-slate-500">
                    Maximum Attempts
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">

                    {
                        preview.n_maximum_attempts !==
                        null
                        ? preview.n_maximum_attempts
                        : "Unlimited"
                    }

                    </p>

                </div>

                </div>

            )}


            {/* ==================================================
                START
            ================================================== */}

            <div className="flex justify-end border-t px-6 py-5">

                <button
                type="button"
                onClick={
                    handleStartAssessment
                }
                disabled={
                    starting ||
                    !preview
                }
                className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >

                {
                    starting
                    ? "Starting..."
                    : "Start Assessment"
                }

                </button>

            </div>

            </div>

        </div>

        </main>

    );

    }

    }

  // ============================================================
  // RESULT
  // ============================================================

  if (
    submitted &&
    result
  ) {

    const passed =
      result.s_result ===
      "PASS";


    return (

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5 py-10">

        <div className="mx-auto w-full max-w-3xl">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

            <div className="border-b px-6 py-6">

              <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                Assessment Result
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {
                  assessmentName
                }
              </p>

            </div>


            <div className="p-6">

              <div
                className={`rounded-xl border p-6 ${
                  passed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50"
                }`}
              >

                <p
                  className={`text-lg font-semibold ${
                    passed
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {
                    passed
                      ? "Assessment Passed"
                      : "Assessment Failed"
                  }
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Your assessment has been submitted successfully.
                </p>

              </div>


              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50/60 p-4 shadow-sm">

                  <p className="text-xs text-slate-500">
                    Score
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      result.n_score
                    }
                  </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50/60 p-4 shadow-sm">

                  <p className="text-xs text-slate-500">
                    Total Marks
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      result.n_total_marks
                    }
                  </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50/60 p-4 shadow-sm">

                  <p className="text-xs text-slate-500">
                    Percentage
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      result.n_percentage
                    }%
                  </p>

                </div>


                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50/60 p-4 shadow-sm">

                  <p className="text-xs text-slate-500">
                    Passing
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      result.n_passing_score
                    }%
                  </p>

                </div>

              </div>


              <p className="mt-6 text-sm text-slate-500">
                {
                  result.email_message ||
                  "Assessment result processing completed."
                }
              </p>

            </div>

          </div>

        </div>

      </main>

    );

  }


  // ============================================================
  // ASSESSMENT
  // ============================================================

  return (

    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5 py-8">

      <div className="mx-auto w-full max-w-5xl">


        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center">

          <div>

            <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
              {
                assessmentName
              }
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Attempt {
                attemptNumber
              }
              {" • "}
              {
                questions.length
              } questions
            </p>

          </div>


          <div className="flex items-center gap-3">


            <div className="rounded-lg border bg-slate-50 px-4 py-2 text-center">

              <p className="text-xs text-slate-500">
                Progress
              </p>

              <p className="text-sm font-extrabold text-indigo-900">
                {
                  answeredCount
                }
                /
                {
                  questions.length
                }
              </p>

            </div>


            {remainingSeconds !== null && (

              <div
                className={`rounded-lg border px-4 py-2 text-center ${
                  remainingSeconds <=
                  60
                    ? "border-rose-200 bg-rose-50"
                    : "bg-slate-50"
                }`}
              >

                <p className="text-xs text-slate-500">
                  Time Left
                </p>

                <p
                  className={`text-sm font-semibold ${
                    remainingSeconds <=
                    60
                      ? "text-rose-600"
                      : "text-slate-900"
                  }`}
                >
                  {
                    timerText
                  }
                </p>

              </div>

            )}

          </div>

        </div>


        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {
              error
            }
          </div>

        )}


        {/* ======================================================
            ASSESSMENT INFO
        ====================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">

            <p className="text-xs text-slate-500">
              Total Marks
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {
                totalMarks
              }
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">

            <p className="text-xs text-slate-500">
              Passing
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {
                passingScore
              }%
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">

            <p className="text-xs text-slate-500">
              Questions
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {
                questions.length
              }
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">

            <p className="text-xs text-slate-500">
              Remaining
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {
                unansweredCount
              }
            </p>

          </div>

        </div>


        {/* ======================================================
            QUESTIONS
        ====================================================== */}

        <div className="space-y-5">

          {questions.map(
            (
              question,
              questionIndex
            ) => (

              <div
                key={
                  question.n_question_id
                }
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
              >

                <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50/70 px-6 py-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-xs font-medium uppercase text-slate-500">
                        Question {
                          questionIndex + 1
                        }
                      </p>

                      <h2 className="mt-2 text-lg font-semibold text-slate-900">
                        {
                          question.s_question_text
                        }
                      </h2>

                    </div>


                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {
                        question.n_marks
                      } marks
                    </span>

                  </div>

                </div>


                <div className="space-y-3 p-6">

                  {question.options.map(
                    (option) => {

                      const selected =
                        answers[
                          question.n_question_id
                        ] ===
                        option.n_option_id;


                      return (

                        <label
                          key={
                            option.n_option_id
                          }
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                            selected
                              ? "border-gray-900 bg-slate-50"
                              : "hover:bg-slate-50"
                          }`}
                        >

                          <input
                            type="radio"
                            name={`question-${question.n_question_id}`}
                            value={
                              option.n_option_id
                            }
                            checked={
                              selected
                            }
                            onChange={() =>
                              handleAnswerChange(
                                question.n_question_id,
                                option.n_option_id
                              )
                            }
                            className="mt-1"
                          />


                          <div>

                            <p className="font-medium text-slate-900">
                              {
                                option.s_option_label
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {
                                option.s_option_text
                              }
                            </p>

                          </div>

                        </label>

                      );

                    }
                  )}

                </div>

              </div>

            )
          )}

        </div>


        {/* ======================================================
            SUBMIT
        ====================================================== */}

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg shadow-indigo-100/40 md:flex-row md:items-center">

          <div>

            <p className="font-medium text-slate-900">
              {
                unansweredCount
              }{" "}
              question(s) remaining
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Please review your answers before submitting.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              handleSubmit(false)
            }
            disabled={
              submitting ||
              unansweredCount > 0
            }
            className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {
              submitting
                ? "Submitting..."
                : "Submit Assessment"
            }
          </button>

        </div>

      </div>

    </main>

  );
}