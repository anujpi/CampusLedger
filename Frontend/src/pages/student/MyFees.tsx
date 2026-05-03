import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { SemesterTabs } from "@/components/SemesterTabs";
import { StatusBadge } from "@/components/StatusBadge";
import { ReceiptOverlay } from "@/components/ReceiptOverlay";
import { SkeletonTable } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { Receipt, X, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PaymentGateway } from "@/components/PaymentGateway";

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
  const { user } = useAuth();
  const [semester, setSemester] = useState(1);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingFee, setPayingFee] = useState<Fee | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptViewFee, setReceiptViewFee] = useState<Fee | null>(null);

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
    try {
      const res = await api<ReceiptData>("/api/student/pay", {
        method: "POST",
        body: { studentFeeId: payingFee.id, paymentMode: "CARD" },
      });
      setReceipt(res);
      setPayingFee(null);
      fetchFees(semester);
    } catch (e: unknown) {
      throw e; // Caught by PaymentGateway processPayment
    }
  };

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
                        onClick={() => setPayingFee(fee)}
                        className="text-[13px] px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all active:scale-[0.98]"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <button
                        onClick={() => setReceiptViewFee(fee)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                        title="View Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {payingFee && (
        <PaymentGateway
          amount={payingFee.amount}
          title={payingFee.feeRequest.title}
          userName={user?.fullName || ""}
          userEmail={user?.email || ""}
          onClose={() => setPayingFee(null)}
          onSuccess={handlePay}
        />
      )}

      {receipt && <ReceiptOverlay data={receipt} onClose={() => setReceipt(null)} />}

      {/* Receipt view for paid fees (no transaction detail available, show fee info) */}
      <AnimatePresence>
        {receiptViewFee && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden"
              onClick={() => setReceiptViewFee(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-950 w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl border border-white/10 text-white"
            >
              <button onClick={() => setReceiptViewFee(null)} className="absolute top-4 right-4 p-2 rounded-full text-white/20 hover:bg-white/5 transition-colors print:hidden">
                <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-8 border-b border-dashed border-white/10 pb-8">
                <div className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">CampusLedger</h2>
                <p className="text-sm font-medium text-white/40">Official Payment Receipt</p>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-6 mb-8 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-white">{receiptViewFee.feeRequest.title}</h4>
                    <p className="text-xs font-medium text-white/40">Semester {receiptViewFee.feeRequest.semester}</p>
                  </div>
                  <span className="font-mono font-bold text-white">{formatINR(receiptViewFee.amount)}</span>
                </div>
                <div className="w-full h-px bg-white/10 my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white/60">Status</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    {receiptViewFee.feeStatus}
                  </span>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="w-full py-3.5 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2 print:hidden"
              >
                <Printer className="w-5 h-5" /> Download / Print PDF
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
