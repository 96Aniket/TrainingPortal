"use client";

import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  FileClock,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  logout,
  LoggedInUser,
} from "@/services/api/authApi";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigation: NavigationSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        color: "blue",
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        color: "violet",
      },
    ],
  },

  {
    title: "TRAINING MANAGEMENT",
    items: [
      {
        label: "Trainings",
        href: "/trainings",
        icon: BookOpen,
        color: "purple",
      },
      {
        label: "Users",
        href: "/users",
        icon: Users,
        color: "blue",
      },
      {
        label: "Attendance",
        href: "/attendance",
        icon: CalendarCheck,
        color: "orange",
      },
      {
        label: "Assessments",
        href: "/assessments",
        icon: ClipboardCheck,
        color: "violet",
      },
    ],
  },

  {
    title: "COMMUNICATION",
    items: [
      {
        label: "Email Logs",
        href: "/email-logs",
        icon: Mail,
        color: "cyan",
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: FileClock,
        color: "slate",
      },
    ],
  },

  {
    title: "SYSTEM",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        color: "slate",
      },
    ],
  },
];

function getColorClasses(color: string) {
  const colors: Record<
    string,
    {
      icon: string;
      active: string;
    }
  > = {
    blue: {
      icon: "text-blue-500",
      active: "bg-blue-50 text-blue-700",
    },

    violet: {
      icon: "text-violet-500",
      active: "bg-violet-50 text-violet-700",
    },

    purple: {
      icon: "text-purple-500",
      active: "bg-purple-50 text-purple-700",
    },

    orange: {
      icon: "text-orange-500",
      active: "bg-orange-50 text-orange-700",
    },

    cyan: {
      icon: "text-cyan-500",
      active: "bg-cyan-50 text-cyan-700",
    },

    slate: {
      icon: "text-slate-500",
      active: "bg-slate-100 text-slate-700",
    },
  };

  return colors[color] ?? colors.slate;
}

