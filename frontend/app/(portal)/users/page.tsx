"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  UserPlus,
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Power,
  RotateCcw,
} from "lucide-react";

import {
  createUser,
  getUsers,
  updateUser,
  activateUser,
  deactivateUser,
  importUserUpload,
  previewUserUpload,
  User,
  UserUploadPreview,
  UserUploadImportResult,
} from "@/services/api/userApi";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add User
  const [showAddUser, setShowAddUser] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  // Edit User
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionSaving, setActionSaving] = useState(false);

  // Excel Upload
  const [showUpload, setShowUpload] = useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadPreview, setUploadPreview] =
    useState<UserUploadPreview | null>(null);

  const [uploading, setUploading] = useState(false);

  const [importing, setImporting] = useState(false);

  const [importResult, setImportResult] =
    useState<UserUploadImportResult | null>(null);

  // ============================================================
  // LOAD USERS
  // ============================================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ============================================================
  // ADD USER
  // ============================================================

  const handleAddUser = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }

    if (!userName.trim()) {
      setError("User name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);

      await createUser({
        s_employee_id: employeeId.trim(),
        s_user_name: userName.trim(),
        s_email: email.trim(),
      });

      setSuccess("User created successfully.");

      setEmployeeId("");
      setUserName("");
      setEmail("");

      setShowAddUser(false);

      await loadUsers();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Unable to create user.";

      setError(
        Array.isArray(message)
          ? "Please check the entered details."
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // EXCEL PREVIEW
  // ============================================================

  const handlePreviewUpload = async () => {
    if (!selectedFile) {
      setError("Please select an Excel file.");
      return;
    }

    setError("");
    setSuccess("");
    setUploadPreview(null);
    setImportResult(null);

    try {
      setUploading(true);

      const result =
        await previewUserUpload(selectedFile);

      setUploadPreview(result);
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Unable to process Excel file.";

      setError(
        Array.isArray(message)
          ? "Unable to process Excel file."
          : message
      );
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // IMPORT USERS
  // ============================================================

  const handleImportUsers = async () => {
    if (!selectedFile || !uploadPreview) {
      return;
    }

    if (uploadPreview.summary.valid_rows === 0) {
      setError("There are no valid users to import.");
      return;
    }

    try {
      setImporting(true);
      setError("");
      setSuccess("");

      const result =
        await importUserUpload(selectedFile);

      setImportResult(result);

      setSuccess(
        `${result.imported_count} users imported successfully.`
      );

      await loadUsers();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Unable to import users.";

      setError(
        Array.isArray(message)
          ? "Unable to import users."
          : message
      );
    } finally {
      setImporting(false);
    }
  };

  // ============================================================
  // EDIT USER
  // ============================================================

  const handleEditUser = (user: User) => {
    setError("");
    setSuccess("");

    setEditingUser(user);

    setEmployeeId(user.s_employee_id || "");
    setUserName(user.s_user_name || "");
    setEmail(user.s_email || "");

    setShowEditUser(true);
  };

  const handleUpdateUser = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingUser) {
      return;
    }

    if (!employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }

    if (!userName.trim()) {
      setError("User name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setActionSaving(true);

      await updateUser(
        editingUser.n_user_id,
        {
          s_employee_id: employeeId.trim(),
          s_user_name: userName.trim(),
          s_email: email.trim(),
        }
      );

      setSuccess("User updated successfully.");

      setEditingUser(null);
      setShowEditUser(false);

      setEmployeeId("");
      setUserName("");
      setEmail("");

      await loadUsers();

    } catch (err: any) {
      const status = err?.response?.status;

      const message =
        err?.response?.data?.detail ||
        "Unable to update user.";

      if (status === 403) {
        setError(message);
        return;
      }

      console.error(err);

      setError(
        Array.isArray(message)
          ? "Please check the entered details."
          : message
      );
    } finally {
      setActionSaving(false);
    }
  };


  // ============================================================
  // ACTIVATE / DEACTIVATE USER
  // ============================================================

  const handleToggleUserStatus = async (
    user: User
  ) => {
    setError("");
    setSuccess("");

    const active =
      user.n_flag === 1 &&
      user.delete_flag !== 1;

    const action = active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      active
        ? `Are you sure you want to deactivate ${user.s_user_name || user.s_email}?`
        : `Are you sure you want to activate ${user.s_user_name || user.s_email}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionSaving(true);

      if (active) {
        await deactivateUser(user.n_user_id);

        setSuccess(
          `${user.s_user_name || user.s_email} deactivated successfully.`
        );
      } else {
        await activateUser(user.n_user_id);

        setSuccess(
          `${user.s_user_name || user.s_email} activated successfully.`
        );
      }

      await loadUsers();

    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.detail ||
        `Unable to ${action} user.`;

      if (status === 403) {
        setError(message);
        return;
      }

      console.error(err);

      setError(
        Array.isArray(message)
          ? `Unable to ${action} user.`
          : message
      );
    } finally {
      setActionSaving(false);
    }
  };

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = users.filter((user) => {
    const value = search.toLowerCase();

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
          PAGE HEADER
      ======================================================== */}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            User Management
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage Training Portal users
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Upload User List */}

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setSelectedFile(null);
              setUploadPreview(null);
              setImportResult(null);
              setShowUpload(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
          >
            <Upload size={18} />

            Upload User List
          </button>

          {/* Add User */}

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowAddUser(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <UserPlus size={18} />

            Add User
          </button>
        </div>
      </div>

      {/* ========================================================
          SUCCESS MESSAGE
      ======================================================== */}

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {/* ========================================================
          ERROR MESSAGE
      ======================================================== */}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {/* ========================================================
          SEARCH / REFRESH
      ======================================================== */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xl">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400"
          />

          <input
            type="text"
            placeholder="Search employee, name or email..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <button
          type="button"
          onClick={loadUsers}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
        >
          <RefreshCw size={17} />

          Refresh
        </button>
      </div>

      {/* ========================================================
          USERS TABLE
      ======================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/70 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">
              Users
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
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const active =
                    user.n_flag === 1 &&
                    user.delete_flag !== 1;

                  return (
                    <tr
                      key={user.n_user_id}
                      className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {user.s_employee_id || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {user.s_user_name || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {user.s_email || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            active
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleEditUser(user)}
                            disabled={actionSaving}
                            title="Edit User"
                            className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* Activate / Deactivate */}
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={actionSaving}
                            title={
                              active
                                ? "Deactivate User"
                                : "Activate User"
                            }
                            className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              active
                                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {active ? (
                              <Power size={16} />
                            ) : (
                              <RotateCcw size={16} />
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          EXCEL UPLOAD MODAL
      ======================================================== */}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/30">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Upload User List
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Upload Excel file containing Employee ID,
                  User Name and Email.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">

              {/* FILE SELECT */}

              <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 p-8 shadow-sm">
                <div className="text-center">

                  <FileSpreadsheet
                    size={40}
                    className="mx-auto mb-3 text-indigo-500"
                  />

                  <p className="text-sm font-medium">
                    Select Excel file
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Required columns:
                    Employee ID, User Name, Email
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Supported formats: .xlsx, .xls
                  </p>

                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0] ||
                        null;

                      setSelectedFile(file);
                      setUploadPreview(null);
                      setImportResult(null);
                      setError("");
                      setSuccess("");
                    }}
                    className="mx-auto mt-4 block text-sm"
                  />

                  {selectedFile && (
                    <p className="mt-3 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                      Selected: {selectedFile.name}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={
                      !selectedFile || uploading
                    }
                    onClick={handlePreviewUpload}
                    className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading
                      ? "Validating..."
                      : "Upload & Preview"}
                  </button>
                </div>
              </div>

              {/* VALIDATION SUMMARY */}

              {uploadPreview && (
                <div className="mt-6">

                  <h3 className="mb-4 text-base font-extrabold text-indigo-900">
                    Validation Summary
                  </h3>

                  <div className="grid gap-4 md:grid-cols-5">

                    <SummaryCard
                      title="Total"
                      value={
                        uploadPreview.summary
                          .total_rows
                      }
                    />

                    <SummaryCard
                      title="Valid"
                      value={
                        uploadPreview.summary
                          .valid_rows
                      }
                      type="success"
                    />

                    <SummaryCard
                      title="Invalid"
                      value={
                        uploadPreview.summary
                          .invalid_rows
                      }
                      type="error"
                    />

                    <SummaryCard
                      title="Duplicate"
                      value={
                        uploadPreview.summary
                          .duplicate_file_rows
                      }
                      type="warning"
                    />

                    <SummaryCard
                      title="Existing"
                      value={
                        uploadPreview.summary
                          .existing_user_rows
                      }
                      type="warning"
                    />

                  </div>

                  {/* PREVIEW TABLE */}

                  <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

                    <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
                      <h3 className="text-base font-extrabold text-slate-800">
                        User Preview
                      </h3>
                    </div>

                    <div className="max-h-80 overflow-auto">
                      <table className="w-full text-left text-sm">

                        <thead className="sticky top-0 bg-gray-100">
                          <tr>
                            <th className="px-4 py-3">
                              Excel Row
                            </th>

                            <th className="px-4 py-3">
                              Employee ID
                            </th>

                            <th className="px-4 py-3">
                              User Name
                            </th>

                            <th className="px-4 py-3">
                              Email
                            </th>

                            <th className="px-4 py-3">
                              Status
                            </th>

                            <th className="px-4 py-3">
                              Reason
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {uploadPreview.rows.map(
                            (row) => {
                              const valid =
                                row.status ===
                                "VALID";

                              return (
                                <tr
                                  key={row.excel_row}
                                  className={`border-t ${
                                    valid
                                      ? ""
                                      : "bg-rose-50"
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    {row.excel_row}
                                  </td>

                                  <td className="px-4 py-3">
                                    {row.s_employee_id ||
                                      "-"}
                                  </td>

                                  <td className="px-4 py-3">
                                    {row.s_user_name ||
                                      "-"}
                                  </td>

                                  <td className="px-4 py-3">
                                    {row.s_email ||
                                      "-"}
                                  </td>

                                  <td className="px-4 py-3">
                                    {valid ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                        <CheckCircle2
                                          size={14}
                                        />

                                        VALID
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                        <AlertCircle
                                          size={14}
                                        />

                                        INVALID
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-xs text-red-600">
                                    {row.errors.length >
                                    0
                                      ? row.errors.join(
                                          ", "
                                        )
                                      : "-"}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>

                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* IMPORT RESULT */}

              {importResult && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">

                  <h3 className="font-extrabold text-emerald-800">
                    Import Completed
                  </h3>

                  <div className="mt-2 text-sm font-medium text-emerald-700">
                    Imported:{" "}
                    <strong>
                      {importResult.imported_count}
                    </strong>
                  </div>

                  <div className="text-sm font-medium text-emerald-700">
                    Skipped:{" "}
                    <strong>
                      {importResult.skipped_count}
                    </strong>
                  </div>

                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">

              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Close
              </button>

              {uploadPreview &&
                uploadPreview.summary.valid_rows >
                  0 &&
                !importResult && (
                  <button
                    type="button"
                    disabled={importing}
                    onClick={handleImportUsers}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importing
                      ? "Importing..."
                      : `Import ${uploadPreview.summary.valid_rows} Valid Users`}
                  </button>
                )}

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          ADD USER MODAL
      ======================================================== */}

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Add User
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Create a Training Portal user
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddUser(false)
                }
                className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleAddUser}
              className="space-y-5 p-6"
            >

              {/* Employee ID */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Employee ID
                </label>

                <input
                  type="text"
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(
                      event.target.value
                    )
                  }
                  placeholder="EMP006"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* User Name */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  User Name
                </label>

                <input
                  type="text"
                  value={userName}
                  onChange={(event) =>
                    setUserName(
                      event.target.value
                    )
                  }
                  placeholder="Enter user name"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* Email */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="user@company.com"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddUser(false)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ============================================================
          EDIT USER MODAL
      ============================================================ */}

      {showEditUser && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 px-6 py-5">

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Edit User
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Update Training Portal user details
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditUser(false);
                  setEditingUser(null);
                }}
                className="rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-100 hover:text-indigo-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleUpdateUser}
              className="space-y-5 p-6"
            >

              {/* Employee ID */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Employee ID
                </label>

                <input
                  type="text"
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(event.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* User Name */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  User Name
                </label>

                <input
                  type="text"
                  value={userName}
                  onChange={(event) =>
                    setUserName(event.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* Email */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionSaving}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionSaving
                    ? "Updating..."
                    : "Update User"}
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
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  type = "normal",
}: {
  title: string;
  value: number;
  type?: "normal" | "success" | "error" | "warning";
}) {
  const styles = {
    normal: "border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60",
    success: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/70",
    error: "border-rose-200 bg-gradient-to-br from-white to-rose-50/70",
    warning: "border-amber-200 bg-gradient-to-br from-white to-amber-50/70",
  };

  return (
    <div
      className={`rounded-lg border bg-white p-4 ${styles[type]}`}
    >
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}