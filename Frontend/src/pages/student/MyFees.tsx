import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { SemesterTabs } from "@/components/SemesterTabs";
import { StatusBadge } from "@/components/StatusBadge";
import { Drawer } from "@/components/Drawer";
import { ReceiptOverlay } from "@/components/ReceiptOverlay";
import { SkeletonTable } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";

interface Fee {
  id: string;
  amount: number;
  dueDate: string;
  feeStatus: "PENDING" | "PAID" | "DELAYED";
  feeRequest: { title: string; semester: number };
}

interface ReceiptData {
  transactionId: string;
  feeTitle: string;
  semester: number;
  amount: number;
  paymentMode: string;
  paidAt: string;
  wasDelayed: boolean;
}

export default function MyFees() {
  const [semester, setSemester] = useState(1);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingFee, setPayingFee] = useState<Fee | null>(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const fetchFees = async (sem: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await api<Fee[]>(`/api/student/fees/semester/${sem}`);
      setFees(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees(semester);
  }, [semester]);

  const handlePay = async () => {
    if (!payingFee) return;
    setPaying(true);
    setPayError("");
    try {
      const res = await api<ReceiptData>("/api/student/pay", {
        method: "POST",
        body: { studentFeeId: payingFee.id, paymentMode },
      });
      setReceipt(res);
      setPayingFee(null);
      fetchFees(semester);
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const modes = ["UPI", "CARD", "NET_BANKING", "CASH"];

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-6">My Fees</h1>
      <SemesterTabs active={semester} onChange={setSemester} />

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5 mb-4">
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonTable cols={5} />
      ) : fees.length === 0 ? (
        <EmptyState title="No fees found" description="There are no fee records for this semester." />
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-th">Title</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Due Date</th>
                <th className="table-th">Status</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="table-td text-foreground font-medium">{fee.feeRequest.title}</td>
                  <td className="table-td text-foreground">{formatINR(fee.amount)}</td>
                  <td className="table-td text-muted-foreground">{formatDate(fee.dueDate)}</td>
                  <td className="table-td"><StatusBadge status={fee.feeStatus} /></td>
                  <td className="table-td">
                    {fee.feeStatus === "PENDING" ? (
                      <button
                        onClick={() => { setPayingFee(fee); setPaymentMode("UPI"); setPayError(""); }}
                        className="text-[13px] px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all active:scale-[0.98]"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!payingFee} onClose={() => setPayingFee(null)} title="Make Payment">
        {payingFee && (
          <div className="space-y-6">
            <div className="bg-accent/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">{payingFee.feeRequest.title}</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{formatINR(payingFee.amount)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Payment Mode</p>
              {modes.map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-lg border transition-all ${
                    paymentMode === mode ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value={mode}
                    checked={paymentMode === mode}
                    onChange={() => setPaymentMode(mode)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground font-medium">{mode.replace("_", " ")}</span>
                </label>
              ))}
            </div>
            {payError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
                <span>⚠</span><span>{payError}</span>
              </div>
            )}
            <button onClick={handlePay} disabled={paying} className="btn-primary">
              {paying ? "Processing…" : "Confirm Payment"}
            </button>
          </div>
        )}
      </Drawer>

      {receipt && <ReceiptOverlay data={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
