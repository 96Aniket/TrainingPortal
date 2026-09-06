"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import type {
  FormEvent,
} from "react";

import {
  getAssessments,
  getAssessment,
  createAssessment,
  createQuestion,
  createOption,
  publishAssessment,
  Assessment,
  AssessmentDetails,
  CreateAssessmentRequest,
} from "@/services/api/assessmentApi";

import {
  getTrainings,
  Training,
} from "@/services/api/trainingApi";


export default function AssessmentsPage() {

    const router = useRouter();

  // ============================================================
  // ASSESSMENTS
  // ============================================================

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ============================================================
  // TRAININGS
  // ============================================================

  const [trainings, setTrainings] =
    useState<Training[]>([]);

  const [trainingLoading, setTrainingLoading] =
    useState(true);

  const [trainingError, setTrainingError] =
    useState("");


  // ============================================================
  // CREATE ASSESSMENT
  // ============================================================

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [createSuccess, setCreateSuccess] =
    useState("");

  const [form, setForm] =
    useState<CreateAssessmentRequest>({
      n_training_id: 0,
      s_assessment_name: "",
      s_description: "",
      n_total_marks: 0,
      n_passing_score: 80,
      n_duration_minutes: null,
      n_maximum_attempts: null,
    });


  // ============================================================
  // MANAGE ASSESSMENT
  // ============================================================

  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentDetails | null>(null);

  const [showManage, setShowManage] =
    useState(false);

  const [manageLoading, setManageLoading] =
    useState(false);

  const [manageError, setManageError] =
    useState("");

  const [manageSuccess, setManageSuccess] =
    useState("");


  // ============================================================
  // QUESTION
  // ============================================================

  const [questionNumber, setQuestionNumber] =
    useState<number>(1);

  const [questionText, setQuestionText] =
    useState("");

  const [questionMarks, setQuestionMarks] =
    useState<number>(0);

  const [creatingQuestion, setCreatingQuestion] =
    useState(false);


  // ============================================================
  // OPTION
  // ============================================================

  const [selectedQuestionId, setSelectedQuestionId] =
    useState<number | null>(null);

  const [optionLabel, setOptionLabel] =
    useState("");

  const [optionText, setOptionText] =
    useState("");

  const [optionCorrect, setOptionCorrect] =
    useState<number>(0);

  const [creatingOption, setCreatingOption] =
    useState(false);

  // ============================================================
  // PUBLISH ASSESSMENT
  // ============================================================

  const [publishing, setPublishing] =
    useState(false);

  const [publishError, setPublishError] =
    useState("");

  const [showPublishConfirm, setShowPublishConfirm] =
    useState(false);


  // ============================================================
  // LOAD ASSESSMENTS
  // ============================================================

  const loadAssessments = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getAssessments();

      setAssessments(data);

    } catch (err: any) {

      console.error(
        "Assessment loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to load assessments."
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // LOAD TRAININGS
  // ============================================================

  const loadTrainings = async () => {

    try {

      setTrainingLoading(true);
      setTrainingError("");

      const data =
        await getTrainings();

      setTrainings(data);

    } catch (err: any) {

      console.error(
        "Training loading failed:",
        err
      );

      setTrainingError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to load trainings."
      );

    } finally {

      setTrainingLoading(false);

    }
  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadAssessments();
    loadTrainings();

  }, []);


  // ============================================================
  // FORM CHANGE
  // ============================================================

  const updateForm = (
    field: keyof CreateAssessmentRequest,
    value: string | number | null
  ) => {

    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

  };


  // ============================================================
  // CREATE ASSESSMENT
  // ============================================================

  const handleCreateAssessment = async (
    event: FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setCreateError("");
    setCreateSuccess("");


    // ----------------------------------------------------------
    // Training
    // ----------------------------------------------------------

    if (
      !form.n_training_id ||
      form.n_training_id <= 0
    ) {

      setCreateError(
        "Please select a training."
      );

      return;
    }


    // ----------------------------------------------------------
    // Assessment name
    // ----------------------------------------------------------

    if (
      !form.s_assessment_name.trim()
    ) {

      setCreateError(
        "Assessment name is required."
      );

      return;
    }


    // ----------------------------------------------------------
    // Total marks
    // ----------------------------------------------------------

    if (
      form.n_total_marks <= 0
    ) {

      setCreateError(
        "Total marks must be greater than zero."
      );

      return;
    }


    // ----------------------------------------------------------
    // Passing score
    // ----------------------------------------------------------

    if (
      form.n_passing_score < 0 ||
      form.n_passing_score > 100
    ) {

      setCreateError(
        "Passing score must be between 0 and 100."
      );

      return;
    }


    // ----------------------------------------------------------
    // Duration
    // ----------------------------------------------------------

    if (
      form.n_duration_minutes != null &&
      form.n_duration_minutes <= 0
    ) {
      setCreateError(
        "Duration must be greater than zero."
      );

      return;
    }

    // ----------------------------------------------------------
    // Maximum attempts
    // ----------------------------------------------------------

    if (
      form.n_maximum_attempts == null ||
      form.n_maximum_attempts <= 0
    ) {
      setCreateError(
        "Please enter maximum attempts."
      );

      return;
    }

    try {

      setCreating(true);

      const requestData:
        CreateAssessmentRequest = {

        n_training_id:
          form.n_training_id,

        s_assessment_name:
          form.s_assessment_name.trim(),

        s_description:
          form.s_description?.trim() || null,

        n_total_marks:
          Number(
            form.n_total_marks
          ),

        n_passing_score:
          Number(
            form.n_passing_score
          ),

        n_duration_minutes:
          form.n_duration_minutes !== null
            ? Number(
                form.n_duration_minutes
              )
            : null,

        n_maximum_attempts:
          form.n_maximum_attempts !== null
            ? Number(
                form.n_maximum_attempts
              )
            : null,
      };


      const response =
        await createAssessment(
          requestData
        );


      setCreateSuccess(
        response.message
      );


      setForm({
        n_training_id: 0,
        s_assessment_name: "",
        s_description: "",
        n_total_marks: 0,
        n_passing_score: 80,
        n_duration_minutes: null,
        n_maximum_attempts: null,
      });

      setShowCreateForm(false);

      await loadAssessments();

    } catch (err: any) {

      console.error(
        "Assessment creation failed:",
        err
      );

      setCreateError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to create assessment."
      );

    } finally {

      setCreating(false);

    }
  };


  // ============================================================
  // MANAGE ASSESSMENT
  // ============================================================

  const handleManageAssessment = (
    assessmentId: number
  ) => {
    router.push(
      `/assessments/${assessmentId}/manage`
    );
  };


  // ============================================================
  // CLOSE MANAGE
  // ============================================================

  const closeManage = () => {

    setShowManage(false);

    setSelectedAssessment(null);

    setSelectedQuestionId(null);

    setQuestionText("");
    setQuestionMarks(0);

    setOptionLabel("");
    setOptionText("");
    setOptionCorrect(0);

    setManageError("");
    setManageSuccess("");
    setPublishError("");
    setShowPublishConfirm(false);

  };


  // ============================================================
  // CREATE QUESTION
  // ============================================================

  const handleCreateQuestion = async () => {

    if (!selectedAssessment) {
      return;
    }

    setManageError("");
    setManageSuccess("");


    // ----------------------------------------------------------
    // Question text
    // ----------------------------------------------------------

    if (
      !questionText.trim()
    ) {

      setManageError(
        "Question text is required."
      );

      return;
    }


    // ----------------------------------------------------------
    // Marks
    // ----------------------------------------------------------

    if (
      questionMarks <= 0
    ) {

      setManageError(
        "Question marks must be greater than zero."
      );

      return;
    }


    try {

      setCreatingQuestion(true);

      const response =
        await createQuestion(
          selectedAssessment.n_assessment_id,
          {
            n_question_number:
              questionNumber,

            s_question_text:
              questionText.trim(),

            n_marks:
              Number(
                questionMarks
              ),
          }
        );


      setManageSuccess(
        response.message
      );


      setQuestionText("");
      setQuestionMarks(0);


      const updated =
        await getAssessment(
          selectedAssessment.n_assessment_id
        );


      setSelectedAssessment(
        updated
      );


      setQuestionNumber(
        updated.questions.length + 1
      );

    } catch (err: any) {

      console.error(
        "Question creation failed:",
        err
      );

      setManageError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to create question."
      );

    } finally {

      setCreatingQuestion(false);

    }
  };


  // ============================================================
  // SELECT QUESTION FOR OPTION
  // ============================================================

  const handleSelectQuestion =
    (
      questionId: number
    ) => {

      setSelectedQuestionId(
        questionId
      );

      setOptionLabel("");
      setOptionText("");
      setOptionCorrect(0);

      setManageError("");
      setManageSuccess("");

    };


  // ============================================================
  // CREATE OPTION
  // ============================================================

  const handleCreateOption = async () => {

    if (!selectedQuestionId) {

      setManageError(
        "Please select a question."
      );

      return;
    }


    // ----------------------------------------------------------
    // Label
    // ----------------------------------------------------------

    if (
      !optionLabel.trim()
    ) {

      setManageError(
        "Option label is required."
      );

      return;
    }


    // ----------------------------------------------------------
    // Text
    // ----------------------------------------------------------

    if (
      !optionText.trim()
    ) {

      setManageError(
        "Option text is required."
      );

      return;
    }


    try {

      setCreatingOption(true);

      setManageError("");
      setManageSuccess("");


      const response =
        await createOption(
          selectedQuestionId,
          {
            s_option_label:
              optionLabel.trim(),

            s_option_text:
              optionText.trim(),

            n_is_correct:
              Number(
                optionCorrect
              ),
          }
        );


      setManageSuccess(
        response.message
      );


      setOptionLabel("");
      setOptionText("");
      setOptionCorrect(0);


      const updated =
        await getAssessment(
          selectedAssessment!.n_assessment_id
        );


      setSelectedAssessment(
        updated
      );


      // Keep the same question selected
      setSelectedQuestionId(
        selectedQuestionId
      );

    } catch (err: any) {

      console.error(
        "Option creation failed:",
        err
      );

      setManageError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to create option."
      );

    } finally {

      setCreatingOption(false);

    }
  };

  // ============================================================
  // PUBLISH ASSESSMENT
  // ============================================================

  const handlePublishAssessment = async () => {

    if (!selectedAssessment) {
      return;
    }

    try {

      setPublishing(true);

      setPublishError("");

      setManageError("");

      setManageSuccess("");


      const response =
        await publishAssessment(
          selectedAssessment.n_assessment_id
        );


      setManageSuccess(
        response.message
      );


      setShowPublishConfirm(false);


      const updated =
        await getAssessment(
          selectedAssessment.n_assessment_id
        );


      setSelectedAssessment(
        updated
      );


      await loadAssessments();

    } catch (err: any) {

      console.error(
        "Assessment publishing failed:",
        err
      );


      setPublishError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to publish assessment."
      );

    } finally {

      setPublishing(false);

    }
  };


  // ============================================================
  // QUESTION MARK TOTAL
  // ============================================================

  const questionMarksTotal =
    selectedAssessment
      ? selectedAssessment.questions.reduce(
          (
            total,
            question
          ) =>
            total +
            Number(
              question.n_marks
            ),
          0
        )
      : 0;


  // ============================================================
  // ASSESSMENT MARKS MATCH
  // ============================================================

  const marksMatch =
    selectedAssessment
      ? Number(
          questionMarksTotal
        ) === Number(
          selectedAssessment.n_total_marks
        )
      : false;


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-full space-y-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">


      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-7 flex items-center justify-between gap-4">

        <div>

          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Assessments
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Create, publish and manage assessments.
          </p>

        </div>


        <button
          type="button"
          onClick={() => {

            setCreateError("");
            setCreateSuccess("");

            setShowCreateForm(
              true
            );

          }}
          className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          + Create Assessment
        </button>

      </div>


      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {createSuccess && (

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">

          {createSuccess}

        </div>

      )}


      {/* ======================================================
          CREATE ASSESSMENT FORM
      ====================================================== */}

      {showCreateForm && (

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

            <h2 className="text-lg font-extrabold text-slate-900">
              Create Assessment
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Create a draft assessment for a training.
            </p>

          </div>


          <form
            onSubmit={
              handleCreateAssessment
            }
            className="space-y-6 p-6"
          >

            {createError && (

              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">

                {createError}

              </div>

            )}


            {/* TRAINING */}

            <div>

              <label
                htmlFor="training"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Training
              </label>


              {trainingLoading ? (

                <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 text-sm font-medium text-indigo-700">
                  Loading trainings...
                </div>

              ) : trainingError ? (

                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">
                  {trainingError}
                </div>

              ) : (

                <select
                  id="training"
                  value={
                    form.n_training_id
                  }
                  onChange={(event) =>
                    updateForm(
                      "n_training_id",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >

                  <option value={0}>
                    Select training
                  </option>


                  {trainings.map(
                    (
                      training
                    ) => (

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


            {/* NAME */}

            <div>

              <label
                htmlFor="assessmentName"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Assessment Name
              </label>

              <input
                id="assessmentName"
                type="text"
                value={
                  form.s_assessment_name
                }
                onChange={(event) =>
                  updateForm(
                    "s_assessment_name",
                    event.target.value
                  )
                }
                maxLength={200}
                placeholder="Enter assessment name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />

            </div>


            {/* DESCRIPTION */}

            <div>

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                value={
                  form.s_description || ""
                }
                onChange={(event) =>
                  updateForm(
                    "s_description",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Enter assessment description"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />

            </div>


            {/* MARKS */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>

                <label
                  htmlFor="totalMarks"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Total Marks
                </label>

                <input
                  id="totalMarks"
                  type="number"
                  min="1"
                  value={
                    form.n_total_marks || ""
                  }
                  onChange={(event) =>
                    updateForm(
                      "n_total_marks",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />

              </div>


              <div>

                <label
                  htmlFor="passingScore"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Passing Score (%)
                </label>

                <input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={
                    form.n_passing_score
                  }
                  onChange={(event) =>
                    updateForm(
                      "n_passing_score",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />

              </div>

            </div>


            {/* DURATION / ATTEMPTS */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>

                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Duration (minutes)
                </label>

                <input
                  id="duration"
                  type="number"
                  min="1"
                  value={
                    form.n_duration_minutes ??
                    ""
                  }
                  onChange={(event) =>
                    updateForm(
                      "n_duration_minutes",
                      event.target.value
                        ? Number(
                            event.target.value
                          )
                        : null
                    )
                  }
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />

              </div>


              <div>

                <label
                  htmlFor="attempts"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Maximum Attempts
                </label>

                <input
                  id="attempts"
                  type="number"
                  min="1"
                  value={
                    form.n_maximum_attempts ??
                    ""
                  }
                  onChange={(event) =>
                    updateForm(
                      "n_maximum_attempts",
                      event.target.value
                        ? Number(
                            event.target.value
                          )
                        : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />

              </div>

            </div>


            {/* ACTIONS */}

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

              <button
                type="button"
                onClick={() => {

                  setShowCreateForm(
                    false
                  );

                  setCreateError("");

                }}
                disabled={creating}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  creating ||
                  trainingLoading
                }
                className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {
                  creating
                    ? "Creating..."
                    : "Create Assessment"
                }
              </button>

            </div>

          </form>

        </div>

      )}


      {/* ======================================================
          MANAGE ASSESSMENT
      ====================================================== */}

      {showManage &&
        selectedAssessment && (

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">


            {/* --------------------------------------------------
                HEADER
            -------------------------------------------------- */}

            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

              <div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  {
                    selectedAssessment.s_assessment_name
                  }
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Manage questions and assessment options.
                </p>

              </div>


              <div className="flex items-center gap-3">

                {selectedAssessment.s_status ===
                  "DRAFT" && (

                  <button
                    type="button"
                    onClick={() => {

                      setPublishError("");

                      setManageError("");

                      setManageSuccess("");

                      setShowPublishConfirm(
                        true
                      );

                    }}
                    disabled={
                      publishing
                    }
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Publish Assessment
                  </button>

                )}

                <button
                  type="button"
                  onClick={
                    closeManage
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Close
                </button>

              </div>

            </div>


            {/* --------------------------------------------------
                LOADING
            -------------------------------------------------- */}

            {manageLoading && (

              <div className="p-10 text-center text-sm font-medium text-slate-500">
                Loading assessment details...
              </div>

            )}


            {!manageLoading && (

              <>

              {showPublishConfirm && (

                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 p-6">

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">

                    <h3 className="text-lg font-extrabold text-slate-900 text-gray-900">
                      Publish Assessment
                    </h3>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Please verify the assessment before publishing.
                    </p>


                    {/* ==================================================
                        PUBLISH ERROR
                    ================================================== */}

                    {publishError && (

                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
                        {publishError}
                      </div>

                    )}


                    {/* ==================================================
                        PUBLISH SUMMARY
                    ================================================== */}

                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

                        <p className="text-xs font-semibold text-slate-500">
                          Assessment
                        </p>

                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {
                            selectedAssessment.s_assessment_name
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

                        <p className="text-xs font-semibold text-slate-500">
                          Total Marks
                        </p>

                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {
                            selectedAssessment.n_total_marks
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

                        <p className="text-xs font-semibold text-slate-500">
                          Question Marks
                        </p>

                        <p
                          className={`mt-1 text-sm font-semibold ${
                            marksMatch
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {
                            questionMarksTotal
                          }
                        </p>

                      </div>


                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

                        <p className="text-xs font-semibold text-slate-500">
                          Questions
                        </p>

                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {
                            selectedAssessment.questions.length
                          }
                        </p>

                      </div>

                    </div>


                    {/* ==================================================
                        VALIDATION
                    ================================================== */}

                    {!marksMatch && (

                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
                        Question marks must equal the assessment total marks before publishing.
                      </div>

                    )}


                    {/* ==================================================
                        ACTIONS
                    ================================================== */}

                    <div className="mt-5 flex justify-end gap-3">

                      <button
                        type="button"
                        onClick={() => {
                          setShowPublishConfirm(
                            false
                          );

                          setPublishError("");
                        }}
                        disabled={
                          publishing
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>


                      <button
                        type="button"
                        onClick={
                          handlePublishAssessment
                        }
                        disabled={
                          publishing ||
                          !marksMatch
                        }
                        className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {
                          publishing
                            ? "Publishing..."
                            : "Confirm Publish"
                        }
                      </button>

                    </div>

                  </div>

                </div>

              )}


                {/* ------------------------------------------------
                    SUMMARY
                ------------------------------------------------ */}

                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 p-6 md:grid-cols-5">

                  <div>

                    <p className="text-xs font-semibold text-slate-500">
                      Training
                    </p>

                    <p className="mt-1 font-bold text-slate-800">
                      {
                        trainings.find(
                          (
                            training
                          ) =>
                            training.n_training_id ===
                            selectedAssessment.n_training_id
                        )?.s_training_name ||
                        "-"
                      }
                    </p>

                  </div>


                  <div>

                    <p className="text-xs font-semibold text-slate-500">
                      Total Marks
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-800">
                      {
                        selectedAssessment.n_total_marks
                      }
                    </p>

                  </div>


                  <div>

                    <p className="text-xs font-semibold text-slate-500">
                      Question Marks
                    </p>

                    <p
                      className={`mt-1 font-semibold ${
                        marksMatch
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {
                        questionMarksTotal
                      }
                    </p>

                  </div>


                  <div>

                    <p className="text-xs font-semibold text-slate-500">
                      Passing
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-800">
                      {
                        selectedAssessment.n_passing_score
                      }%
                    </p>

                  </div>


                  <div>

                    <p className="text-xs font-semibold text-slate-500">
                      Status
                    </p>

                    <p
                      className={`mt-1 font-semibold ${
                        selectedAssessment.s_status ===
                        "PUBLISHED"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {
                        selectedAssessment.s_status
                      }
                    </p>

                  </div>

                </div>


                {/* ------------------------------------------------
                    MARK VALIDATION
                ------------------------------------------------ */}

                <div className="border-b border-slate-200 px-6 py-4">

                  {marksMatch ? (

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                      Question marks match the assessment total marks.
                    </div>

                  ) : (

                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
                      Question marks total must equal the assessment total marks before publishing.
                    </div>

                  )}

                </div>


                {/* ------------------------------------------------
                    MESSAGES
                ------------------------------------------------ */}

                {manageSuccess && (

                  <div className="mx-6 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                    {
                      manageSuccess
                    }
                  </div>

                )}


                {manageError && (

                  <div className="mx-6 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">
                    {
                      manageError
                    }
                  </div>

                )}


                {/* ------------------------------------------------
                    ADD QUESTION
                ------------------------------------------------ */}

                {selectedAssessment.s_status ===
                  "DRAFT" && (

                  <div className="border-b border-slate-200 p-6">

                    <h3 className="mb-4 text-base font-extrabold text-slate-900">
                      Add Question
                    </h3>


                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">

                      {/* QUESTION NUMBER */}

                      <div className="md:col-span-2">

                        <label className="mb-2 block text-xs font-bold text-slate-700">
                          Question No.
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            questionNumber
                          }
                          onChange={(event) =>
                            setQuestionNumber(
                              Number(
                                event.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />

                      </div>


                      {/* QUESTION TEXT */}

                      <div className="md:col-span-7">

                        <label className="mb-2 block text-xs font-bold text-slate-700">
                          Question
                        </label>

                        <input
                          type="text"
                          value={
                            questionText
                          }
                          onChange={(event) =>
                            setQuestionText(
                              event.target.value
                            )
                          }
                          placeholder="Enter question"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />

                      </div>


                      {/* MARKS */}

                      <div className="md:col-span-2">

                        <label className="mb-2 block text-xs font-bold text-slate-700">
                          Marks
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            questionMarks || ""
                          }
                          onChange={(event) =>
                            setQuestionMarks(
                              Number(
                                event.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />

                      </div>


                      {/* ADD */}

                      <div className="flex items-end md:col-span-1">

                        <button
                          type="button"
                          onClick={
                            handleCreateQuestion
                          }
                          disabled={
                            creatingQuestion
                          }
                          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {
                            creatingQuestion
                              ? "..."
                              : "Add"
                          }
                        </button>

                      </div>

                    </div>

                  </div>

                )}


                {/* ------------------------------------------------
                    QUESTIONS
                ------------------------------------------------ */}

                <div className="p-6">

                  <div className="mb-4 flex items-center justify-between">

                    <h3 className="text-base font-bold text-slate-800">
                      Questions
                    </h3>

                    <span className="text-sm text-gray-500">
                      {
                        selectedAssessment.questions.length
                      } questions
                    </span>

                  </div>


                  {selectedAssessment.questions.length ===
                  0 ? (

                    <div className="rounded-xl border border-slate-200 border-dashed p-10 text-center text-sm font-medium text-slate-500">
                      No questions added yet.
                    </div>

                  ) : (

                    <div className="space-y-5">

                      {selectedAssessment.questions.map(
                        (
                          question
                        ) => {

                          const isSelected =
                            selectedQuestionId ===
                            question.n_question_id;

                          return (

                            <div
                              key={
                                question.n_question_id
                              }
                              className="rounded-xl border border-slate-200"
                            >


                              {/* QUESTION HEADER */}

                              <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/70 px-4 py-4">

                                <div>

                                  <p className="font-bold text-slate-800">
                                    Q{
                                      question.n_question_number
                                    }
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-700">
                                    {
                                      question.s_question_text
                                    }
                                  </p>

                                </div>


                                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                  {
                                    question.n_marks
                                  } marks
                                </span>

                              </div>


                              {/* OPTIONS */}

                              <div className="p-4">

                                <div className="mb-3 flex items-center justify-between">

                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Options
                                  </p>

                                  {selectedAssessment.s_status ===
                                    "DRAFT" && (

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSelectQuestion(
                                          question.n_question_id
                                        )
                                      }
                                      className={`rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium ${
                                        isSelected
                                          ? "bg-gray-900 text-white"
                                          : "hover:bg-slate-50"
                                      }`}
                                    >
                                      {
                                        isSelected
                                          ? "Adding Option"
                                          : "Add Option"
                                      }
                                    </button>

                                  )}

                                </div>


                                {question.options.length ===
                                0 ? (

                                  <div className="rounded-xl border border-slate-200 border-dashed p-5 text-center text-sm text-gray-500">
                                    No options added yet.
                                  </div>

                                ) : (

                                  <div className="space-y-2">

                                    {question.options.map(
                                      (
                                        option
                                      ) => (

                                        <div
                                          key={
                                            option.n_option_id
                                          }
                                          className={`flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 ${
                                            option.n_is_correct ===
                                            1
                                              ? "border-green-300 bg-emerald-50"
                                              : "bg-white"
                                          }`}
                                        >

                                          <div>

                                            <span className="mr-2 font-bold text-slate-800">
                                              {
                                                option.s_option_label
                                              }
                                            </span>

                                            <span className="text-sm font-medium text-slate-700">
                                              {
                                                option.s_option_text
                                              }
                                            </span>

                                          </div>


                                          {option.n_is_correct ===
                                            1 && (

                                            <span className="text-xs font-bold text-emerald-700">
                                              Correct
                                            </span>

                                          )}

                                        </div>

                                      )
                                    )}

                                  </div>

                                )}


                                {/* ADD OPTION FORM */}

                                {selectedAssessment.s_status ===
                                  "DRAFT" &&
                                  isSelected && (

                                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                                    <div className="mb-3 text-sm font-bold text-slate-800">
                                      Add Option
                                    </div>


                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">

                                      {/* LABEL */}

                                      <div className="md:col-span-2">

                                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                                          Label
                                        </label>

                                        <input
                                          type="text"
                                          value={
                                            optionLabel
                                          }
                                          onChange={(event) =>
                                            setOptionLabel(
                                              event.target.value
                                            )
                                          }
                                          maxLength={50}
                                          placeholder="A"
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                                        />

                                      </div>


                                      {/* TEXT */}

                                      <div className="md:col-span-6">

                                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                                          Option Text
                                        </label>

                                        <input
                                          type="text"
                                          value={
                                            optionText
                                          }
                                          onChange={(event) =>
                                            setOptionText(
                                              event.target.value
                                            )
                                          }
                                          placeholder="Enter option text"
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                                        />

                                      </div>


                                      {/* CORRECT */}

                                      <div className="md:col-span-2">

                                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                                          Answer
                                        </label>

                                        <select
                                          value={
                                            optionCorrect
                                          }
                                          onChange={(event) =>
                                            setOptionCorrect(
                                              Number(
                                                event.target.value
                                              )
                                            )
                                          }
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                                        >

                                          <option value={0}>
                                            Incorrect
                                          </option>

                                          <option value={1}>
                                            Correct
                                          </option>

                                        </select>

                                      </div>


                                      {/* SAVE */}

                                      <div className="flex items-end md:col-span-2">

                                        <button
                                          type="button"
                                          onClick={
                                            handleCreateOption
                                          }
                                          disabled={
                                            creatingOption
                                          }
                                          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {
                                            creatingOption
                                              ? "Saving..."
                                              : "Save Option"
                                          }
                                        </button>

                                      </div>

                                    </div>

                                  </div>

                                )}

                              </div>

                            </div>

                          );

                        }
                      )}

                    </div>

                  )}

                </div>

              </>

            )}

          </div>

        )}


      {/* ======================================================
          ASSESSMENT LIST
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">


        {/* ------------------------------------------------------
            HEADER
        ------------------------------------------------------ */}

        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/70 px-6 py-5">

          <div>

            <h2 className="text-base font-bold text-slate-800">
              Assessments
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              {
                assessments.length
              } assessments
            </p>

          </div>


          <button
            type="button"
            onClick={
              loadAssessments
            }
            disabled={
              loading
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
          >
            {
              loading
                ? "Refreshing..."
                : "Refresh"
            }
          </button>

        </div>


        {/* ------------------------------------------------------
            LOADING
        ------------------------------------------------------ */}

        {loading && (

          <div className="p-12 text-center text-sm font-medium text-slate-500">
            Loading assessments...
          </div>

        )}


        {/* ------------------------------------------------------
            ERROR
        ------------------------------------------------------ */}

        {!loading &&
          error && (

            <div className="p-10 text-center">

              <p className="text-sm text-rose-600">
                {
                  error
                }
              </p>

              <button
                type="button"
                onClick={
                  loadAssessments
                }
                className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Try Again
              </button>

            </div>

          )}


        {/* ------------------------------------------------------
            EMPTY
        ------------------------------------------------------ */}

        {!loading &&
          !error &&
          assessments.length === 0 && (

            <div className="p-12 text-center text-sm font-medium text-slate-500">
              No assessments found.
            </div>

          )}


        {/* ------------------------------------------------------
            TABLE
        ------------------------------------------------------ */}

        {!loading &&
          !error &&
          assessments.length > 0 && (

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50/70 to-blue-50">

                  <tr>

                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Assessment
                    </th>

                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Training
                    </th>

                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Marks
                    </th>

                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Passing
                    </th>

                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Attempts
                    </th>

                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {assessments.map(
                    (
                      assessment
                    ) => {

                      const isPublished =
                        assessment.s_status
                          .toUpperCase() ===
                        "PUBLISHED";


                      return (

                        <tr
                          key={
                            assessment.n_assessment_id
                          }
                          className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/50"
                        >


                          {/* ASSESSMENT */}

                          <td className="px-5 py-4">

                            <div className="font-bold text-slate-800">
                              {
                                assessment.s_assessment_name
                              }
                            </div>


                            {assessment.s_description && (

                              <div className="mt-1 max-w-xs truncate text-xs font-semibold text-slate-500">
                                {
                                  assessment.s_description
                                }
                              </div>

                            )}

                          </td>


                          {/* TRAINING */}

                          <td className="px-5 py-4 font-medium text-slate-700">

                            {
                              assessment.s_training_name ||
                              "-"
                            }

                          </td>


                          {/* MARKS */}

                          <td className="px-5 py-4 font-medium text-slate-700">

                            {
                              assessment.n_total_marks
                            }

                          </td>


                          {/* PASSING */}

                          <td className="px-5 py-4 font-medium text-slate-700">

                            {
                              assessment.n_passing_score
                            }%

                          </td>


                          {/* ATTEMPTS */}

                          <td className="px-5 py-4 font-medium text-slate-700">

                            {
                              assessment.n_maximum_attempts ??
                              "-"
                            }

                          </td>


                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${
                                isPublished
                                  ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                                  : "border border-amber-200 bg-amber-100 text-amber-700"
                              }`}
                            >
                              {
                                assessment.s_status
                              }
                            </span>

                          </td>


                          {/* ACTION */}

                          {/* ACTION */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">

                              {/* Manage = add/update questions and options */}
                              <button
                                type="button"
                                className={`rounded-xl border px-3 py-2 text-xs font-extrabold shadow-sm transition-all ${
                                  assessment.s_status === "DRAFT"
                                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 hover:shadow-md"
                                    : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                }`}
                                onClick={() => {
                                  if (
                                    assessment.s_status === "DRAFT"
                                  ) {
                                    handleManageAssessment(
                                      assessment.n_assessment_id
                                    );
                                  }
                                }}
                                disabled={
                                  assessment.s_status !== "DRAFT"
                                }
                                title={
                                  assessment.s_status === "DRAFT"
                                    ? "Add or update questions and options"
                                    : "Published assessment is read-only"
                                }
                              >
                                Manage
                              </button>

                              {/* View = participant attempts/results */}
                              <button
                                type="button"
                                className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-extrabold text-violet-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:shadow-md"
                                onClick={() => {
                                  router.push(
                                    `/assessments/${assessment.n_assessment_id}`
                                  );
                                }}
                                title="View participant attempts and results"
                              >
                                View
                              </button>

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

    </div>
  );
}