import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { SkeletonCards, SkeletonTable } from "@/components/Skeletons";
import { formatINR, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Building2, GraduationCap, Users, Mail, BookOpen, Fingerprint, History, CreditCard, ChevronRight, User } from "lucide-react";
import { motion } from "framer-motion";

interface YearData { year: number; totalStudent: number; activeStudent: number; }
interface BranchData { branchId: string; branchName: string; totalStudents: number; }
interface StudentData { id: string; fullName: string; email: string; year: number; branch: string; active: boolean; pendingFees: number; totalFees: number; }
interface StudentProfile {
  fullName: string; email: string; year: number; branch: string; active: boolean;
  feeHistory: { feeTitle: string; semester: number; amount: number; dueDate: string; status: string; paidAt: string | null; }[];
  pendingCount: number; paidCount: number; delayedCount: number;
}

type StreamType = "Engineering" | "BBA/MBA";
type ProgramType = "B.Tech" | "M.Tech" | "BBA" | "MBA";

type View =
  | { level: "streams" }
  | { level: "programs"; stream: StreamType }
  | { level: "years"; stream: StreamType; program: ProgramType }
  | { level: "branches"; stream: StreamType; program: ProgramType; year: number; batchYear: number }
  | { level: "students"; stream: StreamType; program: ProgramType; year: number; batchYear: number; branchId: string; branchName: string }
  | { level: "profile"; stream: StreamType; program: ProgramType; year: number; batchYear: number; branchId: string; branchName: string; studentId: string };

const cardBase = "bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.14] transition-all cursor-pointer text-left group";

