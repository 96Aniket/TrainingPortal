"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/api/authApi";

import {
  Search,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  assignRole,
  getUsersWithRoles,
  removeRole,
  UserWithRoles,
} from "@/services/api/roleApi";


export default function SettingsPage() {
  const [users, setUsers] =
    useState<UserWithRoles[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [processingUserId, setProcessingUserId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ============================================================
  // LOAD USERS
  // ============================================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getUsersWithRoles();

      setUsers(data);

    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        "Unable to load users and roles."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const checkAccessAndLoad = async () => {
      try {
        const currentUser = await getCurrentUser();

        const role =
          currentUser.s_role_name?.trim().toUpperCase();

        if (role !== "ADMIN") {
          setError(
            "Access denied. Only ADMIN users can access Role Management."
          );
          setLoading(false);
          return;
        }

        await loadUsers();

      } catch (err: any) {

        const status =
          err?.response?.status;

        if (status === 403) {
          setError(
            "Access denied. Only ADMIN users can access Role Management."
          );
        } else {
          setError(
            err?.response?.data?.detail ||
            "Unable to verify access."
          );
        }

        setLoading(false);
      }
    };

    checkAccessAndLoad();
  }, []);


  // ============================================================
  // CHECK ROLE
  // ============================================================

  const hasRole = (
    user: UserWithRoles,
    roleName: string
  ): boolean => {

    return user.roles.some(
      (role) =>
        role.s_role_name.toUpperCase() ===
        roleName.toUpperCase()
    );
  };


  // ============================================================
  // GET DISPLAY ROLE
  // ============================================================

  const getDisplayRole = (
    user: UserWithRoles
  ): string => {

    if (user.roles.length === 0) {
      return "USER";
    }

    return user.roles
      .map(
        (role) =>
          role.s_role_name
      )
      .join(", ");
  };


  // ============================================================
  // MAKE COORDINATOR
  // ============================================================

  const handleMakeCoordinator = async (
    user: UserWithRoles
  ) => {

    const confirmed =
      window.confirm(
        `Assign COORDINATOR role to "${user.s_user_name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setProcessingUserId(
        user.n_user_id
      );

      setError("");
      setSuccess("");

      await assignRole(
        user.n_user_id,
        "COORDINATOR"
      );

      setSuccess(
        `COORDINATOR role assigned to ${user.s_user_name}.`
      );

      await loadUsers();

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.detail ||
        "Unable to assign role."
      );

    } finally {

      setProcessingUserId(null);

    }
  };


  // ============================================================
  // REMOVE COORDINATOR
  // ============================================================

  const handleRemoveCoordinator = async (
    user: UserWithRoles
  ) => {

    const confirmed =
      window.confirm(
        `Remove COORDINATOR role from "${user.s_user_name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setProcessingUserId(
        user.n_user_id
      );

      setError("");
      setSuccess("");

      await removeRole(
        user.n_user_id,
        "COORDINATOR"
      );

      setSuccess(
        `COORDINATOR role removed from ${user.s_user_name}.`
      );

      await loadUsers();

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.detail ||
        "Unable to remove role."
      );

    } finally {

      setProcessingUserId(null);

    }
  };


  // ============================================================
  // SEARCH
  // ============================================================

  const filteredUsers =
    users.filter((user) => {

      const value =
        search.trim().toLowerCase();

      return (
        user.s_employee_id
          ?.toLowerCase()
          .includes(value) ||

        user.s_user_name
          ?.toLowerCase()
          .includes(value) ||

        user.s_email
          ?.toLowerCase()
          .includes(value)
      );

    });


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <ShieldCheck
              size={26}
            />

            <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
              Role Management
            </h1>

          </div>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage Training Portal user roles
          </p>

        </div>


        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={17} />

          Refresh
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
          SEARCH
      ======================================================== */}

      <div className="mb-4">

        <div className="relative w-full max-w-xl">

          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search employee, name or email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />

        </div>

      </div>


      {/* ========================================================
          TABLE
      ======================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/70 px-6 py-5">

          <div className="flex items-center justify-between">

            <h2 className="text-base font-extrabold text-slate-800">
              User Roles
            </h2>

            <span className="text-sm font-medium text-slate-500">
              {filteredUsers.length} users
            </span>

          </div>

        </div>


        {loading ? (

          <div className="p-12 text-center text-sm font-medium text-slate-500">
            Loading users...
          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="p-12 text-center text-sm font-medium text-slate-500">
            No users found.
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
                    Current Role
                  </th>

                  <th className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map(
                  (user) => {

                    const isAdmin =
                      hasRole(
                        user,
                        "ADMIN"
                      );

                    const isCoordinator =
                      hasRole(
                        user,
                        "COORDINATOR"
                      );

                    const processing =
                      processingUserId ===
                      user.n_user_id;

                    return (
                      <tr
                        key={
                          user.n_user_id
                        }
                        className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/50"
                      >

                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {
                            user.s_employee_id ||
                            "-"
                          }
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {
                            user.s_user_name ||
                            "-"
                          }
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {
                            user.s_email ||
                            "-"
                          }
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              isAdmin
                                ? "border border-violet-200 bg-violet-100 text-violet-700"
                                : isCoordinator
                                ? "border border-blue-200 bg-blue-100 text-blue-700"
                                : "border border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            {getDisplayRole(
                              user
                            )}
                          </span>

                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">

                          {isAdmin ? (

                            <span className="text-xs font-semibold text-slate-500">
                              Administrator
                            </span>

                          ) : isCoordinator ? (

                            <button
                              type="button"
                              disabled={processing}
                              onClick={() =>
                                handleRemoveCoordinator(
                                  user
                                )
                              }
                              className="rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-rose-600 shadow-sm transition-all hover:bg-rose-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processing
                                ? "Processing..."
                                : "Remove Coordinator"}
                            </button>

                          ) : (

                            <button
                              type="button"
                              disabled={processing}
                              onClick={() =>
                                handleMakeCoordinator(
                                  user
                                )
                              }
                              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processing
                                ? "Processing..."
                                : "Make Coordinator"}
                            </button>

                          )}

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