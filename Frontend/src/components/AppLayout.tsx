import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, History, MessageSquare, FileUp, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { useState } from "react";

const studentLinks = [
  { to: "/student", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/student/fees", icon: Receipt, label: "My Fees" },
  { to: "/student/payments", icon: History, label: "Payment History" },
  { to: "/student/tickets", icon: MessageSquare, label: "My Tickets" },
];

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/fee-requests", icon: Receipt, label: "Fee Requests" },
  { to: "/admin/import", icon: FileUp, label: "CSV Import" },
  { to: "/admin/tickets", icon: MessageSquare, label: "Tickets" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const links = user?.role === "ADMIN" ? adminLinks : studentLinks;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col border-r border-border bg-card card-elevated">
        <div className="p-5 border-b border-border">
          <p className="font-display text-lg text-foreground">CampusPay</p>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/student" || link.to === "/admin"}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={`h-[18px] w-[18px] ${isActive ? "text-primary" : ""}`} />
                  {link.label}
                  {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/8 text-primary mt-1.5">
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between card-elevated">
        <p className="font-display text-lg text-foreground">CampusPay</p>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-1 rounded-lg hover:bg-accent transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-12 left-0 bottom-0 w-[260px] bg-card border-r border-border z-40 flex flex-col animate-slide-in-left card-elevated-md">
            <nav className="flex-1 py-3 px-3 space-y-0.5">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/student" || link.to === "/admin"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      isActive ? "bg-primary/8 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`
                  }
                >
                  <link.icon className="h-[18px] w-[18px]" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
              <button onClick={logout} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground mt-3">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:overflow-y-auto">
        <div className="md:p-8 p-4 pt-16 md:pt-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
