import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { SkeletonCards, SkeletonTable } from "@/components/Skeletons";
import { formatINR, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

interface YearData { year: number; totalStudent: number; activeStudent: number; }
interface BranchData { branchId: string; branchName: string; totalStudents: number; }
interface StudentData { id: string; fullName: string; email: string; year: number; branch: string; active: boolean; pendingFees: number; totalFees: number; }
interface StudentProfile {
  fullName: string; email: string; year: number; branch: string; active: boolean;
  feeHistory: { feeTitle: string; semester: number; amount: number; dueDate: string; status: string; paidAt: string | null; }[];
  pendingCount: number; paidCount: number; delayedCount: number;
}

type View =
  | { level: "years" }
  | { level: "branches"; year: number }
  | { level: "students"; year: number; branchId: string; branchName: string }
  | { level: "profile"; year: number; branchId: string; branchName: string; studentId: string };

export default function AdminDashboard() {
  const [view, setView] = useState<View>({ level: "years" });
  const [years, setYears] = useState<YearData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    (async () => {
      try {
        if (view.level === "years") {
          setYears(await api<YearData[]>("/api/admin/dashboard/years"));
        } else if (view.level === "branches") {
          setBranches(await api<BranchData[]>(`/api/admin/dashboard/year/${view.year}/branch`));
        } else if (view.level === "students") {
          setStudents(await api<StudentData[]>(`/api/admin/dashboard/year/${view.year}/branch/${view.branchId}`));
        } else if (view.level === "profile") {
          setProfile(await api<StudentProfile>(`/api/admin/dashboard/student/${view.studentId}`));
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [view]);

  const crumbs: { label: string; onClick?: () => void }[] = [{ label: "Dashboard", onClick: () => setView({ level: "years" }) }];
  if (view.level !== "years") {
    crumbs.push({ label: `Year ${(view as any).year}`, onClick: () => setView({ level: "branches", year: (view as any).year }) });
  }
  if (view.level === "students" || view.level === "profile") {
    crumbs.push({ label: (view as any).branchName, onClick: () => setView({ level: "students", year: (view as any).year, branchId: (view as any).branchId, branchName: (view as any).branchName }) });
  }
  if (view.level === "profile") {
    crumbs.push({ label: profile?.fullName || "Student" });
  }

  if (error) return (
    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
      <span>⚠</span><span>{error}</span>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/40">›</span>}
            {i < crumbs.length - 1 && crumb.onClick ? (
              <button onClick={crumb.onClick} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </button>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {loading ? (
        view.level === "years" || view.level === "branches" ? <SkeletonCards count={4} /> : <SkeletonTable />
      ) : (
        <>
          {view.level === "years" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {years.map((y) => (
                <button
                  key={y.year}
                  onClick={() => setView({ level: "branches", year: y.year })}
                  className="bg-card border border-border rounded-xl p-5 text-left card-elevated hover:card-elevated-md hover:border-primary/30 transition-all duration-200 group"
                >
                  <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Year {y.year}</p>
                  <p className="text-sm text-muted-foreground mt-1">{y.totalStudent} students · {y.activeStudent} active</p>
                </button>
              ))}
            </div>
          )}

          {view.level === "branches" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {branches.map((b) => (
                <button
                  key={b.branchId}
                  onClick={() => setView({ level: "students", year: view.year, branchId: b.branchId, branchName: b.branchName })}
                  className="bg-card border border-border rounded-xl p-5 text-left card-elevated hover:card-elevated-md hover:border-primary/30 transition-all duration-200 group"
                >
                  <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{b.branchName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{b.totalStudents} students</p>
                </button>
              ))}
            </div>
          )}

          {view.level === "students" && (
            students.length === 0 ? (
              <EmptyState title="No students" description="No students found in this branch." />
            ) : (
              <div className="table-wrapper">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="table-th">Name</th>
                      <th className="table-th">Email</th>
                      <th className="table-th">Pending Fees</th>
                      <th className="table-th">Total Fees</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                        <td className="table-td text-foreground font-medium">{s.fullName}</td>
                        <td className="table-td text-muted-foreground">{s.email}</td>
                        <td className="table-td text-foreground">{formatINR(s.pendingFees)}</td>
                        <td className="table-td text-foreground">{formatINR(s.totalFees)}</td>
                        <td className="table-td">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.active ? "bg-status-paid-bg text-status-paid ring-status-paid/20" : "bg-status-closed-bg text-status-closed ring-status-closed/20"}`}>
                            {s.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="table-td">
                          <button onClick={() => setView({ ...view, level: "profile", studentId: s.id })} className="text-[13px] text-primary font-medium hover:underline">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {view.level === "profile" && profile && (
            <div>
              <div className="bg-card border border-border rounded-xl p-6 card-elevated mb-6">
                <h2 className="text-xl font-semibold text-foreground">{profile.fullName}</h2>
                <p className="text-sm text-muted-foreground mt-1">{profile.email} · {profile.branch}, Year {profile.year}</p>
                <div className="flex gap-2 mt-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-status-pending-bg text-status-pending ring-1 ring-inset ring-status-pending/20">
                    {profile.pendingCount} Pending
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-status-paid-bg text-status-paid ring-1 ring-inset ring-status-paid/20">
                    {profile.paidCount} Paid
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-status-delayed-bg text-status-delayed ring-1 ring-inset ring-status-delayed/20">
                    {profile.delayedCount} Delayed
                  </span>
                </div>
              </div>
              {profile.feeHistory.length === 0 ? (
                <EmptyState title="No fee records" description="This student has no fee history." />
              ) : (
                <div className="table-wrapper">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="table-th">Fee Title</th>
                        <th className="table-th">Semester</th>
                        <th className="table-th">Amount</th>
                        <th className="table-th">Due Date</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Paid At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.feeHistory.map((f, i) => (
                        <tr key={i} className="border-t border-border hover:bg-accent/50 transition-colors">
                          <td className="table-td text-foreground font-medium">{f.feeTitle}</td>
                          <td className="table-td text-muted-foreground">Sem {f.semester}</td>
                          <td className="table-td text-foreground">{formatINR(f.amount)}</td>
                          <td className="table-td text-muted-foreground">{formatDate(f.dueDate)}</td>
                          <td className="table-td"><StatusBadge status={f.status as any} /></td>
                          <td className="table-td text-muted-foreground">{f.paidAt ? formatDate(f.paidAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
