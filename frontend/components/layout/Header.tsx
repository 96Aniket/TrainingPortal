"use client";

import {
  Bell,
  LogOut,
  UserCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  logout,
  LoggedInUser,
} from "@/services/api/authApi";

interface HeaderProps {
  user: LoggedInUser;
}

export default function Header({
  user,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      router.replace("/login");
    }
  };

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-[76px] items-center justify-between
        border-b border-slate-200/80
        bg-white/90
        px-4
        backdrop-blur-xl
        shadow-[0_4px_20px_rgba(15,23,42,0.04)]
        sm:px-6
        lg:px-8
      "
    >
      {/* =====================================================
          LEFT - BRAND / PAGE CONTEXT
      ====================================================== */}

      <div className="flex items-center gap-3">
        <div
          className="
            hidden h-10 w-10
            items-center justify-center
            rounded-xl
            bg-gradient-to-br
            from-indigo-500
            via-violet-500
            to-blue-500
            text-white
            shadow-lg
            shadow-indigo-200
            sm:flex
          "
        >
          <span className="text-sm font-extrabold">
            TP
          </span>
        </div>

        <div>
          <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900 sm:text-base">
            Training Portal
          </h2>

          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Training Management System
          </p>
        </div>
      </div>

      {/* =====================================================
          RIGHT - SYSTEM / USER
      ====================================================== */}

      <div className="flex items-center gap-2 sm:gap-3">

        {/* SYSTEM STATUS */}

        <div
          className="
            hidden items-center gap-2
            rounded-full
            border border-emerald-100
            bg-emerald-50
            px-3 py-1.5
            md:flex
          "
        >
          <span className="relative flex h-2 w-2">
            <span
              className="
                absolute
                inline-flex
                h-full w-full
                animate-ping
                rounded-full
                bg-emerald-400
                opacity-60
              "
            />

            <span
              className="
                relative
                inline-flex
                h-2 w-2
                rounded-full
                bg-emerald-500
              "
            />
          </span>

          <span className="text-[10px] font-bold tracking-wide text-emerald-700">
            SYSTEM ONLINE
          </span>
        </div>

        {/* DIVIDER */}

        <div className="hidden h-8 w-px bg-slate-200 md:block" />

        {/* NOTIFICATIONS */}

        <button
          type="button"
          className="
            relative
            rounded-xl
            border border-transparent
            p-2.5
            text-slate-500
            transition-all
            hover:border-indigo-100
            hover:bg-indigo-50
            hover:text-indigo-600
        "
          title="Notifications"
        >
          <Bell
            size={19}
            strokeWidth={2}
          />

          {/* Notification indicator */}

          <span
            className="
              absolute
              right-2
              top-2
              h-1.5
              w-1.5
              rounded-full
              bg-red-500
              ring-2 ring-white
            "
          />
        </button>

        {/* USER DIVIDER */}

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* USER PROFILE */}

        <div
          className="
            flex items-center gap-2.5
            rounded-xl
            px-2 py-1.5
            transition-all
            hover:bg-slate-50
          "
        >
          {/* Avatar */}

          <div
            className="
              flex h-10 w-10
              shrink-0
              items-center justify-center
              rounded-full
              bg-gradient-to-br
              from-indigo-500
              via-violet-500
              to-blue-600
              text-white
              shadow-md
              shadow-indigo-100
            "
          >
            {user.s_user_name?.trim()
              ? user.s_user_name
                  .trim()
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          {/* USER INFORMATION */}

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-[180px] truncate text-xs font-extrabold text-slate-800">
              {user.s_user_name ||
                user.s_employee_id ||
                "User"}
            </p>

            <div className="mt-0.5 flex items-center gap-2">
              <span
                className="
                  rounded-full
                  bg-indigo-50
                  px-2
                  py-0.5
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-wide
                  text-indigo-600
                "
              >
                {user.s_role_name ||
                  "USER"}
              </span>
            </div>

            <p className="mt-1 max-w-[220px] truncate text-[10px] font-medium text-slate-400">
              {user.s_email}
            </p>
          </div>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            rounded-xl
            border border-transparent
            p-2.5
            text-slate-400
            transition-all
            hover:border-rose-100
            hover:bg-rose-50
            hover:text-rose-600
        "
          title="Logout"
        >
          <LogOut
            size={18}
            strokeWidth={2}
          />
        </button>

      </div>
    </header>
  );
}