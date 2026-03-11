import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { SemesterTabs } from "@/components/SemesterTabs";
import { SkeletonTable } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";

interface Payment {
  transactionId: string;
  feeTitle: string;
  amount: number;
  paymentMode: string;
  paidAt: string;
  isDelayed: boolean;
}

export default function PaymentHistory() {
  const [semester, setSemester] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api<Payment[]>(`/api/student/payment-history/semester/${semester}`)
      .then(setPayments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [semester]);

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-6">Payment History</h1>
      <SemesterTabs active={semester} onChange={setSemester} />

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5 mb-4">
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonTable cols={6} />
      ) : payments.length === 0 ? (
        <EmptyState title="No payments" description="No payment records found for this semester." />
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-th">Transaction ID</th>
                <th className="table-th">Fee Title</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Mode</th>
                <th className="table-th">Date</th>
                <th className="table-th">Flag</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.transactionId} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="table-td text-foreground font-mono text-xs">{p.transactionId}</td>
                  <td className="table-td text-foreground font-medium">{p.feeTitle}</td>
                  <td className="table-td text-foreground">{formatINR(p.amount)}</td>
                  <td className="table-td text-muted-foreground">{p.paymentMode.replace("_", " ")}</td>
                  <td className="table-td text-muted-foreground">{formatDate(p.paidAt)}</td>
                  <td className="table-td">
                    {p.isDelayed && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-status-delayed-bg text-status-delayed ring-1 ring-inset ring-status-delayed/20">
                        Late
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
