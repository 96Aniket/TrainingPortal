"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  Send,
} from "lucide-react";

import {
  getAssessment,
  publishAssessment,
  AssessmentDetails,
} from "@/services/api/assessmentApi";

export default function AssessmentPublishPage() {
  const params =
    useParams<{ assessment_id: string }>();

  const router = useRouter();

  const assessmentId = Number(
    params?.assessment_id
  );

  const [assessment, setAssessment] =
    useState<AssessmentDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState("");

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError("");

      if (!assessmentId || assessmentId <= 0) {
        setError("Invalid assessment.");
        return;
      }

      const data = await getAssessment(
        assessmentId
      );

      setAssessment(data);
    } catch (err: any) {
      console.error(
        "Assessment loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load assessment."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const questionMarksTotal =
    assessment?.questions.reduce(
      (total, question) =>
        total + Number(question.n_marks || 0),
      0
    ) ?? 0;

  const marksMatch =
    !!assessment &&
    Number(questionMarksTotal) ===
      Number(assessment.n_total_marks);

  const questionCount =
    assessment?.questions.length ?? 0;

  const allQuestionsHaveOptions =
    !!assessment &&
    assessment.questions.length > 0 &&
    assessment.questions.every(
      (question) =>
        Array.isArray(question.options) &&
        question.options.length >= 2
    );

  const correctOptionCount =
    assessment?.questions.reduce(
      (total, question) =>
        total +
        (question.options?.filter(
          (option) =>
            option.n_is_correct === 1
        ).length ?? 0),
      0
    ) ?? 0;

  const canPublish =
    !!assessment &&
    assessment.s_status === "DRAFT" &&
    marksMatch &&
    questionCount > 0 &&
    allQuestionsHaveOptions &&
    correctOptionCount > 0;

  const handlePublish = async () => {
    if (!assessment || !canPublish) {
      return;
    }

    try {
      setPublishing(true);
      setError("");

      await publishAssessment(
        assessment.n_assessment_id
      );

      router.push(
        `/assessments/${assessmentId}?published=1`
      );
    } catch (err: any) {
      console.error(
        "Assessment publishing failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to publish assessment."
      );

      await loadAssessment();
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5">
        <div className="rounded-2xl border border-indigo-100 bg-white px-8 py-10 text-center shadow-xl shadow-indigo-100/40">
          <Loader2
            className="mx-auto mb-3 animate-spin text-indigo-600"
            size={28}
          />
          <p className="text-sm font-semibold text-slate-500">
            Loading publish review...
          </p>
        </div>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5">
        <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-100/50">
          <AlertCircle
            className="mx-auto mb-3 text-rose-500"
            size={34}
          />
          <h1 className="text-2xl font-extrabold text-slate-900">
            Publish Review Unavailable
          </h1>
          <p className="mt-3 text-sm font-medium text-rose-600">
            {error || "Assessment not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/manage`
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
          >
            <ArrowLeft size={17} />
            Back to Assessment
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/assessments/${assessmentId}/manage`
            )
          }
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
        >
          <ArrowLeft size={16} />
          Back to Assessment
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-100/60">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-7 py-7 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <FileCheck2 size={24} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-100">
                  Final Review
                </p>

                <h1 className="mt-1 text-2xl font-extrabold">
                  Publish Assessment
                </h1>

                <p className="mt-1 text-sm text-indigo-100">
                  Verify everything before making this
                  assessment available.
                </p>
              </div>
            </div>
          </div>

          <div className="p-7">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                <AlertCircle
                  className="mt-0.5 shrink-0"
                  size={19}
                />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/70 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Assessment
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {assessment.s_assessment_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-3.5 py-1.5 text-xs font-extrabold ${
                      assessment.s_status === "DRAFT"
                        ? "border-amber-200 bg-amber-100 text-amber-700"
                        : "border-emerald-200 bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {assessment.s_status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewCard
                label="Total Marks"
                value={assessment.n_total_marks}
                color="indigo"
              />

              <ReviewCard
                label="Question Marks"
                value={questionMarksTotal}
                color={
                  marksMatch
                    ? "green"
                    : "red"
                }
              />

              <ReviewCard
                label="Questions"
                value={questionCount}
                color="blue"
              />

              <ReviewCard
                label="Correct Answers"
                value={correctOptionCount}
                color="violet"
              />
            </div>

            <div className="mt-6 space-y-3">
              <ValidationRow
                ok={assessment.s_status === "DRAFT"}
                text={
                  assessment.s_status === "DRAFT"
                    ? "Assessment is still in DRAFT status."
                    : "Assessment is already published."
                }
              />

              <ValidationRow
                ok={questionCount > 0}
                text={
                  questionCount > 0
                    ? `${questionCount} question(s) added.`
                    : "At least one question is required."
                }
              />

              <ValidationRow
                ok={marksMatch}
                text={
                  marksMatch
                    ? "Question marks match assessment total marks."
                    : "Question marks must equal total marks."
                }
              />

              <ValidationRow
                ok={allQuestionsHaveOptions}
                text={
                  allQuestionsHaveOptions
                    ? "Every question has at least two options."
                    : "Every question needs at least two options."
                }
              />

              <ValidationRow
                ok={
                  questionCount > 0 &&
                  correctOptionCount > 0
                }
                text={
                  correctOptionCount > 0
                    ? "Correct answer is configured."
                    : "At least one correct answer is required."
                }
              />
            </div>

            {!canPublish && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="mt-0.5 shrink-0 text-amber-600"
                    size={20}
                  />

                  <div>
                    <p className="text-sm font-extrabold text-amber-800">
                      Assessment is not ready to publish.
                    </p>

                    <p className="mt-1 text-xs font-medium text-amber-700">
                      Fix the validation items above,
                      then return to this page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canPublish && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-emerald-600"
                    size={20}
                  />

                  <div>
                    <p className="text-sm font-extrabold text-emerald-800">
                      Assessment is ready to publish.
                    </p>

                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      The next step will publish this
                      assessment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/assessments/${assessmentId}/manage`
                  )
                }
                disabled={publishing}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Review Questions
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  publishing ||
                  !canPublish
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Confirm Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReviewCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color:
    | "indigo"
    | "green"
    | "red"
    | "blue"
    | "violet";
}) {
  const styles = {
    indigo:
      "border-indigo-100 bg-indigo-50/70 text-indigo-700",
    green:
      "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    red:
      "border-rose-100 bg-rose-50/70 text-rose-700",
    blue:
      "border-blue-100 bg-blue-50/70 text-blue-700",
    violet:
      "border-violet-100 bg-violet-50/70 text-violet-700",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${styles[color]}`}
    >
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold">
        {value}
      </p>
    </div>
  );
}

function ValidationRow({
  ok,
  text,
}: {
  ok: boolean;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {ok ? (
        <CheckCircle2 size={18} />
      ) : (
        <AlertCircle size={18} />
      )}

      {text}
    </div>
  );
}
