"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  getRegistrationDetails,
  getAvailableTrainings,
  confirmMultipleRegistration,
  RegistrationTraining,
  RegistrationUser,
} from "@/services/api/registrationApi";


export default function RegistrationPage() {

  // ============================================================
  // TOKEN
  // ============================================================

  const params =
    useParams<{
      registration_token: string;
    }>();

  const registrationToken =
    Array.isArray(
      params?.registration_token
    )
      ? params.registration_token[0]
      : params?.registration_token;


  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] =
    useState<RegistrationUser | null>(null);


  // ============================================================
  // TRAININGS
  // ============================================================

  const [trainings, setTrainings] =
    useState<RegistrationTraining[]>([]);

  const [selectedTrainingIds, setSelectedTrainingIds] =
    useState<number[]>([]);


  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);


  // ============================================================
  // MESSAGES
  // ============================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ============================================================
  // COMPLETED REGISTRATIONS
  // ============================================================

  const [registeredTrainings, setRegisteredTrainings] =
    useState<RegistrationTraining[]>([]);


  // ============================================================
  // LOAD REGISTRATION DATA
  // ============================================================

  const loadRegistrationData =
    async () => {

      if (!registrationToken) {
        setError(
          "Invalid registration link."
        );

        setLoading(false);

        return;
      }

      try {

        setLoading(true);
        setError("");

        // ------------------------------------------------------
        // Registration details
        // ------------------------------------------------------

        const details =
          await getRegistrationDetails(
            registrationToken
          );

        setUser(
          details.user
        );


        // ------------------------------------------------------
        // Available trainings
        // ------------------------------------------------------

        const available =
          await getAvailableTrainings(
            registrationToken
          );

        setTrainings(
          Array.isArray(
            available.trainings
          )
            ? available.trainings
            : []
        );

      } catch (err: any) {

        console.error(
          "Registration loading failed:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load registration details."
        );

      } finally {

        setLoading(false);

      }
    };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadRegistrationData();

  }, [
    registrationToken,
  ]);


  // ============================================================
  // SELECT / UNSELECT TRAINING
  // ============================================================

  const toggleTraining =
    (
      trainingId: number
    ) => {

      setSelectedTrainingIds(
        (previous) => {

          if (
            previous.includes(
              trainingId
            )
          ) {

            return previous.filter(
              (id) =>
                id !== trainingId
            );

          }

          return [
            ...previous,
            trainingId,
          ];

        }
      );

    };


  // ============================================================
  // CONFIRM REGISTRATION
  // ============================================================

  const handleConfirmRegistration =
    async () => {

      if (!registrationToken) {
        return;
      }


      setError("");
      setSuccess("");


      if (
        selectedTrainingIds.length === 0
      ) {

        setError(
          "Please select at least one training."
        );

        return;
      }


      try {

        setSubmitting(true);


        const response =
          await confirmMultipleRegistration(
            registrationToken,
            {
              training_ids:
                selectedTrainingIds,
            }
          );


        setSuccess(
          response.message
        );


        setRegisteredTrainings(
          response.trainings || []
        );


        setSelectedTrainingIds(
          []
        );


        // ------------------------------------------------------
        // Refresh available trainings
        // ------------------------------------------------------

        const available =
          await getAvailableTrainings(
            registrationToken
          );

        setTrainings(
          Array.isArray(
            available.trainings
          )
            ? available.trainings
            : []
        );

      } catch (err: any) {

        console.error(
          "Registration confirmation failed:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to complete registration."
        );

      } finally {

        setSubmitting(false);

      }
    };


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5">

        <div className="w-full max-w-lg rounded-2xl border border-indigo-100 bg-white px-8 py-10 text-center shadow-2xl shadow-indigo-100/50">

          <p className="text-sm text-slate-500">
            Loading registration...
          </p>

        </div>

      </main>

    );

  }


  // ============================================================
  // ERROR SCREEN
  // ============================================================

  if (
    error &&
    !user
  ) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5">

        <div className="w-full max-w-lg rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-2xl shadow-indigo-100/50">

          <h1 className="text-2xl font-semibold text-slate-900">
            Registration Unavailable
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

        </div>

      </main>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-5 py-10">

      <div className="mx-auto w-full max-w-5xl">


        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">

          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Training Registration
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Complete your training registration.
          </p>

        </div>


        {/* ======================================================
            USER DETAILS
        ====================================================== */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">

          <h2 className="text-lg font-extrabold text-slate-900">
            Employee Details
          </h2>


          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                Employee ID
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {
                  user?.s_employee_id ||
                  "-"
                }
              </p>

            </div>


            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                Name
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {
                  user?.s_user_name ||
                  "-"
                }
              </p>

            </div>


            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                Email
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {
                  user?.s_email ||
                  "-"
                }
              </p>

            </div>

          </div>

        </div>


        {/* ======================================================
            SUCCESS
        ====================================================== */}

        {success && (

          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">

            {success}

          </div>

        )}


        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">

            {error}

          </div>

        )}


        {/* ======================================================
            REGISTERED TRAININGS
        ====================================================== */}

        {registeredTrainings.length > 0 && (

          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">

            <h2 className="text-lg font-extrabold text-slate-900">
              Registration Completed
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Your selected training registrations are confirmed.
            </p>


            <div className="mt-5 space-y-4">

              {registeredTrainings.map(
                (training) => (

                  <div
                    key={
                      training.n_training_id
                    }
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-5 shadow-sm"
                  >

                    <div className="flex flex-col justify-between gap-4 md:flex-row">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          {
                            training.s_training_code
                          }
                        </p>

                        <h3 className="mt-1 font-extrabold text-slate-800">
                          {
                            training.s_training_name
                          }
                        </h3>

                        <p className="mt-2 text-sm font-medium text-slate-600">
                          {
                            training.d_training_date
                          }
                          {" • "}
                          {
                            training.t_start_time
                          }
                          {" - "}
                          {
                            training.t_end_time
                          }
                        </p>

                      </div>


                      {training.s_teams_meeting_link && (

                        <a
                          href={
                            training.s_teams_meeting_link
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        >
                          Join Training
                        </a>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        )}


        {/* ======================================================
            AVAILABLE TRAININGS
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">


          {/* ----------------------------------------------------
              HEADER
          ---------------------------------------------------- */}

          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50/70 px-6 py-5">

            <h2 className="text-lg font-extrabold text-slate-900">
              Available Trainings
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Select the training sessions you want to attend.
            </p>

          </div>


          {/* ----------------------------------------------------
              EMPTY
          ---------------------------------------------------- */}

          {trainings.length === 0 ? (

            <div className="p-10 text-center">

              <p className="text-sm text-slate-500">
                No available trainings found.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {trainings.map(
                (training) => {

                  const selected =
                    selectedTrainingIds.includes(
                      training.n_training_id
                    );


                  return (

                    <label
                      key={
                        training.n_training_id
                      }
                      className={`block cursor-pointer p-5 transition-all duration-200 ${
                        selected
                          ? "bg-slate-50"
                          : "hover:bg-slate-50"
                      }`}
                    >

                      <div className="flex items-start gap-4">

                        <input
                          type="checkbox"
                          checked={
                            selected
                          }
                          onChange={() =>
                            toggleTraining(
                              training.n_training_id
                            )
                          }
                          className="mt-1 h-4 w-4"
                        />


                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col justify-between gap-3 md:flex-row">

                            <div>

                              <p className="text-xs font-medium text-slate-500">
                                {
                                  training.s_training_code
                                }
                              </p>

                              <h3 className="mt-1 font-extrabold text-slate-800">
                                {
                                  training.s_training_name
                                }
                              </h3>

                            </div>


                            <span className="self-start rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                              {
                                training.s_registration_status
                              }
                            </span>

                          </div>


                          {training.s_description && (

                            <p className="mt-2 text-sm font-medium text-slate-600">
                              {
                                training.s_description
                              }
                            </p>

                          )}


                          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">

                            <div>

                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                Training Date
                              </span>

                              <p className="font-semibold text-slate-800">
                                {
                                  training.d_training_date
                                }
                              </p>

                            </div>


                            <div>

                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                Time
                              </span>

                              <p className="font-semibold text-slate-800">
                                {
                                  training.t_start_time
                                }
                                {" - "}
                                {
                                  training.t_end_time
                                }
                              </p>

                            </div>


                            <div>

                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                Registration Ends
                              </span>

                              <p className="font-semibold text-slate-800">
                                {
                                  training.dt_registration_end
                                }
                              </p>

                            </div>

                          </div>

                        </div>

                      </div>

                    </label>

                  );

                }
              )}

            </div>

          )}


          {/* ====================================================
              ACTION
          ==================================================== */}

          {trainings.length > 0 && (

            <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-6 py-5 md:flex-row md:items-center">

              <p className="text-sm text-slate-500">

                {
                  selectedTrainingIds.length
                }
                {" "}
                training(s) selected

              </p>


              <button
                type="button"
                onClick={
                  handleConfirmRegistration
                }
                disabled={
                  submitting ||
                  selectedTrainingIds.length ===
                    0
                }
                className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >

                {
                  submitting
                    ? "Registering..."
                    : "Confirm Registration"
                }

              </button>

            </div>

          )}

        </div>

      </div>

    </main>

  );
}