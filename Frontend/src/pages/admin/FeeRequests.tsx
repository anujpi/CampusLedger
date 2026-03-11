import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { SkeletonTable } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { CheckCircle } from "lucide-react";

interface Branch { branchId: string; branchName: string; }
interface FeeRequest { id: string; title: string; amount: number; dueDate: string; semester: number; }
interface CreateResult { studentsMatched: number; studentFeesCreated: number; }

export default function FeeRequests() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [targetYear, setTargetYear] = useState("1");
  const [semester, setSemester] = useState("1");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);

  const [filterYear, setFilterYear] = useState(1);
  const [pastRequests, setPastRequests] = useState<FeeRequest[]>([]);
  const [pastLoading, setPastLoading] = useState(true);

  useEffect(() => {
    api<Branch[]>(`/api/admin/dashboard/year/${targetYear}/branch`).then((b) => {
      setBranches(b);
      if (b.length > 0 && !branchId) setBranchId(b[0].branchId);
    }).catch(() => {});
  }, [targetYear]);

  const fetchPast = () => {
    setPastLoading(true);
    api<FeeRequest[]>(`/api/admin/fee-request/year/${filterYear}`)
      .then(setPastRequests)
      .catch(() => {})
      .finally(() => setPastLoading(false));
  };

  useEffect(() => { fetchPast(); }, [filterYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const res = await api<CreateResult>("/api/admin/fee-request", {
        method: "POST",
        body: { title, description, amount: Number(amount), dueDate, targetYear: Number(targetYear), semester: Number(semester), branchId },
      });
      setResult(res);
      setTitle(""); setDescription(""); setAmount(""); setDueDate("");
      fetchPast();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create fee request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-6">Fee Requests</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Create New</h2>
          <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6 card-elevated">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Target Year</label>
                <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="input-field">
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Semester</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input-field">
                {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
              </select>
            </div>
            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
                <span>⚠</span><span>{error}</span>
              </div>
            )}
            {result && (
              <div className="bg-status-paid-bg border border-status-paid/15 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-status-paid font-medium text-sm">
                  <CheckCircle className="h-4 w-4" /> Fee request created
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Sent to {result.studentsMatched} students · Created {result.studentFeesCreated} fee records
                </p>
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Creating…" : "Create Fee Request"}
            </button>
          </form>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Past Requests</h2>
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="input-field w-auto">
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          {pastLoading ? (
            <SkeletonTable cols={4} rows={3} />
          ) : pastRequests.length === 0 ? (
            <EmptyState title="No fee requests" description="No fee requests found for this year." />
          ) : (
            <div className="table-wrapper">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="table-th">Title</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Due Date</th>
                    <th className="table-th">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {pastRequests.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                      <td className="table-td text-foreground font-medium">{r.title}</td>
                      <td className="table-td text-foreground">{formatINR(r.amount)}</td>
                      <td className="table-td text-muted-foreground">{formatDate(r.dueDate)}</td>
                      <td className="table-td text-muted-foreground">Sem {r.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
