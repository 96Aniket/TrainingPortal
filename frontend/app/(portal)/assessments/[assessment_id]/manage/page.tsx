"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  FilePlus2,
  ListChecks,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";

import {
  getAssessment,
  createQuestion,
  createOption,
  AssessmentDetails,
} from "@/services/api/assessmentApi";

export default function AssessmentManagePage() {
  const params = useParams<{ assessment_id: string }>();
  const router = useRouter();

  const assessmentId = Number(params?.assessment_id);

  const [assessment, setAssessment] =
    useState<AssessmentDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [questionMarks, setQuestionMarks] = useState<number>(0);

  const [selectedQuestionId, setSelectedQuestionId] =
    useState<number | null>(null);

  const [optionLabel, setOptionLabel] = useState("");
  const [optionText, setOptionText] = useState("");
  const [optionCorrect, setOptionCorrect] = useState<number>(0);

  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [creatingOption, setCreatingOption] = useState(false);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError("");

      if (!assessmentId || assessmentId <= 0) {
        setError("Invalid assessment.");
        return;
      }

      const data = await getAssessment(assessmentId);
      setAssessment(data);
    } catch (err: any) {
      console.error("Assessment loading failed:", err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load assessment details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const questionMarksTotal = useMemo(() => {
    if (!assessment) {
      return 0;
    }

    return assessment.questions.reduce(
      (total, question) =>
        total + Number(question.n_marks || 0),
      0
    );
  }, [assessment]);

  const marksMatch =
    !!assessment &&
    Number(questionMarksTotal) ===
      Number(assessment.n_total_marks);

  const handleCreateQuestion = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!assessment) {
      return;
    }

    setError("");
    setSuccess("");

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    if (questionMarks <= 0) {
      setError("Question marks must be greater than zero.");
      return;
    }

    try {
      setCreatingQuestion(true);

      const response = await createQuestion(
        assessment.n_assessment_id,
        {
          n_question_number:
            assessment.questions.length + 1,
          s_question_text:
            questionText.trim(),
          n_marks: Number(questionMarks),
        }
      );

      setSuccess(response.message);

      setQuestionText("");
      setQuestionMarks(0);

      await loadAssessment();
    } catch (err: any) {
      console.error("Question creation failed:", err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to create question."
      );
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleCreateOption = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!assessment || !selectedQuestionId) {
      setError("Please select a question first.");
      return;
    }

    setError("");
    setSuccess("");

    if (!optionLabel.trim()) {
      setError("Option label is required.");
      return;
    }

    if (!optionText.trim()) {
      setError("Option text is required.");
      return;
    }

    try {
      setCreatingOption(true);

      const response = await createOption(
        selectedQuestionId,
        {
          s_option_label:
            optionLabel.trim(),
          s_option_text:
            optionText.trim(),
          n_is_correct:
            Number(optionCorrect),
        }
      );

      setSuccess(response.message);

      setOptionLabel("");
      setOptionText("");
      setOptionCorrect(0);

      await loadAssessment();
    } catch (err: any) {
      console.error("Option creation failed:", err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to create option."
      );
    } finally {
      setCreatingOption(false);
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
            Loading assessment...
          </p>
        </div>
      </main>
    );
  }

  if (error && !assessment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5">
        <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-100/50">
          <AlertCircle
            className="mx-auto mb-3 text-rose-500"
            size={34}
          />
          <h1 className="text-2xl font-extrabold text-slate-900">
            Assessment Unavailable
          </h1>
          <p className="mt-3 text-sm font-medium text-rose-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.push("/assessments")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
          >
            <ArrowLeft size={17} />
            Back to Assessments
          </button>
        </div>
      </main>
    );
  }

  if (!assessment) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5 py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/assessments")}
              className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
            >
              <ArrowLeft size={16} />
              Back to Assessments
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 text-white shadow-lg shadow-indigo-200">
                <ListChecks size={24} />
              </div>

              <div>
                <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                  Manage Assessment
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {assessment.s_assessment_name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`rounded-full border px-4 py-2 text-xs font-extrabold ${
                assessment.s_status === "DRAFT"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {assessment.s_status}
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/assessments/${assessmentId}/publish`
                )
              }
              disabled={
                assessment.s_status !== "DRAFT"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} />
              Publish Assessment
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-md shadow-indigo-100/40">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Marks
            </p>
            <p className="mt-2 text-3xl font-extrabold text-indigo-700">
              {assessment.n_total_marks}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-md shadow-violet-100/40">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Marks
            </p>
            <p
              className={`mt-2 text-3xl font-extrabold ${
                marksMatch
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {questionMarksTotal}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-md shadow-blue-100/40">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions
            </p>
            <p className="mt-2 text-3xl font-extrabold text-blue-600">
              {assessment.questions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-md shadow-amber-100/40">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Passing
            </p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">
              {assessment.n_passing_score}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <ListChecks size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Questions
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Add all questions before publishing.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {assessment.questions.length === 0 ? (
                <div className="p-10 text-center">
                  <CircleHelp
                    className="mx-auto mb-3 text-indigo-300"
                    size={34}
                  />
                  <p className="text-sm font-semibold text-slate-500">
                    No questions added yet.
                  </p>
                </div>
              ) : (
                assessment.questions.map(
                  (question, index) => {
                    const selected =
                      selectedQuestionId ===
                      question.n_question_id;

                    return (
                      <div
                        key={question.n_question_id}
                        className={`p-6 transition-all ${
                          selected
                            ? "bg-gradient-to-r from-indigo-50 via-violet-50/50 to-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xs font-extrabold text-indigo-700">
                            Q{index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h3 className="font-extrabold text-slate-900">
                                  {question.s_question_text}
                                </h3>

                                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                  {question.n_marks} marks
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedQuestionId(
                                    question.n_question_id
                                  )
                                }
                                className={`rounded-xl border px-3.5 py-2 text-xs font-extrabold shadow-sm transition ${
                                  selected
                                    ? "border-indigo-300 bg-indigo-100 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                }`}
                              >
                                {selected
                                  ? "Selected"
                                  : "Add Options"}
                              </button>
                            </div>

                            <div className="mt-4 space-y-2">
                              {question.options?.length ? (
                                question.options.map(
                                  (option) => (
                                    <div
                                      key={
                                        option.n_option_id
                                      }
                                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                                        option.n_is_correct === 1
                                          ? "border-emerald-200 bg-emerald-50"
                                          : "border-slate-200 bg-white"
                                      }`}
                                    >
                                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600">
                                        {option.s_option_label}
                                      </span>

                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-800">
                                          {option.s_option_text}
                                        </p>

                                        {option.n_is_correct === 1 && (
                                          <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                                            Correct Answer
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )
                              ) : (
                                <p className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-3 text-xs font-semibold text-indigo-600">
                                  No options added yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg shadow-indigo-100/40">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <FilePlus2 size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Add Question
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Question{" "}
                    {assessment.questions.length + 1}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateQuestion}
                className="space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Question Text
                  </label>

                  <textarea
                    value={questionText}
                    onChange={(event) =>
                      setQuestionText(
                        event.target.value
                      )
                    }
                    rows={5}
                    placeholder="Enter the question..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Marks
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={questionMarks || ""}
                    onChange={(event) =>
                      setQuestionMarks(
                        Number(event.target.value)
                      )
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingQuestion}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingQuestion ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  {creatingQuestion
                    ? "Adding Question..."
                    : "Add Question"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-lg shadow-cyan-100/40">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <CircleHelp size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Add Option
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    {selectedQuestionId
                      ? "Add an option to the selected question."
                      : "Select a question first."}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateOption}
                className="space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Option Label
                  </label>

                  <select
                    value={optionLabel}
                    onChange={(event) =>
                      setOptionLabel(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    disabled={!selectedQuestionId}
                  >
                    <option value="">
                      Select label
                    </option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Option Text
                  </label>

                  <textarea
                    value={optionText}
                    onChange={(event) =>
                      setOptionText(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Enter option text..."
                    disabled={!selectedQuestionId}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Is Correct?
                  </label>

                  <select
                    value={optionCorrect}
                    onChange={(event) =>
                      setOptionCorrect(
                        Number(event.target.value)
                      )
                    }
                    disabled={!selectedQuestionId}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={
                    creatingOption ||
                    !selectedQuestionId
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-100 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingOption ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  {creatingOption
                    ? "Adding Option..."
                    : "Add Option"}
                </button>
              </form>
            </section>

            <section
              className={`rounded-2xl border p-5 shadow-sm ${
                marksMatch
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {marksMatch ? (
                  <CheckCircle2
                    className="mt-0.5 text-emerald-600"
                    size={20}
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 text-amber-600"
                    size={20}
                  />
                )}

                <div>
                  <p
                    className={`text-sm font-extrabold ${
                      marksMatch
                        ? "text-emerald-800"
                        : "text-amber-800"
                    }`}
                  >
                    {marksMatch
                      ? "Question marks match."
                      : "Question marks do not match."}
                  </p>

                  <p
                    className={`mt-1 text-xs font-medium ${
                      marksMatch
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    Assessment total:{" "}
                    {assessment.n_total_marks}{" "}
                    | Questions:{" "}
                    {questionMarksTotal}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
