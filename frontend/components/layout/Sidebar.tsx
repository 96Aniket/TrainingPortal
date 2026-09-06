"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardCheck,
  FileCheck,
  BarChart3,
  Mail,
  History,
  Settings,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { LoggedInUser } from "@/services/api/authApi";

interface SidebarProps {
  user?: LoggedInUser | null;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowed: boolean;
  color: string;
}

export default function Sidebar({
  user,
}: SidebarProps) {
  const pathname = usePathname();

  const role =
    user?.s_role_name?.trim().toUpperCase() ||
    "USER";

  const isAdmin =
    role === "ADMIN";

  const isCoordinator =
    role === "COORDINATOR";

  // ============================================================
  // NAVIGATION
  // Existing role permissions are preserved exactly.
  // ============================================================

  const navigation: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      allowed: true,
      color: "blue",
    },
    {
      label: "Trainings",
      href: "/trainings",
      icon: GraduationCap,
      allowed:
        isAdmin || isCoordinator,
      color: "purple",
    },
    {
      label: "Users",
      href: "/users",
      icon: Users,
      allowed:
        isAdmin || isCoordinator,
      color: "blue",
    },
    {
      label: "Attendance",
      href: "/attendance",
      icon: ClipboardCheck,
      allowed:
        isAdmin || isCoordinator,
      color: "orange",
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      allowed:
        isAdmin || isCoordinator,
      color: "blue",
    },
    {
      label: "Email Logs",
      href: "/email-logs",
      icon: Mail,
      allowed:
        isAdmin || isCoordinator,
      color: "cyan",
    },
    {
      label: "Audit Logs",
      href: "/audit-logs",
      icon: History,
      allowed: isAdmin,
      color: "slate",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      allowed: isAdmin,
      color: "slate",
    },
  ];

  const visibleNavigation =
    navigation.filter(
      (item) => item.allowed
    );

  // ============================================================
  // COLORS
  // ============================================================

  const getColor = (
    color: string,
    active: boolean
  ): {
    icon: string;
    background: string;
    text: string;
    shadow: string;
  } => {
    if (active) {
      return {
        icon: "text-white",
        background:
          "bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600",
        text: "text-white",
        shadow:
          "shadow-lg shadow-indigo-200/70",
      };
    }

    const colors: Record<
      string,
      {
        icon: string;
        background: string;
        text: string;
        shadow: string;
      }
    > = {
      blue: {
        icon: "text-blue-500",
        background: "hover:bg-blue-50",
        text: "text-slate-700",
        shadow: "",
      },

      purple: {
        icon: "text-purple-500",
        background: "hover:bg-purple-50",
        text: "text-slate-700",
        shadow: "",
      },

      orange: {
        icon: "text-orange-500",
        background: "hover:bg-orange-50",
        text: "text-slate-700",
        shadow: "",
      },

      violet: {
        icon: "text-violet-500",
        background: "hover:bg-violet-50",
        text: "text-slate-700",
        shadow: "",
      },

      cyan: {
        icon: "text-cyan-500",
        background: "hover:bg-cyan-50",
        text: "text-slate-700",
        shadow: "",
      },

      slate: {
        icon: "text-slate-500",
        background: "hover:bg-slate-100",
        text: "text-slate-700",
        shadow: "",
      },
    };

    return colors[color] ?? colors.slate;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside
      className="
        flex w-[270px] shrink-0 flex-col
        border-r border-slate-200/80
        bg-white
        shadow-[4px_0_24px_rgba(15,23,42,0.04)]
      "
    >

      {/* ======================================================
          BRAND
      ======================================================= */}

      <div
        className="
          relative
          border-b border-slate-100
          px-5 py-6
        "
      >
        {/* Decorative background */}

        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-gradient-to-br
            from-indigo-50/80
            via-white
            to-blue-50/60
          "
        />

        <div className="relative flex items-center gap-3">

          {/* Logo */}

          <div
            className="
              flex h-11 w-11 shrink-0
              items-center justify-center
              rounded-xl
              bg-gradient-to-br
              from-indigo-500
              via-violet-500
              to-blue-500
              text-white
              shadow-lg
              shadow-indigo-200
            "
          >
            <ShieldCheck
              size={23}
              strokeWidth={2.2}
            />
          </div>

          {/* Brand */}

          <div className="min-w-0">

            <h1
              className="
                truncate
                bg-gradient-to-r
                from-indigo-700
                via-violet-600
                to-blue-600
                bg-clip-text
                text-[17px]
                font-extrabold
                tracking-tight
                text-transparent
              "
            >
              Training Portal
            </h1>

            <p
              className="
                mt-0.5
                truncate
                text-[9px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-slate-400
              "
            >
              Management System
            </p>

          </div>

        </div>

      </div>

      {/* ======================================================
          NAVIGATION
      ======================================================= */}

      <nav className="flex-1 overflow-y-auto px-3 py-5">

        <div className="space-y-6">

          {/* OVERVIEW */}

          <div>

            <p
              className="
                mb-2
                px-3
                text-[10px]
                font-extrabold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Overview
            </p>

            <div className="space-y-1">

              {visibleNavigation
                .filter(
                  (item) =>
                    item.label ===
                    "Dashboard"
                )
                .map((item) => {

                  const Icon =
                    item.icon;

                  const active =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  const colors =
                    getColor(
                      item.color,
                      active
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative
                        flex items-center gap-3
                        rounded-xl
                        px-3.5 py-3
                        text-[13px]
                        font-semibold
                        transition-all duration-200
                        ${colors.background}
                        ${colors.text}
                        ${
                          active
                            ? colors.shadow
                            : ""
                        }
                      `}
                    >

                      {/* Active indicator */}

                      {active && (
                        <span
                          className="
                            absolute
                            left-0
                            h-7 w-1
                            rounded-r-full
                            bg-white/90
                          "
                        />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={
                          active
                            ? 2.4
                            : 2
                        }
                        className={
                          colors.icon
                        }
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="text-white/70"
                        />
                      )}

                    </Link>
                  );
                })}

            </div>

          </div>

          {/* TRAINING MANAGEMENT */}

          <div>

            <p
              className="
                mb-2
                px-3
                text-[10px]
                font-extrabold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Training Management
            </p>

            <div className="space-y-1">

              {visibleNavigation
                .filter(
                  (item) =>
                    [
                      "Trainings",
                      "Users",
                      "Attendance",
                      "Assessments",
                    ].includes(
                      item.label
                    )
                )
                .map((item) => {

                  const Icon =
                    item.icon;

                  const active =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  const colors =
                    getColor(
                      item.color,
                      active
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative
                        flex items-center gap-3
                        rounded-xl
                        px-3.5 py-3
                        text-[13px]
                        font-semibold
                        transition-all duration-200
                        ${colors.background}
                        ${colors.text}
                        ${
                          active
                            ? colors.shadow
                            : ""
                        }
                      `}
                    >

                      {active && (
                        <span
                          className="
                            absolute
                            left-0
                            h-7 w-1
                            rounded-r-full
                            bg-white/90
                          "
                        />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={
                          active
                            ? 2.4
                            : 2
                        }
                        className={
                          colors.icon
                        }
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="text-white/70"
                        />
                      )}

                    </Link>
                  );
                })}

            </div>

          </div>

          {/* ======================================================
              INSIGHTS
          ======================================================= */}

          <div>
            <p
              className="
                mb-2
                px-3
                text-[10px]
                font-extrabold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Insights
            </p>

            <div className="space-y-1">
              {visibleNavigation
                .filter(
                  (item) =>
                    item.label === "Analytics"
                )
                .map((item) => {
                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  const colors = getColor(
                    item.color,
                    active
                  );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative
                        flex items-center gap-3
                        rounded-xl
                        px-3.5 py-3
                        text-[13px]
                        font-semibold
                        transition-all duration-200
                        ${colors.background}
                        ${colors.text}
                        ${
                          active
                            ? colors.shadow
                            : ""
                        }
                      `}
                    >
                      {active && (
                        <span
                          className="
                            absolute
                            left-0
                            h-7 w-1
                            rounded-r-full
                            bg-white/90
                          "
                        />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={
                          active ? 2.4 : 2
                        }
                        className={colors.icon}
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="text-white/70"
                        />
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* COMMUNICATION */}

          {visibleNavigation.some(
            (item) =>
              item.label ===
              "Email Logs"
          ) && (

            <div>

              <p
                className="
                  mb-2
                  px-3
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.16em]
                  text-slate-400
                "
              >
                Communication
              </p>

              <div className="space-y-1">

                {visibleNavigation
                  .filter(
                    (item) =>
                      item.label ===
                      "Email Logs"
                  )
                  .map((item) => {

                    const Icon =
                      item.icon;

                    const active =
                      pathname ===
                        item.href ||
                      pathname.startsWith(
                        `${item.href}/`
                      );

                    const colors =
                      getColor(
                        item.color,
                        active
                      );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          group relative
                          flex items-center gap-3
                          rounded-xl
                          px-3.5 py-3
                          text-[13px]
                          font-semibold
                          transition-all duration-200
                          ${colors.background}
                          ${colors.text}
                          ${
                            active
                              ? colors.shadow
                              : ""
                          }
                        `}
                      >

                        {active && (
                          <span
                            className="
                              absolute
                              left-0
                              h-7 w-1
                              rounded-r-full
                              bg-white/90
                            "
                          />
                        )}

                        <Icon
                          size={19}
                          strokeWidth={
                            active
                              ? 2.4
                              : 2
                          }
                          className={
                            colors.icon
                          }
                        />

                        <span className="flex-1">
                          {item.label}
                        </span>

                        {active && (
                          <ChevronRight
                            size={15}
                            className="text-white/70"
                          />
                        )}

                      </Link>
                    );

                  })}

              </div>

            </div>

          )}

          {/* ADMINISTRATION */}

          {isAdmin && (

            <div>

              <p
                className="
                  mb-2
                  px-3
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.16em]
                  text-slate-400
                "
              >
                Administration
              </p>

              <div className="space-y-1">

                {visibleNavigation
                  .filter(
                    (item) =>
                      [
                        "Audit Logs",
                        "Settings",
                      ].includes(
                        item.label
                      )
                  )
                  .map((item) => {

                    const Icon =
                      item.icon;

                    const active =
                      pathname ===
                        item.href ||
                      pathname.startsWith(
                        `${item.href}/`
                      );

                    const colors =
                      getColor(
                        item.color,
                        active
                      );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          group relative
                          flex items-center gap-3
                          rounded-xl
                          px-3.5 py-3
                          text-[13px]
                          font-semibold
                          transition-all duration-200
                          ${colors.background}
                          ${colors.text}
                          ${
                            active
                              ? colors.shadow
                              : ""
                          }
                        `}
                      >

                        {active && (
                          <span
                            className="
                              absolute
                              left-0
                              h-7 w-1
                              rounded-r-full
                              bg-white/90
                            "
                          />
                        )}

                        <Icon
                          size={19}
                          strokeWidth={
                            active
                              ? 2.4
                              : 2
                          }
                          className={
                            colors.icon
                          }
                        />

                        <span className="flex-1">
                          {item.label}
                        </span>

                        {active && (
                          <ChevronRight
                            size={15}
                            className="text-white/70"
                          />
                        )}

                      </Link>
                    );

                  })}

              </div>

            </div>

          )}

        </div>

      </nav>

      {/* ======================================================
          ROLE / USER FOOTER
      ======================================================= */}

      <div
        className="
          border-t
          border-slate-100
          bg-gradient-to-r
          from-slate-50
          via-white
          to-indigo-50/40
          p-3
        "
      >

        <div
          className="
            rounded-xl
            border
            border-indigo-100
            bg-white
            px-3
            py-3
            shadow-sm
          "
        >

          <div className="flex items-center gap-3">

            {/* Avatar */}

            <div
              className="
                flex h-9 w-9
                shrink-0
                items-center justify-center
                rounded-full
                bg-gradient-to-br
                from-indigo-500
                to-violet-600
                text-xs
                font-extrabold
                text-white
                shadow-md
                shadow-indigo-100
              "
            >
              {user?.s_user_name
                ?.trim()
                ? user.s_user_name
                    .trim()
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

            {/* User info */}

            <div className="min-w-0 flex-1">

              <p
                className="
                  truncate
                  text-xs
                  font-extrabold
                  text-slate-800
                "
              >
                {user?.s_user_name ||
                  user?.s_employee_id ||
                  "User"}
              </p>

              <div className="mt-1 flex items-center gap-1.5">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  {role}
                </span>

              </div>

            </div>

          </div>

        </div>

        <p
          className="
            px-3
            pb-1
            pt-2
            text-[9px]
            font-medium
            text-slate-400
          "
        >
          Training Portal v1.0
        </p>

      </div>

    </aside>
  );
}