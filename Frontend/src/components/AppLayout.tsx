import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Receipt, History, MessageSquare,
  FileUp, LogOut, Menu, X, ChevronRight, Bell, Users,
} from "lucide-react";
import { useState } from "react";
import { useNotificationContext } from "@/context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";

const studentLinks = [
  { to: "/student", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/student/fees", icon: Receipt, label: "My Fees" },
  { to: "/student/payments", icon: History, label: "Payment History" },
  { to: "/student/tickets", icon: MessageSquare, label: "My Tickets" },
  { to: "/student/clubs", icon: Users, label: "Clubs" },
  { to: "/student/notifications", icon: Bell, label: "Notifications" },
];

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/clubs", icon: Users, label: "Club Oversight" },
  { to: "/admin/fee-requests", icon: Receipt, label: "Fee Management" },
  { to: "/admin/import", icon: FileUp, label: "Data Import" },
  { to: "/admin/tickets", icon: MessageSquare, label: "Support Queue" },
];

function NavLinks({ links, onClose }: { links: typeof studentLinks; onClose?: () => void }) {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const notifCtx = useNotificationContext();

  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/student" || link.to === "/admin"}
          onClick={() => {
            if (link.to === "/student/notifications") notifCtx.clearUnread();
            onClose?.();
          }}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              isActive
                ? "bg-white/[0.06] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.08]"
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full" />
              )}
              <div className="relative">
                <link.icon className={`h-[17px] w-[17px] shrink-0 ${isActive ? "text-white" : "text-white/30 group-hover:text-white/60"}`} />
                {link.to === "/student/notifications" && notifCtx.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse" />
                )}
              </div>
              <span className="truncate">{link.label}</span>

              {isStudent && link.to === "/student/notifications" && notifCtx.unreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 text-[10px] font-bold bg-white text-black rounded-full">
                  {notifCtx.unreadCount > 9 ? "9+" : notifCtx.unreadCount}
                </span>
              )}
              {isActive && link.to !== "/student/notifications" && (
                <ChevronRight className="ml-auto h-3 w-3 text-white/20" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const links = user?.role === "ADMIN" ? adminLinks : studentLinks;
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
            <span className="text-black text-xs font-black">CL</span>
          </div>
          <div>
            <p className="text-[15px] font-bold text-white tracking-tight">CampusLedger</p>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.12em] px-3 mb-2">Navigation</p>
        <NavLinks links={links} onClose={onClose} />
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white/70">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user?.fullName}</p>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-[12px] font-medium text-white/30 hover:text-white/70 transition-colors w-full"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-black grid-pattern">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col border-r border-white/[0.06] bg-black/80 backdrop-blur-xl relative shrink-0">
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <span className="text-black text-[10px] font-black">CL</span>
          </div>
          <p className="font-bold text-white text-[15px]">CampusLedger</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60 p-1 rounded-lg hover:bg-white/5 transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-30">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-[220px] bg-black border-r border-white/[0.06] z-40 flex flex-col"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="md:p-8 p-4 pt-16 md:pt-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}