export default function AdminDashboard() {
  const [view, setView] = useState<View>({ level: "streams" });
  const [years, setYears] = useState<YearData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    (async () => {
      try {
        if (view.level === "years" && (view as any).program === "B.Tech")
          setYears(await api<YearData[]>("/api/admin/dashboard/years"));
        else if (view.level === "branches")
          setBranches(await api<BranchData[]>(`/api/admin/dashboard/year/${(view as any).year}/branch`));
        else if (view.level === "students")
          setStudents(await api<StudentData[]>(`/api/admin/dashboard/year/${(view as any).year}/branch/${(view as any).branchId}`));
        else if (view.level === "profile")
          setProfile(await api<StudentProfile>(`/api/admin/dashboard/student/${(view as any).studentId}`));
      } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [view]);

  const getBatchYear = (y: number) => ({ 1: 2029, 2: 2028, 3: 2027, 4: 2026 }[y] ?? 2030 - y);

  const crumbs: { label: string; onClick?: () => void }[] = [{ label: "Streams", onClick: () => setView({ level: "streams" }) }];
  if (view.level !== "streams") crumbs.push({ label: (view as any).stream, onClick: () => setView({ level: "programs", stream: (view as any).stream }) });
  if (["years","branches","students","profile"].includes(view.level)) crumbs.push({ label: (view as any).program, onClick: () => setView({ level: "years", stream: (view as any).stream, program: (view as any).program }) });
  if (["branches","students","profile"].includes(view.level)) crumbs.push({ label: `Year ${(view as any).year}`, onClick: () => setView({ level: "branches", stream: (view as any).stream, program: (view as any).program, year: (view as any).year, batchYear: (view as any).batchYear }) });
  if (["students","profile"].includes(view.level)) crumbs.push({ label: (view as any).branchName, onClick: () => setView({ level: "students", stream: (view as any).stream, program: (view as any).program, year: (view as any).year, batchYear: (view as any).batchYear, branchId: (view as any).branchId, branchName: (view as any).branchName }) });
  if (view.level === "profile") crumbs.push({ label: profile?.fullName || "Student" });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="mb-8">
        <p className="text-xs font-bold text-white/20 uppercase tracking-[0.15em] mb-1">Admin Terminal</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">Student Directory</h1>
        <p className="text-sm text-white/40 mt-1">Browse students by stream, program, year and branch.</p>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 overflow-x-auto">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2 shrink-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
            {i < crumbs.length - 1 && crumb.onClick ? (
              <button onClick={crumb.onClick} className="text-sm text-white/40 hover:text-white transition-colors font-medium">{crumb.label}</button>
            ) : (
              <span className="text-sm text-white font-bold">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {error && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-4">⚠ {error}</div>}

      {loading ? (
        view.level === "students" || view.level === "profile" ? <SkeletonTable /> : <SkeletonCards count={4} />
      ) : (
        <>
          {/* STREAMS */}
          {view.level === "streams" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { stream: "Engineering" as StreamType, icon: Building2, color: "indigo", desc: "Manage B.Tech and M.Tech students" },
                { stream: "BBA/MBA" as StreamType, icon: GraduationCap, color: "rose", desc: "Manage undergraduate and graduate business students" },
              ].map(({ stream, icon: Icon, color, desc }) => (
                <motion.button key={stream} whileHover={{ scale: 1.01 }}
                  onClick={() => setView({ level: "programs", stream })}
                  className={cardBase}>
                  <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className={`text-xl font-bold text-white mb-1.5 group-hover:text-${color}-400 transition-colors`}>{stream}</h3>
                  <p className="text-sm text-white/40">{desc}</p>
                </motion.button>
              ))}
            </div>
          )}

          {/* PROGRAMS */}
          {view.level === "programs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(view.stream === "Engineering" ? ["B.Tech", "M.Tech"] : ["BBA", "MBA"]).map(prog => (
                <button key={prog} onClick={() => setView({ level: "years", stream: view.stream, program: prog as ProgramType })}
                  className={cardBase}>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{prog}</h3>
                  <p className="text-sm text-white/40">{prog === "B.Tech" ? "4 Year" : prog === "M.Tech" ? "2 Year" : prog === "BBA" ? "Undergraduate" : "Postgraduate"} Program</p>
                </button>
              ))}
            </div>
          )}

          {/* YEARS */}
          {view.level === "years" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(view as any).program === "B.Tech" ? (
                [...years].sort((a, b) => a.year - b.year).map(y => (
                  <button key={y.year}
                    onClick={() => setView({ level: "branches", stream: (view as any).stream, program: (view as any).program, year: y.year, batchYear: getBatchYear(y.year) })}
                    className={cardBase}>
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">Year {y.year}</p>
                      <span className="text-[10px] font-bold font-mono bg-white/[0.06] text-white/50 px-2 py-1 rounded-lg">'{getBatchYear(y.year).toString().slice(-2)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-4 bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                      <div className="text-center flex-1"><p className="text-base font-black text-white">{y.totalStudent}</p><p className="text-[9px] text-white/30 uppercase tracking-widest">Total</p></div>
                      <div className="w-px h-6 bg-white/[0.06]" />
                      <div className="text-center flex-1"><p className="text-base font-black text-emerald-400">{y.activeStudent}</p><p className="text-[9px] text-white/30 uppercase tracking-widest">Active</p></div>
                    </div>
                  </button>
                ))
              ) : (
                ["Year 1", "Year 2"].map(y => (
                  <button key={y} disabled className="bg-white/[0.01] p-6 rounded-2xl border border-white/[0.04] text-left opacity-40 cursor-not-allowed">
                    <p className="text-xl font-bold text-white">{y}</p>
                    <span className="text-[10px] font-bold text-white/30 bg-white/[0.04] px-2 py-1 rounded-lg mt-2 inline-block">Coming Soon</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* BRANCHES */}
          {view.level === "branches" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {branches.map(b => (
                <button key={b.branchId}
                  onClick={() => setView({ level: "students", stream: (view as any).stream, program: (view as any).program, year: (view as any).year, batchYear: (view as any).batchYear, branchId: b.branchId, branchName: b.branchName })}
                  className={`${cardBase} flex flex-col justify-between min-h-[140px]`}>
                  <p className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">{b.branchName}</p>
                  <div className="flex items-center gap-2 mt-4 bg-white/[0.03] px-3 py-2 rounded-xl border border-white/[0.05] w-fit">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs text-white/60 font-bold">{b.totalStudents} enrolled</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STUDENTS */}
          {view.level === "students" && (
            students.length === 0 ? <EmptyState title="No students" description="No students found in this branch." /> : (
              <div className="bg-white/[0.02] rounded-3xl border border-white/[0.07] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.01]">
                    <tr>
                      {["ID", "Name", "Email", "Pending Fees", "Total Fees", "Status", ""].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-white/20 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-4 text-white/30 font-mono text-[11px] font-bold">{s.id}</td>
                        <td className="px-5 py-4 text-white font-bold text-sm">{s.fullName}</td>
                        <td className="px-5 py-4 text-white/40 text-xs">{s.email}</td>
                        <td className="px-5 py-4 font-bold text-amber-400 font-mono text-sm">{formatINR(s.pendingFees)}</td>
                        <td className="px-5 py-4 text-white/40 font-mono text-sm">{formatINR(s.totalFees)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold ${s.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/[0.05] text-white/30 border border-white/10"}`}>
                            {s.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => setView({ ...(view as any), level: "profile", studentId: s.id })}
                            className="text-[12px] font-bold text-indigo-400 hover:text-white transition-colors bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 px-3 py-1.5 rounded-lg">
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* PROFILE */}
          {view.level === "profile" && profile && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white/[0.02] p-7 rounded-3xl border border-white/[0.07] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group hover:border-indigo-500/20 transition-colors">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-white">{profile.fullName}</h2>
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold bg-white/[0.06] text-white/50 px-2 py-1 rounded-lg border border-white/10">
                        <Fingerprint className="w-3 h-3 text-indigo-400" /> {(view as any).studentId}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                        <Mail className="w-3.5 h-3.5 text-rose-400" /> {profile.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> {profile.branch}, Batch {(view as any).batchYear}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 relative z-10">
                  {[
                    { label: "Pending", value: profile.pendingCount, color: "amber" },
                    { label: "Paid", value: profile.paidCount, color: "emerald" },
                    { label: "Delayed", value: profile.delayedCount, color: "red" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`px-4 py-3 rounded-2xl border border-${color}-500/20 bg-${color}-500/5 text-center min-w-[80px]`}>
                      <p className={`text-[10px] font-bold text-${color}-400/60 uppercase tracking-wider mb-1`}>{label}</p>
                      <p className={`text-2xl font-black text-${color}-400`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <History className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Fee History</h3>
              </div>

              {profile.feeHistory.length === 0 ? (
                <EmptyState title="No fee records" description="This student has no fee history." />
              ) : (
                <div className="bg-white/[0.02] rounded-3xl border border-white/[0.07] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/[0.06] bg-white/[0.01]">
                      <tr>
                        {["Fee Title", "Semester", "Amount", "Due Date", "Status", "Paid At"].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-white/20 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {profile.feeHistory.map((f, i) => (
                        <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
                                <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
                              </div>
                              <span className="text-white font-bold text-sm">{f.feeTitle}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white/40 text-sm">Sem {f.semester}</td>
                          <td className="px-5 py-4 font-mono font-bold text-white text-sm">{formatINR(f.amount)}</td>
                          <td className="px-5 py-4 text-white/40 text-sm">{formatDate(f.dueDate)}</td>
                          <td className="px-5 py-4"><StatusBadge status={f.status as any} /></td>
                          <td className="px-5 py-4 text-white/40 text-sm">{f.paidAt ? formatDate(f.paidAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