function Sidebar({
  mobileOpen,
  setMobileOpen,
  user,
  onLogout,
}: {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  user: LoggedInUser | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[270px] flex-col
          border-r border-slate-200/80
          bg-white
          shadow-[4px_0_24px_rgba(15,23,42,0.04)]
          transition-transform duration-300
          lg:translate-x-0
          ${mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
          }
        `}
      >
        {/* ==================================================
            BRAND
           ================================================== */}

        <div className="flex h-[76px] items-center border-b border-slate-100 px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl
                bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500
                text-white
                shadow-lg shadow-indigo-200
              "
            >
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>

            <div>
              <div className="text-[17px] font-bold tracking-tight text-slate-900">
                Training Portal
              </div>

              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Management System
              </div>
            </div>
          </Link>

          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        {/* ==================================================
            NAVIGATION
           ================================================== */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((section) => (
            <div
              key={section.title}
              className="mb-6"
            >
              <div className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                {section.title}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  const colorClasses =
                    getColorClasses(item.color);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() =>
                        setMobileOpen(false)
                      }
                      className={`
                        group relative flex items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-[13px] font-semibold
                        transition-all duration-150
                        ${active
                          ? `${colorClasses.active} shadow-sm`
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      {active && (
                        <span
                          className="
                            absolute left-0
                            h-6 w-1
                            rounded-r-full
                            bg-gradient-to-b
                            from-indigo-500
                            to-violet-500
                          "
                        />
                      )}

                      <Icon
                        size={18}
                        strokeWidth={
                          active ? 2.4 : 2
                        }
                        className={
                          active
                            ? "text-current"
                            : `${colorClasses.icon} group-hover:text-slate-700`
                        }
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="opacity-50"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ==================================================
            USER CARD
           ================================================== */}

        <div className="border-t border-slate-100 p-3">
          <div
            className="
              flex items-center gap-3
              rounded-xl
              bg-gradient-to-r from-slate-50 to-indigo-50/50
              px-3 py-3
            "
          >
            <div
              className="
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-full
                bg-gradient-to-br from-indigo-500 to-violet-600
                text-xs font-bold text-white
                shadow-sm
              "
            >
              {
                (
                  user?.s_user_name ||
                  user?.s_email ||
                  "U"
                )
                  .trim()
                  .charAt(0)
                  .toUpperCase()
              }
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-slate-800">
                {
                  user?.s_user_name ||
                  user?.s_email ||
                  "User"
                }
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {
                    user?.s_role_name ||
                    "USER"
                  }
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="px-3 pb-1 pt-2 text-[9px] font-medium text-slate-400">
            Training Portal v1.0
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({
  setMobileOpen,
  user,
  onLogout,
}: {
  setMobileOpen: (value: boolean) => void;
  user: LoggedInUser | null;
  onLogout: () => void;
}) {
  return (
    <header
      className="
        sticky top-0 z-30
        flex h-[76px] items-center
        border-b border-slate-200/80
        bg-white/90
        px-4
        backdrop-blur-xl
        sm:px-6
        lg:px-8
      "
    >
      {/* Mobile menu */}

      <button
        type="button"
        className="
          mr-3 rounded-xl p-2
          text-slate-500
          hover:bg-slate-100
          lg:hidden
        "
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={21} />
      </button>

      {/* Header title */}

      <div className="hidden sm:block">
        <div className="text-sm font-bold text-slate-900">
          Training Portal
        </div>

        <div className="text-[10px] text-slate-400">
          Training Management
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Status */}

        <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-[10px] font-bold text-emerald-700">
            SYSTEM ONLINE
          </span>
        </div>

        {/* Notifications */}

        <button
          type="button"
          className="
            relative rounded-xl p-2.5
            text-slate-500
            hover:bg-indigo-50
            hover:text-indigo-600
          "
        >
          <Bell size={19} />

          <span
            className="
              absolute right-2 top-2
              h-1.5 w-1.5
              rounded-full
              bg-red-500
              ring-2 ring-white
            "
          />
        </button>

        {/* Divider */}

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* User */}

        <div className="flex items-center gap-2.5">
          <div
            className="
              flex h-9 w-9 items-center justify-center
              rounded-full
              bg-gradient-to-br from-indigo-500 to-violet-600
              text-xs font-bold text-white
              shadow-md shadow-indigo-100
            "
          >
            {
              (
                user?.s_user_name ||
                user?.s_email ||
                "U"
              )
                .trim()
                .charAt(0)
                .toUpperCase()
            }
          </div>

          <div className="hidden sm:block">
            <div className="text-xs font-bold text-slate-800">
              {
                user?.s_user_name ||
                user?.s_email ||
                "User"
              }
            </div>

            <div className="text-[10px] font-semibold text-indigo-600">
              {
                user?.s_role_name ||
                "USER"
              }
            </div>
          </div>
        </div>

        {/* Logout */}

        <button
          type="button"
          onClick={onLogout}
          className="
            rounded-xl p-2.5
            text-slate-400
            hover:bg-red-50
            hover:text-red-600
          "
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [user, setUser] =
    useState<LoggedInUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);


  // ==========================================================
  // LOAD CURRENT USER
  // ==========================================================

  useEffect(() => {

    let mounted = true;

    const checkSession = async () => {

      try {

        const currentUser =
          await getCurrentUser();

        if (mounted) {

          setUser(
            currentUser
          );

        }

      } catch (error: any) {

        console.error(
          "Session check failed:",
          error
        );

        router.replace(
          "/login"
        );

        return;

      } finally {

        if (mounted) {

          setLoadingUser(
            false
          );

        }

      }

    };

    checkSession();

    return () => {

      mounted = false;

    };

  }, [router]);


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {

    try {

      await logout();

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    } finally {

      setUser(null);

      router.replace(
        "/login"
      );

    }

  };


  // ==========================================================
  // SESSION LOADING
  // ==========================================================

  if (loadingUser) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fc]">

        <div className="text-sm font-medium text-slate-500">
          Checking session...
        </div>

      </div>
    );

  }


  // ==========================================================
  // PORTAL
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#f4f7fc]">

      <Sidebar
        mobileOpen={
          mobileOpen
        }

        setMobileOpen={
          setMobileOpen
        }

        user={
          user
        }

        onLogout={
          handleLogout
        }
      />


      <div className="min-h-screen lg:pl-[270px]">

        <Header
          setMobileOpen={
            setMobileOpen
          }

          user={
            user
          }

          onLogout={
            handleLogout
          }
        />


        <main className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">

          <div className="mx-auto w-full max-w-[1600px]">

            {children}

          </div>

        </main>

      </div>

    </div>

  );
}